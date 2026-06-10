-- Run after schema.sql to populate reference data and sample content

-- Interest tags
insert into public.interest_tags (name, label_ko) values
  ('math_academy',    '수학 학원'),
  ('english_academy', '영어 학원'),
  ('science_academy', '과학 학원'),
  ('study_tips',      '학습 방법'),
  ('exam_prep',       '시험·입시 준비'),
  ('local_events',    '지역 행사'),
  ('college_prep',    '고입·입시 정보'),
  ('extracurricular', '특기·적성');

-- Sample published content (author_id will be null for seeded items)
insert into public.content_items (title, summary, body, category, tags, is_premium, is_published, published_at) values
(
  '2026 대치동 수학 학원 트렌드 총정리',
  '중학생 학부모들이 가장 많이 물어보는 수학 학원 선택 기준과 최신 커리큘럼 변화를 정리했습니다.',
  '대치동 수학 학원의 커리큘럼은 매년 빠르게 변화하고 있습니다. 특히 2026년에는...',
  'briefing',
  ARRAY['math_academy', 'study_tips'],
  false,
  true,
  now() - interval '2 days'
),
(
  '중학교 내신 관리 5가지 핵심 전략',
  '중1~중3 내신 성적을 효과적으로 관리하는 방법을 단계별로 안내합니다.',
  '내신 관리는 빠를수록 유리합니다. 중학교 1학년부터 체계적으로...',
  'tip',
  ARRAY['exam_prep', 'study_tips'],
  false,
  true,
  now() - interval '5 days'
),
(
  '[프리미엄] 대치동 영어 학원 심층 분석 리포트',
  '대치동 주요 영어 학원 10곳의 커리큘럼·강사진·비용을 직접 취재하여 비교 분석했습니다.',
  '이 리포트는 프리미엄 회원 전용 콘텐츠입니다...',
  'briefing',
  ARRAY['english_academy', 'college_prep'],
  true,
  true,
  now() - interval '1 day'
);
