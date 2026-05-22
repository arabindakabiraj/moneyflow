/**
 * DesktopSidebar.jsx — Premium, high-fidelity sidebar navigation for Desktop screens
 * Features responsive styling, frosted glass highlights, active route indicator glows,
 * quick access to all 12+ Finance Tools, profile dashboard greeting, and connectivity tracking.
 */
import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { useNotificationCount } from '../hooks/useNotifications'
import { useNetwork } from '../hooks/useNetwork'
import {
  LayoutDashboard,
  Wallet,
  Plus,
  BarChart3,
  Settings,
  MessageSquare,
  Bell,
  BookOpen,
  Target,
  RefreshCw,
  Calculator,
  Scissors,
  TrendingDown,
  Users,
  Heart,
  Sun,
  Moon,
  Sparkles,
  ChevronLeft
} from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'transactions', label: 'Ledger History', Icon: BookOpen },
  { id: 'add', label: 'Add Transaction', Icon: Plus, accent: true },
  { id: 'charts', label: 'Analytics', Icon: BarChart3 },
  { id: 'ai', label: 'AI Advisor', Icon: MessageSquare, glow: true },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

const FINANCE_TOOLS = [
  { label: 'Ledger Sheet',  icon: BookOpen,     color: 'from-indigo-400 to-blue-600',   tab: 'ledger' },
  { label: 'Savings Goals', icon: Target,       color: 'from-[#22c55e] to-emerald-500', tab: 'goals' },
  { label: 'Reminders',     icon: Bell,         color: 'from-amber-400 to-orange-500', tab: 'bills' },
  { label: 'Recurring',     icon: RefreshCw,     color: 'from-blue-400 to-blue-600',    tab: 'recurring' },
  { label: 'EMI Calc',      icon: Calculator,    color: 'from-purple-400 to-violet-600', tab: 'emi' },
  { label: 'Bill Split',    icon: Scissors,      color: 'from-green-400 to-emerald-600', tab: 'split' },
  { label: 'Debt Tracker',  icon: TrendingDown,  color: 'from-rose-400 to-rose-600',    tab: 'debts' },
  { label: 'Group Expense', icon: Users,         color: 'from-indigo-400 to-indigo-600', tab: 'groups' },
  { label: 'Budget Actual', icon: BarChart3,    color: 'from-purple-400 to-pink-500',  tab: 'budgetvactual' },
  { label: 'Net Worth',     icon: Wallet,        color: 'from-emerald-400 to-teal-600', tab: 'networth' },
  { label: 'SMS Import',    icon: MessageSquare, color: 'from-cyan-400 to-cyan-600',    tab: 'smsimport' },
  { label: 'Family Mode',   icon: Heart,         color: 'from-pink-400 to-pink-600',    tab: 'family' },
]

export default function DesktopSidebar() {
  const { activeTab, setActiveTab, username, profilePhoto, darkMode, setDarkMode } = useApp()
  const notifCount = useNotificationCount()
  const isOnline = useNetwork()

  // Collapsible sidebar state initialized from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('mf_sidebar_collapsed') === 'true'
  })

  // Persist collapsible state
  useEffect(() => {
    localStorage.setItem('mf_sidebar_collapsed', isCollapsed)
  }, [isCollapsed])

  const initials = username
    ? username.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '₹'

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen sticky top-0 border-r select-none animate-fade-in flex-shrink-0 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-[78px]' : 'w-64 xl:w-72'
      }`}
      style={{
        background: 'var(--mf-surface)',
        borderColor: 'var(--mf-border)',
      }}
    >
      {/* Elegant floating Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3.5 z-40 w-7 h-7 rounded-full border flex items-center justify-center cursor-pointer transition-all shadow-md hover:scale-105 active:scale-95 bg-white dark:bg-[#1A1A1D] hover:bg-gray-50 dark:hover:bg-[#222226]"
        style={{
          borderColor: 'var(--mf-border)',
          color: 'var(--mf-text-secondary)',
        }}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <ChevronLeft size={13} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180 text-[#4F8EF7]' : 'text-gray-500'}`} />
      </button>

      {/* ── Brand Header ── */}
      <div className={`p-6 pb-4 border-b border-black/[0.04] dark:border-white/[0.04] flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className={`flex items-center gap-2.5 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F8EF7] to-blue-600 flex items-center justify-center shadow-md shadow-[#4F8EF7]/20 flex-shrink-0">
            <span className="text-white font-display font-black text-lg">₹</span>
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h2 className="font-display font-black text-[16px] tracking-tight leading-none text-gray-900 dark:text-white/95">
                MoneyFlow
              </h2>
              <span className="text-[10px] font-bold text-[#4F8EF7] tracking-wider uppercase">V.2 Premium</span>
            </div>
          )}
        </div>

        {/* Network status indicator pill */}
        {!isCollapsed && (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold border transition-colors animate-fade-in ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        )}
      </div>

      {/* ── User Profile banner ── */}
      <div className={`px-5 py-4 border-b border-black/[0.04] dark:border-white/[0.04] flex ${isCollapsed ? 'justify-center' : 'items-center gap-3'}`}>
        <button
          onClick={() => setActiveTab('settings')}
          className="relative flex-shrink-0 group focus:outline-none"
        >
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile"
              className="w-11 h-11 rounded-full object-cover border-2 border-black/[0.08] dark:border-white/[0.08] group-hover:border-[#4F8EF7] transition-all"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4F8EF7] to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{ boxShadow: '0 4px 12px rgba(79,142,247,0.2)' }}
            >
              <span className="text-white text-sm font-bold">{initials}</span>
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white dark:border-[#1A1A1D]" />
        </button>

        {!isCollapsed && (
          <div className="min-w-0 flex-1 animate-fade-in">
            <p className="text-[10px] font-bold tracking-wide text-gray-400 dark:text-white/30 uppercase">Dashboard Profile</p>
            <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white/95 truncate leading-tight group-hover:text-[#4F8EF7]">
              {username || 'User'}
            </h3>
          </div>
        )}
      </div>

      {/* ── Core Navigation Scroll ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-none">
        
        {/* Navigation list */}
        <div className="space-y-1">
          {TABS.map(({ id, label, Icon, accent, glow }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all relative group/tab ${
                  isActive
                    ? 'bg-gradient-to-r from-[#4F8EF7]/12 to-transparent text-[#4F8EF7]'
                    : 'text-gray-500 dark:text-white/60 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] hover:text-gray-800 dark:hover:text-white/90'
                } ${isCollapsed ? 'justify-center py-2 px-0' : 'gap-3 px-3 py-2.5'}`}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#4F8EF7]" />
                )}

                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover/tab:scale-105 flex-shrink-0 ${
                    isActive
                      ? 'bg-[#4F8EF7]/20 text-[#4F8EF7]'
                      : accent
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : glow
                      ? 'bg-purple-500/10 text-purple-400'
                      : 'bg-black/[0.04] dark:bg-white/[0.04] text-gray-400 dark:text-white/40'
                  }`}
                >
                  <Icon size={15} />
                </div>
                {!isCollapsed && <span className="flex-1 text-left animate-fade-in">{label}</span>}

                {/* AI glow effect badge */}
                {!isCollapsed && glow && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-purple-500/15 text-purple-400 tracking-wider uppercase animate-pulse">
                    <Sparkles size={8} /> AI
                  </span>
                )}

                {/* Notification Badge */}
                {!isCollapsed && id === 'settings' && notifCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold">
                    {notifCount}
                  </span>
                )}

                {/* Collapsed absolute notification count dot */}
                {isCollapsed && id === 'settings' && notifCount > 0 && (
                  <span className="absolute top-1 right-3.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white dark:border-[#1A1A1D]">
                    <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                  </span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="sidebar-tooltip">
                    {label}
                    {glow && ' (AI)'}
                    {id === 'settings' && notifCount > 0 && ` (${notifCount})`}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Finance Tools Section ── */}
        <div className="space-y-2">
          {isCollapsed ? (
            <div className="border-t border-black/[0.04] dark:border-white/[0.04] my-2" />
          ) : (
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/35 animate-fade-in">
              Finance Tools
            </p>
          )}
          <div className={isCollapsed ? 'flex flex-col items-center gap-2' : 'grid grid-cols-2 gap-1.5'}>
            {FINANCE_TOOLS.map(({ label, icon: ToolIcon, color, tab }) => {
              const isToolActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative group/tool flex flex-col rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    isCollapsed ? 'p-2 items-center justify-center' : 'p-2.5 items-start gap-1.5'
                  } ${
                    isToolActive
                      ? 'border-[#4F8EF7] bg-[#4F8EF7]/5'
                      : 'border-black/[0.04] dark:border-white/[0.04] bg-black/[0.01] dark:bg-white/[0.01] hover:border-black/[0.08] dark:hover:border-white/[0.08]'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                    <ToolIcon size={12} className="text-white" />
                  </div>
                  {!isCollapsed && (
                    <span className={`text-[9px] font-bold leading-tight mt-1.5 ${isToolActive ? 'text-[#4F8EF7]' : 'text-gray-500 dark:text-white/50'} animate-fade-in`}>
                      {label}
                    </span>
                  )}

                  {/* Collapsed Tooltip */}
                  {isCollapsed && (
                    <div className="sidebar-tooltip">
                      {label}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── Theme & Context Controls Footer ── */}
      <div className={`p-4 border-t border-black/[0.04] dark:border-white/[0.04] flex ${isCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between'}`}>
        {!isCollapsed && (
          <span className="text-[10px] text-gray-400 dark:text-white/30 font-semibold uppercase animate-fade-in">
            MoneyFlow v2.0
          </span>
        )}

        {/* Theme Toggler Buttons */}
        <div className={`flex bg-black/[0.04] dark:bg-white/[0.04] p-0.5 rounded-lg ${isCollapsed ? 'flex-col gap-1' : ''}`}>
          <button
            onClick={() => setDarkMode(false)}
            className={`p-1.5 rounded-md transition-colors ${
              !darkMode ? 'bg-white text-amber-500 shadow-sm' : 'text-gray-400 dark:text-white/40'
            }`}
            title="Light Mode"
          >
            <Sun size={12} />
          </button>
          <button
            onClick={() => setDarkMode(true)}
            className={`p-1.5 rounded-md transition-colors ${
              darkMode ? 'bg-[#1A1A1D] text-[#4F8EF7] shadow-sm' : 'text-gray-400 dark:text-white/40'
            }`}
            title="Dark Mode"
          >
            <Moon size={12} />
          </button>
        </div>
      </div>
    </aside>
  )
}
