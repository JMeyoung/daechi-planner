'use client'

import Script from 'next/script'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { PLANS } from '@/lib/toss/client'
import type { PlanKey } from '@/lib/toss/client'

interface TossV1 {
  requestBillingAuth(method: string, options: {
    customerKey: string
    successUrl: string
    failUrl: string
  }): void
}
declare global {
  interface Window { TossPayments(key: string): TossV1 }
}

type CouponResult = {
  valid: boolean
  label?: string
  originalAmount?: number
  discount?: number
  finalAmount?: number
  message?: string
}

type Props = { userId: string; plan: string }

export default function CheckoutClient({ userId, plan }: Props) {
  const triggered = useRef(false)
  const [error, setError] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState<CouponResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [ready, setReady] = useState(false)

  const planInfo = PLANS[plan as PlanKey] ?? PLANS.premium_monthly
  const finalAmount = coupon?.valid ? coupon.finalAmount! : planInfo.amount

  async function validateCoupon() {
    if (!couponCode.trim()) return
    setValidating(true)
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode.trim())}&plan=${plan}`)
      const data: CouponResult = await res.json()
      setCoupon(data)
    } finally {
      setValidating(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') validateCoupon()
  }

  function launch() {
    if (triggered.current || typeof window === 'undefined') return
    if (!window.TossPayments) return
    triggered.current = true
    try {
      const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      const couponParam = coupon?.valid ? `&coupon=${encodeURIComponent(couponCode.trim().toUpperCase())}` : ''
      toss.requestBillingAuth('카드', {
        customerKey: userId,
        successUrl: `${window.location.origin}/api/toss/billing-auth?plan=${plan}${couponParam}`,
        failUrl: `${window.location.origin}/pricing`,
      })
    } catch (e) {
      console.error('[Toss] requestBillingAuth error:', e)
      setError(true)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!triggered.current && ready) launch()
    }, 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-red-500 font-medium mb-3">결제 창을 여는 데 실패했습니다.</p>
        <Link href="/pricing" className="text-sm text-blue-600 underline">요금제 페이지로 돌아가기</Link>
      </div>
    )
  }

  if (!ready) {
    return (
      <>
        <Script src="https://js.tosspayments.com/v1" strategy="afterInteractive"
          onLoad={() => setReady(true)} onError={() => setError(true)} />
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 w-full max-w-sm space-y-5">
            <div>
              <p className="text-xs text-gray-500 mb-1">선택한 플랜</p>
              <p className="text-lg font-bold text-gray-900">{planInfo.label}</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                ₩{finalAmount.toLocaleString('ko-KR')}
                <span className="text-sm font-normal text-gray-400">/{planInfo.interval === 'month' ? '월' : '년'}</span>
              </p>
              {coupon?.valid && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  {coupon.label} 적용 (₩{coupon.discount!.toLocaleString('ko-KR')} 할인)
                </p>
              )}
            </div>

            {/* 쿠폰 입력 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">할인 쿠폰</p>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCoupon(null) }}
                  onKeyDown={handleKeyDown}
                  placeholder="쿠폰 코드 입력"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={validateCoupon}
                  disabled={validating || !couponCode.trim()}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {validating ? '확인 중' : '적용'}
                </button>
              </div>
              {coupon && (
                <p className={`text-xs mt-1.5 font-medium ${coupon.valid ? 'text-green-600' : 'text-red-500'}`}>
                  {coupon.valid ? `✓ ${coupon.label} 적용됨` : coupon.message}
                </p>
              )}
            </div>

            <button
              onClick={launch}
              className="w-full bg-blue-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors"
            >
              카드 등록 후 결제하기
            </button>
            <p className="text-xs text-gray-400 text-center">카드 등록 후 즉시 결제가 진행됩니다.</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-10 h-10 border-2 border-azure-200 border-t-azure-600 rounded-full animate-spin mb-5" />
      <p className="text-sm text-gray-500 font-medium">결제 페이지로 이동 중...</p>
    </div>
  )
}
