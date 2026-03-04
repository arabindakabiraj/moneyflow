/**
 * BillReminders.jsx — Track upcoming bills and due dates
 */
import { useState } from 'react'
import { Bell, Plus, Trash2, ArrowLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'

const REPEAT_OPTIONS = ['Once', 'Weekly', 'Monthly', 'Yearly']
const BILL_EMOJIS = ['💳', '🏠', '📱', '💡', '🌊', '🎬', '🏋️', '📺', '🚗', '🏥', '📚', '🍔']

export default function BillReminders() {
    const { bills = [], addBill, deleteBill, markBillPaid, setActiveTab } = useApp()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', amount: '', dueDate: '', repeat: 'Monthly', emoji: '💳' })

    const today = new Date().toISOString().split('T')[0]

    const handleAdd = () => {
        if (!form.name || !form.dueDate) return
        addBill({
            name: form.name,
            amount: Number(form.amount || 0),
            dueDate: form.dueDate,
            repeat: form.repeat,
            emoji: form.emoji,
            paid: false,
        })
        setForm({ name: '', amount: '', dueDate: '', repeat: 'Monthly', emoji: '💳' })
        setShowForm(false)
    }

    const getStatus = (bill) => {
        if (bill.paid) return 'paid'
        if (bill.dueDate < today) return 'overdue'
        const daysLeft = Math.ceil((new Date(bill.dueDate) - new Date()) / 86400000)
        if (daysLeft <= 3) return 'urgent'
        return 'upcoming'
    }

    const statusConfig = {
        paid: { label: 'Paid', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
        overdue: { label: 'Overdue!', color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800/40' },
        urgent: { label: 'Due Soon', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-800/30' },
        upcoming: { label: 'Upcoming', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/10', border: 'border-gray-100 dark:border-gray-700' },
    }

    const sorted = [...bills].sort((a, b) => {
        if (a.paid !== b.paid) return a.paid ? 1 : -1
        return new Date(a.dueDate) - new Date(b.dueDate)
    })

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('settings')}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Bill Reminders 🔔</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Track upcoming payments</p>
                </div>
                <button onClick={() => setShowForm(p => !p)}
                    className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/30 active:scale-95 transition-all">
                    <Plus size={18} />
                </button>
            </div>

            {showForm && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-3 animate-slide-up">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Add Bill</h3>
                    <div className="flex flex-wrap gap-1.5">
                        {BILL_EMOJIS.map(e => (
                            <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center ${form.emoji === e ? 'bg-brand-100 dark:bg-brand-900/30 ring-2 ring-brand-500' : 'bg-gray-100 dark:bg-gray-700'}`}>
                                {e}
                            </button>
                        ))}
                    </div>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Bill name (e.g. Netflix, Rent)"
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            placeholder="Amount ₹"
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                        <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                    </div>
                    <div className="flex gap-1.5">
                        {REPEAT_OPTIONS.map(opt => (
                            <button key={opt} onClick={() => setForm(f => ({ ...f, repeat: opt }))}
                                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${form.repeat === opt ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500">Cancel</button>
                        <button onClick={handleAdd}
                            className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-emerald-500 text-white shadow-md">
                            Add Bill
                        </button>
                    </div>
                </div>
            )}

            {bills.length === 0 && !showForm && (
                <div className="text-center py-12">
                    <p className="text-4xl mb-3">🔔</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No bills added</p>
                    <p className="text-sm text-gray-400 mt-1">Tap + to track your first bill</p>
                </div>
            )}

            <div className="space-y-2.5">
                {sorted.map(bill => {
                    const status = getStatus(bill)
                    const cfg = statusConfig[status]
                    const daysLeft = Math.ceil((new Date(bill.dueDate) - new Date()) / 86400000)

                    return (
                        <div key={bill.id} className={`card border ${cfg.border} ${cfg.bg}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{bill.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">{bill.name}</p>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.color} bg-white/50 dark:bg-black/20`}>{cfg.label}</span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                        {bill.amount > 0 && `₹${Number(bill.amount).toLocaleString('en-IN')} · `}
                                        Due {bill.dueDate}
                                        {!bill.paid && daysLeft > 0 && ` · ${daysLeft}d left`}
                                        {!bill.paid && daysLeft <= 0 && ' · Past due!'}
                                        {` · ${bill.repeat}`}
                                    </p>
                                </div>
                                <div className="flex gap-1.5">
                                    {!bill.paid && (
                                        <button onClick={() => markBillPaid(bill.id)}
                                            className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                                            <CheckCircle size={15} />
                                        </button>
                                    )}
                                    <button onClick={() => deleteBill(bill.id)}
                                        className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
