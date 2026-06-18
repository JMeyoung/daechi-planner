export function paymentConfirmHtml(params: {
  planLabel: string
  amount: number
  periodEnd: string
}) {
  const amount = params.amount.toLocaleString('ko-KR')
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:32px 32px 24px;text-align:center">
          <p style="margin:0 0 8px;color:#bfdbfe;font-size:13px;font-weight:600;letter-spacing:0.05em">대치 플래너</p>
          <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">스탠다드 구독 시작!</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6">안녕하세요!<br>대치 플래너 스탠다드 구독이 성공적으로 시작되었습니다.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:24px">
            <tr><td style="padding:6px 0"><span style="color:#6b7280;font-size:13px">플랜</span><span style="float:right;color:#111827;font-size:13px;font-weight:600">${params.planLabel}</span></td></tr>
            <tr><td style="padding:6px 0"><span style="color:#6b7280;font-size:13px">결제 금액</span><span style="float:right;color:#111827;font-size:13px;font-weight:600">₩${amount}</span></td></tr>
            <tr><td style="padding:6px 0"><span style="color:#6b7280;font-size:13px">다음 결제일</span><span style="float:right;color:#111827;font-size:13px;font-weight:600">${params.periodEnd}</span></td></tr>
          </table>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/briefings" style="display:block;text-align:center;background:#2563eb;color:#fff;font-size:15px;font-weight:600;padding:14px;border-radius:12px;text-decoration:none">브리핑 보러가기</a>
          <p style="margin:20px 0 0;color:#9ca3af;font-size:12px;text-align:center">구독 해지는 설정 페이지에서 언제든지 가능합니다.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export function newsletterHtml(params: {
  subject: string
  body: string
  unsubscribeUrl?: string
}) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden">
        <tr><td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);padding:28px 32px;text-align:center">
          <p style="margin:0 0 4px;color:#bfdbfe;font-size:12px;font-weight:600;letter-spacing:0.08em">대치 플래너 뉴스레터</p>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">${params.subject}</h1>
        </td></tr>
        <tr><td style="padding:32px">
          <div style="color:#374151;font-size:15px;line-height:1.8;white-space:pre-wrap">${params.body}</div>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f3f4f6;text-align:center">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/briefings" style="display:inline-block;background:#2563eb;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:12px;text-decoration:none">브리핑 전체 보기</a>
          </div>
          ${params.unsubscribeUrl ? `<p style="margin:20px 0 0;color:#9ca3af;font-size:11px;text-align:center">수신을 원하지 않으시면 <a href="${params.unsubscribeUrl}" style="color:#9ca3af">수신거부</a>를 눌러주세요.</p>` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
