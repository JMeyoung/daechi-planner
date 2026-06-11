'use client'

import Script from 'next/script'
import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'

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

type Props = { userId: string; plan: string }

export default function CheckoutClient({ userId, plan }: Props) {
  const triggered = useRef(false)
  const [error, setError] = useState(false)

  function launch() {
    if (triggered.current || typeof window === 'undefined') return
    if (!window.TossPayments) return
    triggered.current = true
    try {
      const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      toss.requestBillingAuth('카드', {
        customerKey: userId,
        successUrl: `${window.location.origin}/api/toss/billing-auth?plan=${plan}`,
        failUrl: `${window.location.origin}/pricing`,
      })
    } catch (e) {
      console.error('[Toss] requestBillingAuth error:', e)
      setError(true)
    }
  }

  // 이미 스크립트가 로드된 경우(캐시) onLoad가 안 firing될 수 있음
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!triggered.current) launch()
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm text-red-500 font-medium mb-3">결제 창을 여는 데 실패했습니다.</p>
        <Link href="/pricing" className="text-sm text-blue-600 underline">요금제 페이지로 돌아가기</Link>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v1"
        strategy="afterInteractive"
        onLoad={launch}
        onError={() => setError(true)}
      />
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-10 h-10 border-2 border-azure-200 border-t-azure-600 rounded-full animate-spin mb-5" />
        <p className="text-sm text-gray-500 font-medium">결제 페이지로 이동 중...</p>
        <p className="text-xs text-gray-400 mt-1">카드 등록 후 첫 결제가 진행됩니다.</p>
      </div>
    </>
  )
}
