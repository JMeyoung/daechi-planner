import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Outfit } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto',
})

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-outfit',
})

export const metadata: Metadata = {
  title: {
    default: '대치 플래너',
    template: '%s | 대치 플래너',
  },
  description: '대치동 중학생 학부모를 위한 교육 정보 & 일정 관리 서비스',
  keywords: ['대치동', '학원', '중학교', '입시', '교육 정보', '대치 플래너'],
  openGraph: {
    title: '대치 플래너',
    description: '대치동 중학생 학부모를 위한 교육 정보 & 일정 관리 서비스',
    locale: 'ko_KR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} ${outfit.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
