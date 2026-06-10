import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import type { ContentSummary, Profile, Subscription } from '@/types'

export const metadata: Metadata = { title: '대시보드' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, subRes, contentRes, bookmarkRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase
      .from('content_items')
      .select('id, title, summary, category, tags, is_premium, is_published, published_at, author_id, created_at, updated_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(4),
    supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const profile = profileRes.data as Profile | null
  if (!profile?.full_name) redirect('/onboarding')

  const subscription = subRes.data as Subscription | null
  const recentContent = (contentRes.data ?? []) as ContentSummary[]
  const bookmarkCount = bookmarkRes.count ?? 0
  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active'

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <p className="text-sm text-gray-500 mb-1">안녕하세요</p>
        <h1 className="text-lg font-bold text-gray-900">
          {profile?.full_name ?? user.email?.split('@')[0]} 님
        </h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isPremium
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {isPremium ? '프리미엄' : '무료 플랜'}
          </span>
          {!isPremium && (
            <Link href="/pricing" className="text-xs text-blue-700 hover:underline">
              업그레이드 →
            </Link>
          )}
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{bookmarkCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">저장한 북마크</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">0</p>
          <p className="text-xs text-gray-500 mt-0.5">이번 주 일정</p>
        </div>
      </div>

      {/* Recent content */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">최신 브리프</h2>
          <Link href="/briefings" className="text-sm text-blue-700 hover:underline">전체 보기</Link>
        </div>
        {recentContent.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {recentContent.map(item => (
              <ContentCard key={item.id} item={item} showLock={!isPremium} />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-400 text-sm">아직 게시된 콘텐츠가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
