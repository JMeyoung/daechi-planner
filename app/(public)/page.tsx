import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import type { ContentSummary } from '@/types'

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
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-700 to-blue-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <p className="text-blue-200 text-sm font-medium mb-3 tracking-wide uppercase">
            대치동 학부모를 위한
          </p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            교육 정보와 일정을<br />한 곳에서 관리하세요
          </h1>
          <p className="text-blue-100 text-base md:text-lg mb-8 leading-relaxed">
            대치동 중학생 학부모들이 꼭 알아야 할 학원·입시 정보와<br className="hidden md:block" />
            자녀의 교육 일정을 스마트하게 관리할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?signup=1"
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-full hover:bg-blue-50 transition-colors"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/briefings"
              className="text-white border border-white/50 px-6 py-3 rounded-full hover:bg-white/10 transition-colors"
            >
              브리프 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="max-w-5xl mx-auto px-4 py-14">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: '📋',
              title: '교육 일정 관리',
              desc: '학원 시간표, 시험 일정, 상담 예약을 한 곳에서 정리하고 관리하세요.',
            },
            {
              icon: '📰',
              title: '대치동 교육 브리프',
              desc: '주요 학원 커리큘럼 변화, 입시 트렌드를 정리한 큐레이션 정보를 받아보세요.',
            },
            {
              icon: '🔖',
              title: '북마크 & 정리',
              desc: '중요한 정보를 저장하고 언제든지 꺼내볼 수 있습니다.',
            },
          ].map(item => (
            <div
              key={item.title}
              className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent content */}
      {recentItems.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-14">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">최신 브리프</h2>
            <Link href="/briefings" className="text-sm text-blue-700 hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recentItems.map(item => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="bg-blue-50 border-t border-blue-100">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            지금 무료로 가입하고 시작하세요
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            기본 기능은 무료입니다. 프리미엄 브리프는 구독 후 이용 가능합니다.
          </p>
          <Link
            href="/login?signup=1"
            className="inline-block bg-blue-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-800 transition-colors"
          >
            무료 회원가입
          </Link>
        </div>
      </section>
    </>
  )
}
