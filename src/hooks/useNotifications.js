import { useMemo } from 'react'
import { useApp } from '../context/AppContext'

// TTL for dismissed notifications (ms)
export const TTL_URGENT = 24 * 60 * 60 * 1000      // 24 hours — overdue bills, exceeded budgets
export const TTL_NORMAL = 3 * 24 * 60 * 60 * 1000   // 3 days — warnings, debts, anomalies
export const TTL_MILD   = 7 * 24 * 60 * 60 * 1000   // 7 days — milestones, tips, recurring

// Helper: Calculate days until a date string (uses fresh Date each call)
export const daysUntil = (dateStr) => {
  const now = new Date()
  return Math.ceil((new Date(dateStr) - now) / 86400000)
}

// Load dismissed map from localStorage, filtering out expired entries
export const loadDismissed = () => {
  try {
    const nowMs = Date.now()
    const raw = JSON.parse(localStorage.getItem('mf_dismissed_notifs') || '{}')
    // Migrate old array format → new { id: timestamp } format
    if (Array.isArray(raw)) {
      const migrated = {}
      raw.forEach(id => { migrated[id] = nowMs })
      localStorage.setItem('mf_dismissed_notifs', JSON.stringify(migrated))
      return migrated
    }
    // Prune entries older than 7 days (max TTL)
    const pruned = {}
    for (const [id, ts] of Object.entries(raw)) {
      if (nowMs - ts < TTL_MILD) pruned[id] = ts
    }
    if (Object.keys(pruned).length !== Object.keys(raw).length) {
      localStorage.setItem('mf_dismissed_notifs', JSON.stringify(pruned))
    }
    return pruned
  } catch { return {} }
}

export const isDismissed = (map, id, ttl) => {
  const ts = map[id]
  if (!ts) return false
  return (Date.now() - ts) < ttl
}

/**
 * useNotificationCount — lightweight hook for badge dot on the bell icon.
 * Counts real undismissed notifications using the same TTL-based dismiss logic.
 */
export function useNotificationCount() {
  const {
    getBudgetAlerts, getAnomalies, transactions,
    bills = [], debts = [], goals = [], recurringTx = [],
  } = useApp()

  return useMemo(() => {
    const now = new Date()             // Fresh date on every recalculation
    const nowMs = now.getTime()
    const dm = loadDismissed()
    const thisMonth = now.toISOString().slice(0, 7)
    let count = 0

    // Budget alerts
    getBudgetAlerts().forEach(a => {
      const id = `budget-${a.category}-${thisMonth}`
      if (!isDismissed(dm, id, a.exceeded ? TTL_URGENT : TTL_NORMAL)) count++
    })

    // Overdue / upcoming bills
    bills.filter(b => !b.paid).forEach(b => {
      const d = daysUntil(b.dueDate)
      if (d > 7) return
      const id = `bill-${b.id}`
      if (!isDismissed(dm, id, d < 0 ? TTL_URGENT : TTL_NORMAL)) count++
    })

    // Active debts
    debts.filter(d => !d.repaid && Number(d.amount) > 0).forEach(d => {
      if (!isDismissed(dm, `debt-${d.id}`, TTL_NORMAL)) count++
    })

    // Goals 75%+ or completed
    goals.forEach(g => {
      const pct = Math.round((Number(g.saved || 0) / Number(g.target || 1)) * 100)
      if (pct >= 100 && !isDismissed(dm, `goal-done-${g.id}`, TTL_MILD)) count++
      else if (pct >= 75 && !isDismissed(dm, `goal-75-${g.id}`, TTL_NORMAL)) count++
    })

    // Anomalies
    getAnomalies().slice(0, 3).forEach((a, i) => {
      if (!isDismissed(dm, `anomaly-${a.id || a.date}-${i}`, TTL_NORMAL)) count++
    })

    return count
  }, [transactions, bills, debts, goals, recurringTx])
}
