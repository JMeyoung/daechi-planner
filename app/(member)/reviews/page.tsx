'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CHILD_COLORS, BADGE_COLOR, DOT_COLOR } from '@/lib/child-colors'
import type { AcademyReview, ChildProfile } from '@/types'

// Star icon SVG helper
function StarIcon({ filled, className = "w-5 h-5" }: { filled: boolean, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

export default function ReviewsPage() {
  const supabase = createClient()
  const [reviews, setReviews] = useState<AcademyReview[]>([])
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<AcademyReview | null>(null)
  
  const emptyForm = { academy_name: '', child_id: '', rating: 5 as 1|2|3|4|5, review_text: '' }
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [reviewsRes, childrenRes] = await Promise.all([
      supabase.from('academy_reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order'),
    ])
    if (reviewsRes.data) setReviews(reviewsRes.data as AcademyReview[])
    if (childrenRes.data) setChildren(childrenRes.data as ChildProfile[])
    setLoading(false)
  }

  function startAdd() {
    setEditing(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function startEdit(review: AcademyReview) {
    setEditing(review)
    setForm({
      academy_name: review.academy_name,
      child_id: review.child_id ?? '',
      rating: review.rating,
      review_text: review.review_text ?? '',
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.academy_name.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      academy_name: form.academy_name.trim(),
      child_id: form.child_id || null,
      rating: form.rating,
      review_text: form.review_text.trim() || null,
    }

    if (editing) {
      const { data } = await supabase.from('academy_reviews').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id).select().single()
      if (data) setReviews(prev => prev.map(r => r.id === editing.id ? data as AcademyReview : r))
    } else {
      const { data } = await supabase.from('academy_reviews').insert(payload).select().single()
      if (data) setReviews(prev => [data as AcademyReview, ...prev])
    }

    setShowForm(false)
    setEditing(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('리뷰를 삭제할까요?')) return
    await supabase.from('academy_reviews').delete().eq('id', id)
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  const inputClass = 'w-full border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400'

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-navy-200 border-t-navy-800 rounded-full animate-spin" /></div>

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">학원 만족도 기록</h1>
        <button onClick={startAdd} className="text-sm bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-navy-900 transition-colors">
          + 작성
        </button>
      </div>

      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="bg-surface-50 dark:bg-navy-800/50 border border-surface-border dark:border-navy-700 rounded-2xl p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">아직 작성된 리뷰가 없어요.</p>
            <button onClick={startAdd} className="mt-3 text-sm text-gold-600 dark:text-gold-500 font-medium hover:underline">+ 리뷰 작성하기</button>
          </div>
        ) : (
          reviews.map(review => {
            const child = children.find(c => c.id === review.child_id)
            const date = new Date(review.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
            return (
              <div key={review.id} className="bg-white dark:bg-navy-800 rounded-xl border border-gray-200 dark:border-navy-700 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{review.academy_name}</span>
                    {child && (
                      <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BADGE_COLOR[child.color]}`}>{child.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-gold-400">
                      {[1, 2, 3, 4, 5].map(v => (
                        <StarIcon key={v} filled={v <= review.rating} className="w-4 h-4" />
                      ))}
                    </div>
                  </div>
                </div>
                
                {review.review_text && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-navy-900/50 p-3 rounded-lg">
                    {review.review_text}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-400">{date}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(review)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2 py-1 rounded transition-colors">편집</button>
                    <button onClick={() => handleDelete(review.id)} className="text-xs text-red-400 hover:text-red-500 px-2 py-1 rounded transition-colors">삭제</button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0 animate-fade-up">
          <div className="bg-white dark:bg-navy-800 rounded-2xl w-full max-w-sm p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">{editing ? '리뷰 편집' : '새 리뷰 작성'}</h2>

            <div className="space-y-3">
              <input value={form.academy_name} onChange={e => setForm(f => ({ ...f, academy_name: e.target.value }))}
                placeholder="학원/과목명 *" className={inputClass} autoFocus />
              
              {children.length > 0 && (
                <select value={form.child_id} onChange={e => setForm(f => ({ ...f, child_id: e.target.value }))} className={inputClass}>
                  <option value="">수강 자녀 (선택사항)</option>
                  {children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}

              <div className="flex items-center gap-2 py-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">만족도 별점:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rating: v as 1|2|3|4|5 }))}
                      className={`transition-colors ${v <= form.rating ? 'text-gold-400' : 'text-gray-300 dark:text-navy-600'}`}
                    >
                      <StarIcon filled={v <= form.rating} className="w-6 h-6" />
                    </button>
                  ))}
                </div>
              </div>

              <textarea 
                value={form.review_text} 
                onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))}
                placeholder="학원 장단점, 선생님 피드백 등 자유롭게 기록하세요." 
                className={`${inputClass} min-h-[100px] resize-none`} 
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-navy-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-navy-900 transition-colors">취소</button>
              <button onClick={handleSave} disabled={saving || !form.academy_name.trim()}
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
