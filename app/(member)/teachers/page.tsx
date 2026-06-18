'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BADGE_COLOR, DOT_COLOR } from '@/lib/child-colors'
import type { TeacherMemo, ChildProfile } from '@/types'

export default function TeachersPage() {
  const supabase = createClient()
  const [memos, setMemos] = useState<TeacherMemo[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TeacherMemo | null>(null)
  const [filterChild, setFilterChild] = useState<string>('all')

  const emptyForm = { academy_name: '', teacher_name: '', subject: '', phone: '', memo: '', child_id: '' }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [memosRes, childrenRes] = await Promise.all([
      supabase.from('teacher_memos').select('*').eq('user_id', user.id).order('academy_name'),
      supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order'),
    ])
    if (memosRes.data) setMemos(memosRes.data as TeacherMemo[])
    if (childrenRes.data) setChildren(childrenRes.data as ChildProfile[])
    setLoading(false)
  }

  const filtered = useMemo(() =>
    filterChild === 'all' ? memos : memos.filter(m => m.child_id === filterChild || (filterChild === 'none' && !m.child_id)),
    [memos, filterChild]
  )

  // Group by academy
  const grouped = useMemo(() => {
    const map: Record<string, TeacherMemo[]> = {}
    filtered.forEach(m => {
      const key = m.academy_name
      if (!map[key]) map[key] = []
      map[key].push(m)
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [filtered])

  function startAdd() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function startEdit(memo: TeacherMemo) {
    setEditing(memo)
    setForm({
      academy_name: memo.academy_name,
      teacher_name: memo.teacher_name,
      subject: memo.subject ?? '',
      phone: memo.phone ?? '',
      memo: memo.memo ?? '',
      child_id: memo.child_id ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.academy_name.trim() || !form.teacher_name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      academy_name: form.academy_name.trim(),
      teacher_name: form.teacher_name.trim(),
      subject: form.subject.trim() || null,
      phone: form.phone.trim() || null,
      memo: form.memo.trim() || null,
      child_id: form.child_id || null,
    }

    if (editing) {
      const { data } = await supabase.from('teacher_memos').update(payload).eq('id', editing.id).select().single()
      if (data) setMemos(prev => prev.map(m => m.id === editing.id ? data as TeacherMemo : m))
    } else {
      const { data } = await supabase.from('teacher_memos').insert(payload).select().single()
      if (data) setMemos(prev => [...prev, data as TeacherMemo])
    }

    setShowForm(false)
    setEditing(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제할까요?')) return
    await supabase.from('teacher_memos').delete().eq('id', id)
    setMemos(prev => prev.filter(m => m.id !== id))
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400'

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-navy-200 border-t-navy-800 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">선생님 메모</h1>
        <button onClick={startAdd} className="text-sm bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-navy-900 transition-colors">
          + 추가
        </button>
      </div>

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

      {/* 메모 목록 */}
      {memos.length === 0 ? (
        <div className="bg-surface-50 border border-surface-border rounded-2xl p-8 text-center">
          <div className="text-3xl mb-3">👩‍🏫</div>
          <p className="text-sm text-gray-400 mb-2">선생님 정보를 기록해두세요</p>
          <p className="text-xs text-gray-400 mb-4">학원별 선생님 이름, 연락처, 특이사항을 관리합니다</p>
          <button onClick={startAdd} className="text-sm text-gold-600 font-medium hover:underline">+ 추가하기</button>
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-surface-50 border border-surface-border rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-400">해당 자녀에게 배정된 선생님이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([academy, items]) => (
            <div key={academy}>
              <h2 className="text-sm font-semibold text-navy-800 mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                {academy}
              </h2>
              <div className="space-y-2">
                {items.map(memo => {
                  const child = children.find(c => c.id === memo.child_id)
                  return (
                    <div key={memo.id} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-gray-900">👩‍🏫 {memo.teacher_name}</span>
                            {memo.subject && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-navy-50 text-navy-700 font-medium">{memo.subject}</span>
                            )}
                            {child && (
                              <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BADGE_COLOR[child.color]}`}>
                                {child.name}
                              </span>
                            )}
                          </div>
                          {memo.phone && (
                            <a href={`tel:${memo.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gold-600 transition-colors">
                              📱 {memo.phone}
                            </a>
                          )}
                          {memo.memo && (
                            <p className="text-sm text-gray-500 flex items-start gap-1.5">
                              <span className="shrink-0">📝</span>
                              <span>{memo.memo}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => startEdit(memo)} className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded transition-colors">편집</button>
                          <button onClick={() => handleDelete(memo.id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1 rounded transition-colors">삭제</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">{editing ? '선생님 정보 편집' : '선생님 추가'}</h2>

            <div className="space-y-3">
              <input value={form.academy_name} onChange={e => setForm(f => ({ ...f, academy_name: e.target.value }))}
                placeholder="학원명 *" className={inputClass} autoFocus />
              <input value={form.teacher_name} onChange={e => setForm(f => ({ ...f, teacher_name: e.target.value }))}
                placeholder="선생님 이름 *" className={inputClass} />
              <div className="grid grid-cols-2 gap-2">
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="과목" className={inputClass} />
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="연락처" type="tel" className={inputClass} />
              </div>
              {children.length > 0 && (
                <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))} className={inputClass}>
                  <option value="">자녀 선택 (선택사항)</option>
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              <textarea value={form.memo} onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="특이사항, 메모 (선택사항)" rows={2} className={inputClass} />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">취소</button>
              <button onClick={handleSave} disabled={saving || !form.academy_name.trim() || !form.teacher_name.trim()}
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
