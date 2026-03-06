/**
 * FamilyMode.jsx — Premium invite-code account linking for shared finances
 */
import { useState, useMemo } from 'react'
import { ArrowLeft, Users, Link, Unlink, Copy, CheckCircle, Heart, TrendingUp, TrendingDown, RefreshCw, ArrowRight, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function FamilyMode() {
  const {
    setActiveTab, uid, username,
    familySettings, familyTransactions,
    generateInviteCode, linkPartner, unlinkPartner,
  } = useApp()

  const [codeInput, setCodeInput] = useState('')
  const [linkingStatus, setLinkingStatus] = useState('')
  const [linkError, setLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const [activeView, setActiveView] = useState('main')

  const isLinked = !!familySettings?.linkedUid
  const myCode = familySettings?.inviteCode || ''

  const handleGenerateCode = async () => { await generateInviteCode() }

  const handleLink = async () => {
    if (!codeInput.trim() || codeInput.length < 6) return
    setLinkingStatus('loading'); setLinkError('')
    try {
      const result = await linkPartner(codeInput.trim().toUpperCase())
      if (result.success) { setLinkingStatus('success'); setCodeInput('') }
      else { setLinkingStatus('error'); setLinkError(result.error || 'Invalid code') }
    } catch { setLinkingStatus('error'); setLinkError('Connection failed') }
  }

  const handleUnlink = async () => {
    if (!confirm('Unlink your partner? You can always re-link later.')) return
    await unlinkPartner()
  }

  const copyCode = () => {
    navigator.clipboard?.writeText(myCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const familyStats = useMemo(() => {
    if (!familyTransactions || familyTransactions.length === 0) return { income: 0, expense: 0, balance: 0, count: 0 }
    const month = new Date().toISOString().slice(0, 7)
    const monthTx = familyTransactions.filter(t => t.date?.startsWith(month))
    const income = monthTx.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0)
    const expense = monthTx.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0)
    return { income, expense, balance: income - expense, count: monthTx.length }
  }, [familyTransactions])

  // ═══════ COMBINED DASHBOARD ═══════
  if (activeView === 'dashboard' && isLinked) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setActiveView('main')}
            className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Family Dashboard</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Combined finances this month</p>
          </div>
        </div>

        {/* Combined stats card */}
        <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white text-center p-6 shadow-xl shadow-rose-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Combined Balance</p>
          <p className="font-display font-bold text-4xl mt-2 tracking-tight">₹{familyStats.balance.toLocaleString('en-IN')}</p>
          <div className="flex justify-center gap-8 mt-4">
            <div className="text-center">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-1">
                <TrendingUp size={14} className="text-white/80" />
              </div>
              <p className="text-[10px] text-white/50 font-semibold">Income</p>
              <p className="font-mono font-bold text-sm">₹{familyStats.income.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-1">
                <TrendingDown size={14} className="text-white/80" />
              </div>
              <p className="text-[10px] text-white/50 font-semibold">Expense</p>
              <p className="font-mono font-bold text-sm">₹{familyStats.expense.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        {/* Recent transactions */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 px-1">
            Partner's Transactions
          </p>
          {familyTransactions.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 text-center py-10">
              <Users size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No transactions from partner yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {familyTransactions.slice(0, 15).map((tx, i) => (
                <div key={tx.id || i} className="rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tx.type === 'credit'
                    ? 'bg-emerald-50 dark:bg-emerald-900/15' : 'bg-rose-50 dark:bg-rose-900/15'}`}>
                    {tx.type === 'credit'
                      ? <TrendingUp size={16} className="text-emerald-500" />
                      : <TrendingDown size={16} className="text-rose-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{tx.description}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                      {tx.ownerName || 'Partner'} • {tx.date} • {tx.category}
                    </p>
                  </div>
                  <p className={`font-mono font-bold text-sm shrink-0 ${tx.type === 'credit'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════ MAIN VIEW ═══════
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => setActiveTab('settings')}
          className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Family Mode</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Share finances with your partner</p>
        </div>
      </div>

      {isLinked ? (
        /* ─── Connected state ─── */
        <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 text-white p-6 shadow-xl shadow-rose-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[22px] bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Heart size={26} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-base">Connected with {familySettings?.linkedName || 'Partner'}</p>
              <p className="text-white/60 text-xs mt-0.5">Finances are being shared 💕</p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setActiveView('dashboard')}
              className="flex-1 py-3 rounded-2xl text-sm font-bold bg-white/15 backdrop-blur text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              View Dashboard <ArrowRight size={14} />
            </button>
            <button onClick={handleUnlink}
              className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white/70 active:scale-90 transition-transform">
              <Unlink size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ─── Generate Code ─── */}
          <div className="rounded-3xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/15 flex items-center justify-center">
                <Link size={18} className="text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Your Invite Code</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Share this with your partner</p>
              </div>
            </div>

            {myCode ? (
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-2xl px-5 py-4 text-center border border-gray-200/50 dark:border-gray-600/30">
                  <p className="font-mono font-extrabold text-3xl tracking-[0.4em] text-brand-600 dark:text-brand-400 select-all">{myCode}</p>
                </div>
                <button onClick={copyCode}
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${copied
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-gray-600/50'}`}>
                  {copied ? <CheckCircle size={20} /> : <Copy size={18} />}
                </button>
              </div>
            ) : (
              <button onClick={handleGenerateCode}
                className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all">
                Generate Code
              </button>
            )}
          </div>

          {/* ─── Link with partner ─── */}
          <div className="rounded-3xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-pink-50 dark:bg-pink-900/15 flex items-center justify-center">
                <Heart size={18} className="text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Link Partner</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">Enter your partner's invite code</p>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                placeholder="ABCDEF"
                maxLength={6}
                className="flex-1 px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-gray-900 dark:text-white font-mono text-center text-xl tracking-[0.4em] uppercase outline-none focus:ring-2 focus:ring-pink-500/40 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              <button onClick={handleLink} disabled={codeInput.length < 6 || linkingStatus === 'loading'}
                className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white active:scale-[0.98] disabled:opacity-30 transition-all shadow-lg shadow-pink-500/20">
                {linkingStatus === 'loading' ? <RefreshCw size={16} className="animate-spin" /> : 'Link'}
              </button>
            </div>

            {linkingStatus === 'success' && (
              <div className="flex items-center gap-2 justify-center py-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Successfully linked!</p>
              </div>
            )}
            {linkingStatus === 'error' && (
              <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold text-center py-1">❌ {linkError}</p>
            )}
          </div>

          {/* ─── How it works ─── */}
          <div className="rounded-2xl bg-pink-50/50 dark:bg-pink-900/10 border border-pink-100/50 dark:border-pink-800/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={12} className="text-pink-500" />
              <p className="text-xs text-pink-700 dark:text-pink-300 font-bold">How it works</p>
            </div>
            <div className="space-y-1.5">
              {[
                'Generate your invite code & share with partner',
                'Partner enters your code to link accounts',
                'View combined finances in Family Dashboard',
                'Your data stays private until you link',
                'Unlink anytime — it goes both ways',
              ].map((text, i) => (
                <p key={i} className="text-[11px] text-pink-600/70 dark:text-pink-400/70 flex items-start gap-2">
                  <span className="text-pink-400 mt-0.5">•</span> {text}
                </p>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
