'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'
import type { ContentItem } from '@/types'

type FormState = Omit<ContentItem, 'id' | 'author_id' | 'created_at' | 'updated_at'>

const EMPTY_FORM: FormState = {
  title: '',
  summary: '',
  body: '',
  category: 'briefing',
  tags: [],
  is_premium: false,
  is_published: false,
  published_at: null,
}

export default function ContentEditorPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const isNew = id === 'new'

  const supabase = createClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew) return
    supabase
      .from('content_items')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setForm(data as FormState)
        setLoading(false)
      })
  }, [id])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave(publish?: boolean) {
    setSaving(true)
    setError(null)

    const payload = {
      ...form,
      is_published: publish ?? form.is_published,
      published_at: (publish ?? form.is_published) && !form.published_at
        ? new Date().toISOString()
        : form.published_at,
    }

    const { error: dbError } = isNew
      ? await supabase.from('content_items').insert(payload)
      : await supabase.from('content_items').update(payload).eq('id', id)

    setSaving(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    router.push('/admin/content')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await supabase.from('content_items').delete().eq('id', id)
    router.push('/admin/content')
    router.refresh()
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-8">불러오는 중...</div>
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {isNew ? '새 콘텐츠' : '콘텐츠 편집'}
        </h1>
        <div className="flex gap-2">
          {!isNew && (
            <Button variant="danger" size="sm" onClick={handleDelete}>삭제</Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="card-panel p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목 *</label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            placeholder="제목을 입력하세요"
          />
        </div>

        {/* Summary */}
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

        {/* Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">본문 *</label>
          <textarea
            value={form.body}
            onChange={e => set('body', e.target.value)}
            rows={12}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400 font-mono"
            placeholder="본문을 입력하세요 (Markdown 지원 예정)"
          />
        </div>

        {/* Category & settings row */}
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
          <div className="flex flex-col gap-3 justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_premium}
                onChange={e => set('is_premium', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-navy-800 focus:ring-gold-400"
              />
              <span className="text-sm text-gray-700">스탠다드 콘텐츠</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={() => handleSave(false)}
          loading={saving}
          disabled={!form.title}
        >
          초안으로 저장
        </Button>
        <Button
          onClick={() => handleSave(true)}
          loading={saving}
          disabled={!form.title}
        >
          게시하기
        </Button>
      </div>
    </div>
  )
}
