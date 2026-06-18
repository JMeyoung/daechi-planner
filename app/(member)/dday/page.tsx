'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DdayCounter } from '@/types'
import Link from 'next/link'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

// ── Emoji presets ──────────────────────────────────
const EMOJI_PRESETS = [
  { emoji: '📚', label: '중간고사' },
  { emoji: '📝', label: '기말고사' },
  { emoji: '🎯', label: '수능' },
  { emoji: '🏫', label: '학교' },
  { emoji: '⏰', label: '시험' },
  { emoji: '🎓', label: '졸업' },
  { emoji: '📅', label: '기타' },
] as const

// ── Quick-add presets ──────────────────────────────
const QUICK_ADD_PRESETS = [
  { label: '2026 수능', title: '2026 수능', date: '2026-11-19', emoji: '🎯' },
  { label: '중간고사', title: '중간고사', date: '', emoji: '📚' },
  { label: '기말고사', title: '기말고사', date: '', emoji: '📝' },
] as const

// ── Color presets ──────────────────────────────────
const COLOR_PRESETS = [
  { value: 'gold', bg: '#d4a853' },
  { value: 'navy', bg: '#1e3050' },
  { value: 'rose', bg: '#9f1239' },
  { value: 'emerald', bg: '#047857' },
  { value: 'violet', bg: '#6d28d9' },
] as const

/** Calculate D-day difference using KST timezone */
function getDdayNumber(targetDate: string): number {
  const nowKst = new Date(Date.now() + KST_OFFSET_MS)
  const todayKst = Date.UTC(nowKst.getUTCFullYear(), nowKst.getUTCMonth(), nowKst.getUTCDate())
  const [y, m, d] = targetDate.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  return Math.ceil((target - todayKst) / (1000 * 60 * 60 * 24))
}

/** Format D-day display string */
function formatDday(diff: number): string {
  if (diff > 0) return `D-${diff}`
  if (diff === 0) return '🎉 오늘!'
  return `D+${Math.abs(diff)}`
}

/** Get color class for D-day number */
function getDdayColor(diff: number): string {
  if (diff < 0) return 'text-gray-400'
  if (diff <= 7) return 'text-red-500'
  if (diff <= 30) return 'text-amber-500'
  return 'text-gold-500'
}

/** Format date as YYYY.MM.DD */
function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${y}.${m}.${d}`
}

type FormState = {
  title: string
  target_date: string
  emoji: string
  color: string
}

const EMPTY_FORM: FormState = {
  title: '',
  target_date: '',
  emoji: '📅',
  color: 'gold',
}

export default function DdayPage() {
  const supabase = createClient()
  const [counters, setCounters] = useState<DdayCounter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DdayCounter | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('dday_counters')
      .select('*')
      .eq('user_id', user.id)
      .order('target_date', { ascending: true })
    if (data) setCounters(data as DdayCounter[])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  // ── Form handlers ────────────────────────────────
  function startAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function startEdit(counter: DdayCounter) {
    setEditing(counter)
    setForm({
      title: counter.title,
      target_date: counter.target_date,
      emoji: counter.emoji,
      color: counter.color,
    })
    setShowForm(true)
  }

  function applyQuickAdd(preset: typeof QUICK_ADD_PRESETS[number]) {
    setEditing(null)
    setForm({
      ...EMPTY_FORM,
      title: preset.title,
      target_date: preset.date,
      emoji: preset.emoji,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.target_date) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      target_date: form.target_date,
      emoji: form.emoji,
      color: form.color,
    }

    if (editing) {
      // Optimistic update
      const optimistic = { ...editing, ...payload }
      setCounters(prev => prev.map(c => c.id === editing.id ? optimistic : c))
      setShowForm(false)

      const { data } = await supabase
        .from('dday_counters')
        .update(payload)
        .eq('id', editing.id)
        .select()
        .single()
      if (data) {
        setCounters(prev => prev.map(c => c.id === editing.id ? data as DdayCounter : c))
      }
    } else {
      // Optimistic add with temp id
      const tempId = `temp-${Date.now()}`
      const optimistic = { ...payload, id: tempId, created_at: new Date().toISOString() } as DdayCounter
      setCounters(prev =>
        [...prev, optimistic].sort((a, b) => a.target_date.localeCompare(b.target_date))
      )
      setShowForm(false)

      const { data } = await supabase
        .from('dday_counters')
        .insert(payload)
        .select()
        .single()
      if (data) {
        setCounters(prev =>
          prev.map(c => c.id === tempId ? data as DdayCounter : c)
        )
      }
    }

    setEditing(null)
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제할까요?')) return

    // Optimistic delete
    const prev = counters
    setCounters(c => c.filter(item => item.id !== id))

    const { error } = await supabase.from('dday_counters').delete().eq('id', id)
    if (error) {
      // Rollback on error
      setCounters(prev)
    }
  }

  // ── Sorted counters ─────────────────────────────
  const sorted = [...counters].sort((a, b) =>
    a.target_date.localeCompare(b.target_date)
  )

  const inputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 transition-shadow'

  // ── Loading ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-6 h-6 border-2 border-navy-200 border-t-navy-800 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* ── Header ───────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">D-day 관리</h1>
        <button
          onClick={startAdd}
          className="text-sm bg-navy-800 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-navy-900 transition-colors"
        >
          + 추가
        </button>
      </div>

      {/* ── Quick-add presets ─────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_ADD_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => applyQuickAdd(preset)}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:border-gold-400 hover:text-gold-700 font-medium transition-colors"
          >
            {preset.emoji} {preset.label}
          </button>
        ))}
      </div>

      {/* ── Counter list ─────────────────────────── */}
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="bg-surface-50 border border-surface-border rounded-2xl p-8 text-center">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-sm text-gray-400 mb-2">
              등록된 D-day가 없어요.
            </p>
            <button
              onClick={startAdd}
              className="text-sm text-gold-600 font-medium hover:underline"
            >
              + D-day 추가하기
            </button>
          </div>
        ) : (
          sorted.map((counter) => {
            const diff = getDdayNumber(counter.target_date)
            const isPast = diff < 0
            const isUrgent = diff > 0 && diff <= 7

            return (
              <div
                key={counter.id}
                className={`bg-white rounded-xl border p-4 transition-all ${
                  isPast
                    ? 'border-gray-200 opacity-60'
                    : isUrgent
                      ? 'border-red-200 bg-red-50/30'
                      : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Emoji & urgency indicator */}
                  <div className="relative shrink-0">
                    <span className="text-xl">{counter.emoji}</span>
                    {isUrgent && (
                      <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                    )}
                  </div>

                  {/* Title & date */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {counter.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(counter.target_date)}
                    </p>
                  </div>

                  {/* D-day number */}
                  <span
                    className={`font-display text-lg font-bold shrink-0 ${getDdayColor(diff)}`}
                  >
                    {formatDday(diff)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <button
                      onClick={() => startEdit(counter)}
                      className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded transition-colors"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => handleDelete(counter.id)}
                      className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1 rounded transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Bottom sheet modal ───────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4 sm:pb-0">
          <div
            className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 animate-fade-up"
            role="dialog"
            aria-label={editing ? 'D-day 편집' : 'D-day 추가'}
          >
            <h2 className="font-semibold text-gray-900">
              {editing ? 'D-day 편집' : 'D-day 추가'}
            </h2>

            <div className="space-y-3">
              {/* Title */}
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="제목 *"
                className={inputClass}
                autoFocus
              />

              {/* Date */}
              <input
                value={form.target_date}
                onChange={(e) => setForm((f) => ({ ...f, target_date: e.target.value }))}
                type="date"
                className={inputClass}
              />

              {/* Emoji picker */}
              <div>
                <p className="text-xs text-gray-500 mb-2">아이콘</p>
                <div className="flex gap-2 flex-wrap">
                  {EMOJI_PRESETS.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, emoji }))}
                      className={`flex items-center gap-1 text-sm px-2.5 py-1.5 rounded-lg border transition-all ${
                        form.emoji === emoji
                          ? 'border-gold-400 bg-gold-50 ring-1 ring-gold-400/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={label}
                    >
                      <span>{emoji}</span>
                      <span className="text-xs text-gray-500">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <p className="text-xs text-gray-500 mb-2">색상</p>
                <div className="flex items-center gap-2">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      className="w-7 h-7 rounded-full transition-transform"
                      style={{
                        backgroundColor: c.bg,
                        transform: form.color === c.value ? 'scale(1.25)' : 'scale(1)',
                        outline: form.color === c.value ? '2px solid #94a3b8' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick-add inside modal */}
            <div>
              <p className="text-xs text-gray-400 mb-2">빠른 추가</p>
              <div className="flex gap-2 flex-wrap">
                {QUICK_ADD_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        title: preset.title,
                        target_date: preset.date || f.target_date,
                        emoji: preset.emoji,
                      }))
                    }
                    className="text-xs px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gold-400 hover:text-gold-600 transition-colors"
                  >
                    {preset.emoji} {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setShowForm(false)
                  setEditing(null)
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.target_date}
                className="flex-1 py-2.5 rounded-xl bg-navy-800 text-white text-sm font-medium hover:bg-navy-900 transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
