'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import { CHILD_COLORS, BADGE_COLOR, DOT_COLOR } from '@/lib/child-colors'
import type { InterestTag, Profile, ChildProfile } from '@/types'

const GRADE_LABEL = { 1: '중1', 2: '중2', 3: '중3' }

export default function SettingsPage() {
  const supabase = createClient()

  // Profile & interests
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [tags, setTags] = useState<InterestTag[]>([])
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Children
  const [children, setChildren] = useState<ChildProfile[]>([])
  const [showAddChild, setShowAddChild] = useState(false)
  const [editingChild, setEditingChild] = useState<string | null>(null)
  const [childForm, setChildForm] = useState({ name: '', grade: '1', color: 'blue' })
  const [childSaving, setChildSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, tagsRes, interestsRes, childrenRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('interest_tags').select('*').order('label_ko'),
        supabase.from('user_interests').select('tag_id').eq('user_id', user.id),
        supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order'),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (tagsRes.data) setTags(tagsRes.data)
      if (interestsRes.data) setSelectedTags(new Set(interestsRes.data.map(r => r.tag_id)))
      if (childrenRes.data) setChildren(childrenRes.data as ChildProfile[])
    }
    load()
  }, [])

  function toggleTag(tagId: string) {
    setSelectedTags(prev => {
      const next = new Set(prev)
      next.has(tagId) ? next.delete(tagId) : next.add(tagId)
      return next
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('profiles').update({
      full_name: profile.full_name,
      child_grade: profile.child_grade,
    }).eq('id', user.id)

    await supabase.from('user_interests').delete().eq('user_id', user.id)
    if (selectedTags.size > 0) {
      await supabase.from('user_interests').insert(
        Array.from(selectedTags).map(tag_id => ({ user_id: user.id, tag_id }))
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleAddChild() {
    if (!childForm.name.trim()) return
    setChildSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('child_profiles').insert({
      user_id: user.id,
      name: childForm.name.trim(),
      grade: Number(childForm.grade) as 1 | 2 | 3,
      color: childForm.color,
      sort_order: children.length,
    }).select().single()

    if (data) setChildren(prev => [...prev, data as ChildProfile])
    setChildForm({ name: '', grade: '1', color: 'blue' })
    setShowAddChild(false)
    setChildSaving(false)
  }

  async function handleUpdateChild(id: string) {
    setChildSaving(true)
    await supabase.from('child_profiles').update({
      name: childForm.name.trim(),
      grade: Number(childForm.grade) as 1 | 2 | 3,
      color: childForm.color,
    }).eq('id', id)

    setChildren(prev => prev.map(c =>
      c.id === id
        ? { ...c, name: childForm.name.trim(), grade: Number(childForm.grade) as 1|2|3, color: childForm.color }
        : c
    ))
    setEditingChild(null)
    setChildSaving(false)
  }

  async function handleDeleteChild(id: string) {
    if (!confirm('이 자녀 프로필을 삭제할까요?')) return
    await supabase.from('child_profiles').delete().eq('id', id)
    setChildren(prev => prev.filter(c => c.id !== id))
  }

  function startEdit(child: ChildProfile) {
    setEditingChild(child.id)
    setChildForm({ name: child.name, grade: String(child.grade), color: child.color })
    setShowAddChild(false)
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-bold text-gray-900 mb-6">설정</h1>

      {/* 자녀 관리 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">자녀 프로필</h2>
          {!showAddChild && (
            <button
              type="button"
              onClick={() => { setShowAddChild(true); setEditingChild(null); setChildForm({ name: '', grade: '1', color: 'blue' }) }}
              className="text-sm text-blue-700 hover:underline font-medium"
            >
              + 추가
            </button>
          )}
        </div>

        {/* 자녀 목록 */}
        {children.length === 0 && !showAddChild && (
          <p className="text-sm text-gray-400 text-center py-4">등록된 자녀가 없어요.</p>
        )}
        <div className="space-y-2">
          {children.map(child => (
            <div key={child.id}>
              {editingChild === child.id ? (
                <ChildForm
                  form={childForm}
                  setForm={setChildForm}
                  onSave={() => handleUpdateChild(child.id)}
                  onCancel={() => setEditingChild(null)}
                  saving={childSaving}
                  inputClass={inputClass}
                />
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLOR[child.color] ?? 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{child.name}</span>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border font-medium ${BADGE_COLOR[child.color]}`}>
                      {GRADE_LABEL[child.grade]}
                    </span>
                  </div>
                  <button onClick={() => startEdit(child)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">편집</button>
                  <button onClick={() => handleDeleteChild(child.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">삭제</button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 추가 폼 */}
        {showAddChild && (
          <div className="mt-3">
            <ChildForm
              form={childForm}
              setForm={setChildForm}
              onSave={handleAddChild}
              onCancel={() => setShowAddChild(false)}
              saving={childSaving}
              inputClass={inputClass}
            />
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 프로필 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">프로필</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              value={profile.full_name ?? ''}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              placeholder="이름을 입력하세요"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표 자녀 학년</label>
            <select
              value={profile.child_grade ?? ''}
              onChange={e => setProfile(p => ({ ...p, child_grade: (Number(e.target.value) as 1|2|3) || null }))}
              className={inputClass}
            >
              <option value="">선택 안 함</option>
              <option value="1">중학교 1학년</option>
              <option value="2">중학교 2학년</option>
              <option value="3">중학교 3학년</option>
            </select>
          </div>
        </div>

        {/* 관심 분야 */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-1">관심 분야</h2>
          <p className="text-xs text-gray-500 mb-3">관련 콘텐츠를 우선적으로 보여드립니다.</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                  selectedTags.has(tag.id)
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {tag.label_ko}
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" loading={saving} className="w-full" size="lg">
          {saved ? '저장 완료!' : '저장하기'}
        </Button>
      </form>
    </div>
  )
}

function ChildForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  inputClass,
}: {
  form: { name: string; grade: string; color: string }
  setForm: (f: { name: string; grade: string; color: string }) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
  inputClass: string
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-200">
      <input
        type="text"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="자녀 이름"
        autoFocus
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        <select
          value={form.grade}
          onChange={e => setForm({ ...form, grade: e.target.value })}
          className={inputClass}
        >
          <option value="1">중학교 1학년</option>
          <option value="2">중학교 2학년</option>
          <option value="3">중학교 3학년</option>
        </select>
        <div className="flex items-center gap-1.5 px-2">
          {CHILD_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={`w-6 h-6 rounded-full transition-transform ${DOT_COLOR[c]} ${form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-white transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.name.trim()}
          className="flex-1 py-2 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
