/**
 * Dashboard.jsx — Premium dashboard with balance card, quick actions, savings ring, recent transactions
 */
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { TrendingUp, TrendingDown, Wallet, ChevronRight, RefreshCw, Plus, ArrowDownLeft, ArrowUpRight, CreditCard, Zap, ArrowDown, ArrowUp, Brain, X, Lightbulb, Flame, Scale, Target, BarChart3, MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { predictSpending, getDailyBudgetInfo } from '../utils/spendingPredictor'

const CATEGORY_EMOJI = {
  Tiffin: '🍱', Books: '📚', Travel: '🚌', Tuition: '🎓', Others: '💼',
  Entertainment: '🎮', Health: '💊', Rent: '🏠',
}

/* Circular Savings Ring */
function SavingsRing({ progress, balance, goal }) {
  const radius = 54
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const dashoffset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width="130" height="130" className="circular-progress">
        {/* Background ring */}
        <circle cx="65" cy="65" r={radius} fill="none"
          stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth={stroke} />
        {/* Progress ring */}
        <circle cx="65" cy="65" r={radius} fill="none"
          stroke="url(#savingsGrad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        <defs>
          <linearGradient id="savingsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <p className="font-display font-bold text-lg text-gray-900 dark:text-white">
          {progress.toFixed(0)}%
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">Savings</p>
      </div>
    </div>
  )
}

function SummaryCard({ label, amount, type, icon: Icon, gradient }) {
  return (
    <div className={`card ${gradient} text-white relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/30" />
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-white/80 text-[11px] font-semibold uppercase tracking-wider">{label}</span>
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon size={14} className="text-white/90" />
          </div>
        </div>
        <p className="font-display font-bold text-xl">₹{Number(amount).toLocaleString('en-IN')}</p>
      </div>
    </div>
  )
}

/* ═══════ AI Spending Prediction Card ═══════ */
function PredictionCard() {
  const { transactions, budgets } = useApp()
  const prediction = useMemo(() => predictSpending(transactions), [transactions])
  const dailyInfo = useMemo(() => getDailyBudgetInfo(budgets, transactions), [budgets, transactions])
  const [expanded, setExpanded] = useState(false)

  if (!prediction.hasEnoughData) return null

  const trendIcon = prediction.monthlyTrend === 'up' ? '📈' : prediction.monthlyTrend === 'down' ? '📉' : '➡️'
  const trendColor = prediction.monthlyTrend === 'up' ? 'text-rose-500' : prediction.monthlyTrend === 'down' ? 'text-emerald-500' : 'text-blue-500'

  return (
    <div className="card bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 dark:from-indigo-900/20 dark:via-violet-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/40 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
          <Brain size={13} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm">AI Prediction</h3>
        <span className={`ml-auto text-xs font-semibold ${trendColor}`}>{trendIcon} {prediction.monthlyTrend}</span>
      </div>

      {/* Predicted total */}
      <div className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-3 mb-3">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Next Month Predicted Spend</p>
        <p className="font-display font-bold text-2xl text-indigo-700 dark:text-indigo-300">₹{prediction.totalPredicted.toLocaleString('en-IN')}</p>
        {dailyInfo.totalBudget > 0 && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
            Daily budget remaining: <span className={`font-bold ${dailyInfo.isOverBudget ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {dailyInfo.isOverBudget ? 'Over budget! 🚨' : `₹${dailyInfo.dailyBudget.toLocaleString('en-IN')}/day`}
            </span>
            <span className="text-gray-400"> · {dailyInfo.daysRemaining} days left</span>
          </p>
        )}
      </div>

      {/* Insights */}
      {prediction.insights.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {prediction.insights.slice(0, 2).map((insight, i) => (
            <div key={i} className={`flex items-center gap-2 text-[11px] font-medium px-2.5 py-1.5 rounded-lg ${insight.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/15 text-amber-700 dark:text-amber-400' :
              insight.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400' :
                'bg-blue-50 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400'
              }`}>
              {insight.text}
            </div>
          ))}
        </div>
      )}

      {/* Top categories — expand/collapse */}
      <button onClick={() => setExpanded(p => !p)} className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
        {expanded ? 'Hide details ▲' : `Top ${Math.min(prediction.categoryPredictions.length, 5)} categories ▼`}
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 animate-fade-in">
          {prediction.categoryPredictions.slice(0, 5).map(cat => (
            <div key={cat.category} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs">{CATEGORY_EMOJI[cat.category] || '💡'}</span>
                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{cat.category}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${cat.trend === 'up' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600' :
                  cat.trend === 'down' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}>
                  {cat.trend === 'up' ? '↑' : cat.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">₹{cat.predicted.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════ Streak Counter Hook ═══════ */
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
      const prev = new Date(dates[i - 1])
      const curr = new Date(dates[i])
      const diff = (prev - curr) / 86400000
      if (diff === 1) count++
      else break
    }
    return count
  }, [transactions])
}

/* ═══════ Streak Counter Widget (standalone, for backward compat) ═══════ */
function StreakWidget() {
  const streak = useStreak()

  if (streak < 2) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-100 dark:border-orange-800/30 animate-fade-in">
      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-400/30 flex-shrink-0">
        <Flame size={18} className="text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-orange-800 dark:text-orange-300">{streak}-Day Streak! 🔥</p>
        <p className="text-[11px] text-orange-600/70 dark:text-orange-400/70">You've logged transactions {streak} days in a row</p>
      </div>
      <span className="font-display font-bold text-3xl text-orange-500">{streak}</span>
    </div>
  )
}

/* ═══════ Net Worth Widget ═══════ */
function NetWorthWidget() {
  const { accounts, debts } = useApp()
  const totalAssets = Object.values(accounts).reduce((s, v) => s + Number(v), 0)
  const totalDebts = debts.filter(d => !d.repaid).reduce((s, d) => s + Number(d.amount), 0)
  const netWorth = totalAssets - totalDebts

  return (
    <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Scale size={13} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Net Worth</h3>
        <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-md ${netWorth >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
          }`}>{netWorth >= 0 ? '▲ Positive' : '▼ Negative'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20">
          <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wide mb-0.5">Assets</p>
          <p className="font-display font-bold text-sm text-blue-700 dark:text-blue-300">₹{totalAssets.toLocaleString('en-IN')}</p>
        </div>
        <div className="text-center p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20">
          <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wide mb-0.5">Debts</p>
          <p className="font-display font-bold text-sm text-rose-600 dark:text-rose-400">₹{totalDebts.toLocaleString('en-IN')}</p>
        </div>
        <div className={`text-center p-2.5 rounded-xl ${netWorth >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'
          }`}>
          <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">Net</p>
          <p className={`font-display font-bold text-sm ${netWorth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>₹{Math.abs(netWorth).toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  )
}


export default function Dashboard({ onAddWithType }) {
  const { getSummary, transactions, savingsGoal, setActiveTab, loading, accounts, debts, goals } = useApp()
  const summary = getSummary()
  const savingsProgress = Math.min((summary.balance / savingsGoal) * 100, 100)
  const recent = [...transactions].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date)
    if (dateDiff !== 0) return dateDiff
    // Same date — sort by createdAt (Firestore timestamp) descending
    const aT = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0
    const bT = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0
    return bT - aT
  }).slice(0, 5)
  const streak = useStreak()

  // Category breakdown for debits
  const catBreakdown = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})
  const totalDebit = summary.totalDebit || 1

  // Top active goal progress
  const topGoal = goals?.length > 0
    ? goals.reduce((best, g) => {
      const pct = Math.min((Number(g.saved || 0) / Number(g.target || 1)) * 100, 100)
      const bestPct = Math.min((Number(best.saved || 0) / Number(best.target || 1)) * 100, 100)
      return pct < 100 && pct > bestPct ? g : best
    }, goals[0])
    : null
  const topGoalPct = topGoal ? Math.min((Number(topGoal.saved || 0) / Number(topGoal.target || 1)) * 100, 100) : 0

  // Quick actions — row 1 (primary) + row 2 (secondary)
  const primaryActions = [
    { label: '+ Income', icon: ArrowDownLeft, color: 'from-emerald-400 to-emerald-600', action: () => onAddWithType?.('credit') },
    { label: '+ Expense', icon: ArrowUpRight, color: 'from-rose-400 to-rose-600', action: () => onAddWithType?.('debit') },
    { label: 'Smart Add ⚡', icon: Zap, color: 'from-violet-400 to-purple-600', action: () => setActiveTab('smartadd') },
  ]
  const secondaryActions = [
    { label: 'Accounts', icon: CreditCard, color: 'from-blue-400 to-blue-600', action: () => setActiveTab('accounts') },
    { label: 'AI Chat', icon: MessageCircle, color: 'from-violet-400 to-violet-600', action: () => setActiveTab('ai') },
    { label: 'Analytics', icon: BarChart3, color: 'from-amber-400 to-orange-600', action: () => setActiveTab('charts') },
  ]

  const QuickBtn = ({ label, icon: QIcon, color, action }) => (
    <button onClick={action}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-br text-white font-semibold text-xs shadow-md active:scale-95 transition-transform">
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
        <QIcon size={15} className="text-white" />
      </div>
      <span className="text-gray-700 dark:text-gray-200 text-[11px] font-semibold">{label}</span>
    </button>
  )

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ═══ 1. BALANCE HERO CARD (always first) ═══════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-emerald-500 to-teal-600 p-6 shadow-xl shadow-brand-500/25">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/40" />
          <div className="absolute -left-6 -bottom-6 w-36 h-36 rounded-full bg-white/20" />
          <div className="absolute right-8 bottom-4 w-20 h-20 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Current Balance</span>
            <div className="px-2.5 py-1 bg-white/15 rounded-lg backdrop-blur-sm">
              <span className="text-white/90 text-[10px] font-semibold">
                {new Date().toLocaleString('en', { month: 'short' })} {new Date().getFullYear()}
              </span>
            </div>
          </div>
          <p className="font-display font-bold text-4xl text-white mt-1 mb-4 tracking-tight">
            ₹{summary.balance.toLocaleString('en-IN')}
          </p>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingUp size={12} className="text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[9px] uppercase font-medium">Income</p>
                <p className="text-white font-bold text-sm">₹{summary.totalCredit.toLocaleString('en-IN')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                <TrendingDown size={12} className="text-white" />
              </div>
              <div>
                <p className="text-white/60 text-[9px] uppercase font-medium">Expense</p>
                <p className="text-white font-bold text-sm">₹{summary.totalDebit.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 2. QUICK ACTIONS (2 rows: primary + secondary) ═ */}
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          {primaryActions.map(({ label, icon: QIcon, color, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-transform group">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-active:scale-90 transition-transform`}>
                <QIcon size={17} className="text-white" />
              </div>
              <span className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {secondaryActions.map(({ label, icon: QIcon, color, action }) => (
            <button key={label} onClick={action}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm active:scale-95 transition-transform group">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-active:scale-90 transition-transform`}>
                <QIcon size={17} className="text-white" />
              </div>
              <span className="text-[10px] text-gray-700 dark:text-gray-300 font-semibold text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ 3. TODAY'S SNAPSHOT (compact 3-col) ═══════════ */}
      <TodayWidget />

      {/* ═══ 4. STREAK + SAVINGS GOAL (side by side) ═══════ */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak tile */}
        <div className={`card bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border border-orange-100 dark:border-orange-800/30 flex flex-col items-center justify-center py-4 ${streak < 2 ? 'opacity-50' : ''}`}>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-400/30 mb-2">
            <Flame size={18} className="text-white" />
          </div>
          <p className="font-display font-bold text-2xl text-orange-600 dark:text-orange-400">{streak}</p>
          <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70 font-semibold mt-0.5">
            {streak >= 2 ? `🔥 ${streak}-day streak` : 'No streak yet'}
          </p>
        </div>

        {/* Savings goal tile */}
        <div className="card bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30 flex flex-col items-center justify-center py-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-400/30 mb-2">
            <Target size={18} className="text-white" />
          </div>
          <p className="font-display font-bold text-2xl text-emerald-600 dark:text-emerald-400">
            {topGoal ? `${topGoalPct.toFixed(0)}%` : `${savingsProgress.toFixed(0)}%`}
          </p>
          <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold mt-0.5">
            🎯 {topGoal ? (topGoal.name?.length > 12 ? topGoal.name.slice(0, 12) + '…' : topGoal.name) : 'Savings goal'}
          </p>
        </div>
      </div>

      {/* ═══ 5. RECENT TRANSACTIONS (visible early) ════════ */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Recent Transactions</h3>
          <button onClick={() => setActiveTab('transactions')}
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium hover:text-brand-700 transition-colors">
            See all <ChevronRight size={13} />
          </button>
        </div>
        {loading && (
          <div className="flex justify-center py-3">
            <RefreshCw size={16} className="text-brand-500 animate-spin" />
          </div>
        )}
        <div className="space-y-1">
          {recent.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                <Wallet size={22} className="text-gray-400" />
              </div>
              <p className="text-gray-400 text-sm font-medium">No transactions yet</p>
              <button onClick={() => setActiveTab('add')}
                className="text-brand-500 text-xs font-semibold mt-1.5 hover:text-brand-600 transition-colors">
                + Add First Transaction
              </button>
            </div>
          ) : recent.map(tx => (
            <TransactionRow key={tx.id} tx={tx} compact />
          ))}
        </div>
      </div>

      {/* ═══ 6. AI PREDICTION CARD (collapsible, below fold) */}
      <PredictionCard />

      {/* ═══ 7. NET WORTH (below the fold) ═════════════════ */}
      <NetWorthWidget />

      {/* ═══ 8. EXPENSE BREAKDOWN (bottom, for scrollers) ══ */}
      {Object.keys(catBreakdown).length > 0 && (
        <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-3">Expense Breakdown</h3>
          <div className="space-y-2.5">
            {Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs">
                      {CATEGORY_EMOJI[cat] || '💡'}
                    </span>
                    {cat}
                  </span>
                  <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                    ₹{amt.toLocaleString('en-IN')} ({((amt / totalDebit) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${(amt / totalDebit) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function TransactionRow({ tx, compact = false, onEdit, onDelete, onToggleNeedWant }) {
  const isCredit = tx.type === 'credit'
  const rowRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const swiping = useRef(false)
  const [offset, setOffset] = useState(0)
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
    // Only allow left swipe (negative diff), limit max
    if (diff < 0) {
      const clamped = Math.max(diff, -120)
      currentX.current = clamped
      setOffset(clamped)
    } else if (showActions) {
      // Allow right swipe to close
      const clamped = Math.min(diff, 120)
      currentX.current = clamped - 120
      setOffset(Math.min(clamped - 120, 0))
    }
  }, [compact, showActions])

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current || compact) return
    swiping.current = false
    // If swiped past threshold, show actions
    if (currentX.current < -50) {
      setOffset(-110)
      setShowActions(true)
    } else {
      setOffset(0)
      setShowActions(false)
    }
  }, [compact])

  const closeSwipe = () => { setOffset(0); setShowActions(false) }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Action buttons revealed behind */}
      {!compact && (
        <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-2">
          <button onClick={() => { closeSwipe(); onEdit?.(tx) }}
            className="w-12 h-12 rounded-xl bg-brand-500 text-white flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            <span className="text-[9px] font-semibold">Edit</span>
          </button>
          <button onClick={() => { closeSwipe(); onDelete?.(tx.id) }}
            className="w-12 h-12 rounded-xl bg-rose-500 text-white flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform shadow-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            <span className="text-[9px] font-semibold">Delete</span>
          </button>
        </div>
      )}
      {/* Main row content — slides on swipe */}
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${offset}px)`, transition: swiping.current ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
        className={`relative z-10 flex items-center gap-3 ${!compact
          ? 'p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl'
          : 'py-2.5 px-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors'}`}
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-base flex-shrink-0 shadow-sm
          ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
          {CATEGORY_EMOJI[tx.category] || (isCredit ? '💰' : '💸')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{tx.description}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{tx.date}</span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{tx.category}</span>
            {tx.type === 'debit' && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <button onClick={() => onToggleNeedWant?.(tx.id)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition-colors
                    ${tx.isWant
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    }`}>
                  {tx.isWant ? '✨ Want' : '✅ Need'}
                </button>
              </>
            )}
          </div>
          {/* Tags */}
          {tx.tags && tx.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tx.tags.map(tag => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded font-semibold">#{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`font-mono font-bold text-sm ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
          </span>
          {!compact && !showActions && (
            <span className="text-[9px] text-gray-300 dark:text-gray-600">← swipe</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════ Today's Snapshot Widget ═══════ */
export function TodayWidget() {
  const { transactions, budgets } = useApp()
  const today = new Date().toISOString().split('T')[0]
  const todayTx = transactions.filter(t => t.date === today)
  const todaySpent = todayTx.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0)
  const todayEarned = todayTx.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0)

  // Monthly budget remaining
  const month = new Date().toISOString().slice(0, 7)
  const monthlySpent = transactions
    .filter(t => t.type === 'debit' && t.date?.startsWith(month))
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalBudget = Object.values(budgets).reduce((s, v) => s + Number(v), 0)

  if (todayTx.length === 0 && totalBudget === 0) return null

  return (
    <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
          <Zap size={13} className="text-white" />
        </div>
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Today's Snapshot</h3>
        <span className="ml-auto text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-rose-50 dark:bg-rose-900/15 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowUp size={10} className="text-rose-500" />
            <span className="text-[10px] font-semibold text-rose-500/70 uppercase">Spent</span>
          </div>
          <p className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">₹{todaySpent.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/15 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <ArrowDown size={10} className="text-emerald-500" />
            <span className="text-[10px] font-semibold text-emerald-500/70 uppercase">Earned</span>
          </div>
          <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">₹{todayEarned.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/15 rounded-xl p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="text-[10px] font-semibold text-blue-500/70 uppercase">Txns</span>
          </div>
          <p className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">{todayTx.length}</p>
        </div>
      </div>
      {totalBudget > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Monthly Budget Used</span>
            <span className="text-[11px] font-mono font-semibold text-gray-600 dark:text-gray-300">
              ₹{monthlySpent.toLocaleString('en-IN')} / ₹{totalBudget.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${monthlySpent / totalBudget > 0.9 ? 'bg-gradient-to-r from-rose-400 to-rose-500' :
                monthlySpent / totalBudget > 0.7 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  'bg-gradient-to-r from-brand-400 to-emerald-500'}`}
              style={{ width: `${Math.min((monthlySpent / totalBudget) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
