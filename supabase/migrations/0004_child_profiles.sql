create table public.child_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  grade int not null check (grade in (1, 2, 3)),
  memo text,
  color text not null default 'blue',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.child_profiles enable row level security;

create policy "own children all" on public.child_profiles
  for all using (auth.uid() = user_id);
