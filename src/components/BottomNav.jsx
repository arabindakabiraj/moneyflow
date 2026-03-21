/**
 * BottomNav.jsx — Telegram-style liquid glass bottom navigation
 * Flat layout (no elevated CTA), profile photo for Profile tab,
 * frosted glassmorphism with dynamic lighting and smooth animations.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { LayoutDashboard, Wallet, BarChart3, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'

const TABS = [
  { id: 'dashboard', label: 'Home', Icon: LayoutDashboard },
  { id: 'accounts', label: 'Wallet', Icon: Wallet },
  { id: 'add', label: 'Add', Icon: Plus },
  { id: 'charts', label: 'Charts', Icon: BarChart3 },
  { id: 'settings', label: 'Profile', Icon: null }, // uses profile photo
]

export default function BottomNav() {
  const { activeTab, setActiveTab, profilePhoto, username } = useApp()
  const navRef = useRef(null)
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const [ripple, setRipple] = useState(null)

  // Calculate the active indicator position
  const updateIndicator = useCallback(() => {
    if (!navRef.current) return
    const activeEl = navRef.current.querySelector(`[data-tab-id="${activeTab}"]`)
    if (!activeEl) return
    const navRect = navRef.current.getBoundingClientRect()
    const elRect = activeEl.getBoundingClientRect()

    setIndicatorStyle({
      left: elRect.left - navRect.left + elRect.width / 2,
      width: elRect.width + 8,
    })
  }, [activeTab])

  useEffect(() => {
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [updateIndicator])

  // Ripple on tap
  const handleTap = (id, e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top
    setRipple({ x, y, id, key: Date.now() })
    setActiveTab(id)
  }

  // Profile initials fallback
  const initials = username
    ? username.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <nav className="liquid-nav-wrapper" aria-label="Main navigation">
      {/* Dynamic ambient glow */}
      <div className="liquid-ambient-glow" />

      <div className="liquid-glass-nav" ref={navRef}>
        {/* Animated shine layer */}
        <div className="liquid-shine" />

        {/* Active indicator pill */}
        <div
          className="liquid-indicator"
          style={{
            transform: `translateX(${indicatorStyle.left || 0}px) translateX(-50%)`,
            width: indicatorStyle.width || 0,
          }}
        />

        <div className="liquid-nav-items">
          {TABS.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            const isProfile = id === 'settings'

            return (
              <button
                key={id}
                data-tab-id={id}
                onClick={(e) => handleTap(id, e)}
                className={`liquid-nav-item ${isActive ? 'is-active' : ''}`}
                aria-label={label}
              >
                {/* Ripple effect */}
                {ripple?.id === id && (
                  <span
                    key={ripple.key}
                    className="liquid-ripple"
                    style={{ left: ripple.x, top: ripple.y }}
                  />
                )}

                {/* Icon glow (active only) */}
                {isActive && <div className="liquid-icon-glow" />}

                {/* Profile photo or icon */}
                {isProfile ? (
                  <div className={`liquid-profile-avatar ${isActive ? 'is-active' : ''}`}>
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="liquid-profile-img"
                      />
                    ) : (
                      <span className="liquid-profile-initials">{initials}</span>
                    )}
                  </div>
                ) : (
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.2 : 1.6}
                    className="liquid-nav-icon"
                  />
                )}

                <span className="liquid-nav-label">{label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
