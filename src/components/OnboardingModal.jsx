/**
 * OnboardingModal.jsx — Premium, interactive spotlight product tour + setup wizard
 * Highlights key Dashboard components dynamically with glassmorphic tooltip card controllers
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import { ArrowRight, Sparkles, Check, Play, SkipForward, ArrowLeft, Brain, Wallet, Zap, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react'

export default function OnboardingModal({ onComplete }) {
  const { 
    darkMode, 
    openingBalance, 
    setOpeningBalance, 
    gstSettings, 
    updateGstSettings 
  } = useApp()

  const [step, setStep] = useState(0) // 0: Welcome, 1: Balance Card, 2: Logger Quick Actions, 3: AI Chat, 4: Quick Setup Form
  const [coords, setCoords] = useState(null)
  
  // Setup fields
  const [amount, setAmount] = useState(openingBalance > 0 ? String(openingBalance) : '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [gstRate, setGstRate] = useState(gstSettings?.gstRate ?? 18)
  const [registered, setRegistered] = useState(gstSettings?.registered ?? false)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  // Fade-in animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  // Measure and align the spotlight on the target element
  const updateSpotlight = useCallback(() => {
    if (step === 0 || step === 4) {
      setCoords(null)
      return
    }

    let selector = ''
    if (step === 1) selector = '.tour-balance-card'
    else if (step === 2) selector = '.tour-quick-actions'
    else if (step === 3) selector = '.tour-ai-btn'

    const el = document.querySelector(selector)
    if (el) {
      const rect = el.getBoundingClientRect()
      // Scroll into view if element is out of bounds
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      
      // Short delay for smooth scrolling animation to finish
      setTimeout(() => {
        const freshRect = el.getBoundingClientRect()
        setCoords({
          top: freshRect.top,
          left: freshRect.left,
          width: freshRect.width,
          height: freshRect.height,
        })
      }, 150)
    } else {
      setCoords(null)
    }
  }, [step])

  useEffect(() => {
    updateSpotlight()
    window.addEventListener('resize', updateSpotlight)
    
    // Listen for general scroll changes to adjust spotlight positioning
    const handleScroll = (e) => {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
        updateSpotlight()
      }
    }
    window.addEventListener('scroll', handleScroll, true)
    
    return () => {
      window.removeEventListener('resize', updateSpotlight)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [step, updateSpotlight])

  const handleNext = () => {
    if (step < 4) {
      setStep(s => s + 1)
    } else {
      handleFinish()
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(s => s - 1)
    }
  }

  const handleSkip = () => {
    setVisible(false)
    setTimeout(onComplete, 300)
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      if (setOpeningBalance) {
        await setOpeningBalance(Number(amount) || 0, date)
      }
      if (updateGstSettings) {
        await updateGstSettings({ gstRate, registered })
      }
    } catch (e) {
      console.error('Onboarding save error:', e)
    }
    setSaving(false)
    setVisible(false)
    setTimeout(onComplete, 300)
  }

  const getTooltipStyle = () => {
    if (!coords) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '420px',
        zIndex: 10000,
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
      }
    }

    const isBelow = coords.top < window.innerHeight / 2
    const tooltipWidth = 340
    let leftVal = coords.left + coords.width / 2 - tooltipWidth / 2
    leftVal = Math.max(16, Math.min(window.innerWidth - tooltipWidth - 16, leftVal))

    return {
      position: 'fixed',
      top: isBelow ? `${coords.top + coords.height + 16}px` : undefined,
      bottom: !isBelow ? `${window.innerHeight - coords.top + 16}px` : undefined,
      left: `${leftVal}px`,
      width: `${tooltipWidth}px`,
      zIndex: 10000,
      transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
    }
  }

  return (
    <div className={`fixed inset-0 z-[9998] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* ── Spotlight Frame Overlay ── */}
      {coords ? (
        <div
          style={{
            position: 'fixed',
            top: coords.top - 8,
            left: coords.left - 8,
            width: coords.width + 16,
            height: coords.height + 16,
            borderRadius: '24px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
            border: '2.5px solid #4F8EF7',
            transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      ) : (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          style={{ zIndex: 9999 }}
          onClick={handleSkip}
        />
      )}

      {/* ── Glassmorphic Tooltip / Welcome Modal Card ── */}
      <div
        className="rounded-[32px] overflow-hidden transition-all duration-300"
        style={{
          ...getTooltipStyle(),
          background: darkMode ? 'rgba(26, 26, 29, 0.85)' : 'rgba(255, 255, 255, 0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Step Progress Line */}
        {step > 0 && (
          <div className="w-full h-1 bg-black/10 dark:bg-white/10">
            <div 
              className="h-full bg-[#4F8EF7] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        )}

        {/* ── Welcome Screen ── */}
        {step === 0 && (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-[24px] bg-[#22c55e]/30 blur-xl animate-pulse" />
              <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center relative shadow-lg">
                <span className="text-white text-3xl font-black font-display">₹</span>
              </div>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white mb-2 font-display">
              Welcome to MoneyFlow
            </h2>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-white/60 mb-8 max-w-[280px]">
              Track expenses, split bills, and grow your net worth in a professional financial cockpit.
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-[#4F8EF7] text-white font-bold text-sm hover:bg-[#4F8EF7]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-none cursor-pointer shadow-md shadow-[#4F8EF7]/20"
              >
                <Play size={14} className="fill-current" /> Take a Tour
              </button>
              <button
                onClick={handleSkip}
                className="w-full py-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 font-bold text-sm hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98] transition-all border-none cursor-pointer"
              >
                Skip & Setup Later
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Balance Hero Card ── */}
        {step === 1 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Wallet size={18} className="text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#4F8EF7] uppercase tracking-wider block">Step 1 of 4</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Financial Summary</h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/60 leading-relaxed mb-6">
              This is your primary balance cockpit. Track your Net Worth, total monthly Income, and daily Expenses in real-time with count-up animations.
            </p>
            {renderTourControls()}
          </div>
        )}

        {/* ── Step 2: Quick Actions Grid ── */}
        {step === 2 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Zap size={18} className="text-emerald-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#4F8EF7] uppercase tracking-wider block">Step 2 of 4</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Smart Transaction Logger</h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/60 leading-relaxed mb-6">
              Add income or expenses instantly. You can also use **Smart Add** to type transactions in plain language (e.g., *'spent 120 on pizza yesterday'*) and let our AI parser extract the details automatically.
            </p>
            {renderTourControls()}
          </div>
        )}

        {/* ── Step 3: AI Chat Spotlight ── */}
        {step === 3 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-purple-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#4F8EF7] uppercase tracking-wider block">Step 3 of 4</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">AI Financial Advisor</h3>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-white/60 leading-relaxed mb-6">
              Get customized budget alerts, spending insights, and anomaly detection. Click **AI Chat** to talk to your Gemini-powered assistant anytime.
            </p>
            {renderTourControls()}
          </div>
        )}

        {/* ── Step 4: Quick Setup Form ── */}
        {step === 4 && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <Brain size={18} className="text-amber-400" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#4F8EF7] uppercase tracking-wider block">Step 4 of 4</span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Quick Setup</h3>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-white/60 leading-relaxed mb-4">
              Customize your dashboard. Enter your opening balance and GST configuration to complete your profile setup.
            </p>

            {/* Inputs */}
            <div className="space-y-3 mb-6 bg-black/5 dark:bg-white/5 p-3.5 rounded-2xl">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 dark:text-white/35 uppercase mb-1">
                  Opening Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">₹</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-white dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 dark:text-white/35 uppercase mb-1">
                  As of Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 font-medium"
                />
              </div>

              {/* GST rate */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 dark:text-white/35 uppercase mb-1">
                  Tax Rate (GST)
                </label>
                <div className="grid grid-cols-5 gap-1">
                  {[0, 5, 12, 18, 28].map(r => (
                    <button
                      key={r}
                      onClick={() => setGstRate(r)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${
                        gstRate === r 
                          ? 'bg-[#4F8EF7] text-white shadow-sm shadow-[#4F8EF7]/20' 
                          : 'bg-white dark:bg-[#222226] text-gray-500 dark:text-white/40 border border-black/[0.08] dark:border-white/[0.08]'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              {/* GST toggle */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] font-bold text-gray-800 dark:text-white/80 block">GST Registered</span>
                  <span className="text-[9px] text-gray-400 dark:text-white/30 block">Track input credit on expenses</span>
                </div>
                <button
                  onClick={() => setRegistered(!registered)}
                  className="relative w-10 h-5.5 rounded-full transition-all duration-200 shrink-0 border-none cursor-pointer"
                  style={{ background: registered ? '#22c55e' : 'var(--mf-surface-3)' }}
                >
                  <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-md transition-all duration-200 ${registered ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleBack}
                className="px-4 py-3.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/50 font-bold text-xs hover:bg-gray-200 dark:hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center border-none cursor-pointer"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl bg-[#22c55e] text-white font-bold text-xs hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border-none cursor-pointer shadow-md shadow-[#22c55e]/20"
              >
                {saving ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <>Ready, Let's Go! <Check size={14} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  function renderTourControls() {
    return (
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={handleSkip}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-white/80 active:scale-95 transition-all border-none bg-transparent cursor-pointer"
        >
          Skip Tour
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all border-none cursor-pointer"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2.5 rounded-xl bg-[#4F8EF7] text-white font-bold text-xs flex items-center gap-1 hover:bg-[#4F8EF7]/90 active:scale-95 transition-all border-none cursor-pointer shadow-sm shadow-[#4F8EF7]/20"
          >
            Next <ArrowRight size={13} />
          </button>
        </div>
      </div>
    )
  }
}