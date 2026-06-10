import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
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

type SearchParams = { category?: string }

export default async function BriefingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { category } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('content_items')
    .select('id, title, summary, category, tags, is_premium, is_published, published_at, author_id, created_at, updated_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })

  if (category) {
    query = query.eq('category', category)
  }

  const { data } = await query
  const items = (data ?? []) as ContentSummary[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">브리프 둘러보기</h1>
        <p className="text-gray-500 text-sm">대치동 교육 정보를 큐레이션해서 전달합니다.</p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <a
            key={cat.value}
            href={cat.value ? `?category=${cat.value}` : '/briefings'}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              (category ?? '') === cat.value
                ? 'bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.label}
          </a>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-center text-gray-400 py-16">콘텐츠가 없습니다.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
