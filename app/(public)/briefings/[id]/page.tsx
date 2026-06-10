import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/badge'
import { toggleBookmark } from '@/actions/bookmark'
import type { ContentItem } from '@/types'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('content_items')
    .select('title, summary')
    .eq('id', id)
    .single()
  return { title: data?.title ?? '브리프', description: data?.summary }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function BriefingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: { user } }, { data: item }] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single(),
  ])

  if (!item) notFound()

  const content = item as ContentItem

  let isPremium = false
  let isBookmarked = false

  if (user) {
    const [subRes, bookmarkRes] = await Promise.all([
      supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single(),
      supabase.from('bookmarks').select('id').eq('user_id', user.id).eq('content_id', id).maybeSingle(),
    ])
    isPremium = subRes.data?.plan === 'premium' && subRes.data?.status === 'active'
    isBookmarked = !!bookmarkRes.data
  }

  const isLocked = content.is_premium && !isPremium
  const toggleAction = toggleBookmark.bind(null, id, isBookmarked)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/briefings" className="text-sm text-blue-700 hover:underline mb-6 inline-block">
        ← 목록으로
      </Link>

      <article>
        <div className="flex items-center gap-2 mb-3">
          <Badge category={content.category} />
          {content.is_premium && <Badge variant="orange">프리미엄</Badge>}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-snug">{content.title}</h1>

        {content.summary && (
          <p className="text-gray-500 text-base mb-2 leading-relaxed">{content.summary}</p>
        )}

        {content.published_at && (
          <p className="text-sm text-gray-400 mb-6">{formatDate(content.published_at)}</p>
        )}

        {user && (
          <form action={toggleAction} className="mb-8">
            <button
              type="submit"
              className={`text-sm px-4 py-1.5 rounded-lg border transition-colors ${
                isBookmarked
                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700'
              }`}
            >
              {isBookmarked ? '저장됨 ✓' : '저장하기'}
            </button>
          </form>
        )}

        {isLocked ? (
          <div className="border border-gray-200 rounded-2xl p-10 text-center bg-gray-50">
            <p className="font-semibold text-gray-900 mb-1">프리미엄 전용 콘텐츠입니다</p>
            <p className="text-sm text-gray-500 mb-5">
              프리미엄 멤버십을 구독하면 모든 콘텐츠를 이용할 수 있습니다.
            </p>
            <div className="flex gap-3 justify-center">
              {!user && (
                <Link
                  href={`/login?next=/briefings/${id}`}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  로그인
                </Link>
              )}
              <Link
                href="/pricing"
                className="text-sm px-4 py-2 rounded-lg bg-blue-700 text-white hover:bg-blue-800 transition-colors"
              >
                프리미엄 시작하기
              </Link>
            </div>
          </div>
        ) : (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.body}</p>
          </div>
        )}
      </article>
    </div>
  )
}
