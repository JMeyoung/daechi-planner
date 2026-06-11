import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)
export const FROM = '대치 플래너 <noreply@daechi-planner.com>'
