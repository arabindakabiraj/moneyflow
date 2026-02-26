/**
 * BottomNav.jsx - Mobile bottom navigation (6 tabs with Charts)
 */
import { LayoutDashboard, PlusCircle, List, MessageCircle, Settings, BarChart2 } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'transactions', label: 'History', Icon: List },
  { id: 'add', label: 'Add', Icon: PlusCircle },
  { id: 'charts', label: 'Charts', Icon: BarChart2 },
  { id: 'ai', label: 'AI', Icon: MessageCircle },
  { id: 'settings', label: 'More', Icon: Settings },
]

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
      border-t border-gray-200/60 dark:border-gray-700/60">
      <div className="flex items-center justify-around px-1 pt-2 pb-1 max-w-md mx-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          const isAdd = id === 'add'
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-2xl transition-all duration-200 min-w-[48px]
                ${isAdd
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 -translate-y-2 px-3 py-2'
                  : isActive
                    ? 'text-brand-500 dark:text-brand-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
            >
              <Icon size={isAdd ? 20 : 18} strokeWidth={isActive || isAdd ? 2.5 : 1.8} />
              <span className={`text-[9px] font-semibold leading-none ${isAdd ? 'text-white' : ''}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
