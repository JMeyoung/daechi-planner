import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col">
      <Header userEmail={user?.email} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
