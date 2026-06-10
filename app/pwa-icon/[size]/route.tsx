import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: sizeStr } = await params
  const size = parseInt(sizeStr, 10) || 192
  const r = size * 0.18   // border-radius
  const fontSize = size * 0.28

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          borderRadius: r,
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          대치
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: fontSize * 0.38,
            fontWeight: 600,
            marginTop: size * 0.04,
            letterSpacing: '0.04em',
          }}
        >
          플래너
        </div>
      </div>
    ),
    { width: size, height: size },
  )
}
