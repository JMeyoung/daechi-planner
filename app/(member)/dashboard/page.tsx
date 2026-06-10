import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import type { ContentSummary, Profile, Subscription, ScheduleEvent } from '@/types'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function getTodayKST() {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS)
  return {
    dow: nowKst.getUTCDay(),
    year: nowKst.getUTCFullYear(),
    month: nowKst.getUTCMonth(),
    date: nowKst.getUTCDate(),
  }
}

function isTodayKST(startAt: string, today: ReturnType<typeof getTodayKST>) {
  const d = new Date(new Date(startAt).getTime() + KST_OFFSET_MS)
  return d.getUTCFullYear() === today.year &&
    d.getUTCMonth() === today.month &&
    d.getUTCDate() === today.date
}

function fmtTime(s: string) {
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const CATEGORY_BADGE: Record<string, string> = {
  academy: 'bg-blue-100 text-blue-700',
  exam:    'bg-red-100 text-red-700',
  personal:'bg-gray-100 text-gray-600',
}
const CATEGORY_LABEL: Record<string, string> = {
  academy: '학원', exam: '시험', personal: '개인',
}

export const metadata: Metadata = { title: '대시보드' }

export default async function DashboardPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()])
  if (!user) redirect('/login')

  const [profileRes, subRes, contentRes, bookmarkRes, scheduleRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    supabase
      .from('content_items')
      .select('id, title, summary, category, tags, is_premium, is_published, published_at, author_id, created_at, updated_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(4),
    supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('schedule_events').select('id, title, category, subject, location, start_at, end_at, is_recurring, recur_days').eq('user_id', user.id),
  ])

  const profile = profileRes.data as Profile | null
  if (!profile?.full_name) redirect('/onboarding')

  const subscription = subRes.data as Subscription | null
  const recentContent = (contentRes.data ?? []) as ContentSummary[]
  const bookmarkCount = bookmarkRes.count ?? 0
  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active'

  const todayKST = getTodayKST()
  const allEvents = (scheduleRes.data ?? []) as ScheduleEvent[]
  const todayEvents = allEvents
    .filter(e =>
      e.is_recurring && e.recur_days
        ? e.recur_days.includes(todayKST.dow)
        : isTodayKST(e.start_at, todayKST)
    )
    .sort((a, b) => {
      const ta = new Date(a.start_at)
      const tb = new Date(b.start_at)
      return ta.getHours() * 60 + ta.getMinutes() - (tb.getHours() * 60 + tb.getMinutes())
    })

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
        <Link href="/schedule" className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:border-blue-300 transition-colors">
          <p className="text-2xl font-bold text-blue-700">{todayEvents.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">오늘 일정</p>
        </Link>
      </div>

      {/* 오늘의 일정 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">오늘의 일정</h2>
          <Link href="/schedule" className="text-sm text-blue-700 hover:underline">전체 보기</Link>
        </div>
        {todayEvents.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
            <p className="text-gray-400 text-sm mb-2">오늘 등록된 일정이 없어요.</p>
            <Link href="/schedule/new" className="text-sm text-blue-700 hover:underline">
              일정 추가하기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map(event => (
              <Link
                key={event.id}
                href={`/schedule/${event.id}`}
                className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-200 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CATEGORY_BADGE[event.category]}`}>
                      {CATEGORY_LABEL[event.category]}
                    </span>
                    {event.subject && <span className="text-xs text-gray-400">{event.subject}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                </div>
                <p className="text-xs text-gray-500 shrink-0">
                  {fmtTime(event.start_at)}{event.end_at ? `~${fmtTime(event.end_at)}` : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
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
