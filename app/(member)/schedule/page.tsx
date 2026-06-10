'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DOT_COLOR } from '@/lib/child-colors'
import type { ScheduleEvent, ChildProfile } from '@/types'

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORY_STYLE = {
  academy: { card: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-800', label: '학원' },
  exam:    { card: 'border-red-200 bg-red-50',   badge: 'bg-red-100 text-red-800',   label: '시험' },
  personal:{ card: 'border-gray-200 bg-white',   badge: 'bg-gray-100 text-gray-600', label: '개인' },
}

function getMondayOf(date: Date) {
  const d = new Date(date)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function getEventsForDay(events: ScheduleEvent[], day: Date) {
  const dow = day.getDay()
  return events
    .filter(e =>
      e.is_recurring && e.recur_days
        ? e.recur_days.includes(dow)
        : isSameDay(new Date(e.start_at), day)
    )
    .sort((a, b) => {
      const ta = new Date(a.start_at)
      const tb = new Date(b.start_at)
      return ta.getHours() * 60 + ta.getMinutes() - (tb.getHours() * 60 + tb.getMinutes())
    })
}

function fmtTime(s: string) {
  const d = new Date(s)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [childFilter, setChildFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const [weekMonday, setWeekMonday] = useState(() => getMondayOf(today))
  const [selectedDay, setSelectedDay] = useState(today)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i))

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('schedule_events').select('*'),
      supabase.from('child_profiles').select('*').order('sort_order'),
    ]).then(([eventsRes, childrenRes]) => {
      setEvents(eventsRes.data ?? [])
      setChildren((childrenRes.data ?? []) as ChildProfile[])
      setLoading(false)
    })
  }, [])

  const childById = new Map(children.map(c => [c.id, c]))
  const filteredEvents = childFilter
    ? events.filter(e => e.child_id === childFilter)
    : events
  const dayEvents = getEventsForDay(filteredEvents, selectedDay)

  return (
    <div className="relative pb-24">
      {/* 자녀 필터 탭 */}
      {children.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setChildFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
              childFilter === null
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-500 border-surface-border hover:border-gray-400'
            }`}
          >
            전체
          </button>
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setChildFilter(child.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
                childFilter === child.id
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-surface-border hover:border-gray-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${DOT_COLOR[child.color] ?? 'bg-azure-400'}`} />
              {child.name}
            </button>
          ))}
        </div>
      )}

      {/* 주간 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekMonday(d => addDays(d, -7))}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-surface-50 transition-colors text-lg"
        >
          ‹
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {weekMonday.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
          {' – '}
          {addDays(weekMonday, 6).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
        </span>
        <button
          onClick={() => setWeekMonday(d => addDays(d, 7))}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-surface-50 transition-colors text-lg"
        >
          ›
        </button>
      </div>

      {/* 요일 탭 */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {weekDays.map((day, i) => {
          const isSelected = isSameDay(day, selectedDay)
          const isToday = isSameDay(day, today)
          const hasEvents = getEventsForDay(filteredEvents, day).length > 0
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(day)}
              className={`flex flex-col items-center py-2 rounded-xl transition-all duration-150 ${
                isSelected
                  ? 'bg-azure-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.3)]'
                  : isToday
                  ? 'bg-azure-50 text-azure-700'
                  : 'text-gray-500 hover:bg-surface-50'
              }`}
            >
              <span className="text-xs mb-0.5 font-medium">{DAYS_KO[day.getDay()]}</span>
              <span className="text-sm font-bold">{day.getDate()}</span>
              <span className={`w-1 h-1 rounded-full mt-0.5 transition-colors ${
                hasEvents
                  ? isSelected ? 'bg-white/80' : 'bg-azure-400'
                  : 'bg-transparent'
              }`} />
            </button>
          )
        })}
      </div>

      {/* 선택된 날짜 이벤트 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {selectedDay.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </h2>
          <Link href="/schedule/new" className="text-sm text-azure-600 font-semibold hover:text-azure-700 transition-colors">
            + 일정 추가
          </Link>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
        ) : dayEvents.length === 0 ? (
          <div className="bg-surface-50 border border-surface-border rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">이 날 등록된 일정이 없어요.</p>
            <Link
              href="/schedule/new"
              className="btn-primary text-sm py-2 px-5"
            >
              일정 추가하기
            </Link>
          </div>
        ) : (
          dayEvents.map(event => {
            const style = CATEGORY_STYLE[event.category]
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
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <span className={`w-2 h-2 rounded-full ${DOT_COLOR[child.color] ?? 'bg-azure-400'}`} />
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
                    <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {fmtTime(event.start_at)}
                      {event.end_at ? ` ~ ${fmtTime(event.end_at)}` : ''}
                    </p>
                    {event.location && (
                      <p className="text-xs text-gray-400 mt-0.5">{event.location}</p>
                    )}
                  </div>
                  <span className="text-gray-300 mt-1">›</span>
                </div>
              </Link>
            )
          })
        )}
      </div>

      {/* FAB */}
      <Link
        href="/schedule/new"
        aria-label="일정 추가"
        className="fixed bottom-24 right-6 w-14 h-14 bg-azure-gradient text-white rounded-full
                   flex items-center justify-center shadow-cta
                   hover:shadow-cta-hover hover:-translate-y-0.5
                   transition-all duration-200 text-3xl font-light leading-none"
      >
        +
      </Link>
    </div>
  )
}
