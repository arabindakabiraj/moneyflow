/**
 * Settings.jsx — Modern profile & settings page
 */
import { useState, useRef } from 'react'
import { Target, LogOut, User, CheckCircle, Lock, Plus, Trash2, AlertTriangle, Pencil, X, ChevronRight, Camera, Shield, Tag, Wallet, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { setupPin, clearPin, isPinSet } from './AppLock'

/* ── tiny section label ── */
const SectionLabel = ({ children }) => (
  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1 pt-2">
    {children}
  </p>
)

export default function Settings() {
  const { savingsGoal, setSavingsGoal, user, logout, customCategories, addCategory,
    budgets, saveBudget, removeBudget, getBudgetAlerts,
    username, updateUsername, profilePhoto, updateProfilePhoto } = useApp()

  const fileRef = useRef(null)
  const [goalInput, setGoalInput] = useState(savingsGoal)
  const [saved, setSaved] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaved, setNameSaved] = useState(false)

  // PIN state
  const [pinStep, setPinStep] = useState('idle')
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinMsg, setPinMsg] = useState('')

  // Budget state
  const [budgetCat, setBudgetCat] = useState('')
  const [budgetAmt, setBudgetAmt] = useState('')
  const [newCat, setNewCat] = useState('')

  // Expandable sections
  const [expandBudget, setExpandBudget] = useState(false)
  const [expandCategories, setExpandCategories] = useState(false)

  const alerts = getBudgetAlerts()

  const saveGoal = () => {
    setSavingsGoal(Number(goalInput))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSetPin = () => {
    if (pin1.length !== 4) { setPinMsg('4 digit PIN দাও'); return }
    if (pinStep === 'setup' && pin2.length !== 4) { setPinMsg('PIN আবার দাও'); return }
    if (pinStep === 'setup' && pin1 !== pin2) { setPinMsg('PIN মিলছে না!'); return }
    if (pinStep === 'setup') {
      setupPin(pin1)
      setPinMsg('✅ PIN set হয়েছে!')
      setTimeout(() => { setPinStep('idle'); setPin1(''); setPin2(''); setPinMsg('') }, 1500)
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => updateProfilePhoto(reader.result)
    reader.readAsDataURL(file)
  }

  const initials = (username || 'M').charAt(0).toUpperCase()

  return (
    <div className="space-y-5 animate-fade-in pb-6">

      {/* ═══════════ PROFILE HERO CARD ═══════════ */}
      {user && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-emerald-500 to-teal-600 p-6 text-white shadow-lg shadow-brand-500/20">
          {/* decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex flex-col items-center text-center">
            {/* avatar */}
            <button onClick={() => fileRef.current?.click()}
              className="group relative mb-3">
              <div className="w-20 h-20 rounded-full ring-4 ring-white/30 overflow-hidden bg-white/20 flex items-center justify-center shadow-lg">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-display font-bold text-white/90">{initials}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center group-active:scale-90 transition-transform">
                <Camera size={14} className="text-brand-600" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

            {/* name */}
            {editingName ? (
              <div className="flex items-center gap-2 w-full max-w-xs mt-1">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      updateUsername(nameInput)
                      setEditingName(false)
                      setNameSaved(true)
                      setTimeout(() => setNameSaved(false), 2000)
                    }
                    if (e.key === 'Escape') setEditingName(false)
                  }}
                  className="flex-1 bg-white/20 backdrop-blur rounded-xl px-3 py-2 text-white placeholder-white/50 text-sm font-semibold outline-none border border-white/30 focus:border-white/60 text-center"
                  placeholder="নতুন নাম লিখো..."
                />
                <button onClick={() => { updateUsername(nameInput); setEditingName(false); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000) }}
                  className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                  <CheckCircle size={15} />
                </button>
                <button onClick={() => setEditingName(false)}
                  className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="font-display font-bold text-lg leading-tight">
                    {nameSaved ? '✅ Saved!' : username || 'MoneyFlow User'}
                  </h3>
                  <button onClick={() => { setNameInput(username); setEditingName(true) }}
                    className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                    <Pencil size={11} />
                  </button>
                </div>
                <p className="text-white/60 text-xs font-mono mt-1">{user.phoneNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════ BUDGET ALERTS (if any) ═══════════ */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.category} className={`card border flex items-start gap-3 ${a.exceeded
              ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/40'
              : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
              }`}>
              <AlertTriangle size={16} className={a.exceeded ? 'text-rose-500 mt-0.5 shrink-0' : 'text-amber-500 mt-0.5 shrink-0'} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${a.exceeded ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                  {a.category} budget {a.exceeded ? 'exceeded' : 'almost full'}
                </p>
                <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${a.exceeded ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(a.pct, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ₹{a.spent.toLocaleString('en-IN')} / ₹{a.limit.toLocaleString('en-IN')} ({a.pct}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════ PREFERENCES ═══════════ */}
      <div>
        <SectionLabel>Preferences</SectionLabel>
        <div className="mt-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">

          {/* Savings Goal row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
              <Target size={17} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Savings Goal</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">মাসিক সঞ্চয়ের লক্ষ্য</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">₹</span>
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                className="w-20 text-right text-sm font-mono font-semibold text-brand-600 dark:text-brand-400 bg-transparent outline-none" />
              <button onClick={saveGoal}
                className={`ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${saved ? 'bg-brand-500 text-white' : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 hover:bg-brand-100'}`}>
                {saved ? '✓' : 'Save'}
              </button>
            </div>
          </div>

          {/* Custom Categories row */}
          <div>
            <button onClick={() => setExpandCategories(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <Tag size={17} className="text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">Custom Categories</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{customCategories.length} categories</p>
              </div>
              <ChevronRight size={16} className={`text-gray-300 dark:text-gray-600 transition-transform ${expandCategories ? 'rotate-90' : ''}`} />
            </button>
            {expandCategories && (
              <div className="px-4 pb-4 animate-fade-in">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {customCategories.map(c => (
                    <span key={c} className="text-[11px] px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium">{c}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCat} onChange={e => setNewCat(e.target.value)}
                    placeholder="Add new category…"
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 transition"
                    onKeyDown={e => { if (e.key === 'Enter' && newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }} />
                  <button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }}
                    className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ BUDGET ═══════════ */}
      <div>
        <SectionLabel>Budget</SectionLabel>
        <div className="mt-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <button onClick={() => setExpandBudget(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Wallet size={17} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">Budget Limits</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {Object.keys(budgets).length === 0 ? 'No limits set' : `${Object.keys(budgets).length} active limits`}
              </p>
            </div>
            <ChevronRight size={16} className={`text-gray-300 dark:text-gray-600 transition-transform ${expandBudget ? 'rotate-90' : ''}`} />
          </button>

          {expandBudget && (
            <div className="px-4 pb-4 animate-fade-in border-t border-gray-100 dark:border-gray-700/60 pt-3">
              {Object.keys(budgets).length > 0 ? (
                <div className="space-y-2.5 mb-4">
                  {Object.entries(budgets).map(([cat, limit]) => (
                    <div key={cat} className="flex items-center justify-between py-1">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">₹{limit.toLocaleString('en-IN')}<span className="text-gray-400 font-normal text-xs">/mo</span></span>
                        <button onClick={() => removeBudget(cat)} className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">কোনো budget limit নেই। নিচে যোগ করো!</p>
              )}
              <div className="flex gap-2">
                <select value={budgetCat} onChange={e => setBudgetCat(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50">
                  <option value="">Category</option>
                  {customCategories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)}
                  placeholder="₹ Limit"
                  className="w-24 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-sm font-mono text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50" />
                <button onClick={() => { if (budgetCat && budgetAmt) { saveBudget(budgetCat, budgetAmt); setBudgetCat(''); setBudgetAmt('') } }}
                  className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ SECURITY ═══════════ */}
      <div>
        <SectionLabel>Security</SectionLabel>
        <div className="mt-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                <Shield size={17} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">App Lock</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {isPinSet() ? 'PIN is enabled' : 'Protect your app with a PIN'}
                </p>
              </div>
              {isPinSet() && (
                <span className="px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase tracking-wide">Active</span>
              )}
            </div>

            {pinStep === 'idle' ? (
              <div className="flex gap-2">
                <button onClick={() => setPinStep('setup')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/30 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors active:scale-[0.98]">
                  {isPinSet() ? 'Change PIN' : 'Set PIN'}
                </button>
                {isPinSet() && (
                  <button onClick={() => { clearPin(); setPinMsg('🔓 PIN removed') }}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-800/30 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors active:scale-[0.98]">
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <input type="password" inputMode="numeric" maxLength={4} value={pin1} onChange={e => setPin1(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit PIN"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono tracking-[0.3em] text-center text-lg outline-none focus:ring-2 focus:ring-violet-500/50 transition" />
                <input type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Confirm PIN"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono tracking-[0.3em] text-center text-lg outline-none focus:ring-2 focus:ring-violet-500/50 transition" />
                {pinMsg && <p className="text-xs text-center text-brand-600 dark:text-brand-400 font-medium">{pinMsg}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setPinStep('idle'); setPin1(''); setPin2(''); setPinMsg('') }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 active:scale-[0.98] transition-transform">Cancel</button>
                  <button onClick={handleSetPin}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white active:scale-[0.98] transition-transform shadow-sm shadow-violet-500/30">Set PIN</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ ABOUT & ACCOUNT ═══════════ */}
      <div>
        <SectionLabel>About</SectionLabel>
        <div className="mt-2 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700/60">

          {/* App info row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <Info size={17} className="text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">MoneyFlow</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">React + Firebase + Gemini AI</p>
            </div>
            <span className="text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700 px-2 py-0.5 rounded-md">v2.0</span>
          </div>

          {/* Logout row */}
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-rose-50 dark:active:bg-rose-900/10 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
              <LogOut size={17} className="text-rose-500 dark:text-rose-400" />
            </div>
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Log Out</p>
          </button>
        </div>
      </div>

    </div>
  )
}
