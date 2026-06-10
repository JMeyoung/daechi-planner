'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DOT_COLOR } from '@/lib/child-colors'
import type { ChildProfile } from '@/types'

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토']
const CATEGORIES = [
  { value: 'academy', label: '학원' },
  { value: 'exam',    label: '시험' },
  { value: 'personal',label: '개인' },
] as const

type Category = typeof CATEGORIES[number]['value']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function NewSchedulePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurDays, setRecurDays] = useState<number[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [childId, setChildId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('child_profiles').select('*').order('sort_order').then(({ data }) => {
      const list = (data ?? []) as ChildProfile[]
      setChildren(list)
      if (list.length === 1) setChildId(list[0].id)
    })
  }, [])

  const [form, setForm] = useState({
    title: '',
    category: 'academy' as Category,
    subject: '',
    location: '',
    date: todayStr(),
    startTime: '16:00',
    endTime: '18:00',
    memo: '',
  })

  function set(key: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleDay(d: number) {
    setRecurDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('학원·일정명을 입력해주세요.'); return }
    if (isRecurring && recurDays.length === 0) { setError('반복 요일을 하나 이상 선택해주세요.'); return }

    setSaving(true)
    setError('')

    const refDate = isRecurring ? '2000-01-01' : form.date
    const start_at = new Date(`${refDate}T${form.startTime}:00`).toISOString()
    const end_at   = form.endTime ? new Date(`${refDate}T${form.endTime}:00`).toISOString() : null

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error: err } = await supabase.from('schedule_events').insert({
      user_id:      user.id,
      child_id:     childId,
      title:        form.title.trim(),
      category:     form.category,
      subject:      form.subject.trim()  || null,
      location:     form.location.trim() || null,
      start_at,
      end_at,
      is_recurring: isRecurring,
      recur_days:   isRecurring ? recurDays : null,
      memo:         form.memo.trim() || null,
    })

    setSaving(false)
    if (err) { setError('저장 중 오류가 발생했습니다.'); return }
    router.push('/schedule')
  }

  const input = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="max-w-lg pb-10">
      <h1 className="text-lg font-bold text-gray-900 mb-6">일정 추가</h1>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">

        {/* 제목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">학원·일정명 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="수학 학원"
            autoFocus
            className={input}
          />
        </div>

        {/* 자녀 선택 */}
        {children.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">자녀</label>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setChildId(null)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  childId === null
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                선택 안 함
              </button>
              {children.map(child => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setChildId(child.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    childId === child.id
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${DOT_COLOR[child.color] ?? 'bg-blue-400'}`} />
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 종류 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">종류</label>
          <div className="flex gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => set('category', cat.value)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  form.category === cat.value
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 과목 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
          <input
            type="text"
            value={form.subject}
            onChange={e => set('subject', e.target.value)}
            placeholder="수학, 영어 등"
            className={input}
          />
        </div>

        {/* 장소 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
          <input
            type="text"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder="대치동 OO학원"
            className={input}
          />
        </div>

        {/* 매주 반복 토글 */}
        <div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => setIsRecurring(p => !p)}
              className={`relative w-10 h-6 rounded-full transition-colors ${isRecurring ? 'bg-blue-700' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-gray-700">매주 반복</span>
          </label>
        </div>

        {/* 반복 요일 선택 */}
        {isRecurring && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">반복 요일</label>
            <div className="flex gap-2">
              {DAYS_KO.map((day, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${
                    recurDays.includes(i)
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 날짜 (일회성) */}
        {!isRecurring && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className={input}
            />
          </div>
        )}

        {/* 시간 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작</label>
            <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} className={input} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료</label>
            <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} className={input} />
          </div>
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
          <textarea
            value={form.memo}
            onChange={e => set('memo', e.target.value)}
            rows={2}
            placeholder="선생님 연락처, 준비물 등"
            className={`${input} resize-none`}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mt-3 px-1">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-3 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  )
}
