/**
 * Settings.jsx - App settings with Firebase user info + logout
 */
import { useState } from 'react'
import { Target, LogOut, User, CheckCircle, Flame, Info } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { savingsGoal, setSavingsGoal, user, logout } = useApp()
  const [goalInput, setGoalInput] = useState(savingsGoal)
  const [saved, setSaved] = useState(false)

  const saveGoal = () => {
    setSavingsGoal(Number(goalInput))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = async () => {
    if (confirm('Logout করবে?')) await logout()
  }

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      <div>
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">অ্যাপ কাস্টমাইজ করুন</p>
      </div>

      {/* User profile card */}
      {user && (
        <div className="card bg-gradient-to-br from-brand-500 to-emerald-600 text-white shadow-lg shadow-brand-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <User size={22} className="text-white" />
              </div>
              <div>
                <p className="font-display font-bold text-white">
                  {user.displayName || 'MoneyFlow User'}
                </p>
                <p className="text-white/70 text-xs font-mono mt-0.5">
                  {user.phoneNumber || user.email || 'Logged in'}
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <Flame size={16} className="text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Firebase status */}
      <div className="card bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/40">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <Info size={16} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-green-700 dark:text-green-400">✅ Firebase Connected</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              তোমার data securely Firebase Firestore এ সংরক্ষিত হচ্ছে। Real-time sync চালু আছে।
            </p>
          </div>
        </div>
      </div>

      {/* Savings Goal */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
            <Target size={16} className="text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm">🐷 Savings Goal</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">মাসিক সঞ্চয়ের লক্ষ্য সেট করুন</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
            placeholder="যেমন: 2000"
            className="input-field flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" />
          <button onClick={saveGoal}
            className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all ${saved ? 'bg-brand-500 text-white' : 'btn-primary'
              }`}>
            {saved ? <><CheckCircle size={14} /> Saved!</> : 'Save'}
          </button>
        </div>
      </div>

      {/* About */}
      <div className="card bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/10 dark:to-emerald-900/10 border border-brand-100 dark:border-brand-800/20 text-center">
        <p className="text-2xl mb-2">💰</p>
        <p className="font-display font-bold text-gray-800 dark:text-white">MoneyFlow v2.0</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Student Financial Tracker</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">React + Firebase + Gemini AI</p>
      </div>

      {/* Logout */}
      <button onClick={handleLogout}
        className="w-full py-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-rose-100 active:scale-98">
        <LogOut size={16} /> Logout করো
      </button>
    </div>
  )
}
