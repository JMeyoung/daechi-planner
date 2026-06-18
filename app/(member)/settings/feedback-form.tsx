'use client'

import { useState } from 'react'

export default function FeedbackForm() {
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  async function handleSubmit() {
    if (!message.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, contact }),
      })
      if (!res.ok) throw new Error()
      setStatus('done')
      setMessage('')
      setContact('')
    } catch {
      setStatus('error')
    }
  }

  const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-5">
      <h2 className="font-semibold text-gray-900 mb-1">의견 보내기</h2>
      <p className="text-xs text-gray-500 mb-3">
        불편한 점, 있었으면 하는 기능 등 무엇이든 들려주세요. 직접 읽고 반영합니다.
      </p>

      {status === 'done' ? (
        <p className="text-sm text-navy-700 font-medium py-2">✓ 소중한 의견 감사합니다!</p>
      ) : (
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="의견을 자유롭게 적어주세요"
            rows={4}
            className={`${inputClass} resize-none`}
          />
          <input
            value={contact}
            onChange={e => setContact(e.target.value)}
            placeholder="답변 받을 연락처 (선택)"
            className={inputClass}
          />
          {status === 'error' && (
            <p className="text-xs text-red-500">전송에 실패했어요. 다시 시도해 주세요.</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={status === 'sending' || !message.trim()}
            className="w-full bg-navy-800 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-navy-900 transition-colors disabled:opacity-50"
          >
            {status === 'sending' ? '보내는 중...' : '보내기'}
          </button>
        </div>
      )}
    </div>
  )
}
