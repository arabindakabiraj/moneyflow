/**
 * Dashboard.jsx — Premium Liquid Glass dashboard
 * iOS 18-inspired glass surfaces with depth, glow, and fluid motion
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Wallet, ChevronRight, RefreshCw, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Zap, ArrowDown, ArrowUp, Brain, X, Lightbulb, Flame, Scale, Target, BarChart3, MessageCircle, BookOpen, Activity, Eye, EyeOff } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useApp } from '../context/AppContext'
import { predictSpending, getDailyBudgetInfo } from '../utils/spendingPredictor'

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
      <div className="skeleton h-44 rounded-3xl" />
      <div className="grid grid-cols-3 gap-2">
        {[0,1,2].map(i => <div key={i} className="skeleton h-[80px] rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0,1,2].map(i => <div key={i} className="skeleton h-[80px] rounded-2xl" />)}
      </div>
      <div className="skeleton h-8 rounded-xl" />
      <div className="skeleton h-52 rounded-2xl" />
    </div>
  )
}

const CATEGORY_EMOJI = {
  Tiffin:'🍱', Books:'📚', Travel:'🚌', Tuition:'🎓', Others:'💼',
  Entertainment:'🎮', Health:'💊', Rent:'🏠',
}

/* ═══════ AI Spending Prediction Card ═══════ */
function PredictionCard() {
  const { transactions, budgets } = useApp()
  const prediction = useMemo(() => predictSpending(transactions), [transactions])
  const dailyInfo  = useMemo(() => getDailyBudgetInfo(budgets, transactions), [budgets, transactions])
  const [expanded, setExpanded] = useState(false)

  if (!prediction.hasEnoughData) return null

  const trendColor = prediction.monthlyTrend === 'up' ? '#f87171' : prediction.monthlyTrend === 'down' ? '#4ade80' : '#60a5fa'
  const trendIcon  = prediction.monthlyTrend === 'up' ? '📈' : prediction.monthlyTrend === 'down' ? '📉' : '➡️'

  return (
    <div className="lg-surface rounded-3xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.45)' }}>
          <Brain size={13} className="text-white" />
        </div>
        <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>AI Prediction</h3>
        <span className="ml-auto text-xs font-semibold" style={{ color: trendColor }}>
          {trendIcon} {prediction.monthlyTrend}
        </span>
      </div>

      <div className="relative z-10 lg-surface-2 rounded-2xl p-3 mb-3">
        <p className="text-[10px] uppercase font-semibold tracking-wider mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Next Month Predicted Spend
        </p>
        <p className="font-display font-bold text-2xl" style={{ color: '#818cf8' }}>
          ₹{prediction.totalPredicted.toLocaleString('en-IN')}
        </p>
        {dailyInfo.totalBudget > 0 && (
          <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.50)' }}>
            Daily budget remaining:{' '}
            <span className="font-bold" style={{ color: dailyInfo.isOverBudget ? '#f87171' : '#4ade80' }}>
              {dailyInfo.isOverBudget ? 'Over budget! 🚨' : `₹${dailyInfo.dailyBudget.toLocaleString('en-IN')}/day`}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.35)' }}> · {dailyInfo.daysRemaining} days left</span>
          </p>
        )}
      </div>

      {prediction.insights.length > 0 && (
        <div className="space-y-1.5 mb-3 relative z-10">
          {prediction.insights.slice(0, 2).map((insight, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] font-medium px-2.5 py-1.5 rounded-xl"
              style={{
                background: insight.type === 'warning' ? 'rgba(251,191,36,0.12)'
                  : insight.type === 'success' ? 'rgba(34,197,94,0.12)'
                  : 'rgba(99,102,241,0.12)',
                border: '1px solid ' + (insight.type === 'warning' ? 'rgba(251,191,36,0.25)'
                  : insight.type === 'success' ? 'rgba(34,197,94,0.25)'
                  : 'rgba(99,102,241,0.25)'),
                color: insight.type === 'warning' ? '#fbbf24'
                  : insight.type === 'success' ? '#4ade80'
                  : '#818cf8',
              }}>
              {insight.text}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setExpanded(p => !p)}
        className="text-[11px] font-semibold relative z-10" style={{ color: '#818cf8' }}>
        {expanded ? 'Hide details ▲' : `Top ${Math.min(prediction.categoryPredictions.length, 5)} categories ▼`}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 animate-fade-in relative z-10">
          {prediction.categoryPredictions.slice(0, 5).map(cat => (
            <div key={cat.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">{CATEGORY_EMOJI[cat.category] || '💡'}</span>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>{cat.category}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={{
                    background: cat.trend === 'up' ? 'rgba(244,63,94,0.15)' : cat.trend === 'down' ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.08)',
                    color: cat.trend === 'up' ? '#f87171' : cat.trend === 'down' ? '#4ade80' : 'rgba(255,255,255,0.50)',
                  }}>
                  {cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
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
    <div className="lg-surface rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"
          style={{ boxShadow: '0 4px 12px rgba(99,102,241,0.40)' }}>
          <Scale size={13} className="text-white" />
        </div>
        <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>Balance Sheet</h3>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{
            background: isPositive ? 'rgba(34,197,94,0.15)' : 'rgba(244,63,94,0.15)',
            color: isPositive ? '#4ade80' : '#f87171',
            border: '1px solid ' + (isPositive ? 'rgba(34,197,94,0.30)' : 'rgba(244,63,94,0.30)'),
          }}>
          {isPositive ? '▲ Positive' : '▼ Negative'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 relative z-10">
        {[
          { label: 'Assets',      value: getTrueBalance(), color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Liabilities', value: totalLiabilities, color: '#f87171', bg: 'rgba(244,63,94,0.12)' },
          { label: 'Net Worth',   value: Math.abs(netWorth), color: isPositive ? '#4ade80' : '#f87171', bg: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(244,63,94,0.12)' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="text-center p-2.5 rounded-2xl"
            style={{ background: bg, border: '1px solid rgba(255,255,255,0.10)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
            <p className="font-display font-bold text-sm" style={{ color }}>₹{value.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2 relative z-10">
        <button onClick={() => setActiveTab('ledger')}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.25)' }}>
          <BookOpen size={11} /> View Ledger
        </button>
        <button onClick={() => setActiveTab('cashflow')}
          className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold py-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
          <Activity size={11} /> Cash Flow
        </button>
      </div>
    </div>
  )
}

/* ═══════ Net Worth Timeline ═══════ */
function NetWorthTimeline() {
  const { getNetWorthHistory } = useApp()
  const data = getNetWorthHistory()
  if (data.length < 2) return null
  const latest  = data[data.length - 1]?.netWorth || 0
  const first   = data[0]?.netWorth || 0
  const growth  = latest - first
  const growing = growth >= 0

  return (
    <div className="lg-surface rounded-3xl p-4">
      <div className="flex items-center gap-2 mb-1 relative z-10">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
          style={{ boxShadow: '0 4px 12px rgba(139,92,246,0.40)' }}>
          <TrendingUp size={13} className="text-white" />
        </div>
        <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>Net Worth Timeline</h3>
        <span className="ml-auto text-xs font-bold" style={{ color: growing ? '#4ade80' : '#f87171' }}>
          {growing ? '+' : '-'}₹{Math.abs(growth).toLocaleString('en-IN')}
        </span>
      </div>
      <p className="text-[10px] mb-3 relative z-10" style={{ color: 'rgba(255,255,255,0.38)' }}>Wealth growth over time</p>
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={110}>
          <LineChart data={data} margin={{ top:4, right:4, left:-28, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.40)' }} tickFormatter={m => m?.slice(5)} />
            <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.40)' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: 'rgba(6,30,20,0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, fontSize: 11, color: 'rgba(255,255,255,0.90)' }}
              formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Net Worth']}
            />
            <Line type="monotone" dataKey="netWorth" stroke={growing ? '#4ade80' : '#f87171'}
              strokeWidth={2.5} dot={{ r: 3, fill: growing ? '#4ade80' : '#f87171', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: growing ? '#4ade80' : '#f87171' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ═══════ Today's Snapshot Widget ═══════ */
export function TodayWidget() {
  const { transactions, budgets } = useApp()
  const today     = new Date().toISOString().split('T')[0]
  const todayTx   = transactions.filter(t => t.date === today)
  const todaySpent  = todayTx.filter(t => t.type === 'debit').reduce((s,t) => s + Number(t.amount), 0)
  const todayEarned = todayTx.filter(t => t.type === 'credit').reduce((s,t) => s + Number(t.amount), 0)

  const month   = new Date().toISOString().slice(0, 7)
  const monthlySpent = transactions.filter(t => t.type === 'debit' && t.date?.startsWith(month)).reduce((s,t) => s + Number(t.amount), 0)
  const totalBudget  = Object.values(budgets).reduce((s, v) => s + Number(v), 0)

  if (todayTx.length === 0 && totalBudget === 0) return null

  const budgetPct = totalBudget > 0 ? Math.min((monthlySpent / totalBudget) * 100, 100) : 0
  const budgetColor = budgetPct > 90 ? '#f87171' : budgetPct > 70 ? '#fbbf24' : '#4ade80'

  return (
    <div className="lg-surface rounded-3xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3 relative z-10">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
          style={{ boxShadow: '0 4px 12px rgba(251,146,60,0.40)' }}>
          <Zap size={13} className="text-white" />
        </div>
        <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>Today's Snapshot</h3>
        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)', border: '1px solid rgba(255,255,255,0.10)' }}>
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 relative z-10">
        {[
          { label: 'Spent',  icon: ArrowUp,   value: `₹${todaySpent.toLocaleString('en-IN')}`,  color: '#f87171', bg: 'rgba(244,63,94,0.12)' },
          { label: 'Earned', icon: ArrowDown, value: `₹${todayEarned.toLocaleString('en-IN')}`, color: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
          { label: 'Txns',   icon: null,      value: String(todayTx.length),                     color: '#60a5fa', bg: 'rgba(59,130,246,0.12)' },
        ].map(({ label, icon: Icon, value, color, bg }) => (
          <div key={label} className="rounded-2xl p-2.5 text-center"
            style={{ background: bg, border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              {Icon && <Icon size={10} style={{ color }} />}
              <span className="text-[10px] font-semibold uppercase" style={{ color: color + 'aa' }}>{label}</span>
            </div>
            <p className="font-mono font-bold text-sm" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>
      {totalBudget > 0 && (
        <div className="mt-3 pt-3 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>Monthly Budget Used</span>
            <span className="text-[11px] font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
              ₹{monthlySpent.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${budgetPct}%`, background: `linear-gradient(90deg, ${budgetColor}cc, ${budgetColor})`, boxShadow: `0 0 8px ${budgetColor}66` }} />
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
    <div className="relative overflow-hidden rounded-2xl">
      {!compact && (
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2">
          <button onClick={() => { closeSwipe(); onEdit?.(tx) }}
            className="w-12 h-12 rounded-xl text-white flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(16,185,129,0.85))', boxShadow: '0 4px 12px rgba(34,197,94,0.40)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            <span className="text-[9px] font-semibold">Edit</span>
          </button>
          <button onClick={() => { closeSwipe(); onDelete?.(tx.id) }}
            className="w-12 h-12 rounded-xl text-white flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform"
            style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.85), rgba(239,68,68,0.80))', boxShadow: '0 4px 12px rgba(244,63,94,0.40)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            <span className="text-[9px] font-semibold">Delete</span>
          </button>
        </div>
      )}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${offset}px)`, transition: swiping.current ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)' }}
        className={`relative z-10 flex items-center gap-3 ${!compact
          ? 'p-3 rounded-2xl'
          : 'py-2.5 px-1 rounded-xl transition-colors'}`}
        style={!compact ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' } : {}}
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base flex-shrink-0`}
          style={{ background: isCredit ? 'rgba(34,197,94,0.18)' : 'rgba(244,63,94,0.18)', border: '1px solid ' + (isCredit ? 'rgba(34,197,94,0.25)' : 'rgba(244,63,94,0.25)') }}>
          {CATEGORY_EMOJI[tx.category] || (isCredit ? '💰' : '💸')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>{tx.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>{tx.date}</span>
            <span style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>{tx.category}</span>
            {tx.type === 'debit' && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.20)' }}>·</span>
                <button onClick={() => onToggleNeedWant?.(tx.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded-lg font-semibold transition-colors"
                  style={{
                    background: tx.isWant ? 'rgba(139,92,246,0.18)' : 'rgba(59,130,246,0.18)',
                    color: tx.isWant ? '#a78bfa' : '#60a5fa',
                    border: '1px solid ' + (tx.isWant ? 'rgba(139,92,246,0.30)' : 'rgba(59,130,246,0.30)'),
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
                  style={{ background: 'rgba(139,92,246,0.18)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-mono font-bold text-sm" style={{ color: isCredit ? '#4ade80' : '#f87171' }}>
            {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
          </span>
          {!compact && !showActions && (
            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>← swipe</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════ MAIN DASHBOARD ═══════════════ */
export default function Dashboard({ onAddWithType }) {
  const { getSummary, transactions, savingsGoal, setActiveTab, loading, goals } = useApp()
  const summary = getSummary()
  const animatedBalance = useCountUp(summary.balance)
  const streak = useStreak()

  const [balanceHidden, setBalanceHidden] = useState(
    () => localStorage.getItem('mf_balance_hidden') === 'true'
  )
  const toggleBalance = () => {
    setBalanceHidden(h => { localStorage.setItem('mf_balance_hidden', String(!h)); return !h })
  }

  const recent = [...transactions].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date)
    if (dateDiff !== 0) return dateDiff
    const aT = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ?? 0) * 1000
    const bT = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ?? 0) * 1000
    return bT - aT
  }).slice(0, 5)

  if (loading && transactions.length === 0) return <DashboardSkeleton />

  const catBreakdown = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})
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

  const primaryActions = [
    { label: '+ Income',  icon: ArrowDownLeft, color: 'from-emerald-400 to-emerald-600', glow: '34,197,94', action: () => onAddWithType?.('credit') },
    { label: '+ Expense', icon: ArrowUpRight,  color: 'from-rose-400 to-rose-600',       glow: '244,63,94',  action: () => onAddWithType?.('debit') },
    { label: 'Smart Add ⚡', icon: Zap,        color: 'from-violet-400 to-purple-600',   glow: '139,92,246', action: () => setActiveTab('smartadd') },
  ]
  const secondaryActions = [
    { label: 'Accounts',  icon: CreditCard,   color: 'from-blue-400 to-blue-600',    glow: '59,130,246',  action: () => setActiveTab('accounts') },
    { label: 'AI Chat',   icon: MessageCircle, color: 'from-violet-400 to-violet-600', glow: '139,92,246', action: () => setActiveTab('ai') },
    { label: 'Analytics', icon: BarChart3,     color: 'from-amber-400 to-orange-600', glow: '251,146,60',  action: () => setActiveTab('charts') },
  ]

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ═══ 1. LIQUID GLASS BALANCE HERO CARD ═══════════════════ */}
      <div className="lg-deep rounded-3xl p-6 animate-liquid-float" style={{ animationDelay: '0s' }}>
        {/* Ambient gradient overlay inside card */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div style={{
            position: 'absolute', top: '-30%', right: '-15%',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.20) 0%, transparent 70%)',
            filter: 'blur(24px)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-20%', left: '-10%',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Current Balance
            </span>
            <div className="px-2.5 py-1 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}>
              <span className="text-[10px] font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
                {new Date().toLocaleString('en', { month: 'short' })} {new Date().getFullYear()}
              </span>
            </div>
          </div>

          {/* Balance hide/show */}
          <button onClick={toggleBalance}
            className="flex items-center gap-1.5 mb-2 transition-all active:scale-95"
            style={{ color: 'rgba(255,255,255,0.40)' }}>
            {balanceHidden ? <Eye size={13} className="shrink-0" /> : <EyeOff size={13} className="shrink-0" />}
            <span className="text-[10px] font-semibold tracking-wide">
              {balanceHidden ? 'Show balance' : 'Hide balance'}
            </span>
          </button>

          <p className="font-display font-bold text-5xl mb-5 tracking-tight transition-all duration-300"
            style={{ color: 'rgba(255,255,255,0.97)', textShadow: '0 2px 20px rgba(74,222,128,0.35)' }}>
            {balanceHidden ? '₹ ●●●●●●' : `₹${animatedBalance.toLocaleString('en-IN')}`}
          </p>

          {/* Income & Expense mini-cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Income',  Icon: TrendingUp,   value: summary.totalCredit, color: '#4ade80', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.25)' },
              { label: 'Expense', Icon: TrendingDown,  value: summary.totalDebit,  color: '#f87171', bg: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.25)' },
            ].map(({ label, Icon, value, color, bg, border }) => (
              <div key={label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl"
                style={{ background: bg, border: `1px solid ${border}` }}>
                <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ background: color + '25' }}>
                  <Icon size={13} style={{ color }} />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
                  <p className="font-bold text-sm font-mono" style={{ color }}>
                    {balanceHidden ? '₹ ●●●●' : `₹${value.toLocaleString('en-IN')}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ 2. QUICK ACTIONS ═════════════════════════════════════ */}
      <div className="space-y-2">
        {[primaryActions, secondaryActions].map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-2">
            {row.map(({ label, icon: QIcon, color, glow, action }) => (
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-2 py-3 rounded-2xl active:scale-95 transition-all duration-150 lg-chip">
                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center`}
                  style={{ boxShadow: `0 4px 16px rgba(${glow},0.45), 0 0 0 1px rgba(255,255,255,0.15)` }}>
                  <QIcon size={17} className="text-white" />
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: 'rgba(255,255,255,0.80)' }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ═══ 3. TODAY'S SNAPSHOT ════════════════════════════════ */}
      <TodayWidget />

      {/* ═══ 4. STREAK + SAVINGS GOAL ══════════════════════════ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="lg-surface rounded-3xl p-4 flex flex-col items-center justify-center py-5"
          style={{ opacity: streak < 2 ? 0.55 : 1 }}>
          <div className="relative z-10 w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mb-2"
            style={{ boxShadow: '0 4px 16px rgba(251,146,60,0.50)' }}>
            <Flame size={18} className="text-white" />
          </div>
          <p className="font-display font-bold text-2xl relative z-10" style={{ color: '#fb923c' }}>{streak}</p>
          <p className="text-[10px] font-semibold mt-0.5 relative z-10" style={{ color: 'rgba(251,146,60,0.70)' }}>
            {streak >= 2 ? `🔥 ${streak}-day streak` : 'No streak yet'}
          </p>
        </div>

        {/* Savings goal */}
        <div className="lg-surface rounded-3xl p-4 flex flex-col items-center justify-center py-5">
          <div className="relative z-10 w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-2"
            style={{ boxShadow: '0 4px 16px rgba(34,197,94,0.50)' }}>
            <Target size={18} className="text-white" />
          </div>
          <p className="font-display font-bold text-2xl relative z-10" style={{ color: '#4ade80' }}>
            {topGoal ? `${topGoalPct.toFixed(0)}%` : `${savingsPct.toFixed(0)}%`}
          </p>
          <p className="text-[10px] font-semibold mt-0.5 text-center leading-tight relative z-10" style={{ color: 'rgba(74,222,128,0.70)' }}>
            🎯 {topGoal ? (topGoal.name?.length > 12 ? topGoal.name.slice(0,12)+'…' : topGoal.name) : 'Savings goal'}
          </p>
        </div>
      </div>

      {/* ═══ 5. RECENT TRANSACTIONS ════════════════════════════ */}
      <div className="lg-surface rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h3 className="font-semibold text-sm" style={{ color: 'rgba(255,255,255,0.90)' }}>Recent Transactions</h3>
          <button onClick={() => setActiveTab('transactions')}
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: '#4ade80' }}>
            See all <ChevronRight size={13} />
          </button>
        </div>
        {loading && (
          <div className="flex justify-center py-3 relative z-10">
            <RefreshCw size={16} className="animate-spin" style={{ color: '#4ade80' }} />
          </div>
        )}
        <div className="space-y-1.5 relative z-10">
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Wallet size={22} style={{ color: 'rgba(255,255,255,0.40)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>No transactions yet</p>
              <button onClick={() => setActiveTab('add')}
                className="text-xs font-semibold mt-1.5" style={{ color: '#4ade80' }}>
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

      {/* ═══ 6. AI PREDICTION ══════════════════════════════════ */}
      <PredictionCard />

      {/* ═══ 7. BALANCE SHEET ══════════════════════════════════ */}
      <BalanceSheetWidget />

      {/* ═══ 8. NET WORTH TIMELINE ═════════════════════════════ */}
      <NetWorthTimeline />

      {/* ═══ 9. EXPENSE BREAKDOWN ══════════════════════════════ */}
      {Object.keys(catBreakdown).length > 0 && (
        <div className="lg-surface rounded-3xl p-4">
          <h3 className="font-semibold text-sm mb-3 relative z-10" style={{ color: 'rgba(255,255,255,0.90)' }}>Expense Breakdown</h3>
          <div className="space-y-2.5 relative z-10">
            {Object.entries(catBreakdown).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                    <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: 'rgba(255,255,255,0.10)' }}>
                      {CATEGORY_EMOJI[cat] || '💡'}
                    </span>
                    {cat}
                  </span>
                  <span className="font-mono font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>
                    ₹{amt.toLocaleString('en-IN')} ({((amt/totalDebit)*100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(amt/totalDebit)*100}%`,
                      background: 'linear-gradient(90deg, rgba(244,63,94,0.80), rgba(244,63,94,1))',
                      boxShadow: '0 0 6px rgba(244,63,94,0.40)',
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
