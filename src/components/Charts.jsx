/**
 * Charts.jsx — Spending analytics: Weekly comparison, Monthly, Category Pie
 */
import { useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

const COLORS = ['#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#6366f1']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি']

function weekStart(daysAgo = 0) {
    const d = new Date(); d.setDate(d.getDate() - daysAgo)
    const diff = (d.getDay() === 0 ? -6 : 1) - d.getDay()
    d.setDate(d.getDate() + diff); d.setHours(0, 0, 0, 0); return d
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 shadow-lg text-xs">
            <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }} className="font-mono">
                    {p.name}: ₹{Number(p.value).toLocaleString('en-IN')}
                </p>
            ))}
        </div>
    )
}

export default function Charts() {
    const { transactions, setActiveTab } = useApp()

    const monthlyData = useMemo(() => {
        const map = {}
        transactions.forEach(tx => {
            if (!tx.date) return
            const [y, m] = tx.date.split('-')
            const key = `${y}-${m}`
            if (!map[key]) map[key] = { month: MONTHS[Number(m) - 1], income: 0, expense: 0 }
            if (tx.type === 'credit') map[key].income += Number(tx.amount)
            else map[key].expense += Number(tx.amount)
        })
        return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([, v]) => v)
    }, [transactions])

    const weeklyData = useMemo(() => {
        const thisWS = weekStart(0)
        const lastWS = weekStart(7)
        const lastWE = new Date(thisWS); lastWE.setDate(lastWE.getDate() - 1)
        const thisW = Array(7).fill(0)
        const lastW = Array(7).fill(0)
        transactions.filter(t => t.type === 'debit').forEach(tx => {
            const d = new Date(tx.date)
            if (d >= thisWS) { thisW[(d.getDay() + 6) % 7] += Number(tx.amount) }
            else if (d >= lastWS && d <= lastWE) { lastW[(d.getDay() + 6) % 7] += Number(tx.amount) }
        })
        return DAYS.map((day, i) => ({ day, thisWeek: thisW[i], lastWeek: lastW[i] }))
    }, [transactions])

    const catData = useMemo(() => {
        const map = {}
        transactions.filter(t => t.type === 'debit').forEach(tx => {
            map[tx.category] = (map[tx.category] || 0) + Number(tx.amount)
        })
        return Object.entries(map).sort(([, a], [, b]) => b - a).map(([name, value]) => ({ name, value }))
    }, [transactions])

    const thisWeekTotal = weeklyData.reduce((s, d) => s + d.thisWeek, 0)
    const lastWeekTotal = weeklyData.reduce((s, d) => s + d.lastWeek, 0)
    const weekDiff = lastWeekTotal ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal * 100).toFixed(0) : 0

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
                <p className="text-5xl mb-4">📊</p>
                <p className="text-gray-500 dark:text-gray-400 font-semibold">কোনো data নেই</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Transaction add করো, তারপর charts দেখাবে!</p>
            </div>
        )
    }

    return (
        <div className="space-y-5 animate-fade-in pb-4">
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('settings')}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Analytics 📊</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">তোমার income ও expense এর বিশ্লেষণ</p>
                </div>
            </div>

            {/* Weekly comparison */}
            <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">📆 This Week vs Last Week</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${Number(weekDiff) > 0
                            ? 'bg-rose-100 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'
                            : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}>
                        {Number(weekDiff) > 0 ? '↑' : '↓'} {Math.abs(Number(weekDiff))}%
                    </span>
                </div>
                <div className="flex gap-4 text-xs mb-3">
                    <span className="text-gray-500">This week: <strong className="text-gray-800 dark:text-white font-mono">₹{thisWeekTotal.toLocaleString('en-IN')}</strong></span>
                    <span className="text-gray-500">Last week: <strong className="text-gray-500 font-mono">₹{lastWeekTotal.toLocaleString('en-IN')}</strong></span>
                </div>
                <ResponsiveContainer width="100%" height={155}>
                    <BarChart data={weeklyData} barSize={12} barGap={2}>
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                            tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="thisWeek" name="This Week" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="lastWeek" name="Last Week" fill="#d1d5db" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                <div className="flex gap-4 justify-center mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />This Week</span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />Last Week</span>
                </div>
            </div>

            {/* Monthly bar */}
            {monthlyData.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-4">📅 Monthly Overview</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={monthlyData} barSize={18} barGap={4}>
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                                tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-brand-500 inline-block" />Income</span>
                        <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />Expense</span>
                    </div>
                </div>
            )}

            {/* Category pie */}
            {catData.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-4">🏷️ Expense by Category</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                dataKey="value" nameKey="name" paddingAngle={3}>
                                {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />)}
                            </Pie>
                            <Tooltip formatter={val => [`₹${Number(val).toLocaleString('en-IN')}`, '']} />
                            <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Avg Daily Spend', value: `₹${transactions.length ? Math.round(transactions.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0) / Math.max(1, new Set(transactions.filter(t => t.type === 'debit').map(t => t.date)).size)) : 0}` },
                    { label: 'Biggest Expense', value: `₹${transactions.filter(t => t.type === 'debit').reduce((m, t) => Math.max(m, Number(t.amount)), 0).toLocaleString('en-IN')}` },
                    { label: 'Total Transactions', value: transactions.length },
                    { label: 'Categories Used', value: new Set(transactions.map(t => t.category)).size },
                ].map(({ label, value }) => (
                    <div key={label} className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="font-display font-bold text-gray-800 dark:text-white">{value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
