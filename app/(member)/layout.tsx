import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/layout/header'

const MEMBER_NAV = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/bookmarks', label: '북마크' },
  { href: '/settings', label: '설정' },
]

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header userEmail={user.email} />
      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1">
        {/* Mobile nav tabs */}
        <nav className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1">
          {MEMBER_NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 text-center text-sm py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  )
}
