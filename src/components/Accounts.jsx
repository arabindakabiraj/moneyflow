/**
 * Accounts.jsx — Cash / Bank / UPI balance tracker with calculated balances
 */
import { useState } from 'react'
import { Wallet, Building2, Smartphone, Pencil, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

const ACCOUNT_META = {
    cash: { label: 'Cash', emoji: '💵', Icon: Wallet, color: 'from-emerald-500 to-green-600', badge: 'bg-emerald-500/20 text-emerald-300' },
    bank: { label: 'Bank', emoji: '🏦', Icon: Building2, color: 'from-blue-500 to-indigo-600', badge: 'bg-blue-500/20 text-blue-300' },
    upi: { label: 'UPI', emoji: '📱', Icon: Smartphone, color: 'from-violet-500 to-purple-600', badge: 'bg-violet-500/20 text-violet-300' },
}

export default function Accounts() {
    const { accounts, updateAccountBalance, transactions } = useApp()
    const [editing, setEditing] = useState(null)
    const [input, setInput] = useState('')

    const save = (key) => {
        if (!isNaN(Number(input))) updateAccountBalance(key, Number(input))
        setEditing(null)
        setInput('')
    }

    // Per-account transaction totals
    const acctTotals = {}
    transactions.forEach(tx => {
        const a = tx.account?.toLowerCase() || 'cash'
        if (!acctTotals[a]) acctTotals[a] = { credit: 0, debit: 0 }
        if (tx.type === 'credit') acctTotals[a].credit += Number(tx.amount)
        else acctTotals[a].debit += Number(tx.amount)
    })

    // Calculated balance per account = base + income - expense
    const calcBalance = (key) => {
        const base = accounts[key] ?? 0
        const totals = acctTotals[key] || { credit: 0, debit: 0 }
        return base + totals.credit - totals.debit
    }

    const cashBal = calcBalance('cash')
    const bankBal = calcBalance('bank')
    const upiBal = calcBalance('upi')
    const totalBalance = cashBal + bankBal + upiBal

    // Last transaction per account
    const lastTx = (key) => transactions.filter(
        tx => (tx.account?.toLowerCase() || 'cash') === key
    )[0]

    const getBal = (key) => key === 'cash' ? cashBal : key === 'bank' ? bankBal : upiBal

    return (
        <div className="space-y-4 animate-fade-in">
            <div>
                <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Wallet 💳</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">All accounts in one place</p>
            </div>

            {/* Total Balance */}
            <div className="card bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white text-center">
                <p className="text-white/60 text-xs mb-1">Total Balance</p>
                <p className="font-display font-bold text-3xl">₹{totalBalance.toLocaleString('en-IN')}</p>
                <div className="flex items-center justify-center gap-3 mt-3">
                    {Object.entries(ACCOUNT_META).map(([key, { emoji, badge }]) => (
                        <span key={key} className={`text-xs px-2.5 py-1 rounded-lg ${badge} font-mono font-semibold`}>
                            {emoji} ₹{getBal(key).toLocaleString('en-IN')}
                        </span>
                    ))}
                </div>
            </div>

            {/* Account cards */}
            {Object.entries(ACCOUNT_META).map(([key, { label, emoji, Icon, color }]) => {
                const bal = getBal(key)
                const baseBal = accounts[key] ?? 0
                const totals = acctTotals[key] || { credit: 0, debit: 0 }
                const lastTransaction = lastTx(key)
                const txCount = transactions.filter(tx => (tx.account?.toLowerCase() || 'cash') === key).length
                return (
                    <div key={key} className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
                                <Icon size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white">{emoji} {label}</p>
                                <p className="text-xs text-gray-400">{txCount} transactions</p>
                            </div>
                            {editing === key ? (
                                <div className="flex items-center gap-1.5">
                                    <input autoFocus type="number" value={input} onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') save(key); if (e.key === 'Escape') setEditing(null) }}
                                        className="w-28 px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono outline-none focus:border-brand-500" placeholder="₹ Base" />
                                    <button onClick={() => save(key)} className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600"><Check size={13} /></button>
                                    <button onClick={() => setEditing(null)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center"><X size={13} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="font-display font-bold text-xl text-gray-900 dark:text-white font-mono">₹{bal.toLocaleString('en-IN')}</span>
                                    <button onClick={() => { setEditing(key); setInput(String(baseBal)) }}
                                        className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-brand-500 transition-colors">
                                        <Pencil size={13} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Income & Expense stats */}
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1 flex items-center gap-1.5 bg-green-50 dark:bg-green-900/10 rounded-xl px-2.5 py-1.5">
                                <ArrowDownLeft size={12} className="text-green-500 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-gray-400">Income</p>
                                    <p className="text-xs font-mono font-bold text-green-600 dark:text-green-400">₹{totals.credit.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/10 rounded-xl px-2.5 py-1.5">
                                <ArrowUpRight size={12} className="text-rose-500 shrink-0" />
                                <div>
                                    <p className="text-[10px] text-gray-400">Expense</p>
                                    <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">₹{totals.debit.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Last transaction */}
                        {lastTransaction && (
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                                <p className="text-[10px] text-gray-400 mb-1">Last transaction</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[60%]">{lastTransaction.description || lastTransaction.category}</span>
                                    <span className={`text-xs font-mono font-bold ${lastTransaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-rose-500'}`}>
                                        {lastTransaction.type === 'credit' ? '+' : '-'}₹{Number(lastTransaction.amount).toLocaleString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Set base balance. Income - Expense will auto-calculate.</p>
        </div>
    )
}
