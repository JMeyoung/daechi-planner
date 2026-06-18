import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getResend, FROM } from '@/lib/resend'
import { newsletterHtml } from '@/lib/email-templates'

const newsletterSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
})

export async function POST(request: Request) {
  // Use anon client for user identity check, service client for data access
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const parsed = newsletterSchema.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'subject and body required' }, { status: 400 })
  const { subject, body } = parsed.data

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
