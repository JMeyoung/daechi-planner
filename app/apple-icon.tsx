import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        }}
      >
        <div style={{ color: 'white', fontSize: 52, fontWeight: 800, lineHeight: 1 }}>
          대치
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: 600, marginTop: 8, letterSpacing: '0.04em' }}>
          플래너
        </div>
      </div>
    ),
    { ...size },
  )
}
