import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import { DOT_COLOR } from '@/lib/child-colors'
import { FEATURES } from '@/lib/features'
import type { ContentSummary, Profile, Subscription, ScheduleEvent, ChildProfile } from '@/types'

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

const CATEGORY_COLOR: Record<string, string> = {
  academy:  'bg-azure-500',
  exam:     'bg-red-400',
  personal: 'bg-gray-300',
}

const CATEGORY_BADGE: Record<string, string> = {
  academy:  'bg-azure-50 text-azure-700',
  exam:     'bg-red-50 text-red-600',
  personal: 'bg-gray-100 text-gray-500',
}

const CATEGORY_LABEL: Record<string, string> = {
  academy: '학원', exam: '시험', personal: '개인',
}

export const metadata: Metadata = { title: '대시보드' }

export default async function DashboardPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()])
  if (!user) redirect('/login')

  const [profileRes, subRes, contentRes, bookmarkRes, scheduleRes, childrenRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
    FEATURES.briefings
      ? supabase
          .from('content_items')
          .select('id, title, summary, category, tags, is_premium, is_published, published_at, author_id, created_at, updated_at')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
    FEATURES.bookmarks
      ? supabase.from('bookmarks').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      : Promise.resolve({ count: 0 }),
    FEATURES.schedule
      ? supabase.from('schedule_events').select('id, title, category, subject, location, start_at, end_at, is_recurring, recur_days, child_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] }),
    FEATURES.schedule
      ? supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order')
      : Promise.resolve({ data: [] }),
  ])

  const profile = profileRes.data as Profile | null
  if (!profile?.full_name) redirect('/onboarding')

  const subscription = subRes.data as Subscription | null
  const recentContent = (contentRes.data ?? []) as ContentSummary[]
  const bookmarkCount = bookmarkRes.count ?? 0
  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active'

  const todayKST = getTodayKST()
  const children = (childrenRes.data ?? []) as ChildProfile[]
  const childById = new Map(children.map(c => [c.id, c]))
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
      {/* ── Welcome Card ───────────────────────────── */}
      <div className="relative overflow-hidden bg-azure-gradient rounded-2xl p-5 text-white animate-fade-up">
        {/* Decorative circle */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none" aria-hidden="true" />
        <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />

        <p className="text-white/70 text-sm mb-0.5">안녕하세요</p>
        <h1 className="font-display text-xl font-bold text-white">
          {profile?.full_name ?? user.email?.split('@')[0]} 님
        </h1>
        <div className="flex items-center gap-2 mt-3">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            isPremium
              ? 'bg-white/25 text-white border border-white/30'
              : 'bg-white/20 text-white/90 border border-white/20'
          }`}>
            {isPremium ? '✦ 프리미엄' : '무료 플랜'}
          </span>
          {!isPremium && (
            <Link href="/pricing" className="text-xs text-white/70 hover:text-white underline underline-offset-2 transition-colors">
              업그레이드 →
            </Link>
          )}
        </div>
      </div>

      {/* ── Quick Stats ────────────────────────────── */}
      {(FEATURES.bookmarks || FEATURES.schedule) && (
        <div className="grid grid-cols-2 gap-3 animate-fade-up-1">
          {FEATURES.bookmarks && (
            <div className="card-lift p-4 text-center">
              <p className="font-display text-3xl font-bold text-azure-600">{bookmarkCount}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">저장한 북마크</p>
            </div>
          )}
          {FEATURES.schedule && (
            <Link href="/schedule" className="card-lift p-4 text-center">
              <p className="font-display text-3xl font-bold text-azure-600">{todayEvents.length}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">오늘 일정</p>
            </Link>
          )}
        </div>
      )}

      {/* ── 오늘의 일정 ────────────────────────────── */}
      {FEATURES.schedule && <div className="animate-fade-up-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">오늘의 일정</h2>
          <Link href="/schedule" className="text-sm text-azure-600 font-medium hover:text-azure-700 transition-colors">
            전체 보기
          </Link>
        </div>

        {todayEvents.length === 0 ? (
          <div className="bg-surface-50 border border-surface-border rounded-2xl p-6 text-center">
            <p className="text-gray-400 text-sm mb-2">오늘 등록된 일정이 없어요.</p>
            <Link href="/schedule/new" className="text-sm text-azure-600 font-medium hover:underline">
              일정 추가하기 →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event, i) => {
              const child = event.child_id ? childById.get(event.child_id) : null
              return (
                <Link
                  key={event.id}
                  href={`/schedule/${event.id}`}
                  className="flex items-center gap-3 bg-white border border-surface-border rounded-xl px-4 py-3
                             hover:bg-surface-50 hover:border-azure-200 transition-all duration-150"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Category color bar */}
                  <div className={`w-1 h-8 rounded-full shrink-0 ${CATEGORY_COLOR[event.category] ?? 'bg-gray-200'}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[event.category]}`}>
                        {CATEGORY_LABEL[event.category]}
                      </span>
                      {child && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <span className={`w-2 h-2 rounded-full ${DOT_COLOR[child.color] ?? 'bg-azure-400'}`} />
                          {child.name}
                        </span>
                      )}
                      {event.subject && <span className="text-xs text-gray-400">{event.subject}</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                  </div>

                  <p className="text-xs text-gray-400 shrink-0 font-medium">
                    {fmtTime(event.start_at)}{event.end_at ? `~${fmtTime(event.end_at)}` : ''}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>}

      {/* ── 최신 브리프 ────────────────────────────── */}
      {FEATURES.briefings && <div className="animate-fade-up-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">최신 브리프</h2>
          <Link href="/briefings" className="text-sm text-azure-600 font-medium hover:text-azure-700 transition-colors">
            전체 보기
          </Link>
        </div>

        {recentContent.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {recentContent.map(item => (
              <ContentCard key={item.id} item={item} showLock={!isPremium} />
            ))}
          </div>
        ) : (
          <div className="bg-surface-50 border border-surface-border rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm">아직 게시된 콘텐츠가 없습니다.</p>
          </div>
        )}
      </div>}
    </div>
  )
}
