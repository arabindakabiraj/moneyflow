/**
 * Transactions.jsx - Full transaction history with filters and edit/delete
 * সম্পূর্ণ লেনদেনের ইতিহাস — ফিল্টার ও সম্পাদনা সহ
 */
import { useState } from 'react'
import { Calendar, CalendarRange, Filter, X, FileDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TransactionRow } from './Dashboard'
import { exportToPDF } from '../utils/pdfExport'

export default function Transactions({ onEdit }) {
  const { 
    getFilteredTransactions, deleteTransaction, toggleNeedWant,
    filterDate, setFilterDate, filterMonth, setFilterMonth,
    getSummary, transactions 
  } = useApp()
  const [filterMode, setFilterMode] = useState('all') // all | day | month

  const filtered = getFilteredTransactions()
  const summary = getSummary(filtered)

  const clearFilters = () => {
    setFilterDate('')
    setFilterMonth('')
    setFilterMode('all')
  }

  const handleExportPDF = () => {
    exportToPDF(filtered, summary, filterMonth || filterDate || 'All')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Transactions</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} লেনদেন পাওয়া গেছে</p>
        </div>
        <button onClick={handleExportPDF}
          className="flex items-center gap-1.5 btn-primary py-2 px-3 text-xs">
          <FileDown size={14} /> PDF
        </button>
      </div>

      {/* Filter bar */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Filter</span>
        </div>
        <div className="flex gap-2 mb-3">
          {[
            { mode: 'all', label: 'All' },
            { mode: 'day', label: 'By Day', Icon: Calendar },
            { mode: 'month', label: 'By Month', Icon: CalendarRange },
          ].map(({ mode, label, Icon }) => (
            <button key={mode} onClick={() => { setFilterMode(mode); if (mode === 'all') clearFilters() }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === mode ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
              {Icon && <Icon size={12} />} {label}
            </button>
          ))}
        </div>
        {filterMode === 'day' && (
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="input-field bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm py-2" />
        )}
        {filterMode === 'month' && (
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="input-field bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm py-2" />
        )}
        {(filterDate || filterMonth) && (
          <button onClick={clearFilters} className="flex items-center gap-1 mt-2 text-xs text-rose-500 font-medium">
            <X size={12} /> ফিল্টার সরান
          </button>
        )}
      </div>

      {/* Mini summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Balance', amount: summary.balance, color: 'text-gray-800 dark:text-white' },
          { label: 'Credit', amount: summary.totalCredit, color: 'text-green-600 dark:text-green-400' },
          { label: 'Debit', amount: summary.totalDebit, color: 'text-rose-500 dark:text-rose-400' },
        ].map(({ label, amount, color }) => (
          <div key={label} className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
            <p className={`font-mono font-bold text-sm ${color}`}>₹{Number(amount).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">কোনো লেনদেন পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(tx => (
              <TransactionRow
                key={tx.id} tx={tx}
                onEdit={onEdit}
                onDelete={deleteTransaction}
                onToggleNeedWant={toggleNeedWant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
