/**
 * Accounts.jsx — Wallet with multi-layered Liquid Glass account cards
 * Depth stacking, colour-coded left-border glows, animated fade-in
 */
import { useState } from 'react'
import { Wallet, Building2, Smartphone, Pencil, Check, X, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Accounts() {
  const { accounts, updateAccountBalance, transactions, darkMode } = useApp()
  const [editing, setEditing] = useState(null)
  const [input, setInput]     = useState('')

  const accountMeta = {
    cash: {
      label: 'Cash', emoji: '💵', Icon: Wallet,
      gradient: 'from-emerald-500 to-green-600',
      glow: darkMode ? 'rgba(34,197,94,0.45)' : 'rgba(16,185,129,0.25)',
      border: darkMode ? 'rgba(34,197,94,0.35)' : 'rgba(16,185,129,0.35)',
      accent: darkMode ? '#4ade80' : '#047857',
      bg: darkMode ? 'rgba(34,197,94,0.10)' : 'rgba(16,185,129,0.08)',
    },
    bank: {
      label: 'Bank', emoji: '🏦', Icon: Building2,
      gradient: 'from-blue-500 to-indigo-600',
      glow: darkMode ? 'rgba(59,130,246,0.45)' : 'rgba(29,78,216,0.25)',
      border: darkMode ? 'rgba(59,130,246,0.35)' : 'rgba(29,78,216,0.35)',
      accent: darkMode ? '#60a5fa' : '#1d4ed8',
      bg: darkMode ? 'rgba(59,130,246,0.10)' : 'rgba(59,130,246,0.08)',
    },
    upi: {
      label: 'UPI', emoji: '📱', Icon: Smartphone,
      gradient: 'from-violet-500 to-purple-600',
      glow: darkMode ? 'rgba(139,92,246,0.45)' : 'rgba(109,40,217,0.25)',
      border: darkMode ? 'rgba(139,92,246,0.35)' : 'rgba(109,40,217,0.35)',
      accent: darkMode ? '#a78bfa' : '#6d28d9',
      bg: darkMode ? 'rgba(139,92,246,0.10)' : 'rgba(139,92,246,0.08)',
    },
  }

  const save = (key) => {
    if (!isNaN(Number(input))) updateAccountBalance(key, Number(input))
    setEditing(null); setInput('')
  }

  const acctTotals = {}
  transactions.forEach(tx => {
    const a = tx.account?.toLowerCase() || 'cash'
    if (!acctTotals[a]) acctTotals[a] = { credit: 0, debit: 0 }
    if (tx.type === 'credit') acctTotals[a].credit += Number(tx.amount)
    else acctTotals[a].debit += Number(tx.amount)
  })

  const calcBalance = (key) => {
    const base   = accounts[key] ?? 0
    const totals = acctTotals[key] || { credit: 0, debit: 0 }
    return base + totals.credit - totals.debit
  }

  const cashBal = calcBalance('cash')
  const bankBal = calcBalance('bank')
  const  upiBal = calcBalance('upi')
  const totalBalance = cashBal + bankBal + upiBal

  const lastTx = (key) => transactions.filter(tx => (tx.account?.toLowerCase() || 'cash') === key)[0]
  const getBal  = (key) => key === 'cash' ? cashBal : key === 'bank' ? bankBal : upiBal

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white/95">Wallet 💳</h2>
        <p className="text-sm text-gray-500 dark:text-white/45">All accounts in one place</p>
      </div>

      {/* ── Total Balance Hero ── */}
      <div className="lg-deep rounded-3xl p-5 text-center">
        {/* Ambient glow inside */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div style={{
            position:'absolute', top:'-20%', right:'-10%',
            width:'200px', height:'200px', borderRadius:'50%',
            background:'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
            filter:'blur(24px)',
          }} />
        </div>
        <p className="text-xs mb-1 relative z-10 text-black/50 dark:text-white/50">Total Balance</p>
        <p className="font-display font-bold text-4xl relative z-10 text-gray-900 dark:text-white/97" style={{
          textShadow:'0 2px 20px rgba(74,222,128,0.25)',
        }}>
          ₹{totalBalance.toLocaleString('en-IN')}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 relative z-10 flex-wrap">
          {Object.entries(accountMeta).map(([key, { emoji, accent, bg }]) => (
            <span key={key} className="text-xs px-2.5 py-1 rounded-xl font-mono font-semibold"
              style={{ background: bg, color: accent, border: `1px solid ${accent}55` }}>
              {emoji} ₹{getBal(key).toLocaleString('en-IN')}
            </span>
          ))}
        </div>
      </div>

      {/* ── Account cards — depth-stacked with slight offset ── */}
      {Object.entries(accountMeta).map(([key, { label, emoji, Icon, gradient, glow, border, accent, bg }], idx) => {
        const bal            = getBal(key)
        const baseBal        = accounts[key] ?? 0
        const totals         = acctTotals[key] || { credit: 0, debit: 0 }
        const lastTransaction = lastTx(key)
        const txCount        = transactions.filter(tx => (tx.account?.toLowerCase() || 'cash') === key).length

        return (
          <div key={key} className="lg-surface rounded-3xl p-4 stagger-item transition-all"
            style={{
              borderLeft: `3px solid ${border}`,
              boxShadow: darkMode 
                ? `0 8px 32px rgba(0,0,0,0.20), 0 0 0 1px rgba(255,255,255,0.12), 0 0 24px ${glow.replace('0.45','0.12')}`
                : `0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)`,
              animationDelay: `${idx * 60}ms`,
            }}>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3 relative z-10">
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
                style={{ boxShadow: darkMode ? `0 4px 16px ${glow}` : '0 4px 12px rgba(0,0,0,0.08)' }}>
                <Icon size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white/90">{emoji} {label}</p>
                <p className="text-xs text-gray-500 dark:text-white/44">{txCount} transactions</p>
              </div>
              {editing === key ? (
                <div className="flex items-center gap-1.5">
                  <input autoFocus type="number" value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') save(key); if (e.key === 'Escape') setEditing(null) }}
                    className="w-28 px-2 py-1.5 rounded-xl text-sm font-mono outline-none bg-black/[0.05] dark:bg-white/10 border border-black/10 dark:border-white/10 text-gray-900 dark:text-white/90 focus:border-opacity-100"
                    style={{ borderColor: `${accent}77` }}
                    placeholder="₹ Base" />
                  <button onClick={() => save(key)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
                    <Check size={13} />
                  </button>
                  <button onClick={() => setEditing(null)} className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/[0.05] dark:bg-white/10 text-gray-500 dark:text-white/60">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-xl font-mono" style={{ color: accent }}>
                    ₹{bal.toLocaleString('en-IN')}
                  </span>
                  <button onClick={() => { setEditing(key); setInput(String(baseBal)) }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors bg-black/[0.04] dark:bg-white/[0.08] text-gray-500 dark:text-white/45 hover:bg-black/[0.08] dark:hover:bg-white/20">
                    <Pencil size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Income & Expense mini */}
            <div className="flex gap-2 mb-3 relative z-10">
              <div className="flex-1 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                style={{ 
                  background: darkMode ? 'rgba(52,211,153,0.10)' : 'rgba(34,197,94,0.08)',
                  border: darkMode ? '1px solid rgba(52,211,153,0.20)' : '1px solid rgba(34,197,94,0.25)' 
                }}>
                <ArrowDownLeft size={12} style={{ color: 'var(--mf-success)', flexShrink: 0 }} />
                <div>
                  <p className="text-[10px] text-black/40 dark:text-white/38">Income</p>
                  <p className="text-xs font-mono font-bold" style={{ color: 'var(--mf-success)' }}>₹{totals.credit.toLocaleString('en-IN')}</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                style={{ 
                  background: darkMode ? 'rgba(255,107,107,0.10)' : 'rgba(239,68,68,0.08)',
                  border: darkMode ? '1px solid rgba(255,107,107,0.20)' : '1px solid rgba(239,68,68,0.25)' 
                }}>
                <ArrowUpRight size={12} style={{ color: 'var(--mf-error)', flexShrink: 0 }} />
                <div>
                  <p className="text-[10px] text-black/40 dark:text-white/38">Expense</p>
                  <p className="text-xs font-mono font-bold" style={{ color: 'var(--mf-error)' }}>₹{totals.debit.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Last transaction */}
            {lastTransaction && (
              <div className="relative z-10 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                <p className="text-[10px] mb-1 text-black/35 dark:text-white/35">Last transaction</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate max-w-[60%] text-gray-600 dark:text-white/65">
                    {lastTransaction.description || lastTransaction.category}
                  </span>
                  <span className="text-xs font-mono font-bold" style={{ color: lastTransaction.type === 'credit' ? 'var(--mf-success)' : 'var(--mf-error)' }}>
                    {lastTransaction.type === 'credit' ? '+' : '-'}₹{Number(lastTransaction.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-center text-gray-400 dark:text-white/30">
        Set base balance. Income − Expense will auto-calculate.
      </p>
    </div>
  )
}
