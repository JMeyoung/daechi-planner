import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import BottomNav from '@/components/layout/bottom-nav'
import { getUser } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  const loggedIn = !!user

  return (
    <div className="min-h-screen flex flex-col">
      <Header userEmail={user?.email} />
      <main className={`flex-1 ${loggedIn ? 'pb-20' : ''}`}>{children}</main>
      {!loggedIn && <Footer />}
      <BottomNav loggedIn={loggedIn} />
    </div>
  )
}
