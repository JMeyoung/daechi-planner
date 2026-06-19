'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import type { ContentItem } from '@/types'

type FormState = Pick<ContentItem, 'title' | 'summary' | 'body' | 'category' | 'is_premium'>

export default function NewContentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState<FormState>({
    title: '',
    summary: '',
    body: '',
    category: 'briefing',
    is_premium: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave(publish: boolean) {
    setSaving(true)
    setError(null)

    const { error: dbError } = await supabase.from('content_items').insert({
      ...form,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })

    setSaving(false)
    if (dbError) { setError(dbError.message); return }
    router.push('/admin/content')
    router.refresh()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold text-gray-900">새 콘텐츠</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      <div className="card-panel p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            placeholder="제목을 입력하세요"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">요약</label>
          <textarea
            value={form.summary}
            onChange={e => set('summary', e.target.value)}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
            placeholder="목록에서 표시될 한두 줄 요약"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
          <textarea
            value={form.body}
            onChange={e => set('body', e.target.value)}
            rows={14}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 font-mono"
            placeholder="본문을 입력하세요"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value as ContentItem['category'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="briefing">브리프</option>
              <option value="tip">학습 팁</option>
              <option value="announcement">공지</option>
              <option value="event">행사</option>
            </select>
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_premium}
                onChange={e => set('is_premium', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-navy-800"
              />
              <span className="text-sm text-gray-700">스탠다드 콘텐츠</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => handleSave(false)} loading={saving} disabled={!form.title}>
          초안으로 저장
        </Button>
        <Button onClick={() => handleSave(true)} loading={saving} disabled={!form.title}>
          게시하기
        </Button>
      </div>
    </div>
  )
}
