import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/badge'
import type { ContentItem } from '@/types'

export const metadata: Metadata = { title: '콘텐츠 관리' }

export default async function AdminContentPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('content_items')
    .select('*')
    .order('created_at', { ascending: false })

  const items = (data ?? []) as ContentItem[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">콘텐츠 관리</h1>
        <Link
          href="/admin/content/new"
          className="bg-navy-800 text-white text-sm px-4 py-2 rounded-lg hover:bg-navy-900 transition-colors"
        >
          + 새 콘텐츠
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
        {items.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            콘텐츠가 없습니다.{' '}
            <Link href="/admin/content/new" className="text-navy-800 hover:underline">
              첫 콘텐츠를 작성하세요
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">제목</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">카테고리</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">상태</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">등급</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(item.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge category={item.category} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                      item.is_published ? 'text-green-700' : 'text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.is_published ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {item.is_published ? '게시됨' : '초안'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={item.is_premium ? 'orange' : 'gray'}>
                      {item.is_premium ? '스탠다드' : '무료'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/content/${item.id}`}
                      className="text-xs text-navy-800 hover:underline"
                    >
                      편집
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
