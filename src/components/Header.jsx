import { Bell, Moon, Sun } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNotificationCount } from './Notifications'

export default function Header() {
  const { darkMode, setDarkMode, username, profilePhoto, activeTab, setActiveTab } = useApp()
  const notifCount = useNotificationCount()

  return (
    <header className="sticky top-0 z-50 px-5 pt-4 pb-3 lg-surface"
      style={{ borderRadius: '0 0 24px 24px', borderTop: 'none' }}>

      <div className="flex items-center justify-between max-w-md mx-auto relative z-10">
        {/* Left: Greeting */}
        <div className="flex items-center gap-3">
          {/* Profile avatar */}
          <button onClick={() => setActiveTab('settings')} className="relative flex-shrink-0">
            {profilePhoto ? (
              <img src={profilePhoto} alt="" className="w-10 h-10 rounded-2xl object-cover"
                style={{ boxShadow: '0 0 0 2px rgba(74,222,128,0.40), 0 4px 12px rgba(0,0,0,0.30)' }} />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center"
                style={{ boxShadow: '0 0 0 2px rgba(74,222,128,0.35), 0 4px 16px rgba(34,197,94,0.35)' }}>
                <span className="text-white text-sm font-bold">
                  {username ? username.charAt(0).toUpperCase() : '₹'}
                </span>
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 rounded-full"
              style={{ borderColor: 'rgba(6,30,20,0.8)', boxShadow: '0 0 6px rgba(74,222,128,0.70)' }} />
          </button>

          <div>
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.50)' }}>Hello,</p>
            <h1 className="font-display font-bold leading-tight text-lg"
              style={{ color: 'rgba(255,255,255,0.95)' }}>
              {username || 'User'}! 👋
            </h1>
          </div>
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-1.5">
          {/* Notification bell */}
          <button onClick={() => setActiveTab('notifications')}
            className="relative p-2.5 rounded-2xl transition-all active:scale-90 lg-chip">
            <Bell size={16} style={{ color: 'rgba(255,255,255,0.70)' }} />
            {notifCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-400 rounded-full animate-pulse"
                style={{ boxShadow: '0 0 6px rgba(244,63,94,0.70)' }} />
            )}
          </button>

          {/* Dark mode toggle — kept for settings compatibility */}
          <button onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-2xl transition-all active:scale-90 lg-chip">
            {darkMode
              ? <Sun  size={16} style={{ color: 'rgba(255,255,255,0.70)' }} />
              : <Moon size={16} style={{ color: 'rgba(255,255,255,0.70)' }} />}
          </button>
        </div>
      </div>
    </header>
  )
}
