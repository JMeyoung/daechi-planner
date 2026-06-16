import type { Metadata, Viewport } from 'next'
import { Noto_Sans_KR, Playfair_Display } from 'next/font/google'
import './globals.css'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: {
    default: '대치 플래너',
    template: '%s | 대치 플래너',
  },
  description: '대치동 중학생 학부모를 위한 교육 정보 & 일정 관리 서비스',
  keywords: ['대치동', '학원', '중학교', '입시', '교육 정보', '대치 플래너'],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '대치 플래너',
  },
  formatDetection: { telephone: false },
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
  themeColor: '#0f172a',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
