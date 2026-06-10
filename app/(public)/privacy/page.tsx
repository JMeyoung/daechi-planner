import type { Metadata } from 'next'

export const metadata: Metadata = { title: '개인정보처리방침' }

const LAST_UPDATED = '2026년 6월 11일'

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">개인정보처리방침</h1>
      <p className="text-sm text-gray-400 mb-10">최종 수정일: {LAST_UPDATED}</p>

      <div className="space-y-8">
        <Section title="1. 수집하는 개인정보 항목">
          <p>대치 플래너(이하 "서비스")는 다음의 개인정보를 수집합니다.</p>
          <ul>
            <li><strong>필수 항목:</strong> 이메일 주소</li>
            <li><strong>선택 항목:</strong> 이름, 자녀 학년, 자녀 프로필(이름·학년·색상), 관심 분야</li>
            <li><strong>서비스 이용 과정에서 자동 생성:</strong> 일정 데이터, 북마크, 접속 로그</li>
            <li><strong>결제 정보:</strong> 카드 정보는 토스페이먼츠가 직접 수집·저장하며, 서비스는 빌링키(결제 식별자)만 보관합니다.</li>
          </ul>
        </Section>

        <Section title="2. 개인정보 수집 및 이용 목적">
          <ul>
            <li>회원 가입 및 본인 확인</li>
            <li>교육 일정 관리 및 브리프 콘텐츠 제공</li>
            <li>프리미엄 구독 결제 처리 및 구독 관리</li>
            <li>서비스 이용 문의 응대 및 공지 발송</li>
          </ul>
        </Section>

        <Section title="3. 개인정보 보유 및 이용 기간">
          <p>
            회원 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 의해 보존이 필요한 경우
            해당 법령에서 정한 기간 동안 보관합니다.
          </p>
          <ul>
            <li>전자상거래 계약·결제 기록: 5년 (전자상거래법)</li>
            <li>소비자 불만·분쟁 처리 기록: 3년 (전자상거래법)</li>
          </ul>
        </Section>

        <Section title="4. 개인정보의 제3자 제공">
          <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 아래의 경우는 예외입니다.</p>
          <ul>
            <li>이용자가 사전에 동의한 경우</li>
            <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차에 따른 요청이 있는 경우</li>
          </ul>
        </Section>

        <Section title="5. 개인정보 처리 위탁">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-surface-50">
                <th className="border border-surface-border px-3 py-2 text-left">수탁업체</th>
                <th className="border border-surface-border px-3 py-2 text-left">위탁 업무</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-surface-border px-3 py-2">토스페이먼츠(주)</td>
                <td className="border border-surface-border px-3 py-2">결제 처리</td>
              </tr>
              <tr>
                <td className="border border-surface-border px-3 py-2">Supabase Inc.</td>
                <td className="border border-surface-border px-3 py-2">데이터베이스 및 인증 서비스 운영</td>
              </tr>
              <tr>
                <td className="border border-surface-border px-3 py-2">Vercel Inc.</td>
                <td className="border border-surface-border px-3 py-2">서버 및 웹 호스팅</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section title="6. 정보주체의 권리">
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람·정정·삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
            <li>회원 탈퇴를 통한 개인정보 삭제</li>
          </ul>
          <p>권리 행사는 아래 개인정보 보호책임자에게 이메일로 요청하시기 바랍니다.</p>
        </Section>

        <Section title="7. 개인정보 보호책임자">
          <ul>
            <li><strong>성명:</strong> 대치플래너 운영자</li>
            <li><strong>이메일:</strong> hanultari11@naver.com</li>
          </ul>
          <p className="mt-2 text-xs text-gray-400">
            개인정보 처리에 관한 문의·불만·피해 구제는 위 이메일로 접수하시면 신속하게 처리합니다.
          </p>
        </Section>

        <Section title="8. 개인정보처리방침 변경">
          <p>
            이 방침은 법령 및 서비스 변경에 따라 수정될 수 있습니다.
            변경 시 서비스 내 공지 및 이메일을 통해 사전 안내합니다.
          </p>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:leading-relaxed [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-surface-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:bg-surface-50 [&_td]:border [&_td]:border-surface-border [&_td]:px-3 [&_td]:py-2">
        {children}
      </div>
    </section>
  )
}
