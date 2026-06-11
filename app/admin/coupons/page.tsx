'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Coupon } from '@/types'

function formatDate(s: string | null) {
  if (!s) return '-'
  return new Date(s).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

const emptyForm = { code: '', type: 'percent' as 'percent' | 'fixed', value: '', max_uses: '', expires_at: '' }

export default function AdminCouponsPage() {
  const supabase = createClient()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (data) setCoupons(data as Coupon[])
  }

  async function handleSave() {
    if (!form.code.trim() || !form.value) return
    setSaving(true)
    const { data } = await supabase.from('coupons').insert({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
    }).select().single()
    if (data) setCoupons(prev => [data as Coupon, ...prev])
    setForm(emptyForm)
    setShowForm(false)
    setSaving(false)
  }

  async function toggleActive(coupon: Coupon) {
    await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id)
    setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('쿠폰을 삭제할까요?')) return
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons(prev => prev.filter(c => c.id !== id))
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">쿠폰 관리</h1>
        <button onClick={() => setShowForm(v => !v)} className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors">
          + 쿠폰 생성
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">새 쿠폰</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">쿠폰 코드 *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="DAECH110" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">할인 유형 *</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))} className={inputClass}>
                <option value="percent">% 할인</option>
                <option value="fixed">정액 할인 (원)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">할인값 * {form.type === 'percent' ? '(1-100)' : '(원)'}</label>
              <input value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                type="number" min={1} max={form.type === 'percent' ? 100 : undefined} className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">최대 사용 횟수 (비워두면 무제한)</label>
              <input value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                type="number" min={1} placeholder="무제한" className={inputClass} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">만료일 (선택)</label>
              <input value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                type="datetime-local" className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">취소</button>
            <button onClick={handleSave} disabled={saving || !form.code.trim() || !form.value}
              className="flex-1 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
              {saving ? '저장 중...' : '생성'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['코드', '할인', '사용', '만료일', '상태', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">쿠폰이 없어요.</td></tr>
            )}
            {coupons.map(c => (
              <tr key={c.id} className={!c.is_active ? 'opacity-40' : ''}>
                <td className="px-4 py-3 font-mono font-semibold text-gray-900">{c.code}</td>
                <td className="px-4 py-3 text-gray-700">
                  {c.type === 'percent' ? `${c.value}%` : `₩${c.value.toLocaleString('ko-KR')}`}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.used_count}{c.max_uses !== null ? `/${c.max_uses}` : ''}
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(c.expires_at)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.is_active ? '활성' : '비활성'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => toggleActive(c)} className="text-xs text-gray-400 hover:text-gray-600">{c.is_active ? '비활성' : '활성'}</button>
                    <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
