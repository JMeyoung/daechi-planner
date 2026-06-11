import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getResend, FROM } from '@/lib/resend'
import { newsletterHtml } from '@/lib/email-templates'

export async function POST(request: Request) {
  const supabase = createServiceClient()

  // Admin check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { subject, body } = await request.json() as { subject: string; body: string }
  if (!subject?.trim() || !body?.trim()) return NextResponse.json({ error: 'subject and body required' }, { status: 400 })

  // Get all premium active subscribers' emails
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('plan', 'premium')
    .eq('status', 'active')

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const userIds = subs.map((s: { user_id: string }) => s.user_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('email')
    .in('id', userIds)

  const emails = profiles?.map((p: { email: string }) => p.email).filter(Boolean) as string[]
  if (!emails.length) return NextResponse.json({ sent: 0 })

  const html = newsletterHtml({ subject, body })

  // Resend batch limit is 100 per request
  const chunks: string[][] = []
  for (let i = 0; i < emails.length; i += 100) chunks.push(emails.slice(i, i + 100))

  let sent = 0
  for (const chunk of chunks) {
    const batch = chunk.map(to => ({ from: FROM, to, subject, html }))
    const { data } = await getResend().batch.send(batch)
    sent += data?.data?.length ?? 0
  }

  return NextResponse.json({ sent })
}
