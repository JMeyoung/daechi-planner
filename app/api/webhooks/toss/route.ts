import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const tossWebhookSchema = z.object({
  eventType: z.string(),
  createdAt: z.string(),
  data: z.object({
    paymentKey: z.string().optional(),
    orderId: z.string().optional(),
    status: z.string().optional(),
    billingKey: z.string().optional(),
    customerKey: z.string().optional(),
  }),
})

export async function POST(request: Request) {
  // Verify Toss webhook authenticity: Authorization: Basic base64(secretKey:)
  const authHeader = request.headers.get('Authorization')
  const expected = 'Basic ' + Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = tossWebhookSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
  const payload = parsed.data
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
