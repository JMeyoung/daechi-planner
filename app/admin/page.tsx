import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NewsletterForm from './newsletter-form'

export const metadata: Metadata = { title: '관리자 대시보드' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [contentRes, memberRes, premiumRes] = await Promise.all([
    supabase.from('content_items').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('plan', 'premium')
      .eq('status', 'active'),
  ])

  const stats = [
    { label: '총 콘텐츠', value: contentRes.count ?? 0 },
    { label: '가입 회원', value: memberRes.count ?? 0 },
    { label: '스탠다드 구독', value: premiumRes.count ?? 0 },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
        <Link
          href="/admin/content/new"
          className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
        >
          + 새 콘텐츠
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <p className="text-3xl font-bold text-blue-700">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Newsletter */}
      <NewsletterForm premiumCount={premiumRes.count ?? 0} />

      {/* Quick links */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-3">빠른 액션</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link
            href="/admin/content/new"
            className="text-sm text-center border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600"
          >
            콘텐츠 작성
          </Link>
          <Link
            href="/admin/content"
            className="text-sm text-center border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600"
          >
            전체 콘텐츠 보기
          </Link>
          <Link
            href="/admin/coupons"
            className="text-sm text-center border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600"
          >
            쿠폰 관리
          </Link>
          <Link
            href="/briefings"
            className="text-sm text-center border border-gray-200 rounded-lg p-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600"
          >
            사용자 화면 보기
          </Link>
        </div>
      </div>
    </div>
  )
}
