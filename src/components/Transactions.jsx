/**
 * Transactions.jsx — Full history with search, filters, undo
 * REDESIGNED: Dark premium styling, clean cards
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
      <div className={`rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-300 ${exiting ? 'opacity-0 translate-y-4' : 'opacity-100'}`}
        style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.60)' }}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-gray-800 dark:text-white/90">Deleted: {tx.description}</p>
          <p className="text-[11px] text-gray-400 dark:text-white/35">₹{Number(tx.amount).toLocaleString('en-IN')} · {tx.category}</p>
        </div>
        <button onClick={onUndo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform"
          style={{ background: '#34D399', boxShadow: '0 4px 12px rgba(52,211,153,0.30)' }}>
          <Undo2 size={13}/> Undo
        </button>
        <button onClick={dismiss} className="text-gray-400 dark:text-white/35"><X size={14}/></button>
      </div>
    </div>
  )
}

export default function Transactions({ onEdit }) {
  const { getFilteredTransactions, deleteTransaction, addTransaction, toggleNeedWant,
          filterDate, setFilterDate, filterMonth, setFilterMonth, getSummary, setActiveTab } = useApp()
  const [filterMode, setFilterMode] = useState('all')
  const [search, setSearch]         = useState('')
  const [undoTx, setUndoTx]         = useState(null)
  const undoTimer = useRef(null)

  const handleDelete = useCallback((id) => {
    const found = getFilteredTransactions().find(t => t.id === id)
    if (!found) { deleteTransaction(id); return }
    setUndoTx(found)
    deleteTransaction(id)
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndoTx(null), 5000)
  }, [deleteTransaction, getFilteredTransactions])

  const handleUndo = useCallback(() => {
    if (!undoTx) return
    const { id, ...data } = undoTx
    addTransaction(data); setUndoTx(null)
    if (undoTimer.current) clearTimeout(undoTimer.current)
  }, [undoTx, addTransaction])

  const allFiltered = getFilteredTransactions()
  const filtered = search.trim()
    ? allFiltered.filter(tx => {
        const q = search.toLowerCase()
        return tx.description?.toLowerCase().includes(q) ||
          tx.category?.toLowerCase().includes(q) ||
          String(tx.amount).includes(search) ||
          (tx.tags||[]).some(t => t.toLowerCase().includes(q)) ||
          tx.notes?.toLowerCase().includes(q)
      })
    : allFiltered

  const summary = getSummary(filtered)

  const clearFilters = () => { setFilterDate(''); setFilterMonth(''); setFilterMode('all'); setSearch('') }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveTab('dashboard')}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <ArrowLeft size={18} className="text-gray-600 dark:text-white/60" />
          </button>
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white/95">Transactions</h2>
            <p className="text-xs text-gray-400 dark:text-white/35">{filtered.length} transactions</p>
          </div>
        </div>
        <button onClick={() => exportToPDF(filtered, summary, filterMonth||filterDate||'All')}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)' }}>
          <FileDown size={14}/> PDF
        </button>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-3"
        style={{ background: 'var(--mf-surface)', border: '1.5px solid var(--mf-border)' }}>
        <Search size={15} className="text-gray-400 dark:text-white/30 flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, category or amount..."
          className="flex-1 bg-transparent text-sm outline-none text-gray-800 dark:text-white/90"
          style={{ caretColor: '#4F8EF7' }} />
        {search && (
          <button onClick={() => setSearch('')} className="text-gray-400 dark:text-white/30"><X size={14}/></button>
        )}
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-gray-400 dark:text-white/35" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-white/30">Filter</span>
        </div>
        <div className="flex gap-2 mb-3">
          {[
            { mode:'all',   label:'All' },
            { mode:'day',   label:'By Day',   Icon:Calendar },
            { mode:'month', label:'By Month', Icon:CalendarRange },
          ].map(({ mode, label, Icon }) => (
            <button key={mode} onClick={() => { setFilterMode(mode); if (mode==='all') clearFilters() }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
              style={filterMode===mode
                ? { background: '#4F8EF7', color: 'white', boxShadow: '0 4px 12px rgba(79,142,247,0.30)' }
                : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.45)' }}>
              {Icon && <Icon size={12}/>} {label}
            </button>
          ))}
        </div>
        {filterMode==='day' && (
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--mf-surface-2)', border: '1.5px solid var(--mf-border)', color: 'rgba(255,255,255,0.90)' }} />
        )}
        {filterMode==='month' && (
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: 'var(--mf-surface-2)', border: '1.5px solid var(--mf-border)', color: 'rgba(255,255,255,0.90)' }} />
        )}
        {(filterDate||filterMonth||search) && (
          <button onClick={clearFilters}
            className="flex items-center gap-1 mt-2 text-xs font-medium text-[#FF6B6B]">
            <X size={12}/> Clear all filters
          </button>
        )}
      </div>

      {/* Mini summary */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label:'Balance', amount:summary.balance,     color:'rgba(255,255,255,0.90)', bg:'rgba(255,255,255,0.05)' },
          { label:'Credit',  amount:summary.totalCredit, color:'#34D399',                bg:'rgba(52,211,153,0.08)' },
          { label:'Debit',   amount:summary.totalDebit,  color:'#FF6B6B',                bg:'rgba(255,107,107,0.08)' },
        ].map(({ label, amount, color, bg }) => (
          <div key={label} className="text-center p-3 rounded-xl"
            style={{ background: bg }}>
            <p className="text-[10px] mb-1 text-gray-400 dark:text-white/35">{label}</p>
            <p className="font-mono font-bold text-sm" style={{ color }}>₹{Number(amount).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Search size={22} className="text-gray-300 dark:text-white/25" />
            </div>
            <p className="text-sm font-medium text-gray-400 dark:text-white/40">
              {search ? `No results for "${search}"` : 'No transactions found'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map(tx => (
              <TransactionRow key={tx.id} tx={tx} onEdit={onEdit} onDelete={handleDelete} onToggleNeedWant={toggleNeedWant} />
            ))}
          </div>
        )}
      </div>

      {undoTx && <UndoToast tx={undoTx} onUndo={handleUndo} onDismiss={() => setUndoTx(null)} />}
    </div>
  )
}
