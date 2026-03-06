/**
 * InstallBanner.jsx — PWA install prompt banner
 */
import { X, Download } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallBanner() {
  const { canInstall, promptInstall, dismiss } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <div className="mx-4 mt-3 relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20 animate-slide-up">
      <div className="pointer-events-none absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
          <Download size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Install MoneyFlow</p>
          <p className="text-[11px] text-white/70">Add to home screen for the best experience</p>
        </div>
        <button
          onClick={promptInstall}
          className="px-4 py-2 rounded-xl bg-white text-brand-600 text-xs font-bold shrink-0 active:scale-95 transition-transform shadow-sm"
        >
          Install
        </button>
        <button onClick={dismiss} className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
          <X size={14} className="text-white/70" />
        </button>
      </div>
    </div>
  )
}
