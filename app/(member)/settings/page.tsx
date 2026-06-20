'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import { CHILD_COLORS, BADGE_COLOR, DOT_COLOR } from '@/lib/child-colors'
import FeedbackForm from './feedback-form'
import { ThemeToggle } from '@/components/theme-toggle'
import PushPermission from '@/components/push-permission'
import type { InterestTag, Profile, ChildProfile, Subscription } from '@/types'

const GRADE_LABEL: Record<number, string> = {
  1: '중1', 2: '중2', 3: '중3',
  4: '고1', 5: '고2', 6: '고3',
}

export default function SettingsPage() {
  const supabase = createClient()

  // Profile & interests
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [tags, setTags] = useState<InterestTag[]>([])
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [dashboardConfig, setDashboardConfig] = useState<string[]>(["welcome", "dday", "stats", "schedule", "briefings"])
  const [spouseEmail, setSpouseEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Subscription
  const [subscription, setSubscription] = useState<Subscription | null>(null)

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

      const [profileRes, tagsRes, interestsRes, childrenRes, subRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('interest_tags').select('*').order('label_ko'),
        supabase.from('user_interests').select('tag_id').eq('user_id', user.id),
        supabase.from('child_profiles').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).single(),
      ])

      if (profileRes.data) {
        setProfile(profileRes.data)
        if (profileRes.data.dashboard_config) {
          setDashboardConfig(profileRes.data.dashboard_config)
        }
      }
      if (tagsRes.data) setTags(tagsRes.data)
      if (interestsRes.data) setSelectedTags(new Set(interestsRes.data.map(r => r.tag_id)))
      if (childrenRes.data) setChildren(childrenRes.data as ChildProfile[])
      if (subRes.data) setSubscription(subRes.data as Subscription)
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
      dashboard_config: dashboardConfig,
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
      grade: Number(childForm.grade) as 1 | 2 | 3 | 4 | 5 | 6,
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
      grade: Number(childForm.grade) as 1 | 2 | 3 | 4 | 5 | 6,
      color: childForm.color,
    }).eq('id', id)

    setChildren(prev => prev.map(c =>
      c.id === id
        ? { ...c, name: childForm.name.trim(), grade: Number(childForm.grade) as 1|2|3|4|5|6, color: childForm.color }
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

  const inputClass = 'w-full border border-gray-300 dark:border-navy-600 bg-white dark:bg-navy-900 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400'

  const WIDGET_NAMES: Record<string, string> = {
    welcome: '환영 메시지',
    ai_report: '✨ AI 학습 리포트',
    dday: 'D-day 카운터',
    stats: '요약 통계 (저장, 일정 등)',
    schedule: '오늘의 일정',
    briefings: '최신 브리프',
  }

  function moveWidget(index: number, direction: -1 | 1) {
    setDashboardConfig(prev => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active'
  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : null

  async function handleCancelSubscription() {
    if (!confirm('구독을 취소하시겠습니까? 취소 즉시 스탠다드 기능을 이용할 수 없게 됩니다.')) return
    const res = await fetch('/api/toss/cancel', { method: 'POST' })
    if (res.ok) setSubscription(prev => prev ? { ...prev, plan: 'free', status: 'canceled' } : prev)
  }

  async function handleSpouseAction(action: 'invite' | 'cancel' | 'unlink') {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let updates: Partial<Profile> = {}
    if (action === 'invite') {
      if (!spouseEmail.trim() || !spouseEmail.includes('@')) {
        alert('유효한 이메일을 입력해주세요.')
        setSaving(false)
        return
      }
      updates = { spouse_email: spouseEmail.trim(), spouse_status: 'pending' }
    } else {
      updates = { spouse_email: null, spouse_id: null, spouse_status: 'none' }
      setSpouseEmail('')
    }

    await supabase.from('profiles').update(updates).eq('id', user.id)
    setProfile(p => ({ ...p, ...updates }))
    setSaving(false)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-bold text-gray-900 mb-6">설정</h1>

      {/* 푸시 알림 설정 */}
      <div className="mb-5">
        <PushPermission />
      </div>

      {/* 앱 설정 */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-navy-700 p-5 mb-5">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">앱 설정</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5">화면 테마</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">앱의 화면 테마를 설정합니다.</p>
          </div>
          <div className="w-48">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* 배우자 연동 */}
      <div className="bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-navy-700 p-5 mb-5 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">배우자 연동</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            배우자와 자녀 일정, 학원비, 만족도 기록을 공유합니다.
          </p>
        </div>
        
        {profile.spouse_status === 'accepted' ? (
          <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-3 rounded-xl">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">연동 완료</p>
              <p className="text-xs text-green-600 dark:text-green-400">{profile.spouse_email}</p>
            </div>
            <button onClick={() => handleSpouseAction('unlink')} disabled={saving} className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-3 py-1.5 rounded-lg transition-colors">
              연동 해제
            </button>
          </div>
        ) : profile.spouse_status === 'pending' ? (
          <div className="flex items-center justify-between bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-800/50 p-3 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gold-800 dark:text-gold-300">초대 대기 중</p>
              <p className="text-xs text-gold-600 dark:text-gold-400">{profile.spouse_email}</p>
            </div>
            <button onClick={() => handleSpouseAction('cancel')} disabled={saving} className="text-xs text-gray-500 hover:text-red-500 border border-gray-200 dark:border-navy-600 bg-white dark:bg-navy-800 px-3 py-1.5 rounded-lg transition-colors">
              초대 취소
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              value={spouseEmail}
              onChange={e => setSpouseEmail(e.target.value)}
              placeholder="배우자의 이메일 입력"
              className={inputClass}
            />
            <button onClick={() => handleSpouseAction('invite')} disabled={saving || !spouseEmail} className="text-sm bg-navy-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-navy-900 transition-colors shrink-0 disabled:opacity-50">
              초대하기
            </button>
          </div>
        )}
      </div>

      {/* 자녀 관리 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">자녀 프로필</h2>
          {!showAddChild && (
            <button
              type="button"
              onClick={() => { setShowAddChild(true); setEditingChild(null); setChildForm({ name: '', grade: '1', color: 'blue' }) }}
              className="text-sm text-gold-600 hover:underline font-medium"
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
                  <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLOR[child.color] ?? 'bg-navy-400'}`} />
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
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-navy-700 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 dark:text-white">프로필</h2>
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
              onChange={e => setProfile(p => ({ ...p, child_grade: (Number(e.target.value) as 1|2|3|4|5|6) || null }))}
              className={inputClass}
            >
              <option value="">선택 안 함</option>
              <option value="1">중학교 1학년</option>
              <option value="2">중학교 2학년</option>
              <option value="3">중학교 3학년</option>
              <option value="4">고등학교 1학년</option>
              <option value="5">고등학교 2학년</option>
              <option value="6">고등학교 3학년</option>
            </select>
          </div>
        </div>

        {/* 대시보드 설정 */}
        <div className="bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-navy-700 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">대시보드 위젯 순서</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">화살표를 눌러 대시보드에 표시되는 위젯의 순서를 변경할 수 있습니다.</p>
          </div>
          <div className="space-y-2">
            {dashboardConfig.map((key, i) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-navy-700 bg-gray-50 dark:bg-navy-900/50">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{WIDGET_NAMES[key] || key}</span>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => moveWidget(i, -1)} disabled={i === 0} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">
                    ▲
                  </button>
                  <button type="button" onClick={() => moveWidget(i, 1)} disabled={i === dashboardConfig.length - 1} className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">
                    ▼
                  </button>
                </div>
              </div>
            ))}
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
                    ? 'bg-navy-800 text-white border-navy-800'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-navy-400'
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

      {/* 의견 보내기 */}
      <div className="mt-5">
        <FeedbackForm />
      </div>
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
          <option value="4">고등학교 1학년</option>
          <option value="5">고등학교 2학년</option>
          <option value="6">고등학교 3학년</option>
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
          className="flex-1 py-2 rounded-lg bg-navy-800 text-white text-sm font-medium hover:bg-navy-900 transition-colors disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  )
}
