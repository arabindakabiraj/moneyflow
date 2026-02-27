/**
 * Transactions.jsx - Full transaction history with search + filters + edit/delete
 */
import { useState, useRef, useCallback } from 'react'
import { Calendar, CalendarRange, Filter, X, FileDown, Search, ArrowLeft, Undo2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { TransactionRow } from './Dashboard'
import { exportToPDF } from '../utils/pdfExport'

/* ── Undo Toast ── */
function UndoToast({ tx, onUndo, onDismiss }) {
  const [exiting, setExiting] = useState(false)
  const dismiss = () => { setExiting(true); setTimeout(onDismiss, 300) }
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[90] w-[calc(100%-2rem)] max-w-sm animate-fade-in">
      <div className={`rounded-2xl bg-gray-900 dark:bg-gray-700 shadow-2xl px-4 py-3 flex items-center gap-3 transition-all duration-300 ${exiting ? 'opacity-0 translate-y-4' : 'opacity-100'}`}>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">Deleted: {tx.description}</p>
          <p className="text-gray-400 text-[11px]">₹{Number(tx.amount).toLocaleString('en-IN')} · {tx.category}</p>
        </div>
        <button onClick={onUndo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-500 text-white text-xs font-bold active:scale-95 transition-transform shadow-sm">
          <Undo2 size={13} /> Undo
        </button>
        <button onClick={dismiss} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default function Transactions({ onEdit }) {
  const {
    getFilteredTransactions, deleteTransaction, addTransaction, toggleNeedWant,
    filterDate, setFilterDate, filterMonth, setFilterMonth,
    getSummary, setActiveTab,
  } = useApp()
  const [filterMode, setFilterMode] = useState('all')
  const [search, setSearch] = useState('')
  const [undoTx, setUndoTx] = useState(null)
  const undoTimer = useRef(null)

  // Delete with undo — saves tx data, deletes from DB, shows toast
  const handleDelete = useCallback((id) => {
    const allTx = getFilteredTransactions()
    const found = allTx.find(t => t.id === id)
    if (!found) { deleteTransaction(id); return }

    // Save for undo
    setUndoTx(found)
    deleteTransaction(id)

    // Auto-dismiss undo after 5s
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndoTx(null), 5000)
  }, [deleteTransaction, getFilteredTransactions])

  const handleUndo = useCallback(() => {
    if (!undoTx) return
    const { id, ...data } = undoTx
    addTransaction(data)
    setUndoTx(null)
    if (undoTimer.current) clearTimeout(undoTimer.current)
  }, [undoTx, addTransaction])

  const allFiltered = getFilteredTransactions()

  // Search filter on top of date filters
  const filtered = search.trim()
    ? allFiltered.filter(tx =>
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.category?.toLowerCase().includes(search.toLowerCase()) ||
      String(tx.amount).includes(search)
    )
    : allFiltered

  const summary = getSummary(filtered)

  const clearFilters = () => {
    setFilterDate('')
    setFilterMonth('')
    setFilterMode('all')
    setSearch('')
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('settings')}
            className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Transactions</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{filtered.length} লেনদেন</p>
          </div>
        </div>
        <button onClick={() => exportToPDF(filtered, summary, filterMonth || filterDate || 'All')}
          className="flex items-center gap-1.5 btn-primary py-2 px-3 text-xs">
          <FileDown size={14} /> PDF
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2.5 shadow-sm">
        <Search size={15} className="text-gray-400 shrink-0" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="নাম, category বা amount দিয়ে খোঁজো..."
          className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={14} />
          </button>
        )}
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
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterMode === mode ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
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
        {(filterDate || filterMonth || search) && (
          <button onClick={clearFilters} className="flex items-center gap-1 mt-2 text-xs text-rose-500 font-medium">
            <X size={12} /> সব ফিল্টার সরান
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
            <p className="text-4xl mb-3">{search ? '🔍' : '📭'}</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {search ? `"${search}" এ কিছু পাওয়া যায়নি` : 'কোনো লেনদেন পাওয়া যায়নি'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(tx => (
              <TransactionRow key={tx.id} tx={tx} onEdit={onEdit} onDelete={handleDelete} onToggleNeedWant={toggleNeedWant} />
            ))}
          </div>
        )}
      </div>

      {/* Undo Toast */}
      {undoTx && (
        <UndoToast tx={undoTx} onUndo={handleUndo} onDismiss={() => setUndoTx(null)} />
      )}
    </div>
  )
}
