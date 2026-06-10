alter table public.schedule_events
  add column child_id uuid references public.child_profiles(id) on delete set null;
