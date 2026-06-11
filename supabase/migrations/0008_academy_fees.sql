create table if not exists public.academy_fees (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  child_id     uuid references public.child_profiles(id) on delete set null,
  name         text not null,
  amount       integer not null check (amount > 0),
  payment_day  integer check (payment_day between 1 and 31),
  memo         text,
  color        text not null default 'blue',
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.academy_fees enable row level security;

create policy "users view own fees"   on public.academy_fees for select using (auth.uid() = user_id);
create policy "users insert own fees" on public.academy_fees for insert with check (auth.uid() = user_id);
create policy "users update own fees" on public.academy_fees for update using (auth.uid() = user_id);
create policy "users delete own fees" on public.academy_fees for delete using (auth.uid() = user_id);
