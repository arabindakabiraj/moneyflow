/**
 * Ledger.jsx — Professional Double-Entry Bookkeeping View
 * Debit = What Goes Out | Credit = What Comes In
 */
import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import { BookOpen, Search, ChevronLeft, ArrowDownLeft, ArrowUpRight, AlertCircle, TrendingUp, Info } from 'lucide-react'

export default function Ledger() {
  const { getLedgerEntries, openingBalance, setActiveTab } = useApp()
  const [search, setSearch] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showInfo, setShowInfo] = useState(false)

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
  const netFlow     = totalCredit - totalDebit

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
    <div className="space-y-4 animate-fade-in pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all hover:bg-white/10">
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BookOpen size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-white">Ledger</h1>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 ml-10">Track your money flow with double-entry bookkeeping</p>
        </div>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
          title="Learn about Debit & Credit">
          <Info size={14} className="text-gray-400" />
        </button>
      </div>

      {/* Debit/Credit Info Tooltip */}
      {showInfo && (
        <div className="bg-indigo-900/30 border border-indigo-800/50 rounded-2xl p-4 animate-fade-in">
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowDownLeft size={12} className="text-rose-400" />
              </div>
              <div>
                <p className="font-bold text-white">Debit (What Goes Out)</p>
                <p className="text-xs text-gray-400 mt-0.5">Money you spent or paid. Expenses, transfers, investments.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <ArrowUpRight size={12} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-white">Credit (What Comes In)</p>
                <p className="text-xs text-gray-400 mt-0.5">Money you received. Income, allowance, refunds, transfers in.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards with Premium Design */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Debit Card */}
        <div className="relative overflow-hidden rounded-2xl border border-rose-900/30 p-4 transition-all hover:border-rose-800/50 group"
          style={{ background: 'linear-gradient(135deg, rgba(225,29,72,0.08) 0%, rgba(225,29,72,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #ff6b6b 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" 
                style={{ background: 'rgba(251,113,113,0.20)' }}>
                <ArrowDownLeft size={13} className="text-rose-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-300">Debit</p>
            </div>
            <p className="font-black text-xl text-rose-400 font-mono mb-1">₹{totalDebit.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-500">Money out</p>
          </div>
        </div>

        {/* Credit Card */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-900/30 p-4 transition-all hover:border-emerald-800/50 group"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" 
                style={{ background: 'rgba(52,211,153,0.20)' }}>
                <ArrowUpRight size={13} className="text-emerald-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Credit</p>
            </div>
            <p className="font-black text-xl text-emerald-400 font-mono mb-1">₹{totalCredit.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-500">Money in</p>
          </div>
        </div>
      </div>

      {/* Balance & Net Flow Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Closing Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-900/30 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(79,70,229,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 mb-2">Closing Balance</p>
            <p className={`font-black text-lg font-mono ${closing >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
              {closing >= 0 ? '₹' : '-₹'}{Math.abs(closing).toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-gray-500 mt-1">{closing >= 0 ? 'Positive' : 'Negative'}</p>
          </div>
        </div>

        {/* Net Flow */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-900/30 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-teal-300 mb-2">Net Flow</p>
            <p className={`font-black text-lg font-mono ${netFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netFlow >= 0 ? '+' : '-'}₹{Math.abs(netFlow).toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-gray-500 mt-1">{netFlow >= 0 ? 'Surplus' : 'Deficit'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-indigo-500/50 focus-within:bg-white/[0.08] transition-colors">
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
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 focus:bg-white/[0.08] transition-colors"
        />
      </div>      {/* Ledger entries */}
      <div className="bg-gray-900 border border-white/8 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
        {/* Table header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr] gap-x-4 px-4 py-3 bg-gradient-to-r from-white/8 to-white/4 border-b border-white/8 sticky top-0 z-10">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Description</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 text-right">Debit Out</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 text-right">Credit In</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 text-right">Balance</span>
        </div>

        {/* Opening balance row */}
        {openingBalance > 0 && (
          <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr] gap-x-4 px-4 py-3.5 border-b border-white/5 bg-indigo-900/[0.15] hover:bg-indigo-900/[0.25] transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-md tracking-wider">OB</span>
                <span className="text-xs font-semibold text-white">Opening Balance</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-0.5">Starting balance before tracking</p>
            </div>
            <span className="text-right text-xs text-gray-600 font-mono self-center">—</span>
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
            className={`grid grid-cols-[2fr_1fr_1fr_1.2fr] gap-x-4 px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors ${i % 2 === 0 ? 'bg-white/[0.005]' : ''}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {e.type === 'debit'
                  ? <ArrowDownLeft size={12} className="text-rose-400 shrink-0 mt-0.5" />
                  : <ArrowUpRight size={12} className="text-emerald-400 shrink-0 mt-0.5" />}
                <div>
                  <p className="text-xs text-white font-semibold truncate">{e.description}</p>
                  <p className="text-[8px] text-gray-500 mt-0.5">{e.date} • {e.category}</p>
                </div>
              </div>
            </div>
            <span className={`text-right text-xs font-mono font-bold self-center ${e.type === 'debit' ? 'text-rose-400' : 'text-gray-600'}`}>
              {e.type === 'debit' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
            </span>
            <span className={`text-right text-xs font-mono font-bold self-center ${e.type === 'credit' ? 'text-emerald-400' : 'text-gray-600'}`}>
              {e.type === 'credit' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
            </span>
            <span className={`text-right text-xs font-mono font-bold self-center ${e.balance >= 0 ? 'text-indigo-300' : 'text-rose-400'}`}>
              ₹{Math.abs(e.balance ?? 0).toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-gray-500 px-4 pt-2">
        <p>✓ Ledger uses double-entry bookkeeping: Debit (Out) = Credit (In) + Balance</p>
      </div>
    </div>
  )
}
