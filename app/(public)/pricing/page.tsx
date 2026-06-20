import { redirect } from 'next/navigation'

export default function PricingPage() {
  // 사용자의 요청에 따라 무료/유료 구분을 없애기 위해 요금제 페이지 접근 시 메인으로 리다이렉트합니다.
  redirect('/')
}

