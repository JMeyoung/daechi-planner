import type { Metadata } from 'next'
import Link from 'next/link'
import { getUser, createClient } from '@/lib/supabase/server'
import type { Subscription } from '@/types'

export const metadata: Metadata = { title: '요금제' }

const CARD_ERROR_MESSAGES: Record<string, string> = {
  NOT_SUPPORTED_CARD_TYPE: '해당 카드 종류는 정기결제를 지원하지 않습니다. 국내 개인 신용카드를 사용해 주세요.',
  CARD_PROCESSING_ERROR: '카드 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
  EXCEED_MAX_CARD_INSTALLMENT_PLAN: '할부 개월 수가 초과되었습니다.',
}

function getErrorMessage(code: string | null, message: string | null): string | null {
  if (!code && !message) return null
  if (code && CARD_ERROR_MESSAGES[code]) return CARD_ERROR_MESSAGES[code]
  return message ? decodeURIComponent(message) : '결제 중 오류가 발생했습니다. 다시 시도해 주세요.'
}

const FREE_FEATURES = [
  '교육 일정 관리',
  '공개 브리프 열람',
  '학습 팁 콘텐츠',
  '북마크 20개',
]

const PREMIUM_FEATURES = [
  '무제한 북마크',
  '스탠다드 브리프 전체 열람',
  '대치동 학원 심층 분석 리포트',
  '주간 뉴스레터 이메일 수신',
  '신규 콘텐츠 우선 알림',
]

function CheckIcon({ premium }: { premium?: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 ${premium ? 'text-white/80' : 'text-green-500'}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<{ code?: string; message?: string; error?: string }> }) {
  const [user, supabase, params] = await Promise.all([getUser(), createClient(), searchParams])
  const errorMessage = getErrorMessage(params.code ?? null, params.message ?? null)
    ?? (params.error ? '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' : null)

  let isPremium = false
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()
    const s = sub as Subscription | null
    isPremium = s?.plan === 'premium' && s?.status === 'active'
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      {errorMessage && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 text-center animate-fade-up">
          {errorMessage}
        </div>
      )}
      <div className="text-center mb-12 animate-fade-up">
        <p className="section-eyebrow mb-3">요금제</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          필요한 만큼 선택하세요
        </h1>
        <p className="text-gray-500">기본 기능은 무료입니다.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 items-start">
        {/* ── Free plan ─────────────────────────── */}
        <div className="card-lift p-7 animate-fade-up-1">
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">무료</p>
            <p className="font-display text-4xl font-bold text-gray-900">
              ₩0<span className="text-base font-normal text-gray-400"> /월</span>
            </p>
          </div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login?signup=1"
            className="btn-outline w-full justify-center text-sm"
          >
            무료로 시작하기
          </Link>
        </div>

        {/* ── Premium plan ──────────────────────── */}
        <div className="relative bg-azure-gradient rounded-2xl p-7 text-white shadow-[0_8px_32px_rgba(37,99,235,0.3)] animate-fade-up-2 md:scale-[1.02]">
          {/* Recommended badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="bg-white text-azure-700 text-xs font-bold px-3.5 py-1 rounded-full shadow-sm">
              ✦ 추천
            </span>
          </div>

          {/* Decorative circle */}
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" aria-hidden="true" />

          <div className="mb-6 relative">
            <p className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">스탠다드</p>
            <div className="flex items-baseline gap-2.5">
              <p className="font-display text-4xl font-bold text-white">
                ₩9,900<span className="text-base font-normal text-white/60"> /월</span>
              </p>
              <span className="text-xs text-white/50 line-through">₩11,900</span>
            </div>
            <p className="text-xs text-white/60 mt-1.5">연간 구독 시 ₩99,000 (17% 할인)</p>
          </div>

          <ul className="space-y-3 mb-8 relative">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                <CheckIcon premium />
                {f}
              </li>
            ))}
            <li className="h-px bg-white/20 my-2" />
            {PREMIUM_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-white font-medium">
                <CheckIcon premium />
                {f}
              </li>
            ))}
          </ul>

          {isPremium ? (
            <Link
              href="/settings"
              className="block text-center w-full bg-white text-azure-700 font-bold py-3 rounded-full
                         shadow-cta hover:shadow-cta-hover hover:-translate-y-px
                         transition-all duration-200 text-sm"
            >
              구독 관리하기
            </Link>
          ) : (
            <>
              <Link
                href="/checkout?plan=premium_monthly"
                className="block text-center w-full bg-white text-azure-700 font-bold py-3 rounded-full
                           shadow-cta hover:shadow-cta-hover hover:-translate-y-px
                           transition-all duration-200 text-sm"
              >
                스탠다드 시작하기
              </Link>
              <Link
                href="/checkout?plan=premium_yearly"
                className="block text-center w-full mt-2.5 bg-white/15 text-white font-semibold py-2.5 rounded-full
                           hover:bg-white/25 transition-all duration-200 text-sm border border-white/30"
              >
                연간 구독 (₩99,000)
              </Link>
            </>
          )}

          <p className="text-xs text-white/50 text-center mt-3">
            언제든지 해지 가능합니다.
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-10 animate-fade-up-3">
        결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
      </p>
    </div>
  )
}
