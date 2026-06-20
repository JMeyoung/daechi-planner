import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { chargeBilling, PLANS } from '@/lib/toss/client'
import { getResend, FROM } from '@/lib/resend'
import { paymentConfirmHtml } from '@/lib/email-templates'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  try {
    // 1. 보안 체크: Vercel Cron이 보낸 요청인지 확인
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceSupabase = createServiceClient()

    // 2. 오늘 만료 예정인 활성 구독 찾기
    // (현재 시간이 period_end를 지났거나, 오늘 안에 끝나는 경우)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const { data: subscriptions, error } = await serviceSupabase
      .from('subscriptions')
      .select('*, profiles(email)')
      .eq('status', 'active')
      .not('toss_billing_key', 'is', null)
      .not('toss_customer_key', 'is', null)
      .lt('current_period_end', tomorrow.toISOString())

    if (error) throw error

    let successCount = 0
    let failCount = 0

    for (const sub of subscriptions || []) {
      const plan = PLANS[`${sub.plan}_monthly` as keyof typeof PLANS] // 기본적으로 월간으로 가정
      if (!plan) continue

      const orderId = `auto_${sub.user_id.replace(/-/g, '')}_${Date.now()}`
      
      try {
        // 3. 토스 빌링키 결제 요청
        await chargeBilling({
          billingKey: sub.toss_billing_key!,
          customerKey: sub.toss_customer_key!,
          orderId,
          amount: plan.amount,
          orderName: plan.label + ' 정기결제',
          customerEmail: sub.profiles.email,
        })

        // 4. 성공 시 다음 결제일 갱신 (1개월 후)
        const currentEnd = new Date(sub.current_period_end || new Date())
        currentEnd.setMonth(currentEnd.getMonth() + 1)

        await serviceSupabase
          .from('subscriptions')
          .update({
            current_period_end: currentEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id)

        // 5. 결제 성공 메일 발송
        if (sub.profiles.email) {
          const periodEndStr = currentEnd.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
          await getResend().emails.send({
            from: FROM,
            to: sub.profiles.email,
            subject: `[대치 플래너] ${plan.label} 정기결제가 완료되었습니다`,
            html: paymentConfirmHtml({ planLabel: plan.label, amount: plan.amount, periodEnd: periodEndStr }),
          }).catch(e => console.error('Auto billing email error:', e))
        }

        successCount++
      } catch (err: any) {
        console.error(`Auto billing failed for user ${sub.user_id}:`, err)
        
        // 결제 실패 시 상태를 past_due로 변경
        await serviceSupabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id)

        // 실패 알림 메일 발송 (재결제 안내 등)
        if (sub.profiles.email) {
          await getResend().emails.send({
            from: FROM,
            to: sub.profiles.email,
            subject: `[대치 플래너] 정기결제에 실패했습니다`,
            html: `<p>결제 수단 문제로 스탠다드 정기결제가 실패하여 이용권이 정지되었습니다. 마이페이지에서 결제 수단을 업데이트해 주세요.</p>`,
          }).catch(e => console.error('Billing fail email error:', e))
        }
        
        failCount++
      }
    }

    return NextResponse.json({ success: true, successCount, failCount })
  } catch (error: any) {
    console.error('Cron billing error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
