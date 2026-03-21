/**
 * CashFlow.jsx — Professional Statement of Cash Flows
 */
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { Activity, ChevronLeft, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const SECTIONS = [
  {
    id: 'operating',
    label: 'Operating Activities',
    emoji: '🏃',
    desc: 'Day-to-day income & expenses',
    accent: 'from-brand-500 to-emerald-500',
    border: 'border-brand-800/40',
    bg: 'bg-brand-900/20',
    textColor: 'text-brand-400',
  },
  {
    id: 'investing',
    label: 'Investing Activities',
    emoji: '📈',
    desc: 'Savings, investments & goals',
    accent: 'from-violet-500 to-purple-600',
    border: 'border-violet-800/40',
    bg: 'bg-violet-900/20',
    textColor: 'text-violet-400',
  },
  {
    id: 'financing',
    label: 'Financing Activities',
    emoji: '🏦',
    desc: 'Loans, debts & EMIs',
    accent: 'from-amber-500 to-orange-500',
    border: 'border-amber-800/40',
    bg: 'bg-amber-900/20',
    textColor: 'text-amber-400',
  },
]

function AmountRow({ label, amount, isInflow }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
      <span className="text-xs text-gray-400 flex items-center gap-1.5">
        {isInflow
          ? <TrendingUp size={10} className="text-emerald-400" />
          : <TrendingDown size={10} className="text-rose-400" />}
        {label}
      </span>
      <span className={`text-xs font-mono font-bold ${isInflow ? 'text-emerald-400' : 'text-rose-400'}`}>
        {isInflow ? '+' : '-'}₹{Math.abs(amount).toLocaleString('en-IN')}
      </span>
    </div>
  )
}

function SectionCard({ section, data, open, onToggle }) {
  const { label, emoji, desc, accent, border, bg, textColor } = section
  const net = (data?.inflow ?? 0) - (data?.outflow ?? 0)
  const isPositive = net >= 0

  return (
    <div className={`rounded-2xl border ${border} ${bg} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-4"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg shrink-0`}>
          <span className="text-lg">{emoji}</span>
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-white">{label}</p>
          <p className="text-[10px] text-gray-500">{desc}</p>
        </div>
        <div className="text-right shrink-0 mr-2">
          <p className={`text-sm font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : '-'}₹{Math.abs(net).toLocaleString('en-IN')}
          </p>
          <p className="text-[9px] text-gray-600">Net Flow</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-500 shrink-0" /> : <ChevronDown size={16} className="text-gray-500 shrink-0" />}
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 border-t border-white/8">
          <div className="pt-3 space-y-0.5">
            {data?.inflow > 0 && <AmountRow label="Total Inflow" amount={data.inflow} isInflow />}
            {data?.outflow > 0 && <AmountRow label="Total Outflow" amount={data.outflow} isInflow={false} />}
            {(data?.items ?? []).slice(0, 5).map((item, i) => (
              <AmountRow key={i} label={item.description} amount={item.amount} isInflow={item.type === 'credit'} />
            ))}
          </div>
          {/* Net summary row */}
          <div className={`mt-3 flex items-center justify-between px-3 py-2 rounded-xl ${isPositive ? 'bg-emerald-900/30 border border-emerald-800/40' : 'bg-rose-900/30 border border-rose-800/40'}`}>
            <span className="text-xs font-bold text-white">Net Cash</span>
            <span className={`text-sm font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '+' : '-'}₹{Math.abs(net).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CashFlow() {
  const { getCashFlowData, setActiveTab } = useApp()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [openSections, setOpenSections] = useState({ operating: true, investing: false, financing: false })

  const data = useMemo(() => getCashFlowData?.(month) ?? {}, [getCashFlowData, month])

  const toggle = (id) => setOpenSections(s => ({ ...s, [id]: !s[id] }))

  const netTotal = ((data.operating?.inflow ?? 0) - (data.operating?.outflow ?? 0))
    + ((data.investing?.inflow ?? 0) - (data.investing?.outflow ?? 0))
    + ((data.financing?.inflow ?? 0) - (data.financing?.outflow ?? 0))

  const chartData = SECTIONS.map(s => ({
    name: s.emoji,
    net: (data[s.id]?.inflow ?? 0) - (data[s.id]?.outflow ?? 0),
  }))

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('home')}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Activity size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-white">Cash Flow</h1>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 ml-10">Statement of cash flows</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
        />
      </div>

      {/* Mini chart */}
      {chartData.some(d => d.net !== 0) && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Cash Flow by Activity</p>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData} barSize={32}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 16 }} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [`₹${Math.abs(v).toLocaleString('en-IN')}`, v >= 0 ? 'Net Inflow' : 'Net Outflow']}
                contentStyle={{ fontSize: 11, borderRadius: 8, background: '#1f2937', border: 'none' }}
              />
              <Bar dataKey="net" radius={[6, 6, 0, 0]}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.net >= 0 ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sections */}
      {SECTIONS.map(s => (
        <SectionCard
          key={s.id}
          section={s}
          data={data[s.id]}
          open={openSections[s.id]}
          onToggle={() => toggle(s.id)}
        />
      ))}

      {/* Grand total */}
      <div className={`rounded-2xl p-4 flex items-center justify-between ${netTotal >= 0 ? 'bg-emerald-900/20 border border-emerald-800/40' : 'bg-rose-900/20 border border-rose-800/40'}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Net Cash Position</p>
          <p className="text-[10px] text-gray-600 mt-0.5">All activities combined</p>
        </div>
        <p className={`text-2xl font-black font-mono ${netTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {netTotal >= 0 ? '+' : '-'}₹{Math.abs(netTotal).toLocaleString('en-IN')}
        </p>
      </div>
    </div>
  )
}
