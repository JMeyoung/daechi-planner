import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import type { ContentSummary } from '@/types'

export const metadata: Metadata = { title: '북마크' }

export default async function BookmarksPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()])
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('bookmarks')
    .select(`
      id,
      content_items (
        id, title, summary, category, tags,
        is_premium, is_published, published_at,
        author_id, created_at, updated_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const items = (data ?? [])
    .map(b => b.content_items)
    .filter(Boolean) as unknown as ContentSummary[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">북마크</h1>
        <span className="text-sm text-gray-500">{items.length}개</span>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-surface-border rounded-2xl p-12 text-center">
          <p className="text-gray-500 text-sm mb-3">저장한 콘텐츠가 없습니다.</p>
          <Link href="/briefings" className="text-sm text-gold-600 hover:underline">
            브리프 둘러보기 →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map(item => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
