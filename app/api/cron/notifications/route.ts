import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

// Use service role key to query all users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

export async function GET(req: Request) {
  try {
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@daechi-planner.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      )
    }
    // 1. Get auth token to prevent unauthorized access (Vercel Cron sets Authorization header)
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Query today's upcoming fees (e.g. D-3)
    const today = new Date()
    const targetDay = today.getDate() + 3 > 31 ? (today.getDate() + 3) % 31 : today.getDate() + 3
    // This is simplified. In a real scenario, we calculate exact dates.
    
    // For demonstration, let's just send a test push to everyone who is subscribed if the query param ?test=1 is provided
    const url = new URL(req.url)
    const isTest = url.searchParams.get('test') === '1'

    let notificationsSent = 0
    let errors = 0

    if (isTest) {
      const { data: subs, error } = await supabase.from('push_subscriptions').select('*')
      if (error) throw error

      const payload = JSON.stringify({
        title: '대치 플래너 알림 테스트',
        body: '푸시 알림 설정이 정상적으로 완료되었습니다!',
        url: '/dashboard'
      })

      for (const sub of subs) {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          }
          await webpush.sendNotification(pushSubscription, payload)
          notificationsSent++
        } catch (e: any) {
          console.error('Push error for user', sub.user_id, e.message)
          // If 410 Gone, the user unsubscribed on their device, we should remove it
          if (e.statusCode === 410 || e.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          }
          errors++
        }
      }
    } else {
      // Real cron logic for D-day fees
      const { data: fees, error: feesError } = await supabase
        .from('academy_fees')
        .select('*, profiles(id)')
        .eq('is_active', true)
        .eq('payment_day', targetDay)
        
      if (feesError) throw feesError

      // Group fees by user
      const userFees = new Map<string, any[]>()
      fees.forEach(fee => {
        const uId = fee.user_id
        if (!userFees.has(uId)) userFees.set(uId, [])
        userFees.get(uId)!.push(fee)
      })

      // Send to each user
      for (const [userId, upcomingFees] of userFees.entries()) {
        const { data: subs } = await supabase.from('push_subscriptions').select('*').eq('user_id', userId)
        if (!subs || subs.length === 0) continue

        const feeNames = upcomingFees.map(f => f.name).join(', ')
        const payload = JSON.stringify({
          title: '학원비 납부일 안내',
          body: `${feeNames} 학원비 납부일이 3일 남았습니다.`,
          url: '/fees'
        })

        for (const sub of subs) {
          try {
            const pushSubscription = {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth }
            }
            await webpush.sendNotification(pushSubscription, payload)
            notificationsSent++
          } catch (e: any) {
            if (e.statusCode === 410 || e.statusCode === 404) {
              await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
            errors++
          }
        }
      }
    }

    return NextResponse.json({ success: true, notificationsSent, errors })
  } catch (error: any) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
