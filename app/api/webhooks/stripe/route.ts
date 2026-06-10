import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'

// Must export config to disable body parsing — Stripe needs the raw body
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const headerStore = await headers()
  const sig = headerStore.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: sub.id,
          plan: sub.status === 'active' || sub.status === 'trialing' ? 'premium' : 'free',
          status: sub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('subscriptions')
        .update({ plan: 'free', status: 'canceled' })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.customer && session.client_reference_id) {
        // client_reference_id should be set to user_id when creating checkout session
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: session.customer as string })
          .eq('user_id', session.client_reference_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
