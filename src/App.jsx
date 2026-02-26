/**
 * App.jsx - Root component
 * মূল অ্যাপ কম্পোনেন্ট — Firebase Auth gate সহ
 */
import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import AddTransaction from './components/AddTransaction'
import AIChat from './components/AIChat'
import Settings from './components/Settings'
import AuthScreen from './components/AuthScreen'

function AppContent() {
  const { activeTab, setActiveTab, error, user } = useApp()
  const [editData, setEditData] = useState(null)

  // Auth loading state (undefined = still checking)
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/30 animate-pulse">
            <span className="text-3xl">₹</span>
          </div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in → show auth screen
  if (!user) return <AuthScreen />

  const handleEdit = (tx) => {
    setEditData(tx)
    setActiveTab('add')
  }

  const handleEditDone = () => {
    setEditData(null)
    setActiveTab('transactions')
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />
      case 'transactions': return <Transactions onEdit={handleEdit} />
      case 'add': return <AddTransaction editData={editData} onEditDone={handleEditDone} />
      case 'ai': return <AIChat />
      case 'settings': return <Settings />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <Header />

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-medium animate-slide-up">
          ⚠️ {error}
        </div>
      )}

      {/* Main content */}
      <main
        className={`px-4 pt-4 max-w-md mx-auto ${activeTab === 'ai' ? 'pb-0 overflow-hidden' : 'pb-32'
          }`}
        style={{ minHeight: activeTab === 'ai' ? undefined : 'calc(100vh - 64px)' }}
      >
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
