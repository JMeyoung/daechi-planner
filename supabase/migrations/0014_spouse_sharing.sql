-- Add spouse linking columns
ALTER TABLE public.profiles ADD COLUMN spouse_email text;
ALTER TABLE public.profiles ADD COLUMN spouse_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN spouse_status text DEFAULT 'none' CHECK (spouse_status IN ('none', 'pending', 'accepted'));

-- Create security definer function to return an array of user IDs in the family (self + accepted spouse)
create or replace function public.get_family_user_ids()
returns uuid[]
language sql
security definer
set search_path = public
as $$
  select array_agg(family.id)
  from (
    select auth.uid() as id
    union
    select spouse_id from public.profiles where id = auth.uid() and spouse_status = 'accepted' and spouse_id is not null
    union
    select id from public.profiles where spouse_id = auth.uid() and spouse_status = 'accepted'
  ) as family;
$$;

grant execute on function public.get_family_user_ids() to authenticated, anon;


-- Update RLS for child_profiles
drop policy if exists "users view own children" on public.child_profiles;
create policy "family view children" on public.child_profiles for select using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users update own children" on public.child_profiles;
create policy "family update children" on public.child_profiles for update using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users delete own children" on public.child_profiles;
create policy "family delete children" on public.child_profiles for delete using (user_id = ANY (public.get_family_user_ids()));


-- Update RLS for schedule_events
drop policy if exists "users view own schedule" on public.schedule_events;
create policy "family view schedule" on public.schedule_events for select using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users update own schedule" on public.schedule_events;
create policy "family update schedule" on public.schedule_events for update using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users delete own schedule" on public.schedule_events;
create policy "family delete schedule" on public.schedule_events for delete using (user_id = ANY (public.get_family_user_ids()));


-- Update RLS for academy_fees
drop policy if exists "users view own fees" on public.academy_fees;
create policy "family view fees" on public.academy_fees for select using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users update own fees" on public.academy_fees;
create policy "family update fees" on public.academy_fees for update using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users delete own fees" on public.academy_fees;
create policy "family delete fees" on public.academy_fees for delete using (user_id = ANY (public.get_family_user_ids()));


-- Update RLS for teacher_memos
drop policy if exists "users view own memos" on public.teacher_memos;
create policy "family view memos" on public.teacher_memos for select using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users update own memos" on public.teacher_memos;
create policy "family update memos" on public.teacher_memos for update using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users delete own memos" on public.teacher_memos;
create policy "family delete memos" on public.teacher_memos for delete using (user_id = ANY (public.get_family_user_ids()));


-- Update RLS for academy_reviews (from 0013)
drop policy if exists "users view own reviews" on public.academy_reviews;
create policy "family view reviews" on public.academy_reviews for select using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users update own reviews" on public.academy_reviews;
create policy "family update reviews" on public.academy_reviews for update using (user_id = ANY (public.get_family_user_ids()));

drop policy if exists "users delete own reviews" on public.academy_reviews;
create policy "family delete reviews" on public.academy_reviews for delete using (user_id = ANY (public.get_family_user_ids()));
