'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import type { ExamScore, ChildProfile } from '@/types'
import { CHILD_COLORS, BADGE_COLOR, DOT_COLOR } from '@/lib/child-colors'

export default function GradesPage() {
  const supabase = createClient()
  
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [scores, setScores] = useState<ExamScore[]>([])
  const [loading, setLoading] = useState(true)
  
  const [filterChild, setFilterChild] = useState<string>('')
  
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ExamScore | null>(null)
  
  const emptyForm = { child_id: '', exam_name: '', exam_date: new Date().toISOString().split('T')[0], subject: '수학', score: '', percentile: '' }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [childrenRes, scoresRes] = await Promise.all([
      supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order'),
      supabase.from('exam_scores').select('*').eq('user_id', user.id).order('exam_date'),
    ])

    if (childrenRes.data && childrenRes.data.length > 0) {
      setChildren(childrenRes.data as ChildProfile[])
      setFilterChild(childrenRes.data[0].id)
      setForm(f => ({ ...f, child_id: childrenRes.data[0].id }))
    }
    
    if (scoresRes.data) {
      setScores(scoresRes.data as ExamScore[])
    }
    
    setLoading(false)
  }

  // 필터링된 성적 (특정 자녀)
  const activeScores = useMemo(() => scores.filter(s => s.child_id === filterChild), [scores, filterChild])

  // 과목별로 묶기
  const subjects = useMemo(() => Array.from(new Set(activeScores.map(s => s.subject))), [activeScores])
  
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  
  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(selectedSubject)) {
      setSelectedSubject(subjects[0])
    } else if (subjects.length === 0) {
      setSelectedSubject('')
    }
  }, [subjects, selectedSubject])

  // 차트 데이터 (특정 과목)
  const chartData = useMemo(() => {
    return activeScores
      .filter(s => s.subject === selectedSubject)
      .map(s => ({
        name: s.exam_name,
        date: s.exam_date,
        원점수: s.score,
        백분위: s.percentile
      }))
  }, [activeScores, selectedSubject])

  function startAdd() {
    setEditing(null)
    setForm({ ...emptyForm, child_id: filterChild })
    setShowForm(true)
  }

  function startEdit(score: ExamScore) {
    setEditing(score)
    setForm({
      child_id: score.child_id,
      exam_name: score.exam_name,
      exam_date: score.exam_date,
      subject: score.subject,
      score: score.score !== null ? String(score.score) : '',
      percentile: score.percentile !== null ? String(score.percentile) : '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.child_id || !form.exam_name || !form.subject) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      child_id: form.child_id,
      exam_name: form.exam_name.trim(),
      exam_date: form.exam_date,
      subject: form.subject.trim(),
      score: form.score ? Number(form.score) : null,
      percentile: form.percentile ? Number(form.percentile) : null,
    }

    if (editing) {
      const { data } = await supabase.from('exam_scores').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id).select().single()
      if (data) {
        setScores(prev => {
          const next = prev.map(s => s.id === editing.id ? data as ExamScore : s)
          return next.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
        })
      }
    } else {
      const { data } = await supabase.from('exam_scores').insert(payload).select().single()
      if (data) {
        setScores(prev => {
          const next = [...prev, data as ExamScore]
          return next.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
        })
      }
    }

    setShowForm(false)
    setEditing(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('성적을 삭제할까요?')) return
    await supabase.from('exam_scores').delete().eq('id', id)
    setScores(prev => prev.filter(s => s.id !== id))
  }

  const inputClass = 'w-full border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400'

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-navy-200 border-t-navy-800 rounded-full animate-spin" /></div>

  if (children.length === 0) {
    return (
      <div className="max-w-lg space-y-5">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">성적 트래커</h1>
        <div className="bg-surface-50 dark:bg-navy-800/50 border border-surface-border dark:border-navy-700 rounded-2xl p-8 text-center">
          <p className="text-gray-400 dark:text-gray-500 text-sm">먼저 설정 탭에서 자녀 프로필을 추가해 주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">성적 트래커</h1>
        <button onClick={startAdd} className="text-sm bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-navy-900 transition-colors">
          + 성적 입력
        </button>
      </div>

      {/* 자녀 필터 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-navy-700 pb-2 overflow-x-auto scrollbar-hide">
        {children.map(c => (
          <button
            key={c.id}
            onClick={() => setFilterChild(c.id)}
            className={`text-sm px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
              filterChild === c.id 
                ? 'bg-navy-800 text-white' 
                : 'bg-gray-100 dark:bg-navy-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-navy-800'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {activeScores.length === 0 ? (
        <div className="bg-surface-50 dark:bg-navy-800/50 border border-surface-border dark:border-navy-700 rounded-2xl p-8 text-center mt-6">
          <p className="text-gray-400 dark:text-gray-500 text-sm">아직 등록된 성적이 없어요.</p>
          <button onClick={startAdd} className="mt-3 text-sm text-gold-600 dark:text-gold-500 font-medium hover:underline">+ 성적 입력하기</button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-up">
          
          {/* 과목 필터 및 차트 */}
          <div className="bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-700 rounded-2xl p-5">
            <div className="flex flex-wrap gap-2 mb-6">
              {subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                    selectedSubject === sub 
                      ? 'bg-gold-50 border-gold-200 text-gold-700 dark:bg-gold-900/20 dark:border-gold-800/50 dark:text-gold-400' 
                      : 'bg-white border-gray-200 text-gray-500 dark:bg-navy-900 dark:border-navy-700 dark:text-gray-400'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {chartData.length > 0 && (
              <div className="h-56 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} padding={{ left: 20, right: 20 }} />
                    <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                    {/* <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} /> */}
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="원점수" stroke="#2d4470" strokeWidth={3} activeDot={{ r: 6 }} />
                    <Line yAxisId="left" type="monotone" dataKey="백분위" stroke="#d4a853" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 성적 목록 */}
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white px-1">기록 목록</h2>
            {[...activeScores].reverse().map(score => (
              <div key={score.id} className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-navy-900 px-2 py-0.5 rounded-full mr-2">
                      {score.subject}
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{score.exam_name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{score.exam_date}</span>
                </div>
                
                <div className="flex gap-4 mt-3">
                  {score.score !== null && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">원점수</p>
                      <p className="font-display font-semibold text-navy-800 dark:text-navy-100">{score.score}점</p>
                    </div>
                  )}
                  {score.percentile !== null && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">백분위</p>
                      <p className="font-display font-semibold text-gold-600 dark:text-gold-400">{score.percentile}%</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-1 mt-2">
                  <button onClick={() => startEdit(score)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded transition-colors">편집</button>
                  <button onClick={() => handleDelete(score.id)} className="text-xs text-red-400 hover:text-red-500 px-2 py-1 rounded transition-colors">삭제</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0 animate-fade-up">
          <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">{editing ? '성적 편집' : '새 성적 입력'}</h2>

            <div className="space-y-3">
              <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))} className={inputClass}>
                {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <input value={form.exam_date} onChange={e => setForm(f => ({ ...f, exam_date: e.target.value }))}
                  type="date" className={inputClass} />
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  placeholder="과목 (예: 수학)" className={inputClass} />
              </div>

              <input value={form.exam_name} onChange={e => setForm(f => ({ ...f, exam_name: e.target.value }))}
                placeholder="시험명 (예: 1학기 중간고사)" className={inputClass} autoFocus />
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">원점수</label>
                  <input value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                    type="number" step="0.1" placeholder="점수" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">백분위 (%)</label>
                  <input value={form.percentile} onChange={e => setForm(f => ({ ...f, percentile: e.target.value }))}
                    type="number" step="0.1" placeholder="%" className={inputClass} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-navy-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors">취소</button>
              <button onClick={handleSave} disabled={saving || !form.child_id || !form.exam_name || !form.subject}
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
