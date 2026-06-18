'use client'

import { useState } from 'react'

export default function WaitlistForm({ source = 'landing' }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage(data.error ?? '잠시 후 다시 시도해 주세요.')
        setStatus('error')
        return
      }
      setStatus('done')
      setEmail('')
    } catch {
      setMessage('잠시 후 다시 시도해 주세요.')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <p className="text-sm text-navy-700 font-medium">
        ✓ 등록되었어요. 새 소식이 준비되면 이메일로 알려드릴게요.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setStatus('idle') }}
        placeholder="이메일 주소"
        className="flex-1 border border-gray-300 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
      />
      <button
        type="submit"
        disabled={status === 'sending' || !email.trim()}
        className="btn-primary text-sm whitespace-nowrap disabled:opacity-50"
      >
        {status === 'sending' ? '등록 중...' : '소식 받기'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 sm:absolute sm:mt-12 w-full text-center">{message}</p>
      )}
    </form>
  )
}
