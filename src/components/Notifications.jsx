/**
 * Notifications.jsx — Real-time notifications from live app data
 * Sources: budgets, bills, debts, goals, recurring tx, recent transactions, anomalies
 */
import { useState, useMemo } from 'react'
import { Bell, AlertTriangle, TrendingUp, Sparkles, Trash2, CheckCircle, Clock, Target, Wallet, RotateCcw, CreditCard, ArrowLeft, BellOff } from 'lucide-react'
import { useApp } from '../context/AppContext'

import {
  daysUntil, TTL_URGENT, TTL_NORMAL, TTL_MILD,
  loadDismissed, isDismissed
} from '../hooks/useNotifications'

const TODAY = new Date().toISOString().split('T')[0]
const NOW_MS = new Date().getTime()
const fmtAmt = (n) => `₹${Number(n).toLocaleString('en-IN')}`
const relTime = (dateStr) => {
  const d = daysUntil(dateStr)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d === -1) return 'Yesterday'
  if (d < -1) return `${Math.abs(d)} days ago`
  return `In ${d} days`
}

export default function Notifications() {
  const {
    getBudgetAlerts, getAnomalies, transactions,
    bills = [], debts = [], goals = [], recurringTx = [],
    savingsGoal, getSummary, setActiveTab,
  } = useApp()

  const [dismissed, setDismissed] = useState(loadDismissed)

  const dismiss = (id) => {
    setDismissed(prev => {
      const next = { ...prev, [id]: NOW_MS }
      localStorage.setItem('mf_dismissed_notifs', JSON.stringify(next))
      return next
    })
  }

  const clearAll = () => {
    const next = { ...dismissed }
    notifications.forEach(n => { next[n.id] = NOW_MS })
    localStorage.setItem('mf_dismissed_notifs', JSON.stringify(next))
    setDismissed(next)
  }

  // ═══════ Build real-time notifications from all data sources ═══════
  const notifications = useMemo(() => {
    const items = []
    const thisMonth = new Date().toISOString().slice(0, 7)

    // ── 1. Budget Alerts (real from Firestore budgets + transactions) ──
    const alerts = getBudgetAlerts()
    alerts.forEach(a => {
      const id = `budget-${a.category}-${thisMonth}`
      if (isDismissed(dismissed, id, a.exceeded ? TTL_URGENT : TTL_NORMAL)) return
      items.push({
        id,
        type: a.exceeded ? 'danger' : 'warning',
        icon: AlertTriangle,
        title: a.exceeded ? `${a.category} budget exceeded!` : `${a.category} at ${a.pct}%`,
        desc: `Spent ${fmtAmt(a.spent)} of ${fmtAmt(a.limit)} limit this month`,
        pct: a.pct,
        time: 'This month',
        priority: a.exceeded ? 1 : 2,
        action: () => setActiveTab('settings'),
      })
    })

    // ── 2. Bill Reminders (real from Firestore bills) ──
    bills.filter(b => !b.paid).forEach(b => {
      const d = daysUntil(b.dueDate)
      if (d > 7) return // only upcoming 7 days
      const id = `bill-${b.id}`
      const isOverdue = d < 0
      if (isDismissed(dismissed, id, isOverdue ? TTL_URGENT : TTL_NORMAL)) return
      const isUrgent = d >= 0 && d <= 2
      items.push({
        id,
        type: isOverdue ? 'danger' : isUrgent ? 'warning' : 'info',
        icon: Clock,
        title: isOverdue
          ? `${b.emoji || '💳'} ${b.name} is overdue!`
          : d === 0
            ? `${b.emoji || '💳'} ${b.name} due today`
            : `${b.emoji || '💳'} ${b.name} due ${d === 1 ? 'tomorrow' : `in ${d} days`}`,
        desc: b.amount > 0 ? `${fmtAmt(b.amount)} · ${b.repeat}` : b.repeat,
        time: relTime(b.dueDate),
        priority: isOverdue ? 0 : isUrgent ? 2 : 4,
        action: () => setActiveTab('bills'),
      })
    })

    // ── 3. Debt Reminders (real from Firestore debts) ──
    debts.filter(d => !d.repaid).forEach(debt => {
      const id = `debt-${debt.id}`
      if (isDismissed(dismissed, id, TTL_NORMAL)) return
      const amt = Number(debt.amount)
      if (amt <= 0) return
      const personName = debt.name || debt.person || 'Someone'
      const isOwed = debt.type === 'i_owe' // you owe someone
      items.push({
        id,
        type: isOwed ? 'warning' : 'info',
        icon: CreditCard,
        title: isOwed
          ? `You owe ${personName} ${fmtAmt(amt)}`
          : `${personName} owes you ${fmtAmt(amt)}`,
        desc: debt.note || (isOwed ? 'Consider paying back soon' : 'Pending repayment'),
        time: debt.date ? relTime(debt.date) : 'Active',
        priority: isOwed ? 3 : 5,
        action: () => setActiveTab('debts'),
      })
    })

    // ── 4. Savings Goals Progress (real from Firestore goals) ──
    goals.forEach(g => {
      const saved = Number(g.saved || 0)
      const target = Number(g.target || 1)
      const pct = Math.round((saved / target) * 100)
      if (pct >= 100) {
        const id = `goal-done-${g.id}`
        if (isDismissed(dismissed, id, TTL_MILD)) return
        items.push({
          id,
          type: 'success',
          icon: Target,
          title: `🎯 Goal "${g.name}" achieved!`,
          desc: `You saved ${fmtAmt(saved)} — target reached!`,
          time: 'Completed',
          priority: 3,
          action: () => setActiveTab('goals'),
        })
      } else if (pct >= 75) {
        const id = `goal-75-${g.id}`
        if (isDismissed(dismissed, id, TTL_NORMAL)) return
        items.push({
          id,
          type: 'success',
          icon: Target,
          title: `${g.name} is ${pct}% funded`,
          desc: `${fmtAmt(saved)} saved of ${fmtAmt(target)} — almost there!`,
          pct,
          time: 'In progress',
          priority: 5,
          action: () => setActiveTab('goals'),
        })
      }
    })

    // ── 5. Anomaly Detection (real from Firestore transactions) ──
    const anomalies = getAnomalies()
    anomalies.slice(0, 3).forEach((a, i) => {
      const id = `anomaly-${a.id || a.date}-${i}`
      if (isDismissed(dismissed, id, TTL_NORMAL)) return
      items.push({
        id,
        type: 'info',
        icon: TrendingUp,
        title: `Unusual: ${a.description}`,
        desc: `${fmtAmt(a.amount)} in ${a.category} — exceeds 2× your average`,
        time: a.date ? relTime(a.date) : 'Recent',
        priority: 4,
        action: () => setActiveTab('transactions'),
      })
    })

    // ── 6. Large Recent Transactions (real from Firestore) ──
    const recentDebits = transactions
      .filter(t => t.type === 'debit' && t.date && daysUntil(t.date) >= -3)
      .sort((a, b) => Number(b.amount) - Number(a.amount))
    if (recentDebits.length > 0) {
      // Alert on any single transaction > ₹5000 in last 3 days
      recentDebits.filter(t => Number(t.amount) >= 5000).slice(0, 2).forEach(t => {
        const id = `large-${t.id}`
        if (isDismissed(dismissed, id, TTL_NORMAL)) return
        items.push({
          id,
          type: 'info',
          icon: Wallet,
          title: `Large expense: ${t.description}`,
          desc: `${fmtAmt(t.amount)} · ${t.category}`,
          time: relTime(t.date),
          priority: 4,
          action: () => setActiveTab('transactions'),
        })
      })
    }

    // ── 7. Daily Spending Summary (real from today's transactions) ──
    const todayDebits = transactions.filter(t => t.type === 'debit' && t.date === TODAY)
    if (todayDebits.length >= 3) {
      const total = todayDebits.reduce((s, t) => s + Number(t.amount), 0)
      const id = `daily-${TODAY}`
      if (!isDismissed(dismissed, id, TTL_URGENT)) {
        items.push({
          id,
          type: 'info',
          icon: Wallet,
          title: `Today: ${todayDebits.length} expenses totalling ${fmtAmt(total)}`,
          desc: todayDebits.map(t => t.category).filter((v, i, a) => a.indexOf(v) === i).join(', '),
          time: 'Today',
          priority: 6,
        })
      }
    }

    // ── 8. Recurring Transaction Reminders (real from Firestore) ──
    recurringTx.forEach(r => {
      const id = `recurring-${r.id}`
      if (isDismissed(dismissed, id, TTL_MILD)) return
      items.push({
        id,
        type: 'info',
        icon: RotateCcw,
        title: `Recurring: ${r.description || r.category}`,
        desc: `${fmtAmt(r.amount)} · ${r.frequency || 'Monthly'} · ${r.type === 'credit' ? 'Income' : 'Expense'}`,
        time: 'Active',
        priority: 7,
        action: () => setActiveTab('recurring'),
      })
    })

    // ── 9. Milestones (real from transaction count) ──
    const totalTx = transactions.length
    const milestones = [500, 250, 100, 50]
    for (const m of milestones) {
      if (totalTx >= m) {
        const id = `milestone-${m}`
        if (isDismissed(dismissed, id, TTL_MILD)) break
        items.push({
          id,
          type: 'success',
          icon: Sparkles,
          title: `🎉 ${m} transactions tracked!`,
          desc: `You've logged ${totalTx} transactions — impressive!`,
          time: 'Achievement',
          priority: 8,
        })
        break // only show highest
      }
    }

    // ── 10. No Budget Set Nudge ──
    const alerts2 = getBudgetAlerts()
    if (Object.keys(alerts2).length === 0 && transactions.length > 5) {
      const id = 'nudge-budget'
      if (!isDismissed(dismissed, id, TTL_MILD)) {
        items.push({
          id,
          type: 'info',
          icon: AlertTriangle,
          title: 'Set budget limits to get alerts',
          desc: 'Go to Settings → Budget to start tracking spending by category',
          time: 'Tip',
          priority: 9,
          action: () => setActiveTab('settings'),
        })
      }
    }

    // Sort by priority (lower = more urgent)
    return items.sort((a, b) => (a.priority || 5) - (b.priority || 5))
  }, [transactions, bills, debts, goals, recurringTx, dismissed])

  const typeStyles = {
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-900/10',
      border: 'border-rose-200 dark:border-rose-800/40',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
      iconColor: 'text-rose-500',
      dot: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/10',
      border: 'border-amber-200 dark:border-amber-800/40',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-500',
      dot: 'bg-amber-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/10',
      border: 'border-blue-200 dark:border-blue-800/40',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-500',
      dot: 'bg-blue-500',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/10',
      border: 'border-emerald-200 dark:border-emerald-800/40',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-500',
      dot: 'bg-emerald-500',
    },
  }

  const dangerCount = notifications.filter(n => n.type === 'danger' || n.type === 'warning').length

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Notifications</h2>
            {notifications.length > 0 && (
              <span className="px-2 py-0.5 rounded-lg bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-[11px] font-bold">
                {notifications.length}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {dangerCount > 0 ? `${dangerCount} alert${dangerCount > 1 ? 's' : ''} need attention` : 'Real-time updates from your data'}
          </p>
        </div>
        {notifications.length > 0 && (
          <button onClick={clearAll}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 active:scale-95 transition-all">
            Clear all
          </button>
        )}
      </div>

      {/* Empty state */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <BellOff size={28} className="text-gray-400 dark:text-gray-500" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">All caught up! ✨</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">No new notifications right now</p>
          <button onClick={() => {
            localStorage.removeItem('mf_dismissed_notifs')
            setDismissed({})
          }}
            className="mt-4 text-xs text-brand-500 font-semibold">Reset dismissed</button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map(n => {
            const style = typeStyles[n.type]
            const Icon = n.icon
            return (
              <div key={n.id}
                className={`rounded-2xl ${style.bg} border ${style.border} p-4 relative overflow-hidden animate-slide-up`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-2xl ${style.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon size={18} className={style.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={n.action} role={n.action ? 'button' : undefined}>
                    <p className="font-semibold text-sm text-gray-800 dark:text-white leading-snug">{n.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
                    {n.pct != null && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${n.type === 'danger' ? 'bg-rose-500' : n.type === 'warning' ? 'bg-amber-500' : n.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(n.pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{n.time}</p>
                      {n.action && <p className="text-[10px] text-brand-500 font-semibold ml-auto">View →</p>}
                    </div>
                  </div>
                  <button onClick={() => dismiss(n.id)}
                    className="w-7 h-7 rounded-xl bg-white/60 dark:bg-gray-700/60 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0 mt-0.5">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
