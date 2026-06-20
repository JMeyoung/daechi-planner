'use client'

import { useState } from 'react'
import type { ScheduleEvent, ChildProfile } from '@/types'

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']

const CATEGORY_COLOR: Record<string, string> = {
  academy: 'bg-navy-600 dark:bg-navy-400',
  exam: 'bg-red-400 dark:bg-red-500',
  personal: 'bg-gray-400 dark:bg-gray-500',
}

type Props = {
  events: ScheduleEvent[]
  childrenProfiles: ChildProfile[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function MonthlyView({ events, childrenProfiles, selectedDate, onSelectDate }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  
  const today = new Date()

  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  const getEventsForDate = (date: Date) => {
    const dow = date.getDay()
    return events.filter(e => 
      (e.is_recurring && e.recur_days?.includes(dow)) || 
      (!e.is_recurring && new Date(e.start_at).toDateString() === date.toDateString())
    )
  }

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="p-2 border-b border-r border-gray-100 dark:border-navy-800/50 bg-gray-50/50 dark:bg-navy-900/20"></div>)
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d)
    const isToday = date.toDateString() === today.toDateString()
    const isSelected = date.toDateString() === selectedDate.toDateString()
    const dayEvents = getEventsForDate(date)

    days.push(
      <div 
        key={`day-${d}`} 
        onClick={() => onSelectDate(date)}
        className={`min-h-[80px] p-1.5 border-b border-r border-gray-100 dark:border-navy-800/50 cursor-pointer transition-colors ${
          isSelected ? 'bg-gold-50 dark:bg-navy-800/80 ring-1 ring-inset ring-gold-400' : 'hover:bg-gray-50 dark:hover:bg-navy-800/40 bg-white dark:bg-navy-900/50'
        }`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
            isToday ? 'bg-navy-900 dark:bg-white text-white dark:text-navy-900' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {d}
          </span>
          {dayEvents.length > 0 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              {dayEvents.length}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {dayEvents.slice(0, 3).map((e, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${CATEGORY_COLOR[e.category] || 'bg-gray-300'}`} />
          ))}
          {dayEvents.length > 3 && (
            <div className="w-2 h-2 rounded-full border border-gray-300 dark:border-gray-600" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl border border-gray-200 dark:border-navy-700 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-navy-700">
        <button onClick={handlePrevMonth} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors">
          ‹
        </button>
        <h2 className="font-bold text-gray-900 dark:text-white">
          {year}년 {month + 1}월
        </h2>
        <button onClick={handleNextMonth} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-navy-800 rounded-lg transition-colors">
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-800/50">
        {DAYS_KO.map(day => (
          <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-navy-700 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days}
      </div>
    </div>
  )
}
