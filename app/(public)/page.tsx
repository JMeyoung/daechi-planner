import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import WaitlistForm from '@/components/waitlist-form'
import type { ContentSummary } from '@/types'

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold-500">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function NewspaperIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold-500">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gold-500">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  )
}

const VALUE_PROPS = [
  {
    icon: <CalendarIcon />,
    title: '교육 일정 관리',
    desc: '학원 시간표, 시험 일정, 상담 예약을 한 곳에서 정리하고 관리하세요.',
  },
  {
    icon: <NewspaperIcon />,
    title: '대치동 교육 브리프',
    desc: '주요 학원 커리큘럼 변화, 입시 트렌드를 정리한 큐레이션 정보를 받아보세요.',
  },
  {
    icon: <BookmarkIcon />,
    title: '북마크 & 정리',
    desc: '중요한 정보를 저장하고 언제든지 꺼내볼 수 있습니다.',
  },
]

export default async function HomePage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('content_items')
    .select('id, title, summary, category, tags, is_premium, is_published, published_at, author_id, created_at, updated_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(3)

  const recentItems = (items ?? []) as ContentSummary[]

  return (
    <>
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient">
        {/* Noise texture overlay */}
        <div className="absolute inset-0 hero-noise pointer-events-none" aria-hidden="true" />

        {/* Decorative glow blobs */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] rounded-full bg-gold-400/5 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-16 -left-16 w-[320px] h-[320px] rounded-full bg-gold-500/8 blur-3xl pointer-events-none" aria-hidden="true" />

        {/* Subtle gold line accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" aria-hidden="true" />

        <div className="relative max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="section-eyebrow mb-5 animate-fade-in">
            대치동 학부모를 위한
          </p>
          <h1 className="font-display text-3xl md:text-[2.75rem] font-bold text-white leading-tight mb-5 animate-fade-up">
            교육 정보와 일정을<br />
            <span className="text-gold-400">한 곳에서</span> 관리하세요
          </h1>
          <p className="text-white/50 text-base md:text-lg mb-10 leading-relaxed animate-fade-up-1">
            대치동 중학생 학부모들이 꼭 알아야 할 학원·입시 정보와<br className="hidden md:block" />
            자녀의 교육 일정을 스마트하게 관리할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up-2">
            <Link href="/login?signup=1" className="btn-primary text-sm">
              대치 플래너 시작하기
            </Link>
            <Link href="/briefings" className="btn-ghost-white text-sm">
              브리프 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* ── Value Props ────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-5">
          {VALUE_PROPS.map((item, i) => (
            <div
              key={item.title}
              className={`card-lift p-6 animate-fade-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gold-50 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1.5">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent Content ─────────────────────────────── */}
      {recentItems.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="section-eyebrow mb-1">대치동 에디터 픽</p>
              <h2 className="font-display text-xl font-bold text-gray-900">최신 브리프</h2>
            </div>
            <Link
              href="/briefings"
              className="text-sm text-gold-600 font-medium hover:text-gold-700 flex items-center gap-1 transition-colors"
            >
              전체 보기
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentItems.map((item, i) => (
              <div
                key={item.id}
                className="animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <ContentCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA Banner ────────────────────────────────── */}
      <section className="bg-navy-900 border-t border-navy-700/30">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          {/* Gold line */}
          <div className="flex justify-center mb-6">
            <div className="gold-line" />
          </div>
          <h2 className="font-display text-xl font-bold text-white mb-3">
            지금 바로 대치 플래너를 시작하세요
          </h2>
          <p className="text-white/40 text-sm mb-8">
            오픈 베타 기간 동안 모든 기능을 무료로 이용할 수 있습니다.
          </p>
          <Link href="/login?signup=1" className="btn-primary text-sm">
            대치 플래너 시작하기
          </Link>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-white/50 mb-1 font-medium">아직 가입은 망설여지시나요?</p>
            <p className="text-xs text-white/30 mb-4">
              이메일만 남겨주시면 새 소식과 업데이트를 가장 먼저 알려드릴게요.
            </p>
            <WaitlistForm source="landing" />
          </div>
        </div>
      </section>
    </>
  )
}
