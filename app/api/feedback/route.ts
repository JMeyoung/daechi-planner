import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message, contact } = await request.json() as { message?: string; contact?: string }
  if (!message?.trim()) {
    return NextResponse.json({ error: '내용을 입력해 주세요.' }, { status: 400 })
  }

  const { error } = await createServiceClient().from('feedback').insert({
    user_id: user.id,
    message: message.trim(),
    contact: contact?.trim() || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
