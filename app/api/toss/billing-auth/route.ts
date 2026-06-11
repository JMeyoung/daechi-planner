import { NextResponse } from 'next/server'
import { PLANS, issueBillingKey, chargeBilling } from '@/lib/toss/client'
import { createClient } from '@/lib/supabase/server'
import type { PlanKey } from '@/lib/toss/client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const authKey    = searchParams.get('authKey')
  const customerKey = searchParams.get('customerKey')
  const planKey    = (searchParams.get('plan') ?? 'premium_monthly') as PlanKey

  if (!authKey || !customerKey) {
    return NextResponse.redirect(`${origin}/pricing?error=cancelled`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  const plan = PLANS[planKey]

  // 1. Issue billing key
  let billingKey: string
  try {
    ({ billingKey } = await issueBillingKey(authKey, customerKey))
  } catch {
    return NextResponse.redirect(`${origin}/pricing?error=billing`)
  }

  // 2. Charge first payment
  const orderId = `order_${user.id.replace(/-/g, '')}_${Date.now()}`
  try {
    await chargeBilling({
      billingKey,
      customerKey,
      orderId,
      amount: plan.amount,
      orderName: plan.label,
      customerEmail: user.email,
    })
  } catch {
    return NextResponse.redirect(`${origin}/pricing?error=charge`)
  }

  // 3. Compute next billing date
  const periodEnd = new Date()
  if (plan.interval === 'month') periodEnd.setMonth(periodEnd.getMonth() + 1)
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1)

  // 4. Save to DB (upsert in case handle_new_user trigger didn't fire)
  const { error: dbError } = await supabase.from('subscriptions').upsert({
    user_id: user.id,
    toss_billing_key:  billingKey,
    toss_customer_key: customerKey,
    plan:   'premium',
    status: 'active',
    current_period_end: periodEnd.toISOString(),
  }, { onConflict: 'user_id' })

  if (dbError) console.error('[billing-auth] db upsert error:', dbError)

  return NextResponse.redirect(`${origin}/checkout/success`)
}
