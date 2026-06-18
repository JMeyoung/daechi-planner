-- D-day counters
create table dday_counters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  title       text not null,
  target_date date not null,
  emoji       text default '📅',
  color       text default 'gold',
  sort_order  int default 0,
  created_at  timestamptz default now()
);

alter table dday_counters enable row level security;
create policy "Users manage own dday_counters"
  on dday_counters for all using (auth.uid() = user_id);

-- Teacher memos
create table teacher_memos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  child_id     uuid references child_profiles(id) on delete set null,
  academy_name text not null,
  teacher_name text not null,
  subject      text,
  phone        text,
  memo         text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table teacher_memos enable row level security;
create policy "Users manage own teacher_memos"
  on teacher_memos for all using (auth.uid() = user_id);

create trigger set_updated_at before update on teacher_memos
  for each row execute function handle_updated_at();
