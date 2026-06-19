'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from 'recharts'

type ChartDatum = { name: string; 금액: number }
type PieDatum = { name: string; value: number; color: string }

type Props = {
  monthlyChartData: ChartDatum[]
  yearlyChartData: ChartDatum[]
  pieData: PieDatum[]
  chartView: 'monthly' | 'yearly'
  setChartView: (v: 'monthly' | 'yearly') => void
}

function formatAmount(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

export default function FeesCharts({ monthlyChartData, yearlyChartData, pieData, chartView, setChartView }: Props) {
  return (
    <div className="bg-white rounded-xl border border-surface-border p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-900">지출 현황</p>
        <div className="flex gap-1">
          {(['monthly', 'yearly'] as const).map(v => (
            <button key={v} onClick={() => setChartView(v)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${chartView === v ? 'bg-navy-800 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
              {v === 'monthly' ? '월별' : '연간'}
            </button>
          ))}
        </div>
      </div>

      {chartView === 'monthly' ? (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `${(v/10000).toFixed(0)}만`} />
              <Tooltip formatter={(v) => formatAmount(Number(v))} />
              <Bar dataKey="금액" radius={[4,4,0,0]}>
                {monthlyChartData.map((_, i) => (
                  <Cell key={i} fill={i === new Date().getMonth() ? '#1e293b' : '#e2e8f0'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* 자녀별 파이 */}
          {pieData.length > 1 && (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={yearlyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `${(v/10000).toFixed(0)}만`} />
            <Tooltip formatter={(v) => formatAmount(Number(v))} />
            <Bar dataKey="금액" fill="#1e293b" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
