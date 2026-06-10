export type UserRole = 'member' | 'admin'
export type ContentCategory = 'briefing' | 'tip' | 'announcement' | 'event'
export type SubscriptionPlan = 'free' | 'premium'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  child_grade: 1 | 2 | 3 | null
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
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: SubscriptionPlan
  status: SubscriptionStatus
  current_period_end: string | null
  created_at: string
  updated_at: string
}

// Convenience type for content list items (no body for list views)
export type ContentSummary = Omit<ContentItem, 'body'>

export type ScheduleCategory = 'academy' | 'exam' | 'personal'

export type ScheduleEvent = {
  id: string
  user_id: string
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
