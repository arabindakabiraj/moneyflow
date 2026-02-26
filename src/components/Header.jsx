/**
 * Header.jsx - Top navigation bar
 * উপরের নেভিগেশন বার
 */
import { Moon, Sun, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { darkMode, setDarkMode, isDemo, loading, fetchTransactions } = useApp()

  return (
    <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
      
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <span className="text-white text-sm font-bold">₹</span>
        </div>
        <div>
          <h1 className="font-display font-bold text-gray-900 dark:text-white leading-none text-base">MoneyFlow</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-none mt-0.5">Smart Tracker</p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
          isDemo 
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        }`}>
          {isDemo ? <WifiOff size={11} /> : <Wifi size={11} />}
          {isDemo ? 'Demo' : 'Live'}
        </div>

        {/* Refresh */}
        <button onClick={fetchTransactions} className="btn-ghost p-2 rounded-xl text-gray-600 dark:text-gray-400">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>

        {/* Dark mode toggle */}
        <button onClick={() => setDarkMode(!darkMode)} 
          className="btn-ghost p-2 rounded-xl text-gray-600 dark:text-gray-400">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  )
}
