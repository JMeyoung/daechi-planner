import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: '서비스 소개' }

export default function IntroPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
        대치 플래너란?
      </h1>
      <p className="text-gray-600 leading-relaxed mb-8">
        대치동 중학생 학부모들은 매일 쏟아지는 교육 정보 속에서 무엇이 중요한지 판단하기 어렵습니다.
        대치 플래너는 검증된 대치동 교육 정보를 큐레이션하고, 자녀의 학습 일정을 체계적으로 관리할 수 있게 돕습니다.
      </p>

      <div className="space-y-8 mb-12">
        {[
          {
            title: '신뢰할 수 있는 교육 정보',
            body: '대치동 현지에서 수집한 학원 정보, 입시 트렌드, 학습 팁을 매주 큐레이션해서 제공합니다.',
          },
          {
            title: '교육 일정 통합 관리',
            body: '여러 학원의 시간표, 시험 일정, 상담 일정을 하나의 플래너에서 관리하세요.',
          },
          {
            title: '대치 브리프 연동 예정',
            body: '곧 출시 예정인 뉴스레터 서비스 "대치 브리프"와 연동되어 더욱 풍부한 정보를 받아보실 수 있습니다.',
          },
        ].map(item => (
          <div key={item.title} className="flex gap-4">
            <div className="w-1 rounded-full bg-blue-700 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/login?signup=1"
        className="inline-block bg-blue-700 text-white font-semibold px-8 py-3 rounded-full hover:bg-blue-800 transition-colors"
      >
        무료로 시작하기
      </Link>
    </div>
  )
}
