import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import CheckoutClient from './checkout-client'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const user = await getUser()
  if (!user) redirect('/login?next=/pricing')

  const { plan } = await searchParams
  return <CheckoutClient userId={user.id} plan={plan ?? 'premium_monthly'} />
}
