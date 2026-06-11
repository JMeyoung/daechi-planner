create table if not exists public.coupons (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  type        text not null check (type in ('percent', 'fixed')),
  value       integer not null check (value > 0),
  max_uses    integer,
  used_count  integer not null default 0,
  expires_at  timestamptz,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.coupon_uses (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references public.coupons(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (coupon_id, user_id)
);

alter table public.coupons enable row level security;
alter table public.coupon_uses enable row level security;

-- Anyone authenticated can read active coupons (for validation)
create policy "auth users read active coupons" on public.coupons
  for select using (auth.role() = 'authenticated');

-- Users can read their own coupon uses
create policy "users read own coupon uses" on public.coupon_uses
  for select using (auth.uid() = user_id);

-- Auto-increment used_count when a coupon_use is inserted
create or replace function public.increment_coupon_used_count()
returns trigger language plpgsql security definer as $$
begin
  update public.coupons set used_count = used_count + 1 where id = NEW.coupon_id;
  return NEW;
end;
$$;

create trigger trg_increment_coupon_used_count
  after insert on public.coupon_uses
  for each row execute function public.increment_coupon_used_count();
