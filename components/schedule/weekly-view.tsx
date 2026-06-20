'use client'

import React, { useEffect, useState } from 'react'
import type { ScheduleEvent, ChildProfile } from '@/types'
import { DOT_COLOR } from '@/lib/child-colors'

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8) // 08:00 to 22:00

const CATEGORY_STYLE: Record<string, string> = {
  academy: 'bg-navy-100 text-navy-800 dark:bg-navy-900/80 dark:text-navy-100 border-navy-200 dark:border-navy-700',
  exam: 'bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-100 border-red-200 dark:border-red-800',
  personal: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700',
}

type Props = {
  events: ScheduleEvent[]
  childrenProfiles: ChildProfile[]
  weekMonday: Date
  onSelectDate: (date: Date) => void
}

function addDays(date: Date, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function parseTime(timeStr: string) {
  const d = new Date(timeStr)
  return d.getHours() + d.getMinutes() / 60
}

export function WeeklyView({ events, childrenProfiles, weekMonday, onSelectDate }: Props) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i))
  const childById = new Map(childrenProfiles.map(c => [c.id, c]))
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getEventsForDay = (date: Date) => {
    const dow = date.getDay()
    return events.filter(e => 
      (e.is_recurring && e.recur_days?.includes(dow)) || 
      (!e.is_recurring && new Date(e.start_at).toDateString() === date.toDateString())
    )
  }

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-navy-700 shadow-sm overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header (Days) */}
        <div className="flex border-b border-gray-200 dark:border-navy-700">
          <div className="w-12 shrink-0 border-r border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/50"></div>
          {weekDays.map(day => {
            const isToday = day.toDateString() === new Date().toDateString()
            return (
              <div 
                key={day.toISOString()} 
                className={`flex-1 flex flex-col items-center py-2 border-r border-gray-200 dark:border-navy-700 last:border-r-0 cursor-pointer transition-colors ${
                  isToday ? 'bg-navy-50/50 dark:bg-navy-800' : 'hover:bg-gray-50 dark:hover:bg-navy-800/50'
                }`}
                onClick={() => onSelectDate(day)}
              >
                <span className={`text-xs font-medium ${isToday ? 'text-navy-700 dark:text-gold-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {DAYS_KO[day.getDay()]}
                </span>
                <span className={`text-sm font-bold ${isToday ? 'text-navy-900 dark:text-white' : 'text-gray-900 dark:text-gray-200'}`}>
                  {day.getDate()}
                </span>
              </div>
            )
          })}
        </div>

        {/* Time Grid */}
        <div className="relative h-[900px] flex bg-white dark:bg-navy-900/50">
          {/* Hour labels */}
          <div className="w-12 shrink-0 flex flex-col border-r border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/50">
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] border-b border-gray-200 dark:border-navy-700 relative text-[10px] text-gray-400 dark:text-gray-500 font-medium pt-1 text-center">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Grid columns */}
          {weekDays.map(day => {
            const dayEvents = getEventsForDay(day)
            
            return (
              <div key={`col-${day.toISOString()}`} className="flex-1 relative border-r border-gray-100 dark:border-navy-800/50 last:border-r-0">
                {/* Horizontal grid lines */}
                {HOURS.map(hour => (
                  <div key={`grid-${hour}`} className="h-[60px] border-b border-gray-100 dark:border-navy-800/50" />
                ))}

                {/* Event blocks */}
                {isMounted && dayEvents.map(event => {
                  const startHour = parseTime(event.start_at)
                  const endHour = event.end_at ? parseTime(event.end_at) : startHour + 2
                  
                  // Only show events within 08:00 - 22:00
                  if (startHour >= 23 || endHour <= 8) return null
                  
                  const displayStart = Math.max(8, startHour)
                  const displayEnd = Math.min(23, endHour)
                  
                  const top = (displayStart - 8) * 60
                  const height = (displayEnd - displayStart) * 60

                  const style = CATEGORY_STYLE[event.category] || CATEGORY_STYLE.personal
                  const child = event.child_id ? childById.get(event.child_id) : null

                  return (
                    <div
                      key={`evt-${event.id}`}
                      className={`absolute left-1 right-1 rounded border overflow-hidden p-1 text-[10px] leading-tight ${style}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={`${event.title} (${child?.name || '공통'})`}
                    >
                      <div className="font-semibold truncate mb-0.5">{event.title}</div>
                      {child && (
                        <div className="flex items-center gap-1 opacity-80">
                          <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[child.color] ?? 'bg-navy-400'}`} />
                          <span className="truncate">{child.name}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
