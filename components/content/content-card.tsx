import Link from 'next/link'
import type { ContentSummary } from '@/types'
import Badge from '@/components/ui/badge'

type ContentCardProps = {
  item: ContentSummary
  showLock?: boolean
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
  })
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 text-gray-400"
      aria-label="잠금"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export default function ContentCard({ item, showLock = true }: ContentCardProps) {
  // 오픈 베타 기간 동안 자물쇠 해제 (임시)
  const isLocked = false // showLock && item.is_premium

  return (
    <Link
      href={isLocked ? '/pricing' : `/briefings/${item.id}`}
      className="block group card-lift p-5"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge category={item.category} />
        </div>
        {isLocked && <LockIcon />}
      </div>

      <h3 className={`font-semibold text-[15px] leading-[1.4] text-gray-900 dark:text-white group-hover:text-navy-800 dark:group-hover:text-gold-400 transition-colors mb-1.5 ${isLocked ? 'opacity-50' : ''}`}>
        {item.title}
      </h3>

      {item.summary && (
        <p className={`text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3 ${isLocked ? 'opacity-40' : ''}`}>
          {isLocked ? '스탠다드 회원에게만 공개됩니다.' : item.summary}
        </p>
      )}

      {item.published_at && (
        <p className="text-xs text-gray-400">{formatDate(item.published_at)}</p>
      )}
    </Link>
  )
}
