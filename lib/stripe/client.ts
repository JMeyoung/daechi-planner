import Stripe from 'stripe'

// Singleton — null when STRIPE_SECRET_KEY is not set (e.g. before Stripe activation)
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null

export const PLANS = {
  premium_monthly: {
    priceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
    label: '프리미엄 월간',
    amount: 9900,
    interval: 'month' as const,
  },
  premium_yearly: {
    priceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID!,
    label: '프리미엄 연간',
    amount: 99000,
    interval: 'year' as const,
  },
} as const

export type PlanKey = keyof typeof PLANS
