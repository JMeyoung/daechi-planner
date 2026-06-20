create table if not exists public.academy_reviews (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  child_id     uuid references public.child_profiles(id) on delete set null,
  academy_name text not null,
  rating       integer not null check (rating >= 1 and rating <= 5),
  review_text  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.academy_reviews enable row level security;

-- We will apply spouse sharing RLS in the next migration, but for now we set up basic self RLS
create policy "users view own reviews"   on public.academy_reviews for select using (auth.uid() = user_id);
create policy "users insert own reviews" on public.academy_reviews for insert with check (auth.uid() = user_id);
create policy "users update own reviews" on public.academy_reviews for update using (auth.uid() = user_id);
create policy "users delete own reviews" on public.academy_reviews for delete using (auth.uid() = user_id);
