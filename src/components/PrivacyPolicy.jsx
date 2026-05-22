import { ArrowLeft, Shield } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function PrivacyPolicy() {
  const { setActiveTab, darkMode } = useApp()

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={() => setActiveTab('settings')}
          className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#222226] flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform">
          <ArrowLeft size={18} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-[#34D399]" />
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Privacy Policy</h2>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Legal Documentation</p>
        </div>
      </div>

      <div className="flex-1 rounded-3xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden shadow-sm relative min-h-[60vh]">
        <iframe 
          src={`/privacy.html?theme=${darkMode ? 'dark' : 'light'}`} 
          className="absolute inset-0 w-full h-full border-0"
          title="Privacy Policy"
        />
      </div>
    </div>
  )
}
