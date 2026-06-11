import { NextResponse } from 'next/server'
import { PLANS, issueBillingKey, chargeBilling } from '@/lib/toss/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getResend, FROM } from '@/lib/resend'
import { paymentConfirmHtml } from '@/lib/email-templates'
import type { PlanKey } from '@/lib/toss/client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const authKey     = searchParams.get('authKey')
  const customerKey = searchParams.get('customerKey')
  const planKey     = (searchParams.get('plan') ?? 'premium_monthly') as PlanKey
  const couponCode  = searchParams.get('coupon')?.trim().toUpperCase() ?? null

  if (!authKey || !customerKey) {
    return NextResponse.redirect(`${origin}/pricing?error=cancelled`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`)

  const plan = PLANS[planKey]
  const serviceSupabase = createServiceClient()

  // 1. Issue billing key
  let billingKey: string
  try {
    ({ billingKey } = await issueBillingKey(authKey, customerKey))
  } catch {
    return NextResponse.redirect(`${origin}/pricing?error=billing`)
  }

  // 2. Apply coupon discount if provided
  let chargeAmount: number = plan.amount
  let appliedCouponId: string | null = null

  if (couponCode) {
    const { data: coupon } = await serviceSupabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .eq('is_active', true)
      .single()

    const alreadyUsed = coupon
      ? await serviceSupabase.from('coupon_uses').select('id').eq('coupon_id', coupon.id).eq('user_id', user.id).single()
      : null

    const isValid = coupon
      && (!coupon.expires_at || new Date(coupon.expires_at) >= new Date())
      && (coupon.max_uses === null || coupon.used_count < coupon.max_uses)
      && !alreadyUsed?.data

    if (isValid) {
      const discount = coupon.type === 'percent'
        ? Math.floor(plan.amount * coupon.value / 100)
        : Math.min(coupon.value, plan.amount)
      chargeAmount = Math.max(0, plan.amount - discount)
      appliedCouponId = coupon.id
    }
  }

  // 3. Charge first payment
  const orderId = `order_${user.id.replace(/-/g, '')}_${Date.now()}`
  try {
    await chargeBilling({
      billingKey,
      customerKey,
      orderId,
      amount: chargeAmount,
      orderName: plan.label,
      customerEmail: user.email,
    })
  } catch {
    return NextResponse.redirect(`${origin}/pricing?error=charge`)
  }

  // Record coupon use (trigger auto-increments used_count)
  if (appliedCouponId) {
    await serviceSupabase.from('coupon_uses').insert({ coupon_id: appliedCouponId, user_id: user.id })
  }

  // 4. Compute next billing date
  const periodEnd = new Date()
  if (plan.interval === 'month') periodEnd.setMonth(periodEnd.getMonth() + 1)
  else periodEnd.setFullYear(periodEnd.getFullYear() + 1)

  // 5. Save to DB — service role bypasses RLS
  const { error: dbError } = await serviceSupabase.from('subscriptions').upsert({
    user_id: user.id,
    toss_billing_key:  billingKey,
    toss_customer_key: customerKey,
    plan:   'premium',
    status: 'active',
    current_period_end: periodEnd.toISOString(),
  }, { onConflict: 'user_id' })

  if (dbError) console.error('[billing-auth] db upsert error:', dbError)

  // 6. 결제 확인 이메일
  if (user.email) {
    const periodEndStr = periodEnd.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    await getResend().emails.send({
      from: FROM,
      to: user.email,
      subject: '대치 플래너 프리미엄 구독이 시작되었습니다',
      html: paymentConfirmHtml({ planLabel: plan.label, amount: chargeAmount, periodEnd: periodEndStr }),
    }).catch(e => console.error('[billing-auth] email error:', e))
  }

  return NextResponse.redirect(`${origin}/checkout/success`)
}
