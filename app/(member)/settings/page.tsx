'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import type { InterestTag, Profile } from '@/types'

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Partial<Profile>>({})
  const [tags, setTags] = useState<InterestTag[]>([])
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, tagsRes, interestsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('interest_tags').select('*').order('label_ko'),
        supabase.from('user_interests').select('tag_id').eq('user_id', user.id),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      if (tagsRes.data) setTags(tagsRes.data)
      if (interestsRes.data) {
        setSelectedTags(new Set(interestsRes.data.map(r => r.tag_id)))
      }
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

    await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        child_grade: profile.child_grade,
      })
      .eq('id', user.id)

    // Replace all interests
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

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-bold text-gray-900 mb-6">설정</h1>
      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">프로필</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              type="text"
              value={profile.full_name ?? ''}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              placeholder="이름을 입력하세요"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">자녀 학년</label>
            <select
              value={profile.child_grade ?? ''}
              onChange={e => setProfile(p => ({ ...p, child_grade: Number(e.target.value) as 1|2|3 || null }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택 안 함</option>
              <option value="1">중학교 1학년</option>
              <option value="2">중학교 2학년</option>
              <option value="3">중학교 3학년</option>
            </select>
          </div>
        </div>

        {/* Interest tags */}
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
