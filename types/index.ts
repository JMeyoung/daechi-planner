export type UserRole = 'member' | 'admin'
export type ContentCategory = 'briefing' | 'tip' | 'announcement' | 'event'
export type SubscriptionPlan = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  child_grade: 1 | 2 | 3 | 4 | 5 | 6 | null
  dashboard_config: string[]
  spouse_email: string | null
  spouse_id: string | null
  spouse_status: 'none' | 'pending' | 'accepted'
  created_at: string
  updated_at: string
}

export type InterestTag = {
  id: string
  name: string
  label_ko: string
}

export type ContentItem = {
  id: string
  title: string
  summary: string
  body: string
  category: ContentCategory
  tags: string[]
  is_premium: boolean
  is_published: boolean
  published_at: string | null
  author_id: string | null
  created_at: string
  updated_at: string
}

export type Bookmark = {
  id: string
  user_id: string
  content_id: string
  created_at: string
}

export type Subscription = {
  id: string
  user_id: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_end: string | null
  toss_billing_key: string | null
  toss_customer_key: string | null
  created_at: string
  updated_at: string
}

// Convenience type for content list items (no body for list views)
export type ContentSummary = Omit<ContentItem, 'body'>

export type ScheduleCategory = 'academy' | 'exam' | 'personal'

export type ScheduleEvent = {
  id: string
  user_id: string
  child_id: string | null
  title: string
  category: ScheduleCategory
  subject: string | null
  location: string | null
  start_at: string
  end_at: string | null
  is_recurring: boolean
  recur_days: number[] | null
  memo: string | null
  created_at: string
  updated_at: string
}

export type ChildProfile = {
  id: string
  user_id: string
  name: string
  grade: 1 | 2 | 3 | 4 | 5 | 6
  memo: string | null
  color: string
  sort_order: number
  created_at: string
}

export type CouponType = 'percent' | 'fixed'

export type Coupon = {
  id: string
  code: string
  type: CouponType
  value: number
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export type AcademyFee = {
  id: string
  user_id: string
  child_id: string | null
  name: string
  amount: number
  payment_day: number | null
  memo: string | null
  color: string
  is_active: boolean
  created_at: string
}

export type DdayCounter = {
  id: string
  user_id: string
  title: string
  target_date: string
  emoji: string
  color: string
  created_at: string
}


export type TeacherMemo = {
  id: string
  user_id: string
  child_id: string | null
  academy_name: string
  teacher_name: string
  subject: string | null
  phone: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export type AcademyReview = {
  id: string
  user_id: string
  child_id: string | null
  academy_name: string
  rating: 1 | 2 | 3 | 4 | 5
  review_text: string | null
  created_at: string
  updated_at: string
}

export type ExamScore = {
  id: string
  user_id: string
  child_id: string
  exam_name: string
  exam_date: string
  subject: string
  score: number | null
  percentile: number | null
  created_at: string
  updated_at: string
}
