'use client'

import { useState } from 'react'

export default function NewsletterForm({ premiumCount }: { premiumCount: number }) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [sentCount, setSentCount] = useState(0)

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    if (!confirm(`스탠다드 구독자 ${premiumCount}명에게 뉴스레터를 발송할까요?`)) return
    setStatus('sending')
    try {
      const res = await fetch('/api/email/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSentCount(data.sent)
      setStatus('done')
      setSubject('')
      setBody('')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">뉴스레터 발송</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">스탠다드 {premiumCount}명</span>
      </div>

      {status === 'done' && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700">
          {sentCount}명에게 발송 완료!
        </div>
      )}
      {status === 'error' && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
          발송 실패. 다시 시도해주세요.
        </div>
      )}

      <div className="space-y-3">
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="제목 *"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="본문 내용 *"
          rows={6}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          onClick={handleSend}
          disabled={status === 'sending' || !subject.trim() || !body.trim() || premiumCount === 0}
          className="w-full bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {status === 'sending' ? '발송 중...' : `${premiumCount}명에게 발송하기`}
        </button>
      </div>
    </div>
  )
}
