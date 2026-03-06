/**
 * BottomNav.jsx — Modern floating bottom nav with glowing active indicator
 */
import { LayoutDashboard, Wallet, BarChart3, User, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'accounts', label: 'Wallet', Icon: Wallet },
  { id: 'add', label: '', Icon: Plus },
  { id: 'charts', label: 'Charts', Icon: BarChart3 },
  { id: 'settings', label: 'Profile', Icon: User },
]

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(env(safe-area-inset-bottom),8px)]">
      <div className="max-w-md mx-auto">
        {/* Floating pill container */}
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl
          rounded-[28px] border border-gray-200/50 dark:border-gray-700/30
          shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]
          px-2 py-2">

          <div className="flex items-center justify-around">
            {TABS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id
              const isCTA = id === 'add'

              if (isCTA) {
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="relative -mt-7 group"
                    aria-label="Add transaction"
                  >
                    {/* Outer glow ring */}
                    <div className="absolute inset-0 rounded-full bg-brand-500/20 blur-xl scale-150 group-active:scale-125 transition-transform" />
                    {/* Main button */}
                    <div className="relative w-[56px] h-[56px] rounded-full bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600
                      flex items-center justify-center
                      shadow-[0_4px_20px_var(--diamond-shadow),0_0_0_3px_rgba(255,255,255,0.2)]
                      dark:shadow-[0_4px_20px_var(--diamond-shadow),0_0_0_3px_rgba(255,255,255,0.05)]
                      group-active:scale-90 transition-all duration-200">
                      <Plus size={24} strokeWidth={2.5} className="text-white" />
                    </div>
                  </button>
                )
              }

              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 relative
                    ${isActive ? 'scale-105' : 'active:scale-95'}`}
                  aria-label={label}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <div className="absolute inset-0 bg-brand-50 dark:bg-brand-500/10 rounded-2xl transition-all duration-300" />
                  )}

                  <Icon
                    size={21}
                    strokeWidth={isActive ? 2.4 : 1.6}
                    className={`relative z-10 transition-all duration-300 ${isActive
                      ? 'text-brand-600 dark:text-brand-400'
                      : 'text-gray-400 dark:text-gray-500'
                      }`}
                  />
                  <span className={`relative z-10 text-[10px] font-bold leading-none transition-all duration-300 ${isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-gray-400 dark:text-gray-500'
                    }`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}
