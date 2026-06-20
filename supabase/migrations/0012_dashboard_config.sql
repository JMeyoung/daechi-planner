-- Add dashboard_config to profiles

ALTER TABLE public.profiles ADD COLUMN dashboard_config jsonb DEFAULT '["welcome", "dday", "stats", "schedule", "briefings"]'::jsonb;
