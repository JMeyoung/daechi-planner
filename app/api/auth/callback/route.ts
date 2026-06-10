import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Only allow relative, non-login paths — blocks open-redirect via ?next=
function safeNext(next: string | null): string {
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/login')) {
    return next
  }
  return '/dashboard'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Behind a proxy (e.g. Vercel) the public host is in x-forwarded-host;
      // `origin` would otherwise resolve to the internal address.
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocal = process.env.NODE_ENV === 'development'
      const base = !isLocal && forwardedHost ? `https://${forwardedHost}` : origin
      return NextResponse.redirect(`${base}${next}`)
    }
  }

  // Auth failed — back to login with an error flag
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
