const TOSS_BASE = 'https://api.tosspayments.com'

function authHeader() {
  return 'Basic ' + Buffer.from((process.env.TOSS_SECRET_KEY ?? '') + ':').toString('base64')
}

export const PLANS = {
  premium_monthly: { label: '대치 플래너 프리미엄 월간', amount: 9900, interval: 'month' as const },
  premium_yearly:  { label: '대치 플래너 프리미엄 연간', amount: 99000, interval: 'year' as const },
} as const

export type PlanKey = keyof typeof PLANS

export async function issueBillingKey(authKey: string, customerKey: string) {
  const res = await fetch(`${TOSS_BASE}/v1/billing/authorizations/issue`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ authKey, customerKey }),
  })
  if (!res.ok) throw new Error(`billingKey issue failed: ${res.status}`)
  return res.json() as Promise<{ billingKey: string; customerKey: string }>
}

export async function chargeBilling(params: {
  billingKey: string
  customerKey: string
  orderId: string
  amount: number  // can be discounted amount
  orderName: string
  customerEmail?: string
}) {
  const res = await fetch(`${TOSS_BASE}/v1/billing/${params.billingKey}`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerKey: params.customerKey,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
      customerEmail: params.customerEmail,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`charge failed: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}
