/**
 * Notifications.jsx — Dedicated notifications page with budget alerts, anomalies & tips
 */
import { useState } from 'react'
import { Bell, AlertTriangle, TrendingUp, Sparkles, Trash2, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Notifications() {
    const { getBudgetAlerts, getAnomalies, transactions } = useApp()
    const alerts = getBudgetAlerts()
    const anomalies = getAnomalies()
    const [dismissed, setDismissed] = useState([])

    const dismiss = (id) => setDismissed(prev => [...prev, id])

    // Build notification items
    const notifications = []

    // Budget alerts
    alerts.forEach((a, i) => {
        const id = `budget-${a.category}`
        if (dismissed.includes(id)) return
        notifications.push({
            id,
            type: a.exceeded ? 'danger' : 'warning',
            icon: AlertTriangle,
            title: a.exceeded ? `🚨 ${a.category} budget exceeded!` : `⚠️ ${a.category} budget ${a.pct}% used`,
            desc: `₹${a.spent.toLocaleString('en-IN')} / ₹${a.limit.toLocaleString('en-IN')} spent this month`,
            pct: a.pct,
            time: 'This month',
        })
    })

    // Anomalies
    anomalies.forEach((a, i) => {
        const id = `anomaly-${a.id || i}`
        if (dismissed.includes(id)) return
        notifications.push({
            id,
            type: 'info',
            icon: TrendingUp,
            title: `📊 Unusual spending: ${a.description}`,
            desc: `₹${Number(a.amount).toLocaleString('en-IN')} in ${a.category} — more than 2x your average`,
            time: a.date,
        })
    })

    // Milestone notifications
    const totalTx = transactions.length
    if (totalTx >= 100 && !dismissed.includes('milestone-100')) {
        notifications.push({
            id: 'milestone-100',
            type: 'success',
            icon: Sparkles,
            title: '🎉 100 transactions milestone!',
            desc: `You've tracked ${totalTx} transactions!`,
            time: 'Achievement',
        })
    } else if (totalTx >= 50 && !dismissed.includes('milestone-50')) {
        notifications.push({
            id: 'milestone-50',
            type: 'success',
            icon: Sparkles,
            title: '🎉 50 transactions milestone!',
            desc: `You've tracked ${totalTx} transactions! Keep it up!`,
            time: 'Achievement',
        })
    }

    const typeStyles = {
        danger: {
            bg: 'bg-rose-50 dark:bg-rose-900/10',
            border: 'border-rose-200 dark:border-rose-800/40',
            iconBg: 'bg-rose-100 dark:bg-rose-900/30',
            iconColor: 'text-rose-500',
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900/10',
            border: 'border-amber-200 dark:border-amber-800/40',
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-500',
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/10',
            border: 'border-blue-200 dark:border-blue-800/40',
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-500',
        },
        success: {
            bg: 'bg-emerald-50 dark:bg-emerald-900/10',
            border: 'border-emerald-200 dark:border-emerald-800/40',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-500',
        },
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Notifications 🔔</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Budget alerts & activity updates</p>
            </div>

            {notifications.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={28} className="text-brand-500" />
                    </div>
                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">All caught up! ✨</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">No new notifications</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map(n => {
                        const style = typeStyles[n.type]
                        const Icon = n.icon
                        return (
                            <div key={n.id} className={`card ${style.bg} border ${style.border} relative overflow-hidden animate-slide-up`}>
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-2xl ${style.iconBg} flex items-center justify-center shrink-0`}>
                                        <Icon size={18} className={style.iconColor} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-800 dark:text-white leading-snug">{n.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.desc}</p>
                                        {n.pct && (
                                            <div className="mt-2">
                                                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ${n.type === 'danger' ? 'bg-rose-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${Math.min(n.pct, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 font-mono">{n.time}</p>
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
