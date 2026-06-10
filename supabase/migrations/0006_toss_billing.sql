-- Add Toss Payments billing fields to subscriptions
alter table public.subscriptions
  add column if not exists toss_billing_key  text,
  add column if not exists toss_customer_key text;
