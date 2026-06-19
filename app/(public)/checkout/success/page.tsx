import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: '결제 완료' }

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-up">
      {/* 체크 아이콘 */}
      <div className="w-20 h-20 rounded-full bg-navy-gradient flex items-center justify-center shadow-cta mb-6">
        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
        스탠다드 시작을 환영합니다!
      </h1>
      <p className="text-gray-500 mb-2">결제가 완료되었습니다.</p>
      <p className="text-sm text-gray-400 mb-10">
        스탠다드 브리프와 심층 분석 리포트를 모두 열람하실 수 있습니다.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/briefings"
          className="btn-primary px-8 py-3 text-sm"
        >
          브리프 보러 가기
        </Link>
        <Link
          href="/dashboard"
          className="btn-outline px-8 py-3 text-sm"
        >
          대시보드로
        </Link>
      </div>
    </div>
  )
}
