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

  // 모든 콘텐츠를 조건 없이 열람 가능하게 설정 (무료/유료 구분 제거)
  const isLocked = false
  const toggleAction = toggleBookmark.bind(null, id, isBookmarked)

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link
        href="/briefings"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy-700 mb-8 transition-colors font-medium animate-fade-in"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        목록으로
      </Link>

      <article>
        {/* Meta */}
        <div className="flex items-center gap-2 mb-4 animate-fade-up">
          <Badge category={content.category} />
        </div>

        {/* Title */}
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-3 leading-snug animate-fade-up-1">
          {content.title}
        </h1>

        {/* Summary */}
        {content.summary && (
          <p className="text-gray-500 text-[15px] mb-3 leading-relaxed animate-fade-up-1">
            {content.summary}
          </p>
        )}

        {/* Date */}
        {content.published_at && (
          <p className="text-sm text-gray-400 mb-7 animate-fade-up-1">{formatDate(content.published_at)}</p>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 mb-7 animate-fade-up-2" />

        {/* Bookmark */}
        {user && (
          <form action={toggleAction} className="mb-8 animate-fade-up-2">
            <button
              type="submit"
              className={`inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border font-medium transition-all duration-200 ${
                isBookmarked
                  ? 'bg-gold-100 border-gold-200 text-gold-700 hover:bg-gold-50'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-navy-300 hover:text-navy-700'
              }`}
            >
              <svg viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
              </svg>
              {isBookmarked ? '저장됨' : '저장하기'}
            </button>
          </form>
        )}

        {/* Content or paywall */}
        {isLocked ? (
          <div className="rounded-2xl overflow-hidden border border-gray-200 animate-fade-up-2">
            {/* Blurred preview */}
            <div className="h-24 bg-gradient-to-b from-transparent to-white relative overflow-hidden">
              <div className="absolute inset-0 p-5 blur-sm opacity-40 pointer-events-none select-none text-sm text-gray-600 leading-relaxed">
                이 콘텐츠는 스탠다드 멤버에게만 공개됩니다. 지금 구독하시면 대치동 학원 심층 분석과 입시 트렌드 리포트를 포함한 모든 스탠다드 콘텐츠를 이용하실 수 있습니다.
              </div>
            </div>
            {/* Paywall CTA */}
            <div className="bg-gray-50 px-8 py-8 text-center border-t border-gray-200">
              <p className="font-semibold text-gray-900 mb-1">스탠다드 전용 콘텐츠입니다</p>
              <p className="text-sm text-gray-500 mb-6">
                스탠다드 멤버십을 구독하면 모든 콘텐츠를 이용할 수 있습니다.
              </p>
              <div className="flex gap-3 justify-center">
                {!user && (
                  <Link
                    href={`/login?next=/briefings/${id}`}
                    className="btn-outline text-sm py-2 px-5"
                  >
                    로그인
                  </Link>
                )}
                <Link href="/pricing" className="btn-primary text-sm py-2.5 px-6">
                  스탠다드 시작하기
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-up-2">
            <p className="text-gray-700 leading-[1.85] whitespace-pre-wrap text-[15px]">
              {content.body}
            </p>
          </div>
        )}
      </article>
    </div>
  )
}
