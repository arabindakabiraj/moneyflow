/**
 * Settings.jsx — PIN setup, budget manager, user info, logout
 */
import { useState } from 'react'
import { Target, LogOut, User, CheckCircle, Flame, Lock, Plus, Trash2, AlertTriangle, Pencil, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { setupPin, clearPin, isPinSet } from './AppLock'

export default function Settings() {
  const { savingsGoal, setSavingsGoal, user, logout, customCategories, addCategory,
    budgets, saveBudget, removeBudget, getBudgetAlerts,
    username, updateUsername } = useApp()

  const [goalInput, setGoalInput] = useState(savingsGoal)
  const [saved, setSaved] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaved, setNameSaved] = useState(false)

  // PIN state
  const [pinStep, setPinStep] = useState('idle') // idle | setup | change | confirm
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinMsg, setPinMsg] = useState('')

  // Budget state
  const [budgetCat, setBudgetCat] = useState('')
  const [budgetAmt, setBudgetAmt] = useState('')
  const [newCat, setNewCat] = useState('')

  // Custom category
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

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div>
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">অ্যাপ কাস্টমাইজ করুন</p>
      </div>

      {/* User profile */}
      {user && (
        <div className="card bg-gradient-to-br from-brand-500 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <User size={22} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
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
                    className="flex-1 bg-white/20 rounded-xl px-3 py-1.5 text-white placeholder-white/50 text-sm font-semibold outline-none border border-white/30 focus:border-white/60"
                    placeholder="নতুন নাম লিখো..."
                  />
                  <button onClick={() => { updateUsername(nameInput); setEditingName(false); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000) }}
                    className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                    <CheckCircle size={15} className="text-white" />
                  </button>
                  <button onClick={() => setEditingName(false)}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <X size={15} className="text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-display font-bold text-white">
                      {nameSaved ? '✅ Saved!' : username || 'MoneyFlow User'}
                    </p>
                    <p className="text-white/70 text-xs font-mono mt-0.5 truncate">{user.phoneNumber}</p>
                  </div>
                  <button onClick={() => { setNameInput(username); setEditingName(true) }}
                    className="ml-auto w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors shrink-0">
                    <Pencil size={13} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Budget Alerts */}
      {
        alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.category} className={`card border flex items-start gap-3 ${a.exceeded
                ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800/40'
                : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40'
                }`}>
                <AlertTriangle size={16} className={a.exceeded ? 'text-rose-500 mt-0.5 shrink-0' : 'text-amber-500 mt-0.5 shrink-0'} />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${a.exceeded ? 'text-rose-700 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                    {a.exceeded ? '🚨' : '⚠️'} {a.category} budget {a.exceeded ? 'exceeded' : 'almost full'}!
                  </p>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${a.exceeded ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(a.pct, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    ₹{a.spent.toLocaleString('en-IN')} / ₹{a.limit.toLocaleString('en-IN')} ({a.pct}%)
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Budget Manager */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
        <p className="font-semibold text-gray-800 dark:text-white text-sm mb-3">💰 Budget Limits</p>
        <div className="space-y-2 mb-3">
          {Object.entries(budgets).map(([cat, limit]) => (
            <div key={cat} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-brand-600 dark:text-brand-400">₹{limit.toLocaleString('en-IN')}/mo</span>
                <button onClick={() => removeBudget(cat)} className="text-rose-400 hover:text-rose-600 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {Object.keys(budgets).length === 0 && (
            <p className="text-xs text-gray-400">কোনো budget limit নেই। যোগ করো!</p>
          )}
        </div>
        <div className="flex gap-2">
          <select value={budgetCat} onChange={e => setBudgetCat(e.target.value)}
            className="flex-1 input-field bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white py-2 text-sm">
            <option value="">Category বেছে নাও</option>
            {customCategories.map(c => <option key={c}>{c}</option>)}
          </select>
          <input type="number" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)}
            placeholder="₹ Limit" className="w-24 input-field bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white py-2 text-sm font-mono" />
          <button onClick={() => { if (budgetCat && budgetAmt) { saveBudget(budgetCat, budgetAmt); setBudgetCat(''); setBudgetAmt('') } }}
            className="btn-primary px-3 py-2 rounded-xl text-sm">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Custom Category */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
        <p className="font-semibold text-gray-800 dark:text-white text-sm mb-3">🏷️ Custom Categories</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {customCategories.map(c => (
            <span key={c} className="text-xs px-2.5 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg border border-brand-100 dark:border-brand-800/30 font-medium">{c}</span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newCat} onChange={e => setNewCat(e.target.value)}
            placeholder="নতুন category যোগ করো"
            className="flex-1 input-field bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white py-2 text-sm"
            onKeyDown={e => { if (e.key === 'Enter' && newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }} />
          <button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }}
            className="btn-primary px-3 py-2 rounded-xl text-sm"><Plus size={16} /></button>
        </div>
      </div>

      {/* Savings Goal */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Target size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">🐷 Savings Goal</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">মাসিক সঞ্চয়ের লক্ষ্য</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
            className="input-field flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" />
          <button onClick={saveGoal}
            className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-1.5 ${saved ? 'bg-brand-500 text-white' : 'btn-primary'}`}>
            {saved ? <><CheckCircle size={14} /> Saved!</> : 'Save'}
          </button>
        </div>
      </div>

      {/* PIN Lock */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Lock size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">🔐 App Lock (PIN)</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">App open করতে PIN লাগবে</p>
          </div>
        </div>

        {pinStep === 'idle' ? (
          <div className="flex gap-2">
            <button onClick={() => setPinStep('setup')}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/30 hover:bg-violet-100 transition-colors">
              {isPinSet() ? '🔄 PIN change করো' : '➕ PIN set করো'}
            </button>
            {isPinSet() && (
              <button onClick={() => { clearPin(); setPinMsg('🔓 PIN removed') }}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-100 dark:border-rose-800/30">
                Remove
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <input type="password" inputMode="numeric" maxLength={4} value={pin1} onChange={e => setPin1(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit নতুন PIN"
              className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono tracking-widest text-center text-lg" />
            <input type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN আবার দাও"
              className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono tracking-widest text-center text-lg" />
            {pinMsg && <p className="text-xs text-center text-brand-600 dark:text-brand-400">{pinMsg}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setPinStep('idle'); setPin1(''); setPin2(''); setPinMsg('') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">বাতিল</button>
              <button onClick={handleSetPin}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white">SET PIN</button>
            </div>
          </div>
        )}
      </div>

      {/* About */}
      <div className="card bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/10 dark:to-emerald-900/10 border border-brand-100 dark:border-brand-800/20 text-center">
        <p className="text-2xl mb-2">💰</p>
        <p className="font-display font-bold text-gray-800 dark:text-white">MoneyFlow v2.0</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">React + Firebase + Gemini AI + Recharts</p>
      </div>

      {/* Logout */}
      <button onClick={logout}
        className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-98">
        <LogOut size={16} /> Logout করো
      </button>
    </div >
  )
}
