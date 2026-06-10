import Stripe from 'stripe'

// Singleton for server-side use only
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
  typescript: true,
})

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
