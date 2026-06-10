'use client'

import Script from 'next/script'
import { useRef } from 'react'

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

  function handleLoad() {
    if (triggered.current || typeof window === 'undefined') return
    triggered.current = true
    const toss = window.TossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
    toss.requestBillingAuth('카드', {
      customerKey: userId,
      successUrl: `${window.location.origin}/api/toss/billing-auth?plan=${plan}`,
      failUrl: `${window.location.origin}/pricing`,
    })
  }

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v1"
        strategy="afterInteractive"
        onLoad={handleLoad}
      />
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-10 h-10 border-2 border-azure-200 border-t-azure-600 rounded-full animate-spin mb-5" />
        <p className="text-sm text-gray-500 font-medium">결제 페이지로 이동 중...</p>
        <p className="text-xs text-gray-400 mt-1">카드 등록 후 첫 결제가 진행됩니다.</p>
      </div>
    </>
  )
}
