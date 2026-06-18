import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/toss/client'
import type { PlanKey } from '@/lib/toss/client'

// In-memory rate limiter: max 10 requests per IP per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW_MS = 60_000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ valid: false, message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
  }
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.trim().toUpperCase()
  const planKey = (searchParams.get('plan') ?? 'premium_monthly') as PlanKey

  if (!code) return NextResponse.json({ valid: false, message: '코드를 입력해주세요.' })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ valid: false, message: '로그인이 필요합니다.' })

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .single()

  if (!coupon) return NextResponse.json({ valid: false, message: '유효하지 않은 쿠폰입니다.' })

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return NextResponse.json({ valid: false, message: '만료된 쿠폰입니다.' })

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses)
    return NextResponse.json({ valid: false, message: '사용 횟수가 초과된 쿠폰입니다.' })

  const { data: alreadyUsed } = await supabase
    .from('coupon_uses')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', user.id)
    .single()

  if (alreadyUsed) return NextResponse.json({ valid: false, message: '이미 사용한 쿠폰입니다.' })

  const originalAmount = PLANS[planKey]?.amount ?? 9900
  const discount = coupon.type === 'percent'
    ? Math.floor(originalAmount * coupon.value / 100)
    : Math.min(coupon.value, originalAmount)
  const finalAmount = Math.max(0, originalAmount - discount)

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    type: coupon.type,
    value: coupon.value,
    originalAmount,
    discount,
    finalAmount,
    label: coupon.type === 'percent' ? `${coupon.value}% 할인` : `${coupon.value.toLocaleString('ko-KR')}원 할인`,
  })
}
