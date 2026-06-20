create table if not exists public.exam_scores (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  child_id     uuid references public.child_profiles(id) on delete cascade,
  exam_name    text not null,
  exam_date    date not null,
  subject      text not null,
  score        numeric(5,2),
  percentile   numeric(5,2),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.exam_scores enable row level security;

-- Family sharing RLS
create policy "family view exam_scores" on public.exam_scores for select using (user_id = ANY (public.get_family_user_ids()));
create policy "users insert own exam_scores" on public.exam_scores for insert with check (auth.uid() = user_id);
create policy "family update exam_scores" on public.exam_scores for update using (user_id = ANY (public.get_family_user_ids()));
create policy "family delete exam_scores" on public.exam_scores for delete using (user_id = ANY (public.get_family_user_ids()));
