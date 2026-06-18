import Link from 'next/link'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

type Counter = {
  id: string
  title: string
  target_date: string
  emoji: string
  color: string
}

type Props = {
  counters: Counter[]
}

/** Calculate D-day difference using KST timezone */
function getDdayNumber(targetDate: string): number {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS)
  const todayKst = Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), nowKst.getUTCDate())
  const [y, m, d] = targetDate.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  return Math.ceil((target - todayKst) / (1000 * 60 * 60 * 24))
}

/** Format D-day display string */
function formatDday(diff: number): string {
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return '🎉 오늘!'
  return `D+${Math.abs(diff)}`
}

export default function DdayWidget({ counters }: Props) {
  // Sort by target_date ascending, take top 3
  const sorted = [...counters]
    .sort((a, b) => a.target_date.localeCompare(b.target_date))
    .slice(0, 3)

  return (
    <div className="bg-navy-gradient rounded-2xl p-5 relative overflow-hidden">
      {/* Decorative elements */}
      <div
        className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-gold-400/8 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-gold-400/20 to-transparent"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-sm">📅 D-day</h2>
        <Link
          href="/dday"
          className="text-xs text-gold-400/70 hover:text-gold-300 transition-colors"
        >
          관리
        </Link>
      </div>

      {sorted.length === 0 ? (
        /* Empty state */
        <div className="text-center py-3">
          <p className="text-white/40 text-sm mb-2">중요한 날짜를 추가해보세요</p>
          <Link
            href="/dday"
            className="text-xs text-gold-400/70 hover:text-gold-300 underline underline-offset-2 transition-colors"
          >
            추가하기 →
          </Link>
        </div>
      ) : (
        /* Counter list */
        <div className="space-y-3">
          {sorted.map((counter) => {
            const diff = getDdayNumber(counter.target_date)
            const isPast = diff < 0
            const isUrgent = diff > 0 && diff <= 7

            return (
              <div
                key={counter.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Urgent pulse dot */}
                  {isUrgent && (
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                    </span>
                  )}
                  <span className="text-base" aria-hidden="true">
                    {counter.emoji}
                  </span>
                  <span className="text-sm text-white/80 truncate">
                    {counter.title}
                  </span>
                </div>

                <span
                  className={`font-display text-lg font-bold shrink-0 ml-3 ${
                    isPast
                      ? 'text-white/30'
                      : diff === 0
                        ? 'text-white'
                        : 'text-gold-400'
                  }`}
                >
                  {formatDday(diff)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
