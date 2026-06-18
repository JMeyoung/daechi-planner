import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  const { email, source } = await request.json() as { email?: string; source?: string }
  const clean = email?.trim().toLowerCase() ?? ''

  if (!EMAIL_RE.test(clean)) {
    return NextResponse.json({ error: '올바른 이메일을 입력해 주세요.' }, { status: 400 })
  }

  const { error } = await createServiceClient()
    .from('waitlist')
    .upsert({ email: clean, source: source ?? null }, { onConflict: 'email' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
