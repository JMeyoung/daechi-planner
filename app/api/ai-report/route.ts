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
당신은 대치동 최고의 교육 컨설턴트입니다. 아래 자녀의 데이터를 분석하여 학부모에게 맞춤형 학습 피드백과 대치동 학원 유형을 추천해 주세요.
응답은 친절하고 전문적인 톤으로 마크다운 형식으로 작성해주세요.

## 자녀 정보
- 이름: ${child.name}
- 학년: ${GRADE_LABEL[child.grade] || '미상'}

## 현재 스케줄 (학원 및 일정)
${scheduleContext}

## 최근 성적 추이
${examContext}

## 요청 사항
1. **현재 학습량 분석**: 현재 스케줄과 성적을 기반으로 학습량이 적절한지, 어떤 과목에 비중이 치우쳐 있는지 분석해 주세요.
2. **강점 및 보완점**: 스케줄과 성적을 보고 잘하고 있는 점과 보완이 필요한 점을 짚어주세요.
3. **추천 학원 유형 (대치동 기준)**: 이 학생에게 지금 시점에서 필요한 대치동 학원 유형(예: 수학 심화, 국어 독해 클리닉, 내신 대비반 등)을 1~2개 추천해 주세요.
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
