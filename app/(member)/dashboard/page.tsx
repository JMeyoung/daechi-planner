import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, getUser } from '@/lib/supabase/server'
import ContentCard from '@/components/content/content-card'
import DdayWidget from '@/components/dashboard/dday-widget'
import AiReportWidget from '@/components/dashboard/ai-report-widget'
import { DOT_COLOR } from '@/lib/child-colors'
import { FEATURES } from '@/lib/features'
import { detectConflicts } from '@/lib/schedule-conflicts'
import type { ContentSummary, Profile, Subscription, ScheduleEvent, ChildProfile, DdayCounter, TeacherMemo } from '@/types'

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
  academy:  'bg-navy-600',
  exam:     'bg-red-400',
  personal: 'bg-gray-300',
}

const CATEGORY_BADGE: Record<string, string> = {
  academy:  'bg-navy-50 text-navy-700',
  exam:     'bg-red-50 text-red-600',
  personal: 'bg-gray-100 text-gray-500',
}

const CATEGORY_LABEL: Record<string, string> = {
  academy: '학원', exam: '시험', personal: '개인',
}

export const metadata: Metadata = { title: '대시보드' }

const DEFAULT_CONFIG = ["welcome", "ai_report", "dday", "stats", "schedule", "briefings"]

export default async function DashboardPage() {
  const [user, supabase] = await Promise.all([getUser(), createClient()])
  if (!user) redirect('/login')

  const [profileRes, subRes, contentRes, bookmarkRes, scheduleRes, childrenRes, ddayRes, teacherRes] = await Promise.all([
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
    supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order'),
    supabase.from('dday_counters').select('*').eq('user_id', user.id).order('target_date'),
    supabase.from('teacher_memos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ])

  const profile = profileRes.data as Profile | null
  if (!profile?.full_name) redirect('/onboarding')

  const subscription = subRes.data as Subscription | null
  const recentContent = (contentRes.data ?? []) as ContentSummary[]
  const bookmarkCount = (bookmarkRes as { count?: number | null }).count ?? 0
  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active'
  const ddayCounters = (ddayRes.data ?? []) as DdayCounter[]
  const teacherCount = (teacherRes as { count?: number | null }).count ?? 0

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

  // 다자녀 픽업 충돌 감지
  const conflicts = children.length >= 2
    ? detectConflicts(allEvents, children, todayKST.dow)
    : []

  // 입시 관련 최신 브리프
  const admissionBrief = recentContent.find(c =>
    c.tags?.some(t => t.includes('입시') || t.includes('대입') || t.includes('수능') || t.includes('내신'))
  )

  const config = profile.dashboard_config ?? DEFAULT_CONFIG

  // 기존 사용자들의 설정에 ai_report가 없다면 기본 위치(welcome 바로 다음)에 강제 주입
  if (!config.includes('ai_report')) {
    const welcomeIndex = config.indexOf('welcome')
    config.splice(welcomeIndex !== -1 ? welcomeIndex + 1 : 0, 0, 'ai_report')
  }

  const renderWelcome = () => (
    <div key="welcome" className="relative overflow-hidden bg-navy-gradient rounded-2xl p-5 text-white animate-fade-up">
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gold-400/8 pointer-events-none" aria-hidden="true" />
      <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-white/5 pointer-events-none" aria-hidden="true" />
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent" aria-hidden="true" />
      <p className="text-white/50 text-sm mb-0.5">안녕하세요</p>
      <h1 className="font-display text-xl font-bold text-white">
        {profile?.full_name ?? user.email?.split('@')[0]} 님
      </h1>
    </div>
  )

  const renderDday = () => (
    <div key="dday" className="animate-fade-up-1">
      <DdayWidget counters={ddayCounters} />
    </div>
  )

  const renderAiReport = () => (
    <div key="ai_report" className="animate-fade-up-1">
      <AiReportWidget childrenProfiles={children} />
    </div>
  )

  const renderStats = () => (
    (FEATURES.bookmarks || FEATURES.schedule) ? (
      <div key="stats" className="grid grid-cols-3 gap-3 animate-fade-up-1">
        {FEATURES.bookmarks && (
          <div className="card-lift p-4 text-center">
            <p className="font-display text-3xl font-bold text-navy-800 dark:text-white">{bookmarkCount}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">저장한 북마크</p>
          </div>
        )}
        {FEATURES.schedule && (
          <Link href="/schedule" className="card-lift p-4 text-center">
            <p className="font-display text-3xl font-bold text-navy-800 dark:text-white">{todayEvents.length}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">오늘 일정</p>
          </Link>
        )}
        <Link href="/teachers" className="card-lift p-4 text-center">
          <p className="font-display text-3xl font-bold text-navy-800 dark:text-white">{teacherCount}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">선생님 메모</p>
        </Link>
      </div>
    ) : null
  )

  const renderSchedule = () => (
    <div key="schedule" className="space-y-6">
      {conflicts.length > 0 && (
        <div className="animate-fade-up-2">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              ⚠️ 오늘 픽업 충돌 감지!
            </p>
            {conflicts.map((c, i) => (
              <div key={i} className="text-sm text-red-800">
                <span className="font-medium">{c.child1.name}</span>
                <span className="text-red-500"> ({c.event1.title} {fmtTime(c.event1.start_at)}~{c.event1.end_at ? fmtTime(c.event1.end_at) : ''})</span>
                <span className="text-red-400 mx-1">↔</span>
                <span className="font-medium">{c.child2.name}</span>
                <span className="text-red-500"> ({c.event2.title} {fmtTime(c.event2.start_at)}~{c.event2.end_at ? fmtTime(c.event2.end_at) : ''})</span>
              </div>
            ))}
            <Link href="/schedule" className="text-xs text-red-600 font-medium hover:underline">
              일정 확인하기 →
            </Link>
          </div>
        </div>
      )}

      {FEATURES.schedule && <div className="animate-fade-up-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">오늘의 일정</h2>
          <Link href="/schedule" className="text-sm text-gold-600 dark:text-gold-500 font-medium hover:text-gold-700 dark:hover:text-gold-400 transition-colors">
            전체 보기
          </Link>
        </div>

        {todayEvents.length === 0 ? (
          <div className="bg-surface-50 dark:bg-navy-800/50 border border-surface-border dark:border-navy-700 rounded-2xl p-6 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-2">오늘 등록된 일정이 없어요.</p>
            <Link href="/schedule/new" className="text-sm text-gold-600 dark:text-gold-500 font-medium hover:underline">
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
                  className="flex items-center gap-3 bg-white dark:bg-navy-800 border border-surface-border dark:border-navy-700 rounded-xl px-4 py-3
                             hover:bg-surface-50 dark:hover:bg-navy-800/80 hover:border-gold-200 dark:hover:border-gold-500/50 transition-all duration-150"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className={`w-1 h-8 rounded-full shrink-0 ${CATEGORY_COLOR[event.category] ?? 'bg-gray-200'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[event.category]}`}>
                        {CATEGORY_LABEL[event.category]}
                      </span>
                      {child && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <span className={`w-2 h-2 rounded-full ${DOT_COLOR[child.color] ?? 'bg-navy-400'}`} />
                          {child.name}
                        </span>
                      )}
                      {event.subject && <span className="text-xs text-gray-400">{event.subject}</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{event.title}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 shrink-0 font-medium">
                    {fmtTime(event.start_at)}{event.end_at ? `~${fmtTime(event.end_at)}` : ''}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </div>}
    </div>
  )

  const renderBriefings = () => (
    <div key="briefings" className="space-y-6">
      {FEATURES.briefings && admissionBrief && (
        <div className="animate-fade-up-3">
          <Link
            href={`/briefings/${admissionBrief.id}`}
            className="block bg-gradient-to-br from-navy-800 to-navy-900 rounded-xl p-4 hover:from-navy-700 hover:to-navy-800 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold-400/20 text-gold-300 font-semibold">📢 입시 브리프</span>
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">{admissionBrief.title}</h3>
            <p className="text-xs text-white/60 line-clamp-2">{admissionBrief.summary}</p>
            <span className="text-xs text-gold-400/70 mt-2 inline-block">자세히 보기 →</span>
          </Link>
        </div>
      )}

      {FEATURES.briefings && <div className="animate-fade-up-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">최신 브리프</h2>
          <Link href="/briefings" className="text-sm text-gold-600 dark:text-gold-500 font-medium hover:text-gold-700 dark:hover:text-gold-400 transition-colors">
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
          <div className="bg-surface-50 dark:bg-navy-800/50 border border-surface-border dark:border-navy-700 rounded-2xl p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">아직 게시된 콘텐츠가 없습니다.</p>
          </div>
        )}
      </div>}
    </div>
  )

  const WIDGETS: Record<string, () => React.ReactNode> = {
    welcome: renderWelcome,
    ai_report: renderAiReport,
    dday: renderDday,
    stats: renderStats,
    schedule: renderSchedule,
    briefings: renderBriefings,
  }

  return (
    <div className="space-y-6">
      {config.map(key => WIDGETS[key] && WIDGETS[key]())}
    </div>
  )
}
