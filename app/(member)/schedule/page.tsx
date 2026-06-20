'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DOT_COLOR } from '@/lib/child-colors'
import { MonthlyView } from '@/components/schedule/monthly-view'
import { WeeklyView } from '@/components/schedule/weekly-view'
import { DailyView } from '@/components/schedule/daily-view'
import type { ScheduleEvent, ChildProfile } from '@/types'

type ViewMode = 'month' | 'week' | 'day'

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

export default function SchedulePage() {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [childFilter, setChildFilter] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const today = new Date()
  const [weekMonday, setWeekMonday] = useState(() => getMondayOf(today))
  const [selectedDay, setSelectedDay] = useState(today)

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

  const filteredEvents = childFilter
    ? events.filter(e => e.child_id === childFilter)
    : events

  const handleSelectDate = (date: Date) => {
    setSelectedDay(date)
    setWeekMonday(getMondayOf(date))
    setViewMode('day')
  }

  return (
    <div className="relative pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">일정 관리</h1>
        <div className="bg-gray-100 dark:bg-navy-800 p-1 rounded-lg flex text-sm">
          <button 
            onClick={() => setViewMode('month')} 
            className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'month' ? 'bg-white dark:bg-navy-700 shadow-sm font-medium text-navy-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >월별</button>
          <button 
            onClick={() => setViewMode('week')} 
            className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'week' ? 'bg-white dark:bg-navy-700 shadow-sm font-medium text-navy-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >주별</button>
          <button 
            onClick={() => setViewMode('day')} 
            className={`px-3 py-1 rounded-md transition-colors ${viewMode === 'day' ? 'bg-white dark:bg-navy-700 shadow-sm font-medium text-navy-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >일별</button>
        </div>
      </div>

      {/* 자녀 필터 탭 */}
      {children.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setChildFilter(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-150 ${
              childFilter === null
                ? 'bg-gray-900 text-white border-gray-900 dark:bg-navy-700 dark:border-navy-700'
                : 'bg-white text-gray-500 border-surface-border dark:bg-navy-800 dark:text-gray-400 dark:border-navy-700 hover:border-gray-400 dark:hover:border-gray-500'
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
                  ? 'bg-gray-900 text-white border-gray-900 dark:bg-navy-700 dark:border-navy-700'
                  : 'bg-white text-gray-500 border-surface-border dark:bg-navy-800 dark:text-gray-400 dark:border-navy-700 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${DOT_COLOR[child.color] ?? 'bg-navy-400'}`} />
              {child.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">불러오는 중...</div>
      ) : (
        <>
          {viewMode === 'month' && (
            <MonthlyView 
              events={filteredEvents} 
              childrenProfiles={children} 
              selectedDate={selectedDay} 
              onSelectDate={handleSelectDate} 
            />
          )}

          {viewMode === 'week' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setWeekMonday(d => addDays(d, -7))}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >‹</button>
                <span className="font-bold text-gray-900 dark:text-white">
                  {weekMonday.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} - {addDays(weekMonday, 6).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
                <button
                  onClick={() => setWeekMonday(d => addDays(d, 7))}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >›</button>
              </div>
              <WeeklyView 
                events={filteredEvents} 
                childrenProfiles={children} 
                weekMonday={weekMonday} 
                onSelectDate={handleSelectDate} 
              />
            </div>
          )}

          {viewMode === 'day' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    const next = addDays(selectedDay, -1)
                    setSelectedDay(next)
                    setWeekMonday(getMondayOf(next))
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >‹</button>
                <span className="font-bold text-gray-900 dark:text-white">
                  {selectedDay.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const next = addDays(selectedDay, 1)
                    setSelectedDay(next)
                    setWeekMonday(getMondayOf(next))
                  }}
                  className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors"
                >›</button>
              </div>
              <DailyView 
                events={filteredEvents} 
                childrenProfiles={children} 
                selectedDate={selectedDay} 
              />
            </div>
          )}
        </>
      )}

      {/* FAB */}
      <Link
        href="/schedule/new"
        aria-label="일정 추가"
        className="fixed bottom-24 right-6 w-14 h-14 bg-cta-gradient text-white rounded-full
                   flex items-center justify-center shadow-cta
                   hover:shadow-cta-hover hover:-translate-y-0.5
                   transition-all duration-200 text-3xl font-light leading-none z-40"
      >
        +
      </Link>
    </div>
  )
}
