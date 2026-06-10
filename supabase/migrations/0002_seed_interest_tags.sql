-- ============================================================
-- Seed: 관심 분야 태그 (interest_tags)
-- Run ONCE in the Supabase SQL editor.
-- ============================================================

insert into public.interest_tags (name, label_ko) values
  ('math',         '수학'),
  ('english',      '영어'),
  ('korean',       '국어·논술'),
  ('science',      '과학'),
  ('grade_mgmt',   '내신 관리'),
  ('entrance',     '입시 정보'),
  ('special_hs',   '특목고'),
  ('self_study',   '자기주도학습')
on conflict (name) do nothing;
