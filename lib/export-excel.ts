import * as XLSX from 'xlsx'
import type { AcademyFee, ChildProfile } from '@/types'

export function exportFeesToExcel(fees: AcademyFee[], children: ChildProfile[], filename: string) {
  const childById = new Map(children.map(c => [c.id, c]))
  
  // Sheet 1: 요약표 (Summary)
  const summaryData = fees.map(f => {
    const childName = f.child_id ? childById.get(f.child_id)?.name || '알 수 없음' : '공통/미배정'
    return {
      '자녀명': childName,
      '학원명': f.name,
      '월 수강료 (원)': f.amount,
      '연 예상비용 (원)': f.amount * 12,
      '납부일': f.payment_day ? `매월 ${f.payment_day}일` : '미지정',
      '상태': f.is_active ? '수강 중' : '휴원/종료',
      '메모': f.memo || '',
    }
  })

  // 정렬: 자녀 이름 -> 학원명
  summaryData.sort((a, b) => {
    if (a.자녀명 === b.자녀명) return a.학원명.localeCompare(b.학원명)
    return a.자녀명.localeCompare(b.자녀명)
  })

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)

  // Sheet 2: 월별 추이 템플릿 (1~12월)
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`)
  const monthlyData = fees.map(f => {
    const row: any = {
      '자녀명': f.child_id ? childById.get(f.child_id)?.name || '알 수 없음' : '공통/미배정',
      '학원명': f.name,
    }
    // 기본적으로 모두 활성화된 금액으로 채움 (추후 사용자가 엑셀에서 수정 용이)
    months.forEach(m => {
      row[m] = f.is_active ? f.amount : 0
    })
    row['연간 총액'] = f.is_active ? f.amount * 12 : 0
    return row
  })

  const monthlySheet = XLSX.utils.json_to_sheet(monthlyData)

  // 워크북 생성
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, summarySheet, '학원비 요약')
  XLSX.utils.book_append_sheet(wb, monthlySheet, '월별 추이 (템플릿)')

  // 엑셀 파일 다운로드
  XLSX.writeFile(wb, filename)
}
