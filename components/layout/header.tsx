'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/intro', label: '서비스 소개' },
  { href: '/briefings', label: '브리프 둘러보기' },
  // { href: '/pricing', label: '요금제' }, // 베타 기간 동안 숨김
]

export default function Header({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  const isHome = pathname === '/'

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const headerBase = 'sticky top-0 z-50 transition-all duration-300'
  const headerScrolled = 'bg-white/90 dark:bg-navy-950/90 backdrop-blur-md border-b border-surface-border dark:border-navy-700 shadow-header dark:shadow-none'
  const headerTransparent = 'bg-transparent border-b border-transparent'

  return (
    <header className={`${headerBase} ${scrolled ? headerScrolled : headerTransparent}`}>
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className={`font-display font-bold text-lg tracking-tight transition-colors ${
            scrolled || !isHome ? 'text-navy-900 dark:text-white' : 'text-white'
          }`}
        >
          대치 플래너
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors font-medium ${
                scrolled || !isHome
                  ? pathname === link.href
                    ? 'text-navy-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-navy-900 dark:hover:text-white'
                  : pathname === link.href
                    ? 'text-white'
                    : 'text-white/60 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="hidden md:flex items-center gap-3">
          {userEmail ? (
            <>
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  scrolled || !isHome ? 'text-gray-600 dark:text-gray-300 hover:text-navy-900 dark:hover:text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                내 플래너
              </Link>
              <button
                onClick={handleSignOut}
                className={`text-sm transition-colors ${
                  scrolled || !isHome ? 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300' : 'text-white/40 hover:text-white/70'
                }`}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm font-medium transition-colors ${
                  scrolled || !isHome ? 'text-gray-600 dark:text-gray-300 hover:text-navy-900 dark:hover:text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                로그인
              </Link>
              <Link
                href="/login?signup=1"
                className={`text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200 ${
                  scrolled || !isHome
                    ? 'bg-cta-gradient text-navy-950 shadow-cta hover:shadow-cta-hover hover:-translate-y-px'
                    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                }`}
              >
                시작하기
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className={`md:hidden p-2 transition-colors ${
            scrolled || !isHome ? 'text-gray-600 dark:text-gray-300' : 'text-white'
          }`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="메뉴"
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface-border dark:border-navy-700 bg-white/95 dark:bg-navy-950/95 backdrop-blur-md px-4 py-3 space-y-1">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`block text-sm py-2 font-medium transition-colors rounded-lg px-2 ${
                pathname === link.href
                  ? 'text-navy-900 dark:text-white bg-gold-50 dark:bg-navy-800'
                  : 'text-gray-700 dark:text-gray-300 hover:text-navy-900 dark:hover:text-white hover:bg-surface-50 dark:hover:bg-navy-800'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-surface-border dark:border-navy-700 flex flex-col gap-2 mt-1">
            {userEmail ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-700 dark:text-gray-300 font-medium py-2 px-2" onClick={() => setMenuOpen(false)}>내 플래너</Link>
                <button onClick={handleSignOut} className="text-sm text-gray-500 dark:text-gray-400 text-left py-2 px-2">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-700 dark:text-gray-300 py-2 px-2" onClick={() => setMenuOpen(false)}>로그인</Link>
                <Link
                  href="/login?signup=1"
                  className="text-sm bg-cta-gradient text-navy-950 font-semibold px-4 py-2 rounded-full text-center shadow-cta"
                  onClick={() => setMenuOpen(false)}
                >
                  시작하기
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
