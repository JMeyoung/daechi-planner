-- coupon_uses: explicit INSERT policy for user ownership
-- (currently works via service-role bypass, but explicit policy makes intent clear)
create policy "users insert own coupon uses"
  on public.coupon_uses
  for insert
  with check (auth.uid() = user_id);

-- coupons: admin full CRUD policy
-- (currently service-role is used for mutations, but explicit admin policy documents intent)
create policy "admin coupon all"
  on public.coupons
  for all
  using (public.is_admin());
