/**
 * Dashboard.jsx — Premium dark dashboard
 * Clean card system, bold typography, CRED-inspired calm UX
 * All business logic preserved from original
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Wallet, ChevronRight, RefreshCw, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Zap, ArrowDown, ArrowUp, Brain, X, Lightbulb, Flame, Scale, Target, BarChart3, MessageCircle, BookOpen, Activity, Eye, EyeOff, Check } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useApp } from '../context/AppContext'
import { predictSpending, getDailyBudgetInfo } from '../utils/spendingPredictor'
import { CATEGORY_EMOJI } from '../constants'

/* ═══════ Counter animation hook ═══════ */
function useCountUp(target, duration = 750) {
  const [display, setDisplay] = useState(target)
  const prevRef = useRef(target)
  const rafRef  = useRef(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const start = prevRef.current
    const end   = target
    if (start === end) return
    const startTime = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + (end - start) * ease))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
      else { setDisplay(end); prevRef.current = end }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return display
}

/* ═══════ Dashboard Skeleton ═══════ */
function DashboardSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="skeleton h-44 rounded-[20px]" />
      <div className="grid grid-cols-3 gap-3">
        {[0,1,2].map(i => <div key={i} className="skeleton h-[72px] rounded-2xl" />)}
      </div>
      <div className="skeleton h-8 rounded-xl" />
      <div className="skeleton h-52 rounded-2xl" />
    </div>
  )
}

// CATEGORY_EMOJI imported from constants

/* ═══════ AI Spending Prediction Card ═══════ */
function PredictionCard() {
  const { transactions, budgets, darkMode } = useApp()
  const prediction = useMemo(() => predictSpending(transactions), [transactions])
  const dailyInfo  = useMemo(() => getDailyBudgetInfo(budgets, transactions), [budgets, transactions])
  const [expanded, setExpanded] = useState(false)

  if (!prediction.hasEnoughData) return null

  const trendColor = prediction.monthlyTrend === 'up' ? '#FF6B6B' : prediction.monthlyTrend === 'down' ? '#34D399' : '#4F8EF7'
  const trendIcon  = prediction.monthlyTrend === 'up' ? '📈' : prediction.monthlyTrend === 'down' ? '📉' : '➡️'

  return (
    <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(79,142,247,0.15)' }}>
          <Brain size={14} className="text-[#4F8EF7]" />
        </div>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">AI Prediction</h3>
        <span className="ml-auto text-xs font-semibold" style={{ color: trendColor }}>
          {trendIcon} {prediction.monthlyTrend}
        </span>
      </div>

      {/* Predicted amount */}
      <div className="bg-gray-100 dark:bg-[#222226] rounded-xl p-4 mb-4">
        <p className="text-[10px] uppercase font-semibold tracking-wider mb-1 text-gray-400 dark:text-white/35">
          Next Month Predicted Spend
        </p>
        <p className="font-display font-bold text-2xl text-[#4F8EF7]">
          ₹{prediction.totalPredicted.toLocaleString('en-IN')}
        </p>
        {dailyInfo.totalBudget > 0 && (
          <p className="text-[11px] mt-1.5 text-gray-400 dark:text-white/40">
            Daily budget remaining:{' '}
            <span className="font-bold" style={{ color: dailyInfo.isOverBudget ? '#FF6B6B' : '#34D399' }}>
              {dailyInfo.isOverBudget ? 'Over budget! 🚨' : `₹${dailyInfo.dailyBudget.toLocaleString('en-IN')}/day`}
            </span>
            <span className="text-gray-300 dark:text-white/25"> · {dailyInfo.daysRemaining} days left</span>
          </p>
        )}
      </div>

      {/* Insights */}
      {prediction.insights.length > 0 && (
        <div className="space-y-2 mb-4">
          {prediction.insights.slice(0, 2).map((insight, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] font-medium px-3 py-2 rounded-xl"
              style={{
                background: insight.type === 'warning' ? 'rgba(251,191,36,0.10)'
                  : insight.type === 'success' ? 'rgba(52,211,153,0.10)'
                  : 'rgba(79,142,247,0.10)',
                border: '1px solid ' + (insight.type === 'warning' ? 'rgba(251,191,36,0.20)'
                  : insight.type === 'success' ? 'rgba(52,211,153,0.20)'
                  : 'rgba(79,142,247,0.20)'),
                color: insight.type === 'warning' ? '#FBBF24'
                  : insight.type === 'success' ? '#34D399'
                  : '#4F8EF7',
              }}>
              {insight.text}
            </div>
          ))}
        </div>
      )}

      {/* Category details toggle */}
      <button onClick={() => setExpanded(p => !p)}
        className="text-[11px] font-semibold text-[#4F8EF7]">
        {expanded ? 'Hide details ▲' : `Top ${Math.min(prediction.categoryPredictions.length, 5)} categories ▼`}
      </button>
      {expanded && (
        <div className="mt-3 space-y-2.5 animate-fade-in">
          {prediction.categoryPredictions.slice(0, 5).map(cat => (
            <div key={cat.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">{CATEGORY_EMOJI[cat.category] || '💡'}</span>
                <span className="text-xs font-medium text-gray-600 dark:text-white/60">{cat.category}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={{
                    background: cat.trend === 'up' ? 'rgba(255,107,107,0.12)' : cat.trend === 'down' ? 'rgba(52,211,153,0.12)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                    color: cat.trend === 'up' ? '#FF6B6B' : cat.trend === 'down' ? '#34D399' : (darkMode ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.50)'),
                  }}>
                  {cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-white/70">
                ₹{cat.predicted.toLocaleString('en-IN')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════ Streak Hook ═══════ */
function useStreak() {
  const { transactions } = useApp()
  return useMemo(() => {
    if (!transactions.length) return 0
    const dates = [...new Set(transactions.map(t => t.date))].sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (dates[0] !== today && dates[0] !== yesterday) return 0
    let count = 1
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i-1])
      const curr = new Date(dates[i])
      if ((prev - curr) / 86400000 === 1) count++
      else break
    }
    return count
  }, [transactions])
}

/* ═══════ Balance Sheet Widget ═══════ */
function BalanceSheetWidget() {
  const { accounts, debts, openingBalance, getTrueBalance, setActiveTab } = useApp()
  const totalLiabilities = debts.filter(d => !d.repaid).reduce((s, d) => s + Number(d.amount), 0)
  const netWorth = getTrueBalance() - totalLiabilities
  const isPositive = netWorth >= 0

  return (
    <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(79,142,247,0.15)' }}>
          <Scale size={14} className="text-[#4F8EF7]" />
        </div>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">Balance Sheet</h3>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{
            background: isPositive ? 'rgba(52,211,153,0.12)' : 'rgba(255,107,107,0.12)',
            color: isPositive ? '#34D399' : '#FF6B6B',
          }}>
          {isPositive ? '▲ Positive' : '▼ Negative'}
        </span>
      </div>

      {/* Balance grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { label: 'Assets',      value: getTrueBalance(), color: '#4F8EF7', bg: 'rgba(79,142,247,0.10)' },
          { label: 'Liabilities', value: totalLiabilities, color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)' },
          { label: 'Net Worth',   value: Math.abs(netWorth), color: isPositive ? '#34D399' : '#FF6B6B', bg: isPositive ? 'rgba(52,211,153,0.10)' : 'rgba(255,107,107,0.10)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="text-center p-3 rounded-xl" style={{ background: bg }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5 text-gray-400 dark:text-white/35">{label}</p>
            <p className="font-display font-bold text-sm" style={{ color }}>₹{value.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('ledger')}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>
          <BookOpen size={11} /> View Ledger
        </button>
        <button onClick={() => setActiveTab('cashflow')}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2.5 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(52,211,153,0.10)', color: '#34D399' }}>
          <Activity size={11} /> Cash Flow
        </button>
      </div>
    </div>
  )
}

/* ═══════ Net Worth Timeline ═══════ */
function NetWorthTimeline() {
  const { getNetWorthHistory, darkMode } = useApp()
  const rawData = getNetWorthHistory()
  const isMock = rawData.length < 2
  
  const data = isMock ? [
    { month: '2026-01', netWorth: 12000 },
    { month: '2026-02', netWorth: 18000 },
    { month: '2026-03', netWorth: 15500 },
    { month: '2026-04', netWorth: 24000 },
    { month: '2026-05', netWorth: 29000 },
    { month: '2026-06', netWorth: 35000 },
  ] : rawData

  const latest  = data[data.length - 1]?.netWorth || 0
  const first   = data[0]?.netWorth || 0
  const growth  = latest - first
  const growing = growth >= 0

  return (
    <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(79,142,247,0.15)' }}>
          <TrendingUp size={14} className="text-[#4F8EF7]" />
        </div>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">
          Net Worth Timeline {isMock && <span className="ml-1 text-[8px] font-mono tracking-widest uppercase bg-indigo-500/20 text-[#4F8EF7] px-1.5 py-0.5 rounded-md">Preview</span>}
        </h3>
        <span className="ml-auto text-xs font-bold" style={{ color: growing ? '#34D399' : '#FF6B6B' }}>
          {growing ? '+' : '-'}₹{Math.abs(growth).toLocaleString('en-IN')}
        </span>
      </div>
      <p className="text-[10px] mb-3 text-gray-400 dark:text-white/30">
        {isMock ? '✨ Accumulate transaction history over 2 months to unlock actual growth chart' : 'Wealth growth over time'}
      </p>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={110}>
        <LineChart data={data} margin={{ top:4, right:4, left:-28, bottom:0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"} />
          <XAxis dataKey="month" tick={{ fontSize: 9, fill: darkMode ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.45)' }} tickFormatter={m => m?.slice(5)} />
          <YAxis tick={{ fontSize: 9, fill: darkMode ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.45)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              background: darkMode ? 'var(--mf-surface-2)' : '#ffffff',
              border: `1px solid ${darkMode ? 'var(--mf-border)' : 'rgba(0,0,0,0.08)'}`,
              borderRadius: 12,
              fontSize: 11,
              color: darkMode ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.90)',
              boxShadow: darkMode ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'
            }}
            formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Net Worth']}
          />
          <Line type="monotone" dataKey="netWorth" stroke={growing ? '#34D399' : '#FF6B6B'}
            strokeWidth={2} dot={{ r: 3, fill: growing ? '#34D399' : '#FF6B6B', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: growing ? '#34D399' : '#FF6B6B' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── Smart Financial Tip Widget ── */
export function TipWidget() {
  const [tipIdx, setTipIdx] = useState(0)
  const tips = [
    {
      title: "The 50/30/20 Rule",
      desc: "Allocate 50% of your income to Needs, 30% to Wants, and 20% to Savings or paying off debt."
    },
    {
      title: "24-Hour Purchase Rule",
      desc: "Wait 24 hours before buying non-essential items to see if you still want them. Eliminates impulse spend."
    },
    {
      title: "Audit Subscriptions",
      desc: "Look over your recurring card bills monthly. Cancel services you haven't opened in 30 days."
    },
    {
      title: "Wealth Preservation",
      desc: "Standard savings accounts lose value to inflation. Invest your idle capital to grow your true net worth."
    },
    {
      title: "Streak for Discipline",
      desc: "Open MoneyFlow daily to review expenses. Developing a financial habit is key to passive accumulation."
    }
  ]

  const nextTip = () => setTipIdx(i => (i + 1) % tips.length)
  const tip = tips[tipIdx]

  return (
    <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 animate-fade-in relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-35%', right: '-15%',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }} />
      </div>

      <div className="flex items-center gap-2.5 mb-3 relative z-10">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-amber-400/10 text-amber-400">
          <Lightbulb size={14} />
        </div>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">Smart Financial Tip</h3>
        <button onClick={nextTip}
          className="ml-auto text-[10px] font-bold px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.10] text-[#4F8EF7] flex items-center gap-0.5 active:scale-95 transition-all">
          Next Tip <ChevronRight size={10} />
        </button>
      </div>

      <div className="relative z-10 min-h-[50px] flex flex-col justify-center">
        <p className="text-xs font-bold text-gray-900 dark:text-white/90 mb-1">{tip.title}</p>
        <p className="text-[11px] leading-relaxed text-gray-500 dark:text-white/50">{tip.desc}</p>
      </div>
    </div>
  )
}

/* ═══════ Today's Snapshot Widget ═══════ */
export function TodayWidget() {
  const { transactions, budgets, darkMode } = useApp()
  const today     = new Date().toISOString().split('T')[0]
  const todayTx   = transactions.filter(t => t.date === today)
  const todaySpent  = todayTx.filter(t => t.type === 'debit').reduce((s,t) => s + Number(t.amount), 0)
  const todayEarned = todayTx.filter(t => t.type === 'credit').reduce((s,t) => s + Number(t.amount), 0)

  const month   = new Date().toISOString().slice(0, 7)
  const monthlySpent = transactions.filter(t => t.type === 'debit' && t.date?.startsWith(month)).reduce((s,t) => s + Number(t.amount), 0)
  const totalBudget  = Object.values(budgets).reduce((s, v) => s + Number(v), 0)

  if (todayTx.length === 0 && totalBudget === 0) return <TipWidget />

  const budgetPct = totalBudget > 0 ? Math.min((monthlySpent / totalBudget) * 100, 100) : 0
  const budgetColor = budgetPct > 90 ? '#FF6B6B' : budgetPct > 70 ? '#FBBF24' : '#34D399'

  return (
    <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(251,191,36,0.12)' }}>
          <Zap size={14} className="text-[#FBBF24]" />
        </div>
        <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">Today's Snapshot</h3>
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-lg"
          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: darkMode ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.50)' }}>
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: 'Spent',  icon: ArrowUp,   value: `₹${todaySpent.toLocaleString('en-IN')}`,  color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)' },
          { label: 'Earned', icon: ArrowDown, value: `₹${todayEarned.toLocaleString('en-IN')}`, color: '#34D399', bg: 'rgba(52,211,153,0.10)' },
          { label: 'Txns',   icon: null,      value: String(todayTx.length),                     color: '#4F8EF7', bg: 'rgba(79,142,247,0.10)' },
        ].map(({ label, icon: Icon, value, color, bg }) => (
          <div key={label} className="rounded-xl p-3 text-center" style={{ background: bg }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              {Icon && <Icon size={10} style={{ color }} />}
              <span className="text-[10px] font-semibold uppercase" style={{ color: color + 'aa' }}>{label}</span>
            </div>
            <p className="font-mono font-bold text-sm" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Budget progress bar */}
      {totalBudget > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}` }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-medium text-gray-400 dark:text-white/40">Monthly Budget Used</span>
            <span className="text-[11px] font-mono font-semibold text-gray-600 dark:text-white/60">
              ₹{monthlySpent.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${budgetPct}%`, background: budgetColor, boxShadow: `0 0 6px ${budgetColor}44` }} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════ Transaction Row ═══════ */
export function TransactionRow({ tx, compact = false, onEdit, onDelete, onToggleNeedWant }) {
  const isCredit = tx.type === 'credit'
  const rowRef   = useRef(null)
  const startX   = useRef(0)
  const currentX = useRef(0)
  const swiping  = useRef(false)
  const [offset, setOffset]         = useState(0)
  const [showActions, setShowActions] = useState(false)

  const handleTouchStart = useCallback((e) => {
    if (compact) return
    startX.current = e.touches[0].clientX
    currentX.current = 0
    swiping.current = true
  }, [compact])

  const handleTouchMove = useCallback((e) => {
    if (!swiping.current || compact) return
    const diff = e.touches[0].clientX - startX.current
    if (diff < 0) {
      const clamped = Math.max(diff, -120)
      currentX.current = clamped
      setOffset(clamped)
    } else if (showActions) {
      const clamped = Math.min(diff, 120)
      currentX.current = clamped - 120
      setOffset(Math.min(clamped - 120, 0))
    }
  }, [compact, showActions])

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current || compact) return
    swiping.current = false
    if (currentX.current < -50) { setOffset(-110); setShowActions(true) }
    else { setOffset(0); setShowActions(false) }
  }, [compact])

  const closeSwipe = () => { setOffset(0); setShowActions(false) }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action buttons */}
      {!compact && (
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2">
          <button onClick={() => { closeSwipe(); onEdit?.(tx) }}
            className="w-11 h-11 rounded-xl text-white flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
            style={{ background: '#34D399' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            <span className="text-[8px] font-semibold">Edit</span>
          </button>
          <button onClick={() => { closeSwipe(); onDelete?.(tx.id) }}
            className="w-11 h-11 rounded-xl text-white flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
            style={{ background: '#FF6B6B' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            <span className="text-[8px] font-semibold">Delete</span>
          </button>
        </div>
      )}

      {/* Transaction content */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: `translateX(${offset}px)`, 
          transition: swiping.current ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
          ...(!compact ? { background: 'var(--mf-surface-2)', border: '1px solid var(--mf-border)' } : {})
        }}
        className={`relative z-10 flex items-center gap-3 ${!compact
          ? 'p-4 rounded-2xl'
          : 'py-3 px-1 rounded-xl'}`}
      >
        {/* Category icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: isCredit ? 'rgba(52,211,153,0.12)' : 'rgba(255,107,107,0.12)' }}>
          {CATEGORY_EMOJI[tx.category] || (isCredit ? '💰' : '💸')}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate text-gray-800 dark:text-white/90">{tx.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-gray-400 dark:text-white/30">{tx.date}</span>
            <span className="text-gray-300 dark:text-white/15">·</span>
            <span className="text-[11px] text-gray-400 dark:text-white/30">{tx.category}</span>
            {tx.type === 'debit' && (
              <>
                <span className="text-gray-300 dark:text-white/15">·</span>
                <button onClick={() => onToggleNeedWant?.(tx.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded-lg font-semibold transition-colors"
                  style={{
                    background: tx.isWant ? 'rgba(79,142,247,0.12)' : 'rgba(52,211,153,0.12)',
                    color: tx.isWant ? '#4F8EF7' : '#34D399',
                  }}>
                  {tx.isWant ? '✨ Want' : '✅ Need'}
                </button>
              </>
            )}
          </div>
          {tx.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tx.tags.map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: 'rgba(79,142,247,0.12)', color: '#4F8EF7' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono font-bold text-sm" style={{ color: isCredit ? '#34D399' : '#FF6B6B' }}>
            {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
          </span>
          {!compact && !showActions && (
            <span className="text-[9px] text-gray-300 dark:text-white/20">← swipe</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════ MAIN DASHBOARD ═══════════════ */
export default function Dashboard({ onAddWithType }) {
  const { getSummary, transactions, accounts = {}, budgets = {}, savingsGoal, setActiveTab, loading, goals, darkMode, username } = useApp()
  const summary = getSummary()
  const animatedBalance = useCountUp(summary.balance)
  const streak = useStreak()

  const [balanceHidden, setBalanceHidden] = useState(
    () => localStorage.getItem('mf_balance_hidden') === 'true'
  )
  const toggleBalance = () => {
    setBalanceHidden(h => { localStorage.setItem('mf_balance_hidden', String(!h)); return !h })
  }

  const recent = useMemo(() => transactions.slice(0, 5), [transactions])

  const catBreakdown = useMemo(() => {
    return transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})
  }, [transactions])

  if (loading && transactions.length === 0) return <DashboardSkeleton />
  const totalDebit = summary.totalDebit || 1

  const topGoal = goals?.length > 0
    ? goals.reduce((best, g) => {
        const pct = Math.min((Number(g.saved||0)/Number(g.target||1))*100,100)
        const bestPct = Math.min((Number(best.saved||0)/Number(best.target||1))*100,100)
        return pct < 100 && pct > bestPct ? g : best
      }, goals[0])
    : null
  const topGoalPct  = topGoal ? Math.min((Number(topGoal.saved||0)/Number(topGoal.target||1))*100,100) : 0
  const savingsPct  = Math.min((summary.balance / savingsGoal) * 100, 100)

  /* Quick action config */
  const primaryActions = [
    { label: 'Income',   icon: ArrowDownLeft, color: '#34D399', bg: 'rgba(52,211,153,0.10)', action: () => onAddWithType?.('credit') },
    { label: 'Expense',  icon: ArrowUpRight,  color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)', action: () => onAddWithType?.('debit') },
    { label: 'Smart Add', icon: Zap,          color: '#4F8EF7', bg: 'rgba(79,142,247,0.10)',  action: () => setActiveTab('smartadd') },
  ]
  const secondaryActions = [
    { label: 'Accounts', icon: CreditCard,    color: '#4F8EF7', bg: 'rgba(79,142,247,0.10)', action: () => setActiveTab('accounts') },
    { label: 'AI Chat',  icon: MessageCircle, color: '#A78BFA', bg: 'rgba(167,139,250,0.10)', action: () => setActiveTab('ai') },
    { label: 'Analytics', icon: BarChart3,    color: '#FBBF24', bg: 'rgba(251,191,36,0.10)', action: () => setActiveTab('charts') },
  ]
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-black/[0.05] dark:border-white/[0.05]">
        <div>
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white/95">
            Hello, {username || 'User'}! 👋
          </h2>
          <p className="text-xs text-gray-500 dark:text-white/45 mt-0.5">
            Here's your financial status overview at a glance.
          </p>
        </div>
        {streak >= 2 && (
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold shrink-0">
            <span>🔥 {streak}-Day Streak</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Account Summary, Timeline, Recent Ledger */}
        <div className="lg:col-span-7 space-y-6">
          {/* ═══ 1. BALANCE HERO CARD ═══════════════════ */}
          <div className="rounded-[20px] p-6 relative tour-balance-card" style={{ background: 'linear-gradient(145deg, var(--mf-hero-from) 0%, var(--mf-hero-to) 100%)', border: '1px solid var(--mf-border)', boxShadow: 'var(--mf-shadow-lg)' }}>
            {/* Subtle accent glow */}
            <div className="absolute inset-0 overflow-hidden rounded-[20px] pointer-events-none">
              <div style={{
                position: 'absolute', top: '-30%', right: '-15%',
                width: '180px', height: '180px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)',
                filter: 'blur(30px)',
              }} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-white/45">
                  Current Balance
                </span>
                <div className="px-2.5 py-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06]">
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-white/50">
                    {new Date().toLocaleString('en', { month: 'short' })} {new Date().getFullYear()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mb-6">
                {/* Big balance number */}
                <p className="font-display font-bold text-[40px] md:text-[44px] leading-none tracking-tight text-gray-900 dark:text-white/95">
                  {balanceHidden ? '₹ ●●●●●●' : `₹${animatedBalance.toLocaleString('en-IN')}`}
                </p>
                {/* Balance hide/show - aligned opposite to the amount */}
                <button onClick={toggleBalance}
                  className="flex items-center gap-1.5 transition-all active:scale-95 text-gray-500 dark:text-white/45 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.10] border border-black/[0.04] dark:border-white/[0.06] px-2.5 py-1.5 rounded-xl shrink-0">
                  {balanceHidden ? <Eye size={13} className="shrink-0" /> : <EyeOff size={13} className="shrink-0" />}
                  <span className="text-[10px] font-bold tracking-wide">
                    {balanceHidden ? 'Show balance' : 'Hide balance'}
                  </span>
                </button>
              </div>

              {/* Income & Expense mini-cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Income',  Icon: TrendingUp,   value: summary.totalCredit, color: '#34D399', bg: 'rgba(52,211,153,0.10)' },
                  { label: 'Expense', Icon: TrendingDown,  value: summary.totalDebit,  color: '#FF6B6B', bg: 'rgba(255,107,107,0.10)' },
                ].map(({ label, Icon, value, color, bg }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3 py-3 rounded-xl"
                    style={{ background: bg }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: color + '20' }}>
                      <Icon size={13} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-semibold text-gray-500 dark:text-white/40">{label}</p>
                      <p className="font-bold text-sm font-mono" style={{ color }}>
                        {balanceHidden ? '₹ ●●●●' : `₹${value.toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ Setup Checklist (shown only if new user) ═══ */}
          {transactions.length === 0 && (
            <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5 stagger-item">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">🚀</span>
                <h4 className="font-semibold text-sm text-gray-800 dark:text-white/90">Quick Start Checklist</h4>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: 'Add your first transaction',
                    done: transactions.length > 0,
                    action: () => setActiveTab('add'),
                    desc: 'Log an income or expense to activate charts.'
                  },
                  {
                    label: 'Adjust your base accounts balance',
                    done: Object.values(accounts || {}).some(v => v !== 0),
                    action: () => setActiveTab('accounts'),
                    desc: 'Set cash, bank, or UPI base values in Wallet.'
                  },
                  {
                    label: 'Set a monthly spending budget',
                    done: Object.values(budgets || {}).some(v => v !== 0),
                    action: () => setActiveTab('settings'),
                    desc: 'Control category expenditures in Settings.'
                  }
                ].map(({ label, done, action, desc }) => (
                  <div key={label} onClick={action} className="group flex gap-3 p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] border border-transparent hover:border-black/[0.04] dark:hover:border-white/[0.04] cursor-pointer transition-all duration-150">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                      done 
                        ? 'bg-[#34D399] border-[#34D399] text-white' 
                        : 'border-black/20 dark:border-white/20'
                    }`}>
                      {done && <Check size={11} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold ${done ? 'text-gray-400 dark:text-white/40 line-through' : 'text-gray-700 dark:text-white/80'}`}>{label}</p>
                      <p className="text-[10px] text-gray-400 dark:text-white/30 mt-0.5">{desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 dark:text-white/20 group-hover:translate-x-0.5 transition-transform shrink-0 self-center" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 2. TODAY'S SNAPSHOT ════════════════════════════════ */}
          <TodayWidget />

          {/* ═══ 3. NET WORTH TIMELINE ═════════════════════════════ */}
          <NetWorthTimeline />

          {/* ═══ 4. RECENT TRANSACTIONS ════════════════════════════ */}
          <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-800 dark:text-white/90">Recent Transactions</h3>
              <button onClick={() => setActiveTab('transactions')}
                className="flex items-center gap-1 text-xs font-medium text-[#4F8EF7]">
                See all <ChevronRight size={13} />
              </button>
            </div>
            {loading && (
              <div className="flex justify-center py-3">
                <RefreshCw size={16} className="animate-spin text-[#4F8EF7]" />
              </div>
            )}
            <div className="space-y-1.5">
              {recent.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                    <Wallet size={22} className="text-gray-400 dark:text-white/30" />
                  </div>
                  <p className="text-sm font-medium text-gray-400 dark:text-white/40">No transactions yet</p>
                  <button onClick={() => setActiveTab('add')}
                    className="text-xs font-semibold mt-1.5 text-[#4F8EF7]">
                    + Add First Transaction
                  </button>
                </div>
              ) : recent.map((tx, idx) => (
                <div key={tx.id} className="stagger-item">
                  <TransactionRow tx={tx} compact />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Quick Links, Analytics, AI Predictors */}
        <div className="lg:col-span-5 space-y-6">
          {/* ═══ 5. QUICK ACTIONS ═════════════════════════════════════ */}
          <div className="space-y-2.5 tour-quick-actions">
            {[primaryActions, secondaryActions].map((row, ri) => (
              <div key={ri} className="grid grid-cols-3 gap-2.5">
                {row.map(({ label, icon: QIcon, color, bg, action }) => (
                  <button key={label} onClick={action}
                    className={`flex flex-col items-center gap-2 py-3.5 rounded-2xl active:scale-[0.97] transition-all duration-150 ${label === 'AI Chat' ? 'tour-ai-btn' : ''}`}
                    style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: bg }}>
                      <QIcon size={17} style={{ color }} />
                    </div>
                    <span className="text-[10px] font-semibold text-center leading-tight text-gray-600 dark:text-white/60">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* ═══ 6. STREAK + SAVINGS GOAL ══════════════════════════ */}
          <div className="grid grid-cols-2 gap-3">
            {/* Streak */}
            <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 flex flex-col items-center justify-center"
              style={{ opacity: streak < 2 ? 0.5 : 1 }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(251,191,36,0.12)' }}>
                <Flame size={18} className="text-[#FBBF24]" />
              </div>
              <p className="font-display font-bold text-2xl text-[#FBBF24]">{streak}</p>
              <p className="text-[10px] font-semibold mt-0.5 text-[#FBBF24]/60">
                {streak >= 2 ? `🔥 ${streak}-day streak` : 'No streak yet'}
              </p>
            </div>

            {/* Savings goal */}
            <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl p-5 flex flex-col items-center justify-center">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(52,211,153,0.12)' }}>
                <Target size={18} className="text-[#34D399]" />
              </div>
              <p className="font-display font-bold text-2xl text-[#34D399]">
                {topGoal ? `${topGoalPct.toFixed(0)}%` : `${savingsPct.toFixed(0)}%`}
              </p>
              <p className="text-[10px] font-semibold mt-0.5 text-center leading-tight text-[#34D399]/60">
                🎯 {topGoal ? (topGoal.name?.length > 12 ? topGoal.name.slice(0,12)+'…' : topGoal.name) : 'Savings goal'}
              </p>
            </div>
          </div>

          {/* ═══ 7. AI PREDICTION ══════════════════════════════════ */}
          <PredictionCard />

          {/* ═══ 8. BALANCE SHEET ══════════════════════════════════ */}
          <BalanceSheetWidget />

          {/* ═══ 9. EXPENSE BREAKDOWN ══════════════════════════════ */}
          {Object.keys(catBreakdown).length > 0 && (
            <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-4 text-gray-800 dark:text-white/90">Expense Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(catBreakdown).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-1.5 text-gray-600 dark:text-white/60">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                          style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}>
                          {CATEGORY_EMOJI[cat] || '💡'}
                        </span>
                        {cat}
                      </span>
                      <span className="font-mono font-semibold text-gray-700 dark:text-white/70">
                        ₹{amt.toLocaleString('en-IN')} ({((amt/totalDebit)*100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(amt/totalDebit)*100}%`,
                          background: '#FF6B6B',
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

