/**
 * SavingsGoals.jsx — Track savings goals with progress bars
 */
import { useState } from 'react'
import { Target, Plus, Trash2, ArrowLeft, CheckCircle, Calendar, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SavingsGoals() {
    const { goals = [], addGoal, deleteGoal, setActiveTab } = useApp()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', target: '', saved: '', deadline: '', emoji: '🎯' })

    const EMOJIS = ['🎯', '🏠', '✈️', '📱', '🚗', '🎓', '💍', '🏋️', '💻', '🎮', '💰', '🌴']

    const handleAdd = () => {
        if (!form.name || !form.target) return
        addGoal({
            name: form.name,
            target: Number(form.target),
            saved: Number(form.saved || 0),
            deadline: form.deadline,
            emoji: form.emoji,
            createdAt: new Date().toISOString().split('T')[0],
        })
        setForm({ name: '', target: '', saved: '', deadline: '', emoji: '🎯' })
        setShowForm(false)
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('settings')}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Savings Goals 🎯</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track progress toward your goals</p>
                </div>
                <button onClick={() => setShowForm(p => !p)}
                    className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/30 active:scale-95 transition-all">
                    <Plus size={18} />
                </button>
            </div>

            {showForm && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-3 animate-slide-up">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">New Goal</h3>
                    {/* Emoji picker */}
                    <div className="flex flex-wrap gap-1.5">
                        {EMOJIS.map(e => (
                            <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${form.emoji === e ? 'bg-brand-100 dark:bg-brand-900/30 ring-2 ring-brand-500' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                {e}
                            </button>
                        ))}
                    </div>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Goal name (e.g. New Phone)"
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                            placeholder="Target ₹"
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                        <input type="number" value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))}
                            placeholder="Already saved ₹"
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                    </div>
                    <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 active:scale-[0.98] transition-transform">
                            Cancel
                        </button>
                        <button onClick={handleAdd}
                            className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-emerald-500 text-white shadow-md shadow-brand-500/25 active:scale-[0.98] transition-transform">
                            Add Goal
                        </button>
                    </div>
                </div>
            )}

            {goals.length === 0 && !showForm && (
                <div className="text-center py-12">
                    <p className="text-4xl mb-3">🎯</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No goals yet</p>
                    <p className="text-sm text-gray-400 mt-1">Tap + to add your first savings goal</p>
                </div>
            )}

            <div className="space-y-3">
                {goals.map(goal => {
                    const pct = Math.min((goal.saved / goal.target) * 100, 100)
                    const remaining = goal.target - goal.saved
                    const daysLeft = goal.deadline
                        ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)
                        : null
                    const dailyNeeded = daysLeft > 0 ? (remaining / daysLeft).toFixed(0) : null
                    const done = pct >= 100

                    return (
                        <div key={goal.id} className={`card bg-white dark:bg-gray-800 border ${done ? 'border-emerald-200 dark:border-emerald-800/40' : 'border-gray-100 dark:border-gray-700'} shadow-sm`}>
                            <div className="flex items-start gap-3 mb-3">
                                <span className="text-2xl">{goal.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 dark:text-white text-sm">{goal.name}</p>
                                    <p className="text-[11px] text-gray-400">
                                        ₹{Number(goal.saved).toLocaleString('en-IN')} / ₹{Number(goal.target).toLocaleString('en-IN')}
                                        {daysLeft !== null && <span className="ml-1">· {daysLeft > 0 ? `${daysLeft}d left` : 'Deadline passed!'}</span>}
                                    </p>
                                </div>
                                {done ? (
                                    <span className="text-emerald-500"><CheckCircle size={18} /></span>
                                ) : (
                                    <button onClick={() => deleteGoal(goal.id)}
                                        className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400">
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>

                            {/* Progress bar */}
                            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                <div className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-brand-400 to-emerald-500'}`}
                                    style={{ width: `${pct}%` }} />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold ${done ? 'text-emerald-500' : 'text-brand-600 dark:text-brand-400'}`}>{pct.toFixed(0)}% complete</span>
                                {!done && dailyNeeded && (
                                    <span className="text-[11px] text-gray-400">Save ₹{dailyNeeded}/day</span>
                                )}
                                {done && <span className="text-xs font-semibold text-emerald-500">🎉 Goal Reached!</span>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
