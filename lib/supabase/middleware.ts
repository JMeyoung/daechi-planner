import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const MEMBER_PREFIXES = ['/dashboard', '/settings', '/bookmarks']
const ADMIN_PREFIX = '/admin'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must be called before any redirect
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  const requiresMember = MEMBER_PREFIXES.some(p => path.startsWith(p))
  const requiresAdmin = path.startsWith(ADMIN_PREFIX)

  // Already-authenticated users should never see the login page
  if (path === '/login' && user) {
    const nextParam = request.nextUrl.searchParams.get('next')
    const target =
      nextParam && nextParam.startsWith('/') && !nextParam.startsWith('/login')
        ? nextParam
        : '/dashboard'
    return NextResponse.redirect(new URL(target, request.url))
  }

  if (requiresMember && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  if (requiresAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Read the role with the service key so the gate doesn't depend on RLS /
    // the cookie-scoped client.
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: 'no-store',
      }
    )
    const rows = (await res.json().catch(() => [])) as Array<{ role?: string }>

    // Fail closed: any non-admin (or failed lookup) goes back to home.
    // no-store keeps the browser/router from caching the redirect.
    if (rows[0]?.role !== 'admin') {
      const redirectRes = NextResponse.redirect(new URL('/', request.url))
      redirectRes.headers.set('Cache-Control', 'no-store, max-age=0')
      return redirectRes
    }
  }

  return response
}
