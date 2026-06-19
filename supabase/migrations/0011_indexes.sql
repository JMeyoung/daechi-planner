-- Performance indexes on frequently-filtered columns.
-- All user-scoped tables filter by user_id on nearly every query (RLS + app code).
-- Without these, queries do sequential scans that degrade as data grows.

create index if not exists idx_schedule_events_user_id on public.schedule_events(user_id);
create index if not exists idx_bookmarks_user_id        on public.bookmarks(user_id);
create index if not exists idx_subscriptions_user_id    on public.subscriptions(user_id);
create index if not exists idx_child_profiles_user_id   on public.child_profiles(user_id);
create index if not exists idx_academy_fees_user_id     on public.academy_fees(user_id);
create index if not exists idx_coupon_uses_user_id      on public.coupon_uses(user_id);

-- content_items: public listing filters by is_published and orders by published_at
create index if not exists idx_content_items_published
  on public.content_items(is_published, published_at desc);
