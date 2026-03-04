/**
 * RecurringTransactions.jsx — Manage and auto-apply recurring transactions
 */
import { useState } from 'react'
import { RefreshCw, Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

const FREQ_OPTIONS = ['Daily', 'Weekly', 'Monthly']

export default function RecurringTransactions() {
    const { recurringTx = [], addRecurring, deleteRecurring, customCategories, setActiveTab } = useApp()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ description: '', amount: '', type: 'debit', category: 'Others', frequency: 'Monthly', account: 'Cash', nextDue: '' })

    const handleAdd = () => {
        if (!form.description || !form.amount || !form.nextDue) return
        addRecurring({ ...form, amount: Number(form.amount) })
        setForm({ description: '', amount: '', type: 'debit', category: 'Others', frequency: 'Monthly', account: 'Cash', nextDue: '' })
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
                    <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Recurring 🔄</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Auto-tracked repeating transactions</p>
                </div>
                <button onClick={() => setShowForm(p => !p)}
                    className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/30 active:scale-95 transition-all">
                    <Plus size={18} />
                </button>
            </div>

            {showForm && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-3 animate-slide-up">
                    <h3 className="font-semibold text-gray-800 dark:text-white text-sm">New Recurring</h3>

                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Description (e.g. Netflix subscription)"
                        className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />

                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                            placeholder="Amount ₹"
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50">
                            <option value="debit">Expense</option>
                            <option value="credit">Income</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50">
                            {customCategories.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <select value={form.account} onChange={e => setForm(f => ({ ...f, account: e.target.value }))}
                            className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50">
                            {['Cash', 'Bank', 'UPI'].map(a => <option key={a}>{a}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-1.5">
                        {FREQ_OPTIONS.map(opt => (
                            <button key={opt} onClick={() => setForm(f => ({ ...f, frequency: opt }))}
                                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${form.frequency === opt ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1 block">Next Due Date</label>
                        <input type="date" value={form.nextDue} onChange={e => setForm(f => ({ ...f, nextDue: e.target.value }))}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500">Cancel</button>
                        <button onClick={handleAdd}
                            className="flex-[2] py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-500 to-emerald-500 text-white shadow-md">
                            Add Recurring
                        </button>
                    </div>
                </div>
            )}

            {recurringTx.length === 0 && !showForm && (
                <div className="text-center py-12">
                    <p className="text-4xl mb-3">🔄</p>
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No recurring transactions</p>
                    <p className="text-sm text-gray-400 mt-1">Add subscriptions, rent, salary etc.</p>
                </div>
            )}

            <div className="space-y-2.5">
                {recurringTx.map(tx => {
                    const isCredit = tx.type === 'credit'
                    return (
                        <div key={tx.id} className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
                                <RefreshCw size={16} className={isCredit ? 'text-emerald-500' : 'text-rose-500'} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{tx.description}</p>
                                <p className="text-[11px] text-gray-400">
                                    {tx.frequency} · {tx.category} · Next: {tx.nextDue}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`font-mono font-bold text-sm ${isCredit ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                                </span>
                                <button onClick={() => deleteRecurring(tx.id)}
                                    className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400">
                                    <Trash2 size={11} />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
