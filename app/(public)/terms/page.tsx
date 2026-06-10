import type { Metadata } from 'next'

export const metadata: Metadata = { title: '이용약관' }

const LAST_UPDATED = '2026년 6월 11일'

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">이용약관</h1>
      <p className="text-sm text-gray-400 mb-10">최종 수정일: {LAST_UPDATED} · 시행일: {LAST_UPDATED}</p>

      <div className="space-y-8">
        <Section title="제1조 (목적)">
          <p>
            이 약관은 대치플래너(이하 "회사")가 운영하는 대치 플래너 서비스(이하 "서비스")의
            이용 조건 및 절차, 회사와 이용자의 권리·의무 및 책임 사항을 규정합니다.
          </p>
        </Section>

        <Section title="제2조 (서비스 내용)">
          <p>서비스는 대치동 중학생 학부모를 위해 다음을 제공합니다.</p>
          <ul>
            <li>자녀 교육 일정 관리</li>
            <li>대치동 학원·입시 정보 브리프 콘텐츠</li>
            <li>북마크 및 관심 분야 맞춤 서비스</li>
          </ul>
          <p>일부 콘텐츠는 프리미엄 구독자에게만 제공됩니다.</p>
        </Section>

        <Section title="제3조 (회원 가입)">
          <ul>
            <li>이메일 주소와 비밀번호로 가입합니다.</li>
            <li>만 14세 미만은 가입할 수 없습니다.</li>
            <li>타인의 정보를 도용하거나 허위 정보를 입력한 경우 서비스 이용이 제한될 수 있습니다.</li>
          </ul>
        </Section>

        <Section title="제4조 (유료 서비스 및 결제)">
          <ul>
            <li><strong>월간 구독:</strong> ₩9,900 / 월 (매월 자동 결제)</li>
            <li><strong>연간 구독:</strong> ₩99,000 / 년 (매년 자동 결제)</li>
            <li>결제는 토스페이먼츠를 통해 처리됩니다.</li>
            <li>자동 결제를 원하지 않는 경우 구독 기간 만료 전에 해지하시기 바랍니다.</li>
          </ul>
        </Section>

        <Section title="제5조 (구독 해지 및 환불)">
          <ul>
            <li>구독은 설정 페이지에서 언제든지 해지할 수 있습니다.</li>
            <li>해지 즉시 프리미엄 서비스 이용이 종료됩니다.</li>
            <li>
              결제 후 7일 이내에 콘텐츠를 이용하지 않은 경우 전액 환불을 요청할 수 있습니다.
              이미 콘텐츠를 이용한 경우 환불이 제한될 수 있습니다.
            </li>
            <li>환불 요청: hanultari11@naver.com</li>
          </ul>
        </Section>

        <Section title="제6조 (이용자의 의무)">
          <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
          <ul>
            <li>타인의 계정을 무단 사용하는 행위</li>
            <li>서비스 내 콘텐츠를 무단으로 복제·배포·상업적으로 이용하는 행위</li>
            <li>서비스 운영을 방해하는 행위</li>
            <li>기타 법령 또는 이 약관에 위반되는 행위</li>
          </ul>
        </Section>

        <Section title="제7조 (서비스 중단)">
          <p>
            회사는 시스템 점검, 고장, 천재지변, 서비스 개편 등으로 서비스를 일시 중단할 수 있습니다.
            이 경우 사전에 공지하며, 불가피한 경우 사후 공지합니다.
          </p>
        </Section>

        <Section title="제8조 (책임의 한계)">
          <p>
            회사는 서비스 내 정보의 정확성·완전성을 보증하지 않으며,
            이용자가 서비스를 이용하여 기대하는 수익을 얻지 못하거나 손실이 발생한 경우
            이에 대한 책임을 지지 않습니다.
          </p>
        </Section>

        <Section title="제9조 (분쟁 해결)">
          <p>
            이 약관에 관한 분쟁은 대한민국 법률을 적용하며,
            소송 발생 시 서울중앙지방법원을 관할 법원으로 합니다.
          </p>
        </Section>

        <Section title="제10조 (문의)">
          <p>이용약관에 관한 문의는 hanultari11@naver.com으로 연락해 주시기 바랍니다.</p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed">
        {children}
      </div>
    </section>
  )
}
