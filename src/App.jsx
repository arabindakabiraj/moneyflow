/**
 * App.jsx - Root component
 * মূল অ্যাপ কম্পোনেন্ট — সব কিছু এখান থেকে নিয়ন্ত্রিত হয়
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

function AppContent() {
  const { activeTab, setActiveTab, error } = useApp()
  const [editData, setEditData] = useState(null)

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

      {/* Main content — padded for bottom nav, special layout for AI chat */}
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
