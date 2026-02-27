/**
 * BottomNav.jsx - Mobile bottom navigation (5 tabs with centered Add button)
 */
import { LayoutDashboard, PlusCircle, MessageCircle, MoreVertical, Wallet } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'accounts', label: 'Wallet', Icon: Wallet },
  { id: 'add', label: 'Add', Icon: PlusCircle },
  { id: 'ai', label: 'AI', Icon: MessageCircle },
  { id: 'settings', label: 'More', Icon: MoreVertical },
]

export default function BottomNav() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom
      bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl
      border-t border-gray-200/60 dark:border-gray-700/60">
      <div className="flex items-center justify-around px-2 pt-1.5 pb-2 max-w-md mx-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          const isAdd = id === 'add'
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-200
                ${isAdd
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40 -translate-y-3 w-14 h-14 rounded-xl active:scale-110'
                  : `min-w-[48px] px-2 py-1.5 active:scale-125 ${isActive
                    ? 'text-brand-500 dark:text-brand-400 scale-110'
                    : 'text-gray-400 dark:text-gray-500'
                  }`
                }`}
            >
              <Icon size={isAdd ? 24 : 20} strokeWidth={isActive || isAdd ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold leading-none mt-0.5 ${isAdd ? 'text-white text-[8px]' : ''}`}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
