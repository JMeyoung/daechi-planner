create table public.schedule_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'academy'
    check (category in ('academy', 'exam', 'personal')),
  subject text,
  location text,
  start_at timestamptz not null,
  end_at timestamptz,
  is_recurring boolean not null default false,
  recur_days int[],
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.schedule_events enable row level security;

create policy "own schedule all" on public.schedule_events
  for all using (auth.uid() = user_id);

create trigger schedule_events_updated_at
  before update on public.schedule_events
  for each row execute procedure public.handle_updated_at();
