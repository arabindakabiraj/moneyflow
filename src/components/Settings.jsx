/**
 * Settings.jsx - App settings including savings goal, API config
 * অ্যাপ সেটিংস — সঞ্চয়ের লক্ষ্য, API কনফিগ ইত্যাদি
 */
import { useState } from 'react'
import { Target, Key, Link, Info, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Settings() {
  const { savingsGoal, setSavingsGoal, isDemo, CONFIG } = useApp()
  const [goalInput, setGoalInput] = useState(savingsGoal)
  const [saved, setSaved] = useState(false)

  const saveGoal = () => {
    setSavingsGoal(Number(goalInput))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">অ্যাপ কাস্টমাইজ করুন</p>
      </div>

      {/* Connection status */}
      <div className={`card border ${isDemo 
        ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40' 
        : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/40'}`}>
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDemo ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
            <Info size={16} className={isDemo ? 'text-amber-600' : 'text-green-600'} />
          </div>
          <div>
            <p className={`font-semibold text-sm ${isDemo ? 'text-amber-700 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}>
              {isDemo ? '⚠️ Demo Mode চলছে' : '✅ Google Sheets Connected'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isDemo 
                ? '.env ফাইলে VITE_GAS_URL যোগ করলে Google Sheets কানেক্ট হবে' 
                : 'সব ডেটা Google Sheets এ সংরক্ষিত হচ্ছে'}
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
            <p className="font-semibold text-gray-800 dark:text-white text-sm">🐷 Savings Goal (Piggy Bank)</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">মাসিক সঞ্চয়ের লক্ষ্য সেট করুন</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
            placeholder="যেমন: 2000"
            className="input-field flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white" />
          <button onClick={saveGoal}
            className={`px-4 py-3 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition-all ${
              saved ? 'bg-brand-500 text-white' : 'btn-primary'
            }`}>
            {saved ? <><CheckCircle size={14} /> Saved!</> : 'Save'}
          </button>
        </div>
      </div>

      {/* Setup guide */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Key size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <p className="font-semibold text-gray-800 dark:text-white text-sm">API Configuration</p>
        </div>
        <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl font-mono">
            <p className="text-gray-400 dark:text-gray-500 mb-1"># .env ফাইলে যোগ করুন:</p>
            <p className="text-green-600 dark:text-green-400">VITE_GAS_URL=https://script.google.com/...</p>
            <p className="text-blue-600 dark:text-blue-400">VITE_GEMINI_API_KEY=AIza...</p>
          </div>
          <div className="space-y-2">
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">GAS URL কোথায় পাবেন:</span></p>
            <ol className="space-y-1 ml-2">
              <li>1. Google Sheets → Extensions → Apps Script খুলুন</li>
              <li>2. Code.gs এ Backend কোড পেস্ট করুন</li>
              <li>3. Deploy → New Deployment → Web App → Execute as "Me"</li>
              <li>4. Anyone can access → Deploy করুন → URL কপি করুন</li>
            </ol>
          </div>
          <div className="space-y-2">
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Gemini API Key কোথায় পাবেন:</span></p>
            <ol className="space-y-1 ml-2">
              <li>1. <span className="text-blue-500">aistudio.google.com</span> এ যান</li>
              <li>2. "Get API Key" → Create API Key</li>
              <li>3. Key টি কপি করে .env এ রাখুন</li>
            </ol>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/10 dark:to-emerald-900/10 border border-brand-100 dark:border-brand-800/20 text-center">
        <p className="text-2xl mb-2">💰</p>
        <p className="font-display font-bold text-gray-800 dark:text-white">MoneyFlow v1.0</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Student Financial Tracker</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">React + Vite + Tailwind CSS + Google Sheets + Gemini AI</p>
      </div>
    </div>
  )
}
