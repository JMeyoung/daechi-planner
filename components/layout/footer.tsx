import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="font-bold text-gray-800 mb-1">대치 플래너</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              대치동 중학생 학부모를 위한<br />교육 정보 & 일정 관리 서비스
            </p>
          </div>
          <div className="flex gap-8 text-sm text-gray-500">
            <div className="space-y-2">
              <Link href="/intro" className="block hover:text-gray-700">서비스 소개</Link>
              <Link href="/pricing" className="block hover:text-gray-700">요금제</Link>
              <Link href="/briefings" className="block hover:text-gray-700">브리프 둘러보기</Link>
            </div>
            <div className="space-y-2">
              <Link href="/privacy" className="block hover:text-gray-700">개인정보처리방침</Link>
              <Link href="/terms" className="block hover:text-gray-700">이용약관</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 text-xs text-gray-400 text-center md:text-left space-y-1">
          <p>© 2026 대치 플래너. All rights reserved.</p>
          <p>문의: <a href="mailto:hanultari11@naver.com" className="hover:text-gray-600 underline">hanultari11@naver.com</a></p>
        </div>
      </div>
    </footer>
  )
}
