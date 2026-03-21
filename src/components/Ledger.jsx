/**
 * Ledger.jsx — Professional Double-Entry Bookkeeping View
 */
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { BookOpen, Search, ChevronLeft, ArrowDownLeft, ArrowUpRight, AlertCircle, TrendingUp } from 'lucide-react'

export default function Ledger() {
  const { getLedgerEntries, openingBalance, setActiveTab } = useApp()
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  const entries = useMemo(() => getLedgerEntries?.() ?? [], [getLedgerEntries])

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const inMonth = !month || (e.date || '').startsWith(month)
      const inSearch = !search || [e.description, e.category].some(
        f => f?.toLowerCase().includes(search.toLowerCase())
      )
      return inMonth && inSearch
    })
  }, [entries, month, search])

  const totalDebit  = filtered.filter(e => e.type === 'debit').reduce((s, e) => s + Number(e.amount), 0)
  const totalCredit = filtered.filter(e => e.type === 'credit').reduce((s, e) => s + Number(e.amount), 0)
  const closing     = filtered.length > 0 ? filtered[filtered.length - 1]?.balance ?? 0 : openingBalance

  if (!openingBalance && openingBalance !== 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 px-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center">
          <AlertCircle size={28} className="text-amber-500" />
        </div>
        <h2 className="font-black text-white text-lg">Opening Balance Required</h2>
        <p className="text-gray-400 text-sm">Set your opening balance in Settings → Financial Setup to use the Ledger.</p>
        <button onClick={() => setActiveTab('settings')}
          className="px-6 py-3 rounded-2xl bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/30 active:scale-95 transition-all">
          Go to Settings
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-white">Ledger</h1>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 ml-10">Double-entry bookkeeping view</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-rose-900/20 border border-rose-800/30 rounded-2xl p-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400 mb-1">Total Debit</p>
          <p className="font-black text-base text-rose-400 font-mono">₹{totalDebit.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-2xl p-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Total Credit</p>
          <p className="font-black text-base text-emerald-400 font-mono">₹{totalCredit.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-indigo-900/20 border border-indigo-800/30 rounded-2xl p-3 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-indigo-300 mb-1">Balance</p>
          <p className={`font-black text-base font-mono ${closing >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
            ₹{Math.abs(closing).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-brand-500/50 transition-colors">
          <Search size={14} className="text-gray-500 shrink-0" />
          <input
            placeholder="Search transactions…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-gray-600 outline-none flex-1 min-w-0"
          />
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500/50 transition-colors"
        />
      </div>

      {/* Ledger entries */}
      <div className="bg-gray-900 border border-white/8 rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-2.5 bg-white/5 border-b border-white/8">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Description</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400 text-right">Debit</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 text-right">Credit</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300 text-right">Balance</span>
        </div>

        {/* Opening balance row */}
        {openingBalance > 0 && (
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-3 border-b border-white/5 bg-indigo-900/[0.12]">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-black bg-indigo-500 text-white px-1.5 py-0.5 rounded-md tracking-wider">OB</span>
                <span className="text-xs font-semibold text-white">Opening Balance</span>
              </div>
              <p className="text-[9px] text-gray-600 mt-0.5">Starting balance before tracking</p>
            </div>
            <span className="text-right text-xs text-gray-700 font-mono self-center">—</span>
            <span className="text-right text-xs text-emerald-400 font-mono font-bold self-center">
              ₹{openingBalance.toLocaleString('en-IN')}
            </span>
            <span className="text-right text-xs text-indigo-300 font-mono font-bold self-center">
              ₹{openingBalance.toLocaleString('en-IN')}
            </span>
          </div>
        )}

        {/* Transaction rows */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <TrendingUp size={32} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No entries for this period</p>
          </div>
        ) : filtered.map((e, i) => (
          <div key={e.id}
            className={`grid grid-cols-[1fr_auto_auto_auto] gap-x-3 px-4 py-3 border-b border-white/[0.04] ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                {e.type === 'debit'
                  ? <ArrowDownLeft size={11} className="text-rose-400 shrink-0" />
                  : <ArrowUpRight size={11} className="text-emerald-400 shrink-0" />}
                <p className="text-xs text-white font-medium truncate">{e.description}</p>
              </div>
              <p className="text-[9px] text-gray-600 mt-0.5 truncate">{e.date} · {e.category}</p>
            </div>
            <span className={`text-right text-xs font-mono font-semibold self-center ${e.type === 'debit' ? 'text-rose-400' : 'text-gray-700'}`}>
              {e.type === 'debit' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
            </span>
            <span className={`text-right text-xs font-mono font-semibold self-center ${e.type === 'credit' ? 'text-emerald-400' : 'text-gray-700'}`}>
              {e.type === 'credit' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
            </span>
            <span className={`text-right text-xs font-mono font-bold self-center ${e.balance >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
              ₹{Math.abs(e.balance ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
