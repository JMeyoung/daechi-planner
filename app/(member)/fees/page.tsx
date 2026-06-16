'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHILD_COLORS, BADGE_COLOR, DOT_COLOR } from '@/lib/child-colors'
import type { AcademyFee, ChildProfile } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

const COLOR_MAP: Record<string, string> = {
  blue: '#2d4470',   // navy-600
  orange: '#d4a853', // gold-400
  emerald: '#047857',// emerald-700
  pink: '#9f1239',   // rose-800
  violet: '#78716c', // stone-500
}

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function getDday(paymentDay: number | null): number | null {
  if (!paymentDay) return null
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), paymentDay)
  if (thisMonth < today) thisMonth.setMonth(thisMonth.getMonth() + 1)
  return Math.ceil((thisMonth.getTime() - today.setHours(0,0,0,0)) / 86400000)
}

export default function FeesPage() {
  const supabase = createClient()
  const [fees, setFees] = useState<AcademyFee[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AcademyFee | null>(null)
  const [filterChild, setFilterChild] = useState<string>('all')
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly')

  const emptyForm = { name: '', amount: '', payment_day: '', child_id: '', memo: '', color: 'blue', is_active: true }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [feesRes, childrenRes] = await Promise.all([
      supabase.from('academy_fees').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order'),
    ])
    if (feesRes.data) setFees(feesRes.data as AcademyFee[])
    if (childrenRes.data) setChildren(childrenRes.data as ChildProfile[])
    setLoading(false)
  }

  const activeFees = useMemo(() =>
    fees.filter(f => f.is_active && (filterChild === 'all' || f.child_id === filterChild || (filterChild === 'none' && !f.child_id))),
    [fees, filterChild]
  )

  const monthlyTotal = useMemo(() => activeFees.reduce((s, f) => s + f.amount, 0), [activeFees])
  const yearlyTotal = monthlyTotal * 12

  // 납부일 D-3 이내 알림
  const upcomingFees = useMemo(() =>
    fees.filter(f => f.is_active && f.payment_day !== null).map(f => ({ ...f, dday: getDday(f.payment_day) })).filter(f => f.dday !== null && f.dday! <= 3),
    [fees]
  )

  // 월별 차트 데이터 (현재 월 기준 ±5개월)
  const monthlyChartData = useMemo(() => {
    const today = new Date()
    return MONTHS.map((label, i) => ({
      name: label,
      금액: i === today.getMonth() ? monthlyTotal : 0,
    })).map((d, i) => i === new Date().getMonth() ? { ...d, 금액: monthlyTotal } : d)
  }, [monthlyTotal])

  // 연간 차트 데이터 (월별 동일 금액)
  const yearlyChartData = useMemo(() =>
    MONTHS.map(label => ({ name: label, 금액: monthlyTotal })),
    [monthlyTotal]
  )

  // 자녀별 파이 데이터
  const pieData = useMemo(() => {
    const map: Record<string, number> = {}
    activeFees.forEach(f => {
      const key = f.child_id ?? '__none__'
      map[key] = (map[key] ?? 0) + f.amount
    })
    return Object.entries(map).map(([id, value]) => {
      const child = children.find(c => c.id === id)
      return { name: child?.name ?? '미배정', value, color: child ? COLOR_MAP[child.color] ?? '#6b7280' : '#9ca3af' }
    })
  }, [activeFees, children])

  function startAdd() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function startEdit(fee: AcademyFee) {
    setEditing(fee)
    setForm({
      name: fee.name,
      amount: String(fee.amount),
      payment_day: fee.payment_day ? String(fee.payment_day) : '',
      child_id: fee.child_id ?? '',
      memo: fee.memo ?? '',
      color: fee.color,
      is_active: fee.is_active,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.amount) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      name: form.name.trim(),
      amount: Number(form.amount),
      payment_day: form.payment_day ? Number(form.payment_day) : null,
      child_id: form.child_id || null,
      memo: form.memo.trim() || null,
      color: form.color,
      is_active: form.is_active,
    }

    if (editing) {
      const { data } = await supabase.from('academy_fees').update(payload).eq('id', editing.id).select().single()
      if (data) setFees(prev => prev.map(f => f.id === editing.id ? data as AcademyFee : f))
    } else {
      const { data } = await supabase.from('academy_fees').insert(payload).select().single()
      if (data) setFees(prev => [...prev, data as AcademyFee])
    }

    setShowForm(false)
    setEditing(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제할까요?')) return
    await supabase.from('academy_fees').delete().eq('id', id)
    setFees(prev => prev.filter(f => f.id !== id))
  }

  async function toggleActive(fee: AcademyFee) {
    await supabase.from('academy_fees').update({ is_active: !fee.is_active }).eq('id', fee.id)
    setFees(prev => prev.map(f => f.id === fee.id ? { ...f, is_active: !f.is_active } : f))
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400'

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-navy-200 border-t-navy-800 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">학원비 관리</h1>
        <button onClick={startAdd} className="text-sm bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-navy-900 transition-colors">
          + 추가
        </button>
      </div>

      {/* 납부일 알림 */}
      {upcomingFees.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-amber-700 mb-2">납부일 임박</p>
          {upcomingFees.map(f => (
            <div key={f.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{f.name}</span>
              <span className={`font-semibold ${f.dday === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                {f.dday === 0 ? '오늘' : `D-${f.dday}`} · {formatAmount(f.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">월 총 학원비</p>
          <p className="text-xl font-bold text-gray-900">{formatAmount(monthlyTotal)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">연간 예상</p>
          <p className="text-xl font-bold text-navy-900">{formatAmount(yearlyTotal)}</p>
        </div>
      </div>

      {/* 차트 */}
      {monthlyTotal > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-900">지출 현황</p>
            <div className="flex gap-1">
              {(['monthly', 'yearly'] as const).map(v => (
                <button key={v} onClick={() => setChartView(v)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${chartView === v ? 'bg-navy-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {v === 'monthly' ? '월별' : '연간'}
                </button>
              ))}
            </div>
          </div>

          {chartView === 'monthly' ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `${(v/10000).toFixed(0)}만`} />
                  <Tooltip formatter={(v) => formatAmount(Number(v))} />
                  <Bar dataKey="금액" radius={[4,4,0,0]}>
                    {monthlyChartData.map((_, i) => (
                      <Cell key={i} fill={i === new Date().getMonth() ? '#1e293b' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* 자녀별 파이 */}
              {pieData.length > 1 && (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={yearlyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `${(v/10000).toFixed(0)}만`} />
                <Tooltip formatter={(v) => formatAmount(Number(v))} />
                <Bar dataKey="금액" fill="#1e293b" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* 자녀 필터 */}
      {children.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterChild('all')} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filterChild === 'all' ? 'bg-navy-800 text-white border-navy-900' : 'text-gray-600 border-gray-300 hover:border-navy-400'}`}>전체</button>
          {children.map(c => (
            <button key={c.id} onClick={() => setFilterChild(c.id)} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filterChild === c.id ? 'bg-navy-800 text-white border-navy-900' : 'text-gray-600 border-gray-300 hover:border-navy-400'}`}>{c.name}</button>
          ))}
          <button onClick={() => setFilterChild('none')} className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${filterChild === 'none' ? 'bg-navy-800 text-white border-navy-900' : 'text-gray-600 border-gray-300 hover:border-navy-400'}`}>미배정</button>
        </div>
      )}

      {/* 학원 목록 */}
      <div className="space-y-2">
        {fees.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-sm text-gray-400">등록된 학원이 없어요.</p>
            <button onClick={startAdd} className="mt-3 text-sm text-gold-600 font-medium hover:underline">+ 학원비 추가하기</button>
          </div>
        ) : (
          activeFees.map(fee => {
            const child = children.find(c => c.id === fee.child_id)
            const dday = getDday(fee.payment_day)
            return (
              <div key={fee.id} className={`bg-white rounded-xl border p-4 transition-opacity ${!fee.is_active ? 'opacity-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0`} style={{ backgroundColor: COLOR_MAP[fee.color] ?? '#6b7280' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{fee.name}</span>
                      {child && (
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BADGE_COLOR[child.color]}`}>{child.name}</span>
                      )}
                      {dday !== null && dday <= 3 && (
                        <span className={`text-xs font-semibold ${dday === 0 ? 'text-red-600' : 'text-amber-600'}`}>{dday === 0 ? '오늘 납부' : `D-${dday}`}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-bold text-gray-900">{formatAmount(fee.amount)}</span>
                      {fee.payment_day && <span className="text-xs text-gray-400">매월 {fee.payment_day}일</span>}
                      {fee.memo && <span className="text-xs text-gray-400 truncate">{fee.memo}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => toggleActive(fee)} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded transition-colors">{fee.is_active ? '비활성' : '활성'}</button>
                    <button onClick={() => startEdit(fee)} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded transition-colors">편집</button>
                    <button onClick={() => handleDelete(fee.id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1 rounded transition-colors">삭제</button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">{editing ? '학원비 편집' : '학원비 추가'}</h2>

            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="학원명 *" className={inputClass} autoFocus />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="월 금액 *" type="number" min={1000} step={5000} className={inputClass} />
                <input value={form.payment_day} onChange={e => setForm(f => ({ ...f, payment_day: e.target.value }))}
                  placeholder="납부일 (1-31)" type="number" min="1" max="31" className={inputClass} />
              </div>
              {children.length > 0 && (
                <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))} className={inputClass}>
                  <option value="">자녀 선택 (선택사항)</option>
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <input value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="메모 (선택사항)" className={inputClass} />
              <div className="flex items-center gap-2">
                {CHILD_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                    className={`w-6 h-6 rounded-full transition-transform`}
                    style={{ backgroundColor: COLOR_MAP[c] ?? '#6b7280', transform: form.color === c ? 'scale(1.25)' : 'scale(1)', outline: form.color === c ? '2px solid #94a3b8' : 'none', outlineOffset: '2px' }} />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.amount}
                className="flex-1 py-2.5 rounded-xl bg-navy-800 text-white text-sm font-medium hover:bg-navy-900 transition-colors disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
