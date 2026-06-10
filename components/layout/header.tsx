'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/intro', label: '서비스 소개' },
  { href: '/briefings', label: '브리프 둘러보기' },
  { href: '/pricing', label: '요금제' },
]

export default function Header({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg text-blue-700 tracking-tight">
          대치 플래너
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-blue-700 ${
                pathname === link.href ? 'text-blue-700 font-medium' : 'text-gray-600'
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
                className="text-sm text-gray-600 hover:text-blue-700 transition-colors"
              >
                내 플래너
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-blue-700 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/login?signup=1"
                className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-full hover:bg-blue-800 transition-colors"
              >
                무료로 시작
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="메뉴"
        >
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current mb-1" />
          <span className="block w-5 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-gray-700 py-1"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {userEmail ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-700">내 플래너</Link>
                <button onClick={handleSignOut} className="text-sm text-gray-500 text-left">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-700">로그인</Link>
                <Link
                  href="/login?signup=1"
                  className="text-sm bg-blue-700 text-white px-4 py-2 rounded-full text-center"
                >
                  무료로 시작
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
