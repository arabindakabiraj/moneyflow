/**
 * BottomNav.jsx — Premium bottom nav with diamond CTA + profile icon
 */
import { LayoutDashboard, Wallet, BarChart3, User } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'accounts', label: 'Wallet', Icon: Wallet },
  { id: 'add', label: '', Icon: null }, // Diamond CTA
  { id: 'charts', label: 'Charts', Icon: BarChart3 },
  { id: 'settings', label: 'Profile', Icon: User },
]

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      {/* Frosted glass background */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl
        border-t border-gray-200/60 dark:border-gray-700/40
        shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-around px-2 pt-1.5 pb-2 max-w-md mx-auto relative">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            const isDiamond = id === 'add'

            if (isDiamond) {
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className="diamond-btn bg-gradient-to-br from-brand-400 to-emerald-600 relative"
                  style={{ marginTop: '-12px' }}
                >
                  <span className="diamond-icon text-white text-2xl font-light leading-none">+</span>
                </button>
              )
            }

            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-2xl transition-all duration-200 active:scale-110 relative"
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.4 : 1.6}
                  className={`transition-all duration-200 ${isActive
                      ? 'text-brand-500 dark:text-brand-400'
                      : 'text-gray-400 dark:text-gray-500'
                    }`}
                />
                <span className={`text-[10px] font-semibold leading-none mt-0.5 transition-colors duration-200 ${isActive
                    ? 'text-brand-500 dark:text-brand-400'
                    : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  {label}
                </span>
                {/* Active dot indicator */}
                {isActive && (
                  <div className="absolute -bottom-0.5 w-1 h-1 bg-brand-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
