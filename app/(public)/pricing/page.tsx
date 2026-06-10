import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: '요금제' }

const FREE_FEATURES = [
  '교육 일정 관리',
  '공개 브리프 열람',
  '학습 팁 콘텐츠',
  '북마크 20개',
]

const PREMIUM_FEATURES = [
  '무제한 북마크',
  '프리미엄 브리프 전체 열람',
  '대치동 학원 심층 분석 리포트',
  '주간 뉴스레터 이메일 수신',
  '신규 콘텐츠 우선 알림',
]

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default function PricingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">요금제</h1>
        <p className="text-gray-500">필요한 만큼 선택하세요. 기본 기능은 무료입니다.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Free plan */}
        <div className="border border-gray-200 rounded-2xl p-6">
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-500 mb-1">무료</p>
            <p className="text-3xl font-bold text-gray-900">
              ₩0<span className="text-base font-normal text-gray-400"> /월</span>
            </p>
          </div>
          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login?signup=1"
            className="block text-center w-full border border-blue-700 text-blue-700 font-medium py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            무료로 시작하기
          </Link>
        </div>

        {/* Premium plan */}
        <div className="border-2 border-blue-700 rounded-2xl p-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-blue-700 text-white text-xs font-medium px-3 py-1 rounded-full">
              추천
            </span>
          </div>
          <div className="mb-5">
            <p className="text-sm font-medium text-blue-700 mb-1">프리미엄</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900">
                ₩9,900<span className="text-base font-normal text-gray-400"> /월</span>
              </p>
              <span className="text-xs text-gray-400 line-through">₩11,900</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">연간 구독 시 ₩99,000 (17% 할인)</p>
          </div>
          <ul className="space-y-2.5 mb-6">
            {[...FREE_FEATURES, ...PREMIUM_FEATURES.map(f => `✦ ${f}`)].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckIcon />
                <span className={f.startsWith('✦') ? 'font-medium text-gray-800' : ''}>
                  {f.replace('✦ ', '')}
                </span>
              </li>
            ))}
          </ul>
          {/* Stripe integration will activate this button */}
          <Link
            href="/login?signup=1&plan=premium"
            className="block text-center w-full bg-blue-700 text-white font-medium py-2.5 rounded-lg hover:bg-blue-800 transition-colors text-sm"
          >
            프리미엄 시작하기
          </Link>
          <p className="text-xs text-gray-400 text-center mt-2">첫 7일 무료 체험</p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        결제는 Stripe를 통해 안전하게 처리됩니다. 언제든지 해지 가능합니다.
      </p>
    </div>
  )
}
