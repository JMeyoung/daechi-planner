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

export default function ContentCard({ item, showLock = true }: ContentCardProps) {
  const isLocked = showLock && item.is_premium

  return (
    <Link
      href={isLocked ? '/pricing' : `/briefings/${item.id}`}
      className="block group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge category={item.category} />
          {item.is_premium && (
            <Badge variant="orange">프리미엄</Badge>
          )}
        </div>
        {isLocked && (
          <span className="text-gray-400 shrink-0 text-base" aria-label="잠금">🔒</span>
        )}
      </div>

      <h3 className={`font-medium text-gray-900 group-hover:text-blue-700 transition-colors leading-snug mb-1 ${isLocked ? 'opacity-60' : ''}`}>
        {item.title}
      </h3>

      {item.summary && (
        <p className={`text-sm text-gray-500 line-clamp-2 mb-3 ${isLocked ? 'opacity-50' : ''}`}>
          {isLocked ? '프리미엄 회원에게만 공개됩니다.' : item.summary}
        </p>
      )}

      {item.published_at && (
        <p className="text-xs text-gray-400">{formatDate(item.published_at)}</p>
      )}
    </Link>
  )
}
