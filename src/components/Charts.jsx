/**
 * Charts.jsx — Analytics with Liquid Glass containers
 * iOS 18 glass surfaces, custom dark tooltips, animated charts
 */
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from 'recharts'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

const COLORS = ['#4ade80','#f87171','#a78bfa','#fbbf24','#34d399','#f472b6','#86efac','#818cf8']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function weekStart(daysAgo = 0) {
  const d = new Date(); d.setDate(d.getDate() - daysAgo)
  const diff = (d.getDay() === 0 ? -6 : 1) - d.getDay()
  d.setDate(d.getDate() + diff); d.setHours(0,0,0,0); return d
}

/* Glass tooltip */
const GlassTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2.5 rounded-2xl text-xs"
      style={{ background: 'rgba(6,30,20,0.90)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 8px 24px rgba(0,0,0,0.40)' }}>
      <p className="font-bold mb-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono" style={{ color: p.color }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  )
}

export default function Charts() {
  const { transactions, setActiveTab, getPLStatement, getMLPredictions } = useApp()
  const currentMonth = new Date().toISOString().slice(0,7)
  const pl = getPLStatement(currentMonth)
  const predictions = getMLPredictions()

  const monthlyData = useMemo(() => {
    const map = {}
    transactions.forEach(tx => {
      if (!tx.date) return
      const [y, m] = tx.date.split('-')
      const key = `${y}-${m}`
      if (!map[key]) map[key] = { month: MONTHS[Number(m)-1], income: 0, expense: 0 }
      if (tx.type === 'credit') map[key].income += Number(tx.amount)
      else map[key].expense += Number(tx.amount)
    })
    return Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).slice(-6).map(([,v]) => v)
  }, [transactions])

  const weeklyData = useMemo(() => {
    const thisWS = weekStart(0), lastWS = weekStart(7)
    const lastWE = new Date(thisWS); lastWE.setDate(lastWE.getDate()-1)
    const thisW = Array(7).fill(0), lastW = Array(7).fill(0)
    transactions.filter(t => t.type === 'debit').forEach(tx => {
      const d = new Date(tx.date)
      if (d >= thisWS) thisW[(d.getDay()+6)%7] += Number(tx.amount)
      else if (d >= lastWS && d <= lastWE) lastW[(d.getDay()+6)%7] += Number(tx.amount)
    })
    return DAYS.map((day, i) => ({ day, thisWeek: thisW[i], lastWeek: lastW[i] }))
  }, [transactions])

  const catData = useMemo(() => {
    const map = {}
    transactions.filter(t => t.type === 'debit').forEach(tx => {
      map[tx.category] = (map[tx.category]||0) + Number(tx.amount)
    })
    return Object.entries(map).sort(([,a],[,b]) => b-a).map(([name, value]) => ({ name, value }))
  }, [transactions])

  const cashFlowData = useMemo(() => {
    const days = 30, today = new Date(), result = []
    let running = 0
    const txByDate = {}
    [...transactions].filter(t => t.date).sort((a,b) => a.date.localeCompare(b.date))
      .forEach(t => { if (!txByDate[t.date]) txByDate[t.date] = 0; txByDate[t.date] += t.type === 'credit' ? Number(t.amount) : -Number(t.amount) })
    for (let i = days-1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate()-i)
      const key = d.toISOString().split('T')[0]
      running += txByDate[key] || 0
      if (i % 3 === 0 || i === 0) result.push({ date: key.slice(5), balance: Math.round(running) })
    }
    return result
  }, [transactions])

  const dowData = useMemo(() => {
    const totals = Array(7).fill(0)
    transactions.filter(t => t.type === 'debit' && t.date).forEach(t => { totals[new Date(t.date).getDay()] += Number(t.amount) })
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, i) => ({ day, amount: Math.round(totals[i]) }))
  }, [transactions])

  const thisWeekTotal = weeklyData.reduce((s,d) => s+d.thisWeek, 0)
  const lastWeekTotal = weeklyData.reduce((s,d) => s+d.lastWeek, 0)
  const weekDiff = lastWeekTotal ? ((thisWeekTotal-lastWeekTotal)/lastWeekTotal*100).toFixed(0) : 0

  const axisStyle  = { fontSize:10, fill:'rgba(255,255,255,0.38)' }
  const gridStyle  = { stroke:'rgba(255,255,255,0.06)', strokeDasharray:'3 3' }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 8px 32px rgba(0,0,0,0.20)' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(74,222,128,0.80)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            <line x1="2" y1="20" x2="22" y2="20"/>
          </svg>
        </div>
        <p className="font-semibold text-lg" style={{ color:'rgba(255,255,255,0.70)' }}>No data yet</p>
        <p className="text-sm mt-1.5" style={{ color:'rgba(255,255,255,0.38)' }}>Add transactions to see charts!</p>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('settings')}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 lg-chip">
          <ArrowLeft size={18} style={{ color: 'rgba(255,255,255,0.70)' }} />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'rgba(255,255,255,0.95)' }}>Analytics 📊</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Income & expense analysis</p>
        </div>
      </div>

      {/* Weekly comparison */}
      <div className="lg-surface rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>📆 This Week vs Last Week</h3>
          <span className="text-xs font-bold px-2 py-1 rounded-xl"
            style={Number(weekDiff) > 0
              ? { background:'rgba(244,63,94,0.15)', color:'#f87171', border:'1px solid rgba(244,63,94,0.25)' }
              : { background:'rgba(34,197,94,0.15)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.25)' }}>
            {Number(weekDiff) > 0 ? '↑' : '↓'} {Math.abs(Number(weekDiff))}%
          </span>
        </div>
        <div className="flex gap-4 text-xs mb-3 relative z-10">
          <span style={{ color:'rgba(255,255,255,0.45)' }}>
            This week: <strong className="font-mono" style={{ color:'rgba(255,255,255,0.85)' }}>₹{thisWeekTotal.toLocaleString('en-IN')}</strong>
          </span>
          <span style={{ color:'rgba(255,255,255,0.45)' }}>
            Last week: <strong className="font-mono" style={{ color:'rgba(255,255,255,0.55)' }}>₹{lastWeekTotal.toLocaleString('en-IN')}</strong>
          </span>
        </div>
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={155}>
            <BarChart data={weeklyData} barSize={12} barGap={2}>
              <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="thisWeek" name="This Week" fill="#4ade80" radius={[5,5,0,0]} />
              <Bar dataKey="lastWeek" name="Last Week" fill="rgba(255,255,255,0.20)" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-1">
            <span className="flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.45)' }}><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:'#4ade80' }} />This Week</span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.45)' }}><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background:'rgba(255,255,255,0.25)' }} />Last Week</span>
          </div>
        </div>
      </div>

      {/* Monthly overview */}
      {monthlyData.length > 0 && (
        <div className="lg-surface rounded-3xl p-4">
          <h3 className="font-semibold text-sm mb-4 relative z-10" style={{ color:'rgba(255,255,255,0.90)' }}>📅 Monthly Overview</h3>
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={18} barGap={4}>
                <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="income"  name="Income"  fill="#4ade80" radius={[6,6,0,0]} />
                <Bar dataKey="expense" name="Expense" fill="#f87171" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2">
              <span className="flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.45)' }}><span className="w-3 h-3 rounded-full inline-block" style={{ background:'#4ade80' }} />Income</span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color:'rgba(255,255,255,0.45)' }}><span className="w-3 h-3 rounded-full inline-block" style={{ background:'#f87171' }} />Expense</span>
            </div>
          </div>
        </div>
      )}

      {/* Cash Flow */}
      {cashFlowData.length > 2 && (
        <div className="lg-surface rounded-3xl p-4">
          <h3 className="font-semibold text-sm mb-4 relative z-10" style={{ color:'rgba(255,255,255,0.90)' }}>📈 Cash Flow (30 Days)</h3>
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={cashFlowData}>
                <defs>
                  <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.30} />
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0.00} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="balance" name="Balance" stroke="#4ade80" fill="url(#cfGrad)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Spending by day */}
      <div className="lg-surface rounded-3xl p-4">
        <h3 className="font-semibold text-sm mb-4 relative z-10" style={{ color:'rgba(255,255,255,0.90)' }}>🗓️ Spending by Day</h3>
        <div className="relative z-10">
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={dowData} barSize={20}>
              <XAxis dataKey="day" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="amount" name="Spent" radius={[6,6,0,0]}>
                {dowData.map((entry, i) => (
                  <Cell key={i} fill={entry.day === ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()] ? '#a78bfa' : '#4ade80'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-center mt-1" style={{ color:'rgba(255,255,255,0.30)' }}>Purple bar = today's day of week</p>
        </div>
      </div>

      {/* Category pie */}
      {catData.length > 0 && (
        <div className="lg-surface rounded-3xl p-4">
          <h3 className="font-semibold text-sm mb-4 relative z-10" style={{ color:'rgba(255,255,255,0.90)' }}>🏷️ Expense by Category</h3>
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i%COLORS.length]} stroke="transparent" />)}
                </Pie>
                <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, '']}
                  contentStyle={{ background:'rgba(6,30,20,0.90)', backdropFilter:'blur(24px)', border:'1px solid rgba(255,255,255,0.16)', borderRadius:12, fontSize:11, color:'rgba(255,255,255,0.85)' }} />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11, color:'rgba(255,255,255,0.60)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label:'Avg Daily Spend', value:`₹${transactions.length ? Math.round(transactions.filter(t=>t.type==='debit').reduce((s,t)=>s+Number(t.amount),0)/Math.max(1,new Set(transactions.filter(t=>t.type==='debit').map(t=>t.date)).size)) : 0}` },
          { label:'Biggest Expense', value:`₹${transactions.filter(t=>t.type==='debit').reduce((m,t)=>Math.max(m,Number(t.amount)),0).toLocaleString('en-IN')}` },
          { label:'Total Transactions', value:transactions.length },
          { label:'Categories Used', value:new Set(transactions.map(t=>t.category)).size },
        ].map(({ label, value }) => (
          <div key={label} className="lg-surface rounded-2xl p-3 text-center">
            <p className="text-xs mb-1 relative z-10" style={{ color:'rgba(255,255,255,0.40)' }}>{label}</p>
            <p className="font-display font-bold relative z-10" style={{ color:'rgba(255,255,255,0.90)' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* P&L Statement */}
      <div className="lg-surface rounded-3xl p-4">
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg"
            style={{ boxShadow:'0 4px 12px rgba(99,102,241,0.45)' }}>
            <span className="text-sm">📋</span>
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color:'rgba(255,255,255,0.90)' }}>P&amp;L Statement</h3>
            <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color:'rgba(255,255,255,0.38)' }}>{currentMonth}</p>
          </div>
        </div>
        <div className="space-y-1 relative z-10">
          {[
            { label:'📥 Total Income',  value:`+₹${pl.income.toLocaleString('en-IN')}`,   color:'#4ade80' },
            { label:'📤 Total Expenses', value:`-₹${pl.expense.toLocaleString('en-IN')}`, color:'#f87171' },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-2.5" style={{ borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
              <span className="text-xs" style={{ color:'rgba(255,255,255,0.50)' }}>{label}</span>
              <span className="font-mono font-bold text-sm" style={{ color }}>{value}</span>
            </div>
          ))}
          {Object.entries(pl.catBreakdown).sort(([,a],[,b])=>b-a).map(([cat, amt]) => (
            <div key={cat} className="flex justify-between items-center py-1.5 pl-6">
              <span className="text-[11px]" style={{ color:'rgba(255,255,255,0.35)' }}>{cat}</span>
              <span className="font-mono text-[11px]" style={{ color:'#f87171aa' }}>₹{amt.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-2.5" style={{ borderTop:'2px solid rgba(255,255,255,0.12)', marginTop:4 }}>
            <span className="text-xs font-bold" style={{ color:'rgba(255,255,255,0.80)' }}>💰 Net Savings</span>
            <span className="font-mono font-bold text-sm" style={{ color: pl.grossSavings >= 0 ? '#4ade80' : '#f87171' }}>
              {pl.grossSavings >= 0 ? '+' : ''}₹{pl.grossSavings.toLocaleString('en-IN')}
            </span>
          </div>
          {/* Savings rate bar */}
          <div className="pt-1 pb-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs" style={{ color:'rgba(255,255,255,0.40)' }}>📊 Savings Rate</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-lg"
                style={pl.savingsRate >= 20
                  ? { background:'rgba(34,197,94,0.15)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.25)' }
                  : pl.savingsRate >= 0
                  ? { background:'rgba(251,191,36,0.15)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.25)' }
                  : { background:'rgba(244,63,94,0.15)', color:'#f87171', border:'1px solid rgba(244,63,94,0.25)' }}>
                {pl.savingsRate}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width:`${Math.min(Math.max(pl.savingsRate,0),100)}%`,
                  background: pl.savingsRate >= 20 ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                    : pl.savingsRate >= 0 ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(90deg, #f87171, #ef4444)',
                }} />
            </div>
            <p className="text-[9px] mt-1.5" style={{ color:'rgba(255,255,255,0.35)' }}>
              {pl.savingsRate >= 20 ? "🎉 Great! You're saving well this month."
               : pl.savingsRate >= 0 ? '💡 Tip: Try to save at least 20% of your income.'
               : '⚠️ Spending exceeds income this month.'}
            </p>
          </div>
        </div>
      </div>

      {/* ML Predictions */}
      {predictions.length > 0 && (
        <div className="lg-surface rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-1 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
              style={{ boxShadow:'0 4px 12px rgba(139,92,246,0.45)' }}>
              <span className="text-sm">🤖</span>
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color:'rgba(255,255,255,0.90)' }}>ML Spending Prediction</h3>
              <p className="text-[9px] uppercase tracking-widest font-semibold" style={{ color:'rgba(255,255,255,0.38)' }}>Next Month Forecast</p>
            </div>
          </div>
          <p className="text-[10px] mb-1 mt-2 relative z-10" style={{ color:'rgba(255,255,255,0.40)' }}>
            Highest predicted: <strong style={{ color:'#a78bfa' }}>{predictions.sort((a,b)=>b.predicted-a.predicted)[0]?.category}</strong>
          </p>
          <p className="text-[10px] mb-4 relative z-10" style={{ color:'rgba(255,255,255,0.40)' }}>
            Total: <strong style={{ color:'#a78bfa' }}>₹{predictions.reduce((s,p)=>s+p.predicted,0).toLocaleString('en-IN')}</strong>
          </p>
          <div className="relative z-10">
            <ResponsiveContainer width="100%" height={Math.max(180, predictions.length*35)}>
              <BarChart data={predictions} layout="vertical" barSize={10} barGap={2} margin={{ left:10, right:30 }}>
                <XAxis type="number" tick={axisStyle} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <YAxis type="category" dataKey="category" tick={axisStyle} width={75} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="lastMonth" name="Last Month" fill="rgba(255,255,255,0.20)" radius={[0,4,4,0]} />
                <Bar dataKey="predicted"  name="Predicted"  fill="#a78bfa"                 radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
