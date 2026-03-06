/**
 * App.jsx — Root with Splash + PIN lock + all tabs including Accounts, Debts
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import AddTransaction from './components/AddTransaction'
import AIChat from './components/AIChat'
import Settings from './components/Settings'
import Charts from './components/Charts'
import SplitCalculator from './components/SplitCalculator'
import Accounts from './components/Accounts'
import DebtTracker from './components/DebtTracker'
import SmartAdd from './components/SmartAdd'
import SavingsGoals from './components/SavingsGoals'
import EMICalculator from './components/EMICalculator'
import BillReminders from './components/BillReminders'
import RecurringTransactions from './components/RecurringTransactions'
import Notifications from './components/Notifications'
import AuthScreen from './components/AuthScreen'
import AppLock, { isPinSet, getAutoLockMinutes, isBiometricEnabled } from './components/AppLock'
import SplashScreen from './components/SplashScreen'
import InstallBanner from './components/InstallBanner'
import GroupExpenses from './components/GroupExpenses'
import SMSImport from './components/SMSImport'
import FamilyMode from './components/FamilyMode'
import { useNetwork } from './hooks/useNetwork'

function AppContent() {
  const { activeTab, setActiveTab, error, uid, setUid } = useApp()
  const [editData, setEditData] = useState(null)
  const [addType, setAddType] = useState(null) // 'credit' or 'debit' — pre-select when coming from quick actions
  const [unlocked, setUnlocked] = useState(!isPinSet())
  const [splashDone, setSplashDone] = useState(() => !!sessionStorage.getItem('mf_splash_done'))
  const isOnline = useNetwork()
  const idleTimer = useRef(null)

  const onSplashFinish = useCallback(() => setSplashDone(true), [])

  // ── Auto-lock on idle ──
  const lockApp = useCallback(() => {
    if (isPinSet() || isBiometricEnabled()) {
      setUnlocked(false)
    }
  }, [])

  useEffect(() => {
    const mins = getAutoLockMinutes()
    if (mins <= 0 || !unlocked) return

    const ms = mins * 60 * 1000
    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(lockApp, ms)
    }

    const events = ['mousedown', 'touchstart', 'keydown', 'scroll', 'mousemove']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    // Also lock when tab becomes hidden (user switches away)
    const handleVisibility = () => {
      if (document.hidden && mins > 0) {
        // Start a short lock timer when hidden (half the idle time, min 30s)
        if (idleTimer.current) clearTimeout(idleTimer.current)
        idleTimer.current = setTimeout(lockApp, Math.max(ms / 2, 30000))
      } else {
        resetTimer()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      events.forEach(e => window.removeEventListener(e, resetTimer))
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [unlocked, lockApp])

  // ── Back button navigation: go to Home instead of exiting app ──
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault()
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard')
      }
      // Push state again so next back press also works
      window.history.pushState({ tab: 'dashboard' }, '')
    }
    // Push initial state
    window.history.pushState({ tab: activeTab }, '')
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [activeTab, setActiveTab])

  if (!splashDone) return <SplashScreen onFinish={onSplashFinish} />

  if (uid === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 animate-pulse shadow-2xl shadow-brand-500/30">
            <span className="text-3xl font-bold text-white">₹</span>
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!uid) return <AuthScreen onAuth={(newUid) => setUid(newUid)} />
  if (!unlocked) return <AppLock onUnlock={() => setUnlocked(true)} />

  const handleEdit = (tx) => { setEditData(tx); setActiveTab('add') }
  const handleEditDone = () => { setEditData(null); setActiveTab('transactions') }
  const openAddWithType = (type) => { setAddType(type); setActiveTab('add') }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onAddWithType={openAddWithType} />
      case 'transactions': return <Transactions onEdit={handleEdit} />
      case 'add': return <AddTransaction editData={editData} onEditDone={handleEditDone} defaultType={addType} onTypeConsumed={() => setAddType(null)} />
      case 'charts': return <Charts />
      case 'accounts': return <Accounts />
      case 'notifications': return <Notifications />
      case 'debts': return <DebtTracker />
      case 'split': return <SplitCalculator />
      case 'ai': return <AIChat />
      case 'smartadd': return <SmartAdd />
      case 'goals': return <SavingsGoals />
      case 'emi': return <EMICalculator />
      case 'bills': return <BillReminders />
      case 'recurring': return <RecurringTransactions />
      case 'groups': return <GroupExpenses />
      case 'smsimport': return <SMSImport />
      case 'family': return <FamilyMode />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* PWA Install Banner */}
      <InstallBanner />

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 text-xs font-semibold animate-slide-up flex items-center justify-center gap-1.5">
          ⚠️ You are offline — data will sync automatically when connected
        </div>
      )}
      <Header />

      {error && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-medium animate-slide-up">
          ⚠️ {error}
        </div>
      )}
      <main className={`px-4 pt-4 max-w-md mx-auto ${activeTab === 'ai' ? 'pb-0 overflow-hidden' : 'pb-32'}`}
        style={{ minHeight: activeTab === 'ai' ? undefined : 'calc(100vh - 64px)' }}>
        {renderTab()}
      </main>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  )
}
