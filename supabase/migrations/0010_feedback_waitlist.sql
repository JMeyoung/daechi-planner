-- 사용자 피드백 (로그인 유저가 앱에서 남기는 의견)
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  message     text not null,
  contact     text,
  created_at  timestamptz not null default now()
);

-- 출시 알림 대기자 (비로그인 방문자가 남기는 이메일)
create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  source      text,
  created_at  timestamptz not null default now()
);

alter table public.feedback enable row level security;
alter table public.waitlist enable row level security;

-- 관리자만 피드백/대기자 전체 조회 (작성은 service role 경유)
create policy "admins read feedback" on public.feedback
  for select using (public.is_admin());

create policy "admins read waitlist" on public.waitlist
  for select using (public.is_admin());
