/**
 * Header.jsx — Premium minimal header
 * Clean dark surface, no glassmorphism
 * Includes App Menu popover for Finance Tools
 */
import { useState, useRef, useEffect } from 'react'
import { Bell, LayoutGrid, Target, RefreshCw, Calculator, Scissors, TrendingDown, Users, MessageSquare, Heart, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNotificationCount } from '../hooks/useNotifications'

/* Finance Tools config — moved from Settings */
const FINANCE_TOOLS = [
  { label: 'Savings Goals', icon: Target,         color: 'from-brand-400 to-emerald-500', tab: 'goals' },
  { label: 'Bill Reminders', icon: Bell,           color: 'from-amber-400 to-orange-500', tab: 'bills' },
  { label: 'Recurring',     icon: RefreshCw,       color: 'from-blue-400 to-blue-600',    tab: 'recurring' },
  { label: 'EMI Calc',      icon: Calculator,      color: 'from-purple-400 to-violet-600', tab: 'emi' },
  { label: 'Bill Split',    icon: Scissors,        color: 'from-green-400 to-emerald-600', tab: 'split' },
  { label: 'Debt Tracker',  icon: TrendingDown,    color: 'from-rose-400 to-rose-600',    tab: 'debts' },
  { label: 'Group Expense', icon: Users,           color: 'from-indigo-400 to-indigo-600', tab: 'groups' },
  { label: 'SMS Import',    icon: MessageSquare,   color: 'from-cyan-400 to-cyan-600',    tab: 'smsimport' },
  { label: 'Family Mode',   icon: Heart,           color: 'from-pink-400 to-pink-600',    tab: 'family' },
]

export default function Header() {
  const { darkMode, username, profilePhoto, activeTab, setActiveTab } = useApp()
  const notifCount = useNotificationCount()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const btnRef = useRef(null)

  /* Close popover on outside click */
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) &&
          btnRef.current && !btnRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [menuOpen])

  const handleToolClick = (tab) => {
    setActiveTab(tab)
    setMenuOpen(false)
  }

  return (
    <header
      className="sticky top-0 z-50 px-5 pt-4 pb-3"
      style={{
        background: 'var(--mf-bg)',
        borderBottom: '1px solid var(--mf-border)',
      }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          {/* Profile avatar — clean, no glow */}
          <button onClick={() => setActiveTab('settings')} className="relative flex-shrink-0">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: '2px solid var(--mf-border)' }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full bg-[#4F8EF7] flex items-center justify-center"
                style={{ boxShadow: '0 4px 12px rgba(79,142,247,0.25)' }}
              >
                <span className="text-white text-sm font-bold">
                  {username ? username.charAt(0).toUpperCase() : '₹'}
                </span>
              </div>
            )}
            {/* Online indicator */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
              style={{
                background: '#34D399',
                border: '2px solid var(--mf-bg)',
              }}
            />
          </button>

          <div>
            <p className="text-[11px] font-medium text-gray-400 dark:text-white/35">Hello,</p>
            <h1 className="font-display font-bold leading-tight text-lg text-gray-900 dark:text-white/95">
              {username || 'User'} 👋
            </h1>
          </div>
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2.5 rounded-xl transition-all active:scale-90"
            style={{ background: 'rgba(128,128,128,0.08)' }}
          >
            <Bell size={16} className="text-gray-500 dark:text-white/50" />
            {notifCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-pulse"
                style={{ background: '#FF6B6B', boxShadow: '0 0 6px rgba(255,107,107,0.60)' }}
              />
            )}
          </button>

          {/* App Menu — four-squares button */}
          <button
            ref={btnRef}
            onClick={() => setMenuOpen(prev => !prev)}
            className={`relative p-2.5 rounded-xl transition-all active:scale-90 ${menuOpen ? 'ring-2 ring-[#4F8EF7]/40' : ''}`}
            style={{ background: menuOpen ? 'rgba(79,142,247,0.12)' : 'rgba(128,128,128,0.08)' }}
            title="App Menu"
          >
            <LayoutGrid size={16} className={menuOpen ? 'text-[#4F8EF7]' : 'text-gray-500 dark:text-white/50'} />
          </button>
        </div>
      </div>

      {/* ═══ App Menu Popover ═══ */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] app-menu-backdrop"
            onClick={() => setMenuOpen(false)}
          />

          {/* Popover */}
          <div
            ref={menuRef}
            className="fixed z-50 app-menu-popover"
            style={{
              top: '68px',
              left: '16px',
              right: '16px',
              maxWidth: '320px',
              margin: '0 auto',
              maxHeight: 'calc(100vh - 84px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              className="rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              style={{
                background: 'var(--mf-surface)',
                border: '1px solid var(--mf-border)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px var(--mf-border)',
                maxHeight: 'inherit',
              }}
            >
              {/* Popover header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#4F8EF7]/15 flex items-center justify-center">
                    <LayoutGrid size={13} className="text-[#4F8EF7]" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/35">
                    Finance Tools
                  </p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors active:scale-90"
                  style={{ background: 'rgba(128,128,128,0.08)' }}
                >
                  <X size={14} className="text-gray-400 dark:text-white/40" />
                </button>
              </div>

              {/* Tools grid — scrollable */}
              <div className="overflow-y-auto overscroll-contain p-3" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="grid grid-cols-3 gap-2">
                  {FINANCE_TOOLS.map(({ label, icon: Icon, color, tab }) => (
                    <button
                      key={tab}
                      onClick={() => handleToolClick(tab)}
                      className="flex flex-col items-center gap-2 py-3.5 rounded-2xl active:scale-95 transition-all group"
                      style={{ background: 'var(--mf-surface-2)', border: '1px solid var(--mf-border)' }}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center group-active:scale-90 transition-transform`}>
                        <Icon size={17} className="text-white" />
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-white/50 font-semibold text-center leading-tight">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
