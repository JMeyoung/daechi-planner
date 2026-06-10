import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

type TossWebhookPayload = {
  eventType: string
  createdAt: string
  data: {
    paymentKey?: string
    orderId?: string
    status?: string
    billingKey?: string
    customerKey?: string
  }
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TossWebhookPayload
  const supabase = createServiceClient()

  switch (payload.eventType) {
    case 'PAYMENT_STATUS_CHANGED': {
      const { orderId, status, billingKey } = payload.data
      if (!orderId) break

      if (status === 'DONE' && billingKey) {
        // Recurring billing succeeded — extend current_period_end
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('current_period_end')
          .eq('toss_billing_key', billingKey)
          .single()

        if (sub) {
          const base = sub.current_period_end ? new Date(sub.current_period_end) : new Date()
          // Determine interval from order ID (e.g. "order_xxx_yearly_...")
          const isYearly = orderId.includes('yearly')
          if (isYearly) base.setFullYear(base.getFullYear() + 1)
          else base.setMonth(base.getMonth() + 1)

          await supabase
            .from('subscriptions')
            .update({ plan: 'premium', status: 'active', current_period_end: base.toISOString() })
            .eq('toss_billing_key', billingKey)
        }
      } else if (status === 'CANCELED' || status === 'ABORTED') {
        if (billingKey) {
          await supabase
            .from('subscriptions')
            .update({ plan: 'free', status: 'canceled' })
            .eq('toss_billing_key', billingKey)
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
