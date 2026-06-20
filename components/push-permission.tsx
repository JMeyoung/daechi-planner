'use client'

import { useState, useEffect } from 'react'

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushPermission() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) setIsSubscribed(true)
        })
      })

      // Check if PWA (standalone)
      setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true)
    }
  }, [])

  async function handleSubscribe() {
    try {
      setLoading(true)
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
      })

      // Send to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub })
      })

      if (res.ok) {
        setIsSubscribed(true)
        setPermission('granted')
      } else {
        throw new Error('서버에 구독 정보를 저장하는데 실패했습니다.')
      }
    } catch (e: any) {
      console.error(e)
      alert('알림 설정 중 오류가 발생했습니다: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  // Not supported browser
  if (!isSupported) return null

  // iOS Safari specific warning if not standalone
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const showPWAWarning = isIOS && !isStandalone

  return (
    <div className="bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-navy-700 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">푸시 알림</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            납부일 임박 학원비, 오늘의 주요 일정을 받아보세요.
          </p>
          
          {showPWAWarning && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-navy-900/50 border border-blue-200 dark:border-navy-600 rounded-xl">
              <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">💡 iOS 기기 안내</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                아이폰에서는 브라우저 공유 버튼[<svg className="inline w-3 h-3 mx-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>]을 눌러 <b>'홈 화면에 추가'</b> 하신 후, 추가된 앱을 실행해야 알림을 받을 수 있습니다.
              </p>
            </div>
          )}
        </div>

        <div className="ml-4 shrink-0 mt-1">
          {permission === 'granted' && isSubscribed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold border border-green-200 dark:border-green-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              알림 수신 중
            </span>
          ) : permission === 'denied' ? (
            <span className="text-sm font-medium text-red-500 px-2">권한 차단됨</span>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={loading || showPWAWarning}
              className="text-sm bg-navy-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-navy-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '설정 중...' : '알림 켜기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
