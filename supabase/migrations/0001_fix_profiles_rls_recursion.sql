-- ============================================================
-- Fix: 42P17 "infinite recursion detected in policy for relation profiles"
-- Run ONCE in the Supabase SQL editor (Dashboard > SQL Editor).
--
-- Cause: "admin profile select" queried profiles from inside a policy ON
-- profiles, which recurses for authenticated reads. The identical subquery in
-- the content/subscription admin policies inherits the same problem.
--
-- Fix: do the admin-role lookup in a SECURITY DEFINER function, which runs as
-- the owner and bypasses RLS — so the policy no longer re-enters profiles.
-- ============================================================

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- profiles: replace the self-referential (recursive) policy
drop policy if exists "admin profile select" on public.profiles;
create policy "admin profile select" on public.profiles
  for select using (public.is_admin());

-- content_items: same pattern → migrate to the function
drop policy if exists "admin content all" on public.content_items;
create policy "admin content all" on public.content_items
  for all using (public.is_admin());

-- subscriptions: same pattern → migrate to the function
drop policy if exists "admin subscription select" on public.subscriptions;
create policy "admin subscription select" on public.subscriptions
  for select using (public.is_admin());
