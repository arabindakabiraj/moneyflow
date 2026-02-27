import { Search, Bell, Moon, Sun, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function Header() {
  const { darkMode, setDarkMode, username, profilePhoto, loading, fetchTransactions, activeTab, setActiveTab } = useApp()

  return (
    <header className="sticky top-0 z-50 px-5 pt-4 pb-3
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100/50 dark:border-gray-800/50">

      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          {/* Profile avatar */}
          <button onClick={() => setActiveTab('settings')} className="relative flex-shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-brand-500/30" />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <span className="text-white text-sm font-bold">
                  {username ? username.charAt(0).toUpperCase() : '₹'}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
          </button>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Hello,</p>
            <h1 className="font-display font-bold text-gray-900 dark:text-white leading-tight text-lg">
              {username || 'User'}! 👋
            </h1>
          </div>
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Refresh */}
          <button onClick={fetchTransactions}
            className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Notification bell */}
          <button onClick={() => setActiveTab('settings')}
            className="relative p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
          </button>

          {/* Dark mode */}
          <button onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90">
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
