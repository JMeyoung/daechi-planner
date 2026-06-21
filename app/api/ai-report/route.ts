import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'

const GRADE_LABEL: Record<number, string> = {
  1: '중학교 1학년', 2: '중학교 2학년', 3: '중학교 3학년',
  4: '고등학교 1학년', 5: '고등학교 2학년', 6: '고등학교 3학년',
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { childId } = await req.json()

    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 })
    }

    // 데이터 수집
    const [childRes, scheduleRes, examRes] = await Promise.all([
      supabase.from('child_profiles').select('*').eq('id', childId).single(),
      supabase.from('schedule_events').select('*').eq('child_id', childId),
      supabase.from('exam_scores').select('*').eq('child_id', childId).order('exam_date', { ascending: false }).limit(5)
    ])

    const child = childRes.data
    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 })
    }

    const schedules = scheduleRes.data ?? []
    const exams = examRes.data ?? []

    // 프롬프트 구성
    const scheduleContext = schedules.length > 0
      ? schedules.map(s => `- ${s.title} (${s.subject || '과목 미상'}): ${s.category === 'academy' ? '학원' : '개인 일정'}`).join('\n')
      : '등록된 일정이 없습니다.'

    const examContext = exams.length > 0
      ? exams.map(e => `- ${e.exam_name} (${e.subject}): ${e.score}점`).join('\n')
      : '최근 등록된 시험 성적이 없습니다.'

    const prompt = `
당신은 대치동 학원가에서 15년 이상 입시 로드맵을 설계해 온 전략 컨설턴트입니다. 아래 자녀의 데이터를 분석하여 학부모에게 장기적인 입시 관점의 피드백과 다음 학원 테크트리를 추천해 주세요.
응답은 신뢰감을 주는 전문적이고 체계적인 톤으로 마크다운 형식으로 작성해주세요.

## 자녀 정보
- 이름: ${child.name}
- 학년: ${GRADE_LABEL[child.grade] || '미상'}

## 현재 스케줄 (학원 및 일정)
${scheduleContext}

## 최근 성적 추이
${examContext}

## 요청 사항
1. **현재 위치 진단**: 현재 스케줄(수강 중인 과목)과 최근 성적을 종합하여, 대입 및 특목고 진학 관점에서 어느 과목의 선행이 부족하고 어느 과목이 안정권인지 진단하세요.
2. **단기/중장기 목표 설정**: 다음 시험(또는 방학)까지 반드시 달성해야 할 구체적인 목표 점수와 학습 테마를 설정해 주세요.
3. **대치동식 학원 테크트리 추천**: 목표 달성을 위해 대치동에서 일반적으로 밟는 학원 테크트리(예: 개념 완성반 -> 기출 심화반 -> 파이널 모의고사반 등) 중, 현재 학생이 진입해야 할 다음 단계의 학원 유형을 1~2개 구체적으로 추천해 주세요.
`

    // Gemini API 호출
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API 키가 서버에 설정되지 않았습니다.' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey })
    
    // streaming 옵션을 사용할 수도 있지만, 간결함을 위해 단일 응답(generateContent) 사용
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    })

    const reportText = response.text

    return NextResponse.json({ report: reportText })

  } catch (error: any) {
    console.error('AI Report Error:', error)
    return NextResponse.json({ error: '리포트 생성 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
