/**
 * App.jsx — Root with Splash + PIN lock + all tabs including Accounts, Debts
 */
import { useState, useCallback } from 'react'
import { AppProvider, useApp } from './context/AppContext'
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
import AuthScreen from './components/AuthScreen'
import AppLock, { isPinSet } from './components/AppLock'
import SplashScreen from './components/SplashScreen'
import { useNetwork } from './hooks/useNetwork'

function AppContent() {
  const { activeTab, setActiveTab, error, uid, setUid } = useApp()
  const [editData, setEditData] = useState(null)
  const [unlocked, setUnlocked] = useState(!isPinSet())
  const [splashDone, setSplashDone] = useState(() => !!sessionStorage.getItem('mf_splash_done'))
  const isOnline = useNetwork()

  const onSplashFinish = useCallback(() => setSplashDone(true), [])

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

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'transactions': return <Transactions onEdit={handleEdit} />
      case 'add': return <AddTransaction editData={editData} onEditDone={handleEditDone} />
      case 'charts': return <Charts />
      case 'accounts': return <Accounts />
      case 'debts': return <DebtTracker />
      case 'split': return <SplitCalculator />
      case 'ai': return <AIChat />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
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
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
