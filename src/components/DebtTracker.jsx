/**
 * DebtTracker.jsx — কে কত টাকা নিয়েছে / দিতে হবে
 */
import { useState } from 'react'
import { Plus, Users, ArrowUpRight, ArrowDownLeft, Check, Trash2, ChevronDown, ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function DebtTracker() {
    const { debts, addDebt, markDebtRepaid, deleteDebt, setActiveTab } = useApp()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', amount: '', type: 'they_owe', note: '', date: new Date().toISOString().split('T')[0] })

    const iOwe = debts.filter(d => d.type === 'i_owe' && !d.repaid)
    const theyOwe = debts.filter(d => d.type === 'they_owe' && !d.repaid)
    const repaid = debts.filter(d => d.repaid)

    const totalIOwe = iOwe.reduce((s, d) => s + Number(d.amount), 0)
    const totalTheyOwe = theyOwe.reduce((s, d) => s + Number(d.amount), 0)

    const handleAdd = () => {
        if (!form.name.trim() || !form.amount) return
        addDebt({ ...form, amount: Number(form.amount) })
        setForm({ name: '', amount: '', type: 'they_owe', note: '', date: new Date().toISOString().split('T')[0] })
        setShowForm(false)
    }

    const DebtRow = ({ d, onRepay, onDelete }) => (
        <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${d.type === 'i_owe' ? 'bg-rose-100 dark:bg-rose-900/20' : 'bg-green-100 dark:bg-green-900/20'
                }`}>
                {d.type === 'i_owe'
                    ? <ArrowUpRight size={16} className="text-rose-500" />
                    : <ArrowDownLeft size={16} className="text-green-500" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{d.name}</p>
                {d.note && <p className="text-xs text-gray-400 truncate">{d.note}</p>}
                <p className="text-[10px] text-gray-400">{d.date}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                <span className={`font-mono font-bold text-sm ${d.type === 'i_owe' ? 'text-rose-500' : 'text-green-600 dark:text-green-400'}`}>
                    ₹{Number(d.amount).toLocaleString('en-IN')}
                </span>
                {!d.repaid && (
                    <button onClick={() => onRepay(d.id)}
                        className="w-7 h-7 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all" title="Repaid হয়েছে">
                        <Check size={13} />
                    </button>
                )}
                <button onClick={() => onDelete(d.id)}
                    className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    )

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveTab('settings')}
                        className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Debt Tracker 🤝</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">কার কাছে টাকা আছে, কাকে দিতে হবে</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(s => !s)}
                    className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 active:scale-95 transition-all">
                    <Plus size={20} />
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 text-center">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">🏦 পাবো</p>
                    <p className="font-display font-bold text-xl text-green-700 dark:text-green-400">₹{totalTheyOwe.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-green-500 mt-0.5">{theyOwe.length} জন বকেয়া</p>
                </div>
                <div className="card bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 text-center">
                    <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">💸 দেবো</p>
                    <p className="font-display font-bold text-xl text-rose-600 dark:text-rose-400">₹{totalIOwe.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-rose-400 mt-0.5">{iOwe.length} জনকে দিতে হবে</p>
                </div>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-3">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">➕ নতুন Debt যোগ করো</p>
                    {/* Type toggle */}
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        {[{ v: 'they_owe', l: '💰 সে আমাকে দেবে' }, { v: 'i_owe', l: '💸 আমি দেবো' }].map(({ v, l }) => (
                            <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${form.type === v ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow' : 'text-gray-500'}`}>{l}</button>
                        ))}
                    </div>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="নাম (যেমন: Rahul, Mama)"
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm" />
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="পরিমাণ (₹)"
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm font-mono" />
                    <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                        placeholder="কারণ (optional)"
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm" />
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm" />
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">বাতিল</button>
                        <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white shadow-md shadow-brand-500/30">Save করো</button>
                    </div>
                </div>
            )}

            {/* They owe me */}
            {theyOwe.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">💰 যারা আমাকে দেবে ({theyOwe.length})</p>
                    {theyOwe.map(d => <DebtRow key={d.id} d={d} onRepay={markDebtRepaid} onDelete={deleteDebt} />)}
                </div>
            )}

            {/* I owe */}
            {iOwe.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">💸 যাদের দিতে হবে ({iOwe.length})</p>
                    {iOwe.map(d => <DebtRow key={d.id} d={d} onRepay={markDebtRepaid} onDelete={deleteDebt} />)}
                </div>
            )}

            {/* Repaid */}
            {repaid.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 opacity-60">
                    <p className="font-semibold text-sm text-gray-500 mb-2">✅ Settled ({repaid.length})</p>
                    {repaid.map(d => <DebtRow key={d.id} d={d} onRepay={() => { }} onDelete={deleteDebt} />)}
                </div>
            )}

            {debts.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-5xl mb-3">🤝</p>
                    <p className="text-gray-500 dark:text-gray-400 font-semibold">কোনো debt নেই!</p>
                    <p className="text-gray-400 text-sm mt-1">+ বোতাম চাপো record করতে</p>
                </div>
            )}
        </div>
    )
}
