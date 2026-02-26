/**
 * Dashboard.jsx - Main dashboard with summary cards and recent transactions
 * মূল ড্যাশবোর্ড — সারসংক্ষেপ কার্ড ও সাম্প্রতিক লেনদেন
 */
import { TrendingUp, TrendingDown, Wallet, ChevronRight, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'

const CATEGORY_EMOJI = {
  Tiffin: '🍱', Books: '📚', Travel: '🚌', Tuition: '🎓', Others: '💼'
}

function SummaryCard({ label, amount, type, icon: Icon, gradient }) {
  return (
    <div className={`card ${gradient} text-white relative overflow-hidden`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/30" />
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/20" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">{label}</span>
          <Icon size={16} className="text-white/70" />
        </div>
        <p className="font-display font-bold text-2xl">₹{Number(amount).toLocaleString('en-IN')}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { getSummary, transactions, savingsGoal, setActiveTab, getFilteredTransactions, fetchTransactions, loading } = useApp()
  const summary = getSummary()
  const savingsProgress = Math.min((summary.balance / savingsGoal) * 100, 100)
  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  // Category breakdown for debits
  const catBreakdown = transactions
    .filter(t => t.type === 'debit')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})
  const totalDebit = summary.totalDebit || 1

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <SummaryCard
            label="Total Balance"
            amount={summary.balance}
            icon={Wallet}
            gradient={summary.balance >= 0
              ? 'bg-gradient-to-br from-brand-500 to-emerald-600'
              : 'bg-gradient-to-br from-rose-500 to-red-600'}
          />
        </div>
        <SummaryCard label="Total Credit" amount={summary.totalCredit} icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-400 to-teal-600" />
        <SummaryCard label="Total Debit" amount={summary.totalDebit} icon={TrendingDown}
          gradient="bg-gradient-to-br from-rose-400 to-pink-600" />
      </div>

      {/* 🐷 Savings goal — Piggy Bank Mode */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white text-sm">Piggy Bank Goal</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">₹{summary.balance.toLocaleString('en-IN')} / ₹{savingsGoal.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">
            {savingsProgress.toFixed(0)}%
          </span>
        </div>
        <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
            style={{ width: `${savingsProgress}%` }}
          />
        </div>
        {savingsProgress >= 100 && (
          <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-2 animate-pulse-soft">
            🎉 লক্ষ্য পূরণ হয়েছে! অভিনন্দন!
          </p>
        )}
      </div>

      {/* Category breakdown */}
      {Object.keys(catBreakdown).length > 0 && (
        <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-3">Expense Breakdown</h3>
          <div className="space-y-2.5">
            {Object.entries(catBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400">
                    {CATEGORY_EMOJI[cat] || '💡'} {cat}
                  </span>
                  <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                    ₹{amt.toLocaleString('en-IN')} ({((amt / totalDebit) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full" style={{ width: `${(amt / totalDebit) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Recent Transactions</h3>
          <button onClick={() => setActiveTab('transactions')}
            className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium">
            See all <ChevronRight size={13} />
          </button>
        </div>
        {loading && (
          <div className="flex justify-center py-3">
            <RefreshCw size={16} className="text-brand-500 animate-spin" />
          </div>
        )}
        <div className="space-y-2">
          {recent.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">কোনো লেনদেন নেই। Add করুন!</p>
          ) : recent.map(tx => (
            <TransactionRow key={tx.id} tx={tx} compact />
          ))}
        </div>
      </div>
    </div>
  )
}

export function TransactionRow({ tx, compact = false, onEdit, onDelete, onToggleNeedWant }) {
  const isCredit = tx.type === 'credit'
  return (
    <div className={`flex items-center gap-3 ${!compact ? 'p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl' : 'py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0
        ${isCredit ? 'bg-green-100 dark:bg-green-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
        {CATEGORY_EMOJI[tx.category] || (isCredit ? '💰' : '💸')}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{tx.description}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-gray-400 dark:text-gray-500">{tx.date}</span>
          <span className="text-gray-300 dark:text-gray-600">·</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">{tx.category}</span>
          {tx.type === 'debit' && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <button onClick={() => onToggleNeedWant?.(tx.id)}
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition-colors
                  ${tx.isWant
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                {tx.isWant ? '✨ Want' : '✅ Need'}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`font-mono font-bold text-sm ${isCredit ? 'text-green-600 dark:text-green-400' : 'text-rose-500 dark:text-rose-400'}`}>
          {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
        </span>
        {!compact && (
          <div className="flex gap-1">
            <button onClick={() => onEdit?.(tx)} className="text-xs text-gray-400 hover:text-brand-500 transition-colors px-1.5 py-0.5 rounded-md hover:bg-brand-50 dark:hover:bg-brand-900/20">Edit</button>
            <button onClick={() => onDelete?.(tx.id)} className="text-xs text-gray-400 hover:text-rose-500 transition-colors px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/20">Del</button>
          </div>
        )}
      </div>
    </div>
  )
}
