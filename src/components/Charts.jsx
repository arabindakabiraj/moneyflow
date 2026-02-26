/**
 * Charts.jsx — Spending analytics with Bar + Pie charts (recharts)
 */
import { useMemo } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useApp } from '../context/AppContext'

const COLORS = ['#10b981', '#f43f5e', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#6366f1']

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Charts() {
    const { transactions } = useApp()

    // Monthly data (last 6 months)
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
        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([, v]) => v)
    }, [transactions])

    // Category pie data
    const catData = useMemo(() => {
        const map = {}
        transactions.filter(t => t.type === 'debit').forEach(tx => {
            map[tx.category] = (map[tx.category] || 0) + Number(tx.amount)
        })
        return Object.entries(map)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({ name, value }))
    }, [transactions])

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
        <div className="space-y-5 animate-fade-in">
            <div>
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Analytics 📊</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">তোমার income ও expense এর চার্ট</p>
            </div>

            {/* Bar Chart — Monthly */}
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

            {/* Pie Chart — Category */}
            {catData.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-4">🏷️ Expense by Category</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                                dataKey="value" nameKey="name" paddingAngle={3}>
                                {catData.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, '']} />
                            <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 11 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Stats row */}
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
