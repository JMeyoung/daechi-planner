import { Resend } from 'resend'

export function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'placeholder')
}

export const FROM = '대치 플래너 <noreply@daechi-planner.com>'
