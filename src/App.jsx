/**
 * App.jsx — Root with Splash + PIN lock + all tabs including Accounts, Debts
 * REDESIGNED: Clean dark premium layout, no liquid glass orbs
 */
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { ThemeProvider } from './context/ThemeContext'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import AddTransaction from './components/AddTransaction'
import AuthScreen from './components/AuthScreen'
import AppLock, { isPinSet, getAutoLockMinutes, isBiometricEnabled } from './components/AppLock'
import SplashScreen from './components/SplashScreen'
import InstallBanner from './components/InstallBanner'
import OnboardingModal from './components/OnboardingModal'
import ErrorBoundary from './components/ErrorBoundary'
import { useNetwork } from './hooks/useNetwork'

// ── Lazy-loaded tabs (code-split → faster initial load) ──
const AIChat = lazy(() => import('./components/AIChat'))
const Settings = lazy(() => import('./components/Settings'))
const Charts = lazy(() => import('./components/Charts'))
const SplitCalculator = lazy(() => import('./components/SplitCalculator'))
const Accounts = lazy(() => import('./components/Accounts'))
const DebtTracker = lazy(() => import('./components/DebtTracker'))
const SmartAdd = lazy(() => import('./components/SmartAdd'))
const SavingsGoals = lazy(() => import('./components/SavingsGoals'))
const EMICalculator = lazy(() => import('./components/EMICalculator'))
const BillReminders = lazy(() => import('./components/BillReminders'))
const RecurringTransactions = lazy(() => import('./components/RecurringTransactions'))
const Notifications = lazy(() => import('./components/Notifications'))
const GroupExpenses = lazy(() => import('./components/GroupExpenses'))
const SMSImport = lazy(() => import('./components/SMSImport'))
const FamilyMode = lazy(() => import('./components/FamilyMode'))
const Ledger = lazy(() => import('./components/Ledger'))
const CashFlow = lazy(() => import('./components/CashFlow'))

// ── Skeleton shown while a lazy tab is loading ──
function TabFallback() {
  return (
    <div className="space-y-4 pt-2 animate-fade-in">
      <div className="skeleton h-10 w-40 rounded-xl" />
      <div className="skeleton h-36 rounded-2xl" />
      <div className="skeleton h-24 rounded-2xl" />
      <div className="skeleton h-14 rounded-2xl" />
      <div className="skeleton h-40 rounded-2xl" />
    </div>
  )
}


function AppContent() {
  const { activeTab, setActiveTab, error, uid, setUid, onboardingDone, completeOnboarding } = useApp()
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--mf-bg)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#4F8EF7] flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg shadow-[#4F8EF7]/20">
            <span className="text-3xl font-bold text-white">₹</span>
          </div>
          <p className="text-white/40 text-sm">Loading...</p>
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
      case 'ledger': return <Ledger />
      case 'cashflow': return <CashFlow />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--mf-bg)' }}>
      {/* PWA Install Banner */}
      <InstallBanner />

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-[#FBBF24]/10 border-b border-[#FBBF24]/20 text-[#FBBF24] text-center py-2.5 text-xs font-semibold animate-slide-up flex items-center justify-center gap-1.5">
          ⚠️ You are offline — data will sync when connected
        </div>
      )}

      <Header />

      {error && (
        <div className="mx-4 mt-3 p-3 rounded-xl text-xs font-medium animate-slide-up"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.20)', color: '#FBBF24' }}>
          ⚠️ {error}
        </div>
      )}

      <main
        key={activeTab}
        className={`px-4 pt-4 max-w-md mx-auto animate-tab-enter ${activeTab === 'ai' ? 'pb-0 overflow-hidden' : 'pb-28'}`}
        style={{ minHeight: activeTab === 'ai' ? undefined : 'calc(100vh - 64px)' }}
      >
        <ErrorBoundary key={activeTab}>
          <Suspense fallback={<TabFallback />}>
            {renderTab()}
          </Suspense>
        </ErrorBoundary>
      </main>

      <BottomNav />

      {/* Onboarding modal — shown once after first login */}
      {onboardingDone === false && (
        <OnboardingModal onComplete={completeOnboarding} />
      )}
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
