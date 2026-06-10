'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/button'

type Step = 'input' | 'sent'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next')
  const next =
    nextParam && nextParam.startsWith('/') && !nextParam.startsWith('/login')
      ? nextParam
      : '/dashboard'
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Bounce an already-signed-in visitor off the login page. Covers the case
  // where the magic link completed in another tab: the cookie is set, but this
  // tab never re-navigated, so it would otherwise sit on the login UI.
  useEffect(() => {
    const supabase = createClient()

    async function redirectIfAuthed() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) router.replace(next)
    }

    redirectIfAuthed()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) router.replace(next)
      }
    )

    // Re-check when the user switches back to this tab
    const onVisible = () => {
      if (document.visibilityState === 'visible') redirectIfAuthed()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [next, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    setLoading(false)

    if (authError) {
      setError('로그인 링크를 보내는 데 실패했습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setStep('sent')
  }

  if (step === 'sent') {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">📧</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">이메일을 확인해주세요</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          <strong>{email}</strong>로 로그인 링크를 보냈습니다.
          <br />
          이메일의 링크를 클릭하면 자동으로 로그인됩니다.
        </p>
        <button
          onClick={() => setStep('input')}
          className="text-sm text-blue-700 hover:underline"
        >
          다른 이메일로 시도하기
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">로그인 / 회원가입</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          이메일 주소를 입력하면 로그인 링크를 보내드립니다.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일 주소
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            이메일로 로그인 링크 받기
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          처음 방문이라면 자동으로 회원가입됩니다.
        </p>
      </div>
    </div>
  )
}
