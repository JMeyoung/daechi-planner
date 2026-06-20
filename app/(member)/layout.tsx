import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import Header from '@/components/layout/header'
import BottomNav from '@/components/layout/bottom-nav'

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-navy-950 transition-colors duration-300">
      <Header userEmail={user.email} />
      <div className="max-w-5xl mx-auto w-full px-4 py-6 flex-1 pb-24">
        {children}
      </div>
      <BottomNav loggedIn={true} />
    </div>
  )
}
