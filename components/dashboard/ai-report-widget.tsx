'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import type { ChildProfile } from '@/types'

export default function AiReportWidget({ childrenProfiles }: { childrenProfiles: ChildProfile[] }) {
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenProfiles[0]?.id || '')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  async function generateReport() {
    if (!selectedChildId) return

    setLoading(true)
    setError(null)
    setReport(null)
    setIsOpen(true)

    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: selectedChildId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '리포트 생성 중 오류가 발생했습니다.')
      }

      setReport(data.report)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (childrenProfiles.length === 0) {
    return (
      <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-5 text-white animate-fade-up border border-navy-700 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">✨</span>
            <h2 className="font-bold text-lg text-white">AI 학습 분석 리포트</h2>
          </div>
          <p className="text-sm text-navy-200 mb-4">
            자녀를 등록하시면, 대치동 교육 컨설턴트 AI가 스케줄과 성적을 분석하여 맞춤형 학원을 추천해 드립니다.
          </p>
          <a
            href="/settings"
            className="inline-block bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-2.5 px-4 rounded-xl transition-colors text-sm"
          >
            자녀 등록하러 가기 →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-5 text-white animate-fade-up border border-navy-700 shadow-xl relative overflow-hidden">
      {/* 장식용 배경 */}
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">✨</span>
          <h2 className="font-bold text-lg text-white">AI 학습 분석 리포트</h2>
        </div>
        <p className="text-sm text-navy-200 mb-4">
          대치동 교육 컨설턴트 AI가 자녀의 스케줄과 최근 성적을 분석하여 맞춤형 학원을 추천해 드립니다.
        </p>

        <div className="flex gap-2">
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="bg-navy-950 border border-navy-700 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold-500 flex-1"
          >
            {childrenProfiles.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.grade}학년)</option>
            ))}
          </select>
          <button
            onClick={generateReport}
            className="bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-2.5 px-4 rounded-xl transition-colors shrink-0 text-sm"
          >
            리포트 받기
          </button>
        </div>
      </div>

      {/* 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-navy-900 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-navy-800">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-navy-800">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <span>✨</span> 맞춤형 교육 컨설팅 리포트
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 text-navy-800 dark:text-gold-400">
                  <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium animate-pulse">AI가 자녀의 데이터를 분석하고 있습니다...</p>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}

              {report && (
                <div className="prose dark:prose-invert prose-sm max-w-none 
                                prose-headings:text-navy-800 dark:prose-headings:text-gold-400
                                prose-strong:text-gold-600 dark:prose-strong:text-gold-300">
                  <ReactMarkdown>{report}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
