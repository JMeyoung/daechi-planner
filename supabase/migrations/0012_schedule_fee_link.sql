-- 일정 ↔ 학원비 연결
-- schedule_events에 fee_id(nullable FK) 추가해 학원 일정과 비용을 직접 연결

ALTER TABLE public.schedule_events
  ADD COLUMN IF NOT EXISTS fee_id uuid REFERENCES public.academy_fees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_schedule_events_fee_id ON public.schedule_events(fee_id);
