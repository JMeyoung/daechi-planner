import type { Metadata } from 'next'
import { createClient, getUser } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import type { ContentSummary } from '@/types'

export const metadata: Metadata = { title: '브리프 둘러보기' }

const CATEGORIES = [
  { value: '', label: '전체' },
  { value: 'briefing', label: '브리프' },
  { value: 'tip', label: '학습 팁' },
  { value: 'announcement', label: '공지' },
  { value: 'event', label: '행사' },
] as const

type SearchParams = { category?: string; q?: string }

export default async function BriefingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { category, q } = await searchParams
  const [user, supabase] = await Promise.all([getUser(), createClient()])

  // 구독 상태 — 프리미엄 회원에겐 잠금 표시 안 함
  let isPremium = false
  if (user) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single()
    isPremium = sub?.plan === 'premium' && sub?.status === 'active'
  }

  let query = supabase
    .from('content_items')
    .select('id, title, summary, category, tags, is_premium, is_published, published_at, author_id, created_at, updated_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  // PostgREST or() 문법과 충돌하는 문자는 제거
  const search = q?.replace(/[,()%]/g, '').trim()
  if (search) {
    query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)
  }

  const { data } = await query.limit(60)
  const items = (data ?? []) as ContentSummary[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Page header */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <p className="section-eyebrow mb-2">대치동 에디터 픽</p>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">브리프 둘러보기</h1>
            <p className="text-gray-500 text-sm">대치동 교육 정보를 큐레이션해서 전달합니다.</p>
          </div>
          {/* Result count */}
          {(search || category) && (
            <p className="text-sm text-gray-400 shrink-0">
              {items.length}건
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <form action="/briefings" method="get" className="mb-5">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative max-w-md">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ''}
            placeholder="제목·내용 검색"
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-4 pr-12 py-3 text-sm
                       focus:outline-none focus:border-navy-400 focus:ring-2 focus:ring-navy-300
                       transition-all placeholder:text-gray-400"
          />
          <button
            type="submit"
            aria-label="검색"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center
                       rounded-xl bg-navy-800 text-white shadow-sm hover:bg-navy-900 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Category filter chips */}
      <div className="flex gap-2 flex-wrap mb-8">
        {CATEGORIES.map(cat => {
          const params = new URLSearchParams()
          if (cat.value) params.set('category', cat.value)
          if (q) params.set('q', q)
          const qs = params.toString()
          const isActive = (category ?? '') === cat.value
          return (
            <a
              key={cat.value}
              href={qs ? `/briefings?${qs}` : '/briefings'}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                isActive
                  ? 'bg-navy-900 text-white border-navy-900 shadow-[0_2px_8px_rgba(15,23,42,0.3)]'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-700'
              }`}
            >
              {cat.label}
            </a>
          )
        })}
      </div>

      {/* Content grid */}
      {items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-gray-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">
            {search ? `"${search}"에 대한 결과가 없습니다` : '콘텐츠가 없습니다'}
          </p>
          {search && (
            <a href="/briefings" className="text-sm text-gold-600 hover:underline font-medium">전체 보기</a>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
            >
              <ContentCard item={item} showLock={!isPremium} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
