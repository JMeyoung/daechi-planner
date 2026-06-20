'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { AcademyFee, ScheduleEvent, AcademyReview, TeacherMemo, ChildProfile } from '@/types'
import { CHILD_COLORS, DOT_COLOR } from '@/lib/child-colors'

const CATEGORY_COLOR: Record<string, string> = {
  academy: '#2d4470', // navy-600
  personal: '#d4a853', // gold-400
  exam: '#9f1239', // rose-800
}

const CATEGORY_LABEL: Record<string, string> = {
  academy: '학원',
  personal: '개인 학습',
  exam: '시험',
}

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function ReportsPage() {
  const supabase = createClient()
  
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [fees, setFees] = useState<AcademyFee[]>([])
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [reviews, setReviews] = useState<AcademyReview[]>([])
  const [memos, setMemos] = useState<TeacherMemo[]>([])

  useEffect(() => {
    loadData()
  }, [currentDate])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // 이 달의 시작과 끝 (UTC 기준 단순 계산을 피하기 위해 ISO 문자열 사용, 서버 필터용)
    // 하지만 RLS 정책 상 가족 데이터를 다 가져와야 하므로, 클라이언트 필터링을 병행하는 것이 안전할 수 있습니다.
    const startStr = new Date(year, month, 1).toISOString()
    const endStr = new Date(year, month + 1, 0, 23, 59, 59).toISOString()

    const [childRes, feesRes, eventsRes, reviewsRes, memosRes] = await Promise.all([
      supabase.from('child_profiles').select('*'),
      // 활성화된 학원비 전체
      supabase.from('academy_fees').select('*').eq('is_active', true),
      // 일회성 일정은 이 달에 속하는지, 반복 일정은 모두 가져와서 필터링
      supabase.from('schedule_events').select('*'),
      supabase.from('academy_reviews').select('*').gte('created_at', startStr).lte('created_at', endStr),
      supabase.from('teacher_memos').select('*').gte('created_at', startStr).lte('created_at', endStr),
    ])

    if (childRes.data) setChildren(childRes.data as ChildProfile[])
    if (feesRes.data) setFees(feesRes.data as AcademyFee[])
    if (eventsRes.data) setEvents(eventsRes.data as ScheduleEvent[])
    if (reviewsRes.data) setReviews(reviewsRes.data as AcademyReview[])
    if (memosRes.data) setMemos(memosRes.data as TeacherMemo[])
    
    setLoading(false)
  }

  function prevMonth() {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  
  function nextMonth() {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // --- 통계 계산 ---

  // 1. 이번 달 총 교육비 (활성화된 모든 학원비의 합)
  const totalFees = useMemo(() => fees.reduce((sum, f) => sum + f.amount, 0), [fees])

  // 2. 학습 시간 통계
  const studyHours = useMemo(() => {
    let academyMins = 0
    let personalMins = 0
    let examMins = 0

    events.forEach(e => {
      if (!e.end_at) return
      
      const start = new Date(e.start_at)
      const end = new Date(e.end_at)
      const durationMins = (end.getTime() - start.getTime()) / 60000

      if (e.is_recurring && e.recur_days) {
        // 이 달에 해당 요일이 몇 번 있는지 대략 계산 (간단히 4번으로 추산)
        const count = 4
        const total = durationMins * count
        if (e.category === 'academy') academyMins += total
        if (e.category === 'personal') personalMins += total
        if (e.category === 'exam') examMins += total
      } else {
        // 일회성 일정이 이번 달인지 확인
        if (start.getFullYear() === currentDate.getFullYear() && start.getMonth() === currentDate.getMonth()) {
          if (e.category === 'academy') academyMins += durationMins
          if (e.category === 'personal') personalMins += durationMins
          if (e.category === 'exam') examMins += durationMins
        }
      }
    })

    return [
      { name: 'academy', value: Math.round(academyMins / 60), color: CATEGORY_COLOR.academy },
      { name: 'personal', value: Math.round(personalMins / 60), color: CATEGORY_COLOR.personal },
      { name: 'exam', value: Math.round(examMins / 60), color: CATEGORY_COLOR.exam },
    ].filter(d => d.value > 0)
  }, [events, currentDate])

  const totalHours = studyHours.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">월간 교육 리포트</h1>
      </div>

      {/* 월 이동 컨트롤 */}
      <div className="flex items-center justify-between bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-4">
        <button onClick={prevMonth} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </button>
        <span className="font-semibold text-lg text-gray-900 dark:text-white">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </span>
        <button onClick={nextMonth} className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-navy-200 border-t-navy-800 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-5 animate-fade-up">
          {/* 비용 요약 */}
          <div className="bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-5 text-white">
            <p className="text-white/60 text-sm mb-1">총 교육 지출</p>
            <p className="font-display text-3xl font-bold">{formatAmount(totalFees)}</p>
          </div>

          {/* 학습 시간 차트 */}
          <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-5">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">예상 학습 시간 (월)</h2>
            {totalHours > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={studyHours}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {studyHours.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}시간`} labelFormatter={() => ''} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-4 justify-center mt-2">
                  {studyHours.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      {CATEGORY_LABEL[d.name]} <span className="font-semibold">{d.value}시간</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">등록된 일정이 부족하여 학습 시간을 계산할 수 없습니다.</p>
            )}
          </div>

          {/* 주요 이슈 (이번 달 생성된 리뷰 및 메모) */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">이번 달 주요 기록</h2>
            
            {reviews.length === 0 && memos.length === 0 && (
              <div className="bg-surface-50 dark:bg-navy-900 border border-surface-border dark:border-navy-700 rounded-xl p-5 text-center">
                <p className="text-sm text-gray-400 dark:text-gray-500">작성된 만족도 기록이나 선생님 메모가 없습니다.</p>
              </div>
            )}

            {reviews.map(r => (
              <div key={r.id} className="bg-gold-50 dark:bg-gold-900/20 border border-gold-100 dark:border-gold-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold-200 dark:bg-gold-800 text-gold-800 dark:text-gold-200 font-semibold">만족도 기록</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{r.academy_name}</span>
                </div>
                {r.review_text && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{r.review_text}</p>}
              </div>
            ))}

            {memos.map(m => (
              <div key={m.id} className="bg-navy-50 dark:bg-navy-900/40 border border-navy-100 dark:border-navy-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-navy-200 dark:bg-navy-700 text-navy-800 dark:text-navy-100 font-semibold">선생님 메모</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{m.academy_name} {m.teacher_name}</span>
                </div>
                {m.memo && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">{m.memo}</p>}
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  )
}
