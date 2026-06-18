import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: '의견 · 대기자' }

function fmt(ts: string) {
  return new Date(ts).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function AdminFeedbackPage() {
  const supabase = await createClient()

  const [feedbackRes, waitlistRes] = await Promise.all([
    supabase.from('feedback').select('id, message, contact, created_at').order('created_at', { ascending: false }),
    supabase.from('waitlist').select('id, email, source, created_at').order('created_at', { ascending: false }),
  ])

  const feedback = feedbackRes.data ?? []
  const waitlist = waitlistRes.data ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-gray-900">의견 · 대기자</h1>

      {/* 대기자 명단 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-gray-900">출시 알림 대기자</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{waitlist.length}명</span>
        </div>
        {waitlist.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl p-5">아직 등록된 대기자가 없습니다.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {waitlist.map(w => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-800">{w.email}</span>
                <span className="text-xs text-gray-400">{fmt(w.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 사용자 의견 */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-gray-900">사용자 의견</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{feedback.length}건</span>
        </div>
        {feedback.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-200 rounded-xl p-5">아직 받은 의견이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {feedback.map(f => (
              <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{f.message}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span>{fmt(f.created_at)}</span>
                  {f.contact && <span className="text-azure-600">· {f.contact}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
