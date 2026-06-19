-- ============================================================
-- 대치 플래너 — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard > SQL Editor)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  full_name     text,
  role          text not null default 'member' check (role in ('member', 'admin')),
  child_grade   smallint check (child_grade between 1 and 6), -- 1~3=중1~3, 4~6=고1~3 (see 0007_expand_grade.sql)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── Interest Tags ─────────────────────────────────────────────
create table public.interest_tags (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,  -- internal key
  label_ko   text not null,         -- display label
  created_at timestamptz not null default now()
);

-- ── User Interests (junction) ─────────────────────────────────
create table public.user_interests (
  user_id uuid references public.profiles(id) on delete cascade,
  tag_id  uuid references public.interest_tags(id) on delete cascade,
  primary key (user_id, tag_id)
);

-- ── Content Items ─────────────────────────────────────────────
create table public.content_items (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  summary      text not null default '',
  body         text not null default '',
  category     text not null check (category in ('briefing', 'tip', 'announcement', 'event')),
  tags         text[] not null default '{}',
  is_premium   boolean not null default false,
  is_published boolean not null default false,
  published_at timestamptz,
  author_id    uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Bookmarks ─────────────────────────────────────────────────
create table public.bookmarks (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  content_id uuid not null references public.content_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, content_id)
);

-- ── Subscriptions ─────────────────────────────────────────────
create table public.subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references public.profiles(id) on delete cascade unique,
  stripe_customer_id     text unique, -- reserved for future Stripe integration (currently Toss only — see 0006_toss_billing.sql)
  stripe_subscription_id text unique, -- reserved for future Stripe integration
  plan                   text not null default 'free' check (plan in ('free', 'premium')),
  status                 text not null default 'active'
                           check (status in ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ── Triggers ─────────────────────────────────────────────────
-- Auto-create profile + free subscription on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);

  insert into public.subscriptions (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at on any table that has it
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger content_items_updated_at
  before update on public.content_items
  for each row execute procedure public.handle_updated_at();

create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.handle_updated_at();

-- ── Row Level Security ────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.interest_tags enable row level security;
alter table public.user_interests enable row level security;
alter table public.content_items enable row level security;
alter table public.bookmarks     enable row level security;
alter table public.subscriptions enable row level security;

-- Admin check via SECURITY DEFINER so the lookup bypasses RLS on profiles.
-- (A policy on profiles that queries profiles would recurse — Postgres 42P17.)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- Profiles
create policy "own profile select" on public.profiles
  for select using (auth.uid() = id);

create policy "own profile update" on public.profiles
  for update using (auth.uid() = id);

create policy "admin profile select" on public.profiles
  for select using (public.is_admin());

-- Interest tags (public read)
create policy "tags public read" on public.interest_tags
  for select using (true);

-- User interests
create policy "own interests all" on public.user_interests
  for all using (auth.uid() = user_id);

-- Content: public non-premium
create policy "public content read" on public.content_items
  for select using (is_published = true and is_premium = false);

-- Content: premium requires active subscription
create policy "premium content read" on public.content_items
  for select using (
    is_published = true
    and is_premium = true
    and exists (
      select 1 from public.subscriptions
      where user_id = auth.uid()
        and plan = 'premium'
        and status = 'active'
    )
  );

-- Content: admin full access
create policy "admin content all" on public.content_items
  for all using (public.is_admin());

-- Bookmarks
create policy "own bookmarks all" on public.bookmarks
  for all using (auth.uid() = user_id);

-- Subscriptions
create policy "own subscription select" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "admin subscription select" on public.subscriptions
  for select using (public.is_admin());

-- Service role bypass for webhook updates (Stripe)
create policy "service role subscription update" on public.subscriptions
  for update using (auth.role() = 'service_role');
