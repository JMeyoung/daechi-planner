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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div style={{ color: '#d4a853', fontSize: 52, fontWeight: 800, lineHeight: 1 }}>
          대치
        </div>
        <div style={{ color: 'rgba(212,168,83,0.8)', fontSize: 20, fontWeight: 600, marginTop: 8, letterSpacing: '0.04em' }}>
          플래너
        </div>
      </div>
    ),
    { ...size },
  )
}
