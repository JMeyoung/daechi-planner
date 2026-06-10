import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Keep billing key in DB (to charge any outstanding amounts if needed later)
  // Just mark plan as free and status as canceled — stops future recurring charges
  const { error } = await supabase.from('subscriptions').update({
    plan:   'free',
    status: 'canceled',
  }).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
