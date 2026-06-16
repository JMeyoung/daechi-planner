import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 px-4">
      <div className="text-center max-w-md">
        {/* Large 404 number */}
        <p className="font-display text-8xl md:text-9xl font-bold text-gold-500/20 select-none leading-none mb-6">
          404
        </p>

        {/* Main message */}
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
          페이지를 찾을 수 없습니다
        </h1>

        {/* Sub-message */}
        <p className="text-navy-300 text-sm md:text-base leading-relaxed mb-10">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>

        {/* Gold CTA */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 text-navy-950 font-semibold text-sm px-7 py-3 rounded-full shadow-[0_4px_14px_rgba(212,168,83,0.35)] hover:shadow-[0_8px_20px_rgba(212,168,83,0.45)] hover:-translate-y-0.5 transition-all"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
