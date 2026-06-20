'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { ScheduleEvent, ChildProfile } from '@/types'
import { DOT_COLOR } from '@/lib/child-colors'

const CATEGORY_STYLE: Record<string, { card: string, badge: string, label: string }> = {
  academy: { card: 'border-navy-200 bg-navy-50 dark:bg-navy-900 dark:border-navy-700', badge: 'bg-navy-100 text-navy-800 dark:bg-navy-800 dark:text-navy-100', label: '학원' },
  exam:    { card: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/30',   badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',   label: '시험' },
  personal:{ card: 'border-gray-200 bg-white dark:bg-navy-800 dark:border-navy-700',   badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: '개인' },
}

function fmtTime(s: string) {
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

type Props = {
  events: ScheduleEvent[]
  childrenProfiles: ChildProfile[]
  selectedDate: Date
}

export function DailyView({ events, childrenProfiles, selectedDate }: Props) {
  const childById = new Map(childrenProfiles.map(c => [c.id, c]))
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const dow = selectedDate.getDay()
  const dayEvents = events.filter(e => 
    (e.is_recurring && e.recur_days?.includes(dow)) || 
    (!e.is_recurring && new Date(e.start_at).toDateString() === selectedDate.toDateString())
  ).sort((a, b) => {
    const ta = new Date(a.start_at)
    const tb = new Date(b.start_at)
    return ta.getHours() * 60 + ta.getMinutes() - (tb.getHours() * 60 + tb.getMinutes())
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </h2>
        <Link href="/schedule/new" className="text-sm text-gold-600 dark:text-gold-500 font-semibold hover:text-gold-700 dark:hover:text-gold-400 transition-colors">
          + 일정 추가
        </Link>
      </div>

      {(!isMounted || dayEvents.length === 0) ? (
        <div className="bg-surface-50 dark:bg-navy-800/50 border border-surface-border dark:border-navy-700 rounded-2xl p-12 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
            {!isMounted ? '일정을 불러오는 중...' : '이 날 등록된 일정이 없어요.'}
          </p>
          <Link
            href="/schedule/new"
            className="btn-primary text-sm py-2 px-5"
          >
            일정 추가하기
          </Link>
        </div>
      ) : (
        dayEvents.map(event => {
          const style = CATEGORY_STYLE[event.category] || CATEGORY_STYLE.personal
          const child = event.child_id ? childById.get(event.child_id) : null
          return (
            <Link
              key={event.id}
              href={`/schedule/${event.id}`}
              className={`block border rounded-xl p-4 hover:shadow-sm transition-all duration-150 ${style.card}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${style.badge}`}>
                      {style.label}
                    </span>
                    {child && (
                      <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <span className={`w-2 h-2 rounded-full ${DOT_COLOR[child.color] ?? 'bg-navy-400'}`} />
                        {child.name}
                      </span>
                    )}
                    {event.subject && (
                      <span className="text-xs text-gray-500">{event.subject}</span>
                    )}
                    {event.is_recurring && (
                      <span className="text-xs text-gray-400">매주</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{event.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {fmtTime(event.start_at)}
                    {event.end_at ? ` ~ ${fmtTime(event.end_at)}` : ''}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{event.location}</p>
                  )}
                </div>
                <span className="text-gray-300 dark:text-gray-600 mt-1">›</span>
              </div>
            </Link>
          )
        })
      )}
    </div>
  )
}
