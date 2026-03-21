/**
 * OnboardingModal.jsx
 * Professional 3-step first-run setup shown once after login.
 * Steps: 1. Welcome  2. Opening Balance  3. GST Setup (optional)
 */
import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

const steps = [
  { id: 'welcome',  emoji: '👋', title: 'Welcome to MoneyFlow' },
  { id: 'balance',  emoji: '🏦', title: 'Set Opening Balance' },
  { id: 'gst',      emoji: '🧾', title: 'GST Setup (Optional)' },
]

/* ── tiny animated dots ── */
const Dot = ({ active }) => (
  <span
    className={`inline-block rounded-full transition-all duration-300 ${active ? 'w-6 h-2 bg-brand-500' : 'w-2 h-2 bg-white/20'}`}
  />
)

export default function OnboardingModal({ onComplete }) {
  const { username, openingBalance, setOpeningBalance, gstSettings, updateGstSettings } = useApp()
  const [step, setStep] = useState(0)
  const [amount, setAmount] = useState(openingBalance > 0 ? String(openingBalance) : '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [gstRate, setGstRate] = useState(gstSettings?.gstRate ?? 18)
  const [registered, setRegistered] = useState(gstSettings?.registered ?? false)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)
  const amountRef = useRef(null)

  // fade-in on mount
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  useEffect(() => {
    if (step === 1) setTimeout(() => amountRef.current?.focus(), 300)
  }, [step])

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1))
  const prev = () => setStep(s => Math.max(s - 1, 0))

  const finish = async () => {
    setSaving(true)
    try {
      if (Number(amount) > 0) {
        await setOpeningBalance(Number(amount), date)
      } else {
        await setOpeningBalance(0, date)
      }
      await updateGstSettings({ gstRate, registered })
    } catch (e) { console.error(e) }
    setSaving(false)
    // fade out
    setVisible(false)
    setTimeout(onComplete, 350)
  }

  const skip = () => {
    setVisible(false)
    setTimeout(onComplete, 350)
  }

  /* ─────────────────── STEP CONTENT ─────────────────── */
  const StepWelcome = () => (
    <div className="flex flex-col items-center text-center gap-4 animate-fade-in">
      {/* Glowing avatar */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-brand-500/40 ring-4 ring-brand-500/20">
          <span className="text-4xl font-black text-white">
            {(username || 'M').charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="absolute -bottom-1 -right-1 text-2xl">👋</span>
      </div>

      <div>
        <h2 className="text-2xl font-black text-white leading-tight">
          Hello, {username?.split(' ')[0] || 'there'}!
        </h2>
        <p className="text-gray-400 text-sm mt-1">Let's set up your financial dashboard</p>
      </div>

      {/* Feature pills */}
      <div className="grid grid-cols-2 gap-2 w-full mt-2">
        {[
          { icon: '📊', label: 'Balance Sheet' },
          { icon: '📒', label: 'Ledger View' },
          { icon: '💵', label: 'Cash Flow' },
          { icon: '🤖', label: 'AI Predictions' },
        ].map(f => (
          <div key={f.label} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
            <span className="text-lg">{f.icon}</span>
            <span className="text-sm text-gray-300 font-medium">{f.label}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Takes just 1 minute to set up. You can always change these later in Settings.
      </p>
    </div>
  )

  const StepBalance = () => (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">🏦</span>
        </div>
        <h2 className="text-xl font-black text-white">Opening Balance</h2>
        <p className="text-gray-400 text-sm mt-1">
          How much money did you have <strong className="text-gray-300">before using MoneyFlow?</strong>
        </p>
      </div>

      {/* Amount field */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400 font-bold">₹</span>
        <input
          ref={amountRef}
          type="number"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && next()}
          className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-2xl font-black font-mono placeholder-gray-600 outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 transition-all"
        />
      </div>

      {/* Date picker */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
          As of Date
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm outline-none focus:border-brand-500/60 focus:ring-2 focus:ring-brand-500/20 transition-all"
        />
      </div>

      {/* Helpful tip */}
      <div className="flex gap-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-3">
        <span className="text-lg shrink-0">💡</span>
        <p className="text-xs text-indigo-300 leading-relaxed">
          This is the money you had in your bank/wallet before you started tracking. It ensures your Balance Sheet and Net Worth are accurate.
        </p>
      </div>
    </div>
  )

  const StepGST = () => (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">🧾</span>
        </div>
        <h2 className="text-xl font-black text-white">GST Setup</h2>
        <p className="text-gray-400 text-sm mt-1">For tax-deductible expense tracking</p>
      </div>

      {/* GST Rate */}
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
          Your GST Rate
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[0, 5, 12, 18, 28].map(r => (
            <button
              key={r}
              onClick={() => setGstRate(r)}
              className={`py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                gstRate === r
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                  : 'bg-white/5 border border-white/10 text-gray-400 hover:border-amber-500/40 hover:text-amber-300'
              }`}
            >
              {r}%
            </button>
          ))}
        </div>
      </div>

      {/* GST Registered toggle */}
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-white">I am GST Registered</p>
          <p className="text-xs text-gray-500 mt-0.5">Track GST input credit on expenses</p>
        </div>
        <button
          onClick={() => setRegistered(r => !r)}
          className={`relative w-14 h-7 rounded-full transition-all duration-300 shrink-0 ${registered ? 'bg-brand-500' : 'bg-white/10'}`}
        >
          <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${registered ? 'left-7' : 'left-0.5'}`} />
        </button>
      </div>

      <p className="text-xs text-gray-600 text-center">You can update GST settings anytime in Profile → Financial Setup</p>
    </div>
  )

  const stepContent = [<StepWelcome key="w" />, <StepBalance key="b" />, <StepGST key="g" />]

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-end sm:items-center justify-center transition-all duration-350 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className={`w-full max-w-sm mx-4 mb-0 sm:mb-0 bg-gray-900 border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-transform duration-350 ${visible ? 'translate-y-0' : 'translate-y-full sm:translate-y-8'}`}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {steps.map((_, i) => <Dot key={i} active={i === step} />)}
          </div>

          {/* Step label */}
          <p className="text-center text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500 mb-1">
            Step {step + 1} of {steps.length}
          </p>

          {/* Skip button */}
          <button
            onClick={skip}
            className="absolute top-6 right-5 text-xs text-gray-600 hover:text-gray-400 transition-colors font-medium"
          >
            Skip all
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 min-h-[320px]">
          {stepContent[step]}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-5 flex gap-3 border-t border-white/5 mt-2">
          {step > 0 && (
            <button
              onClick={prev}
              className="flex-none px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-gray-400 text-sm font-semibold active:scale-95 transition-all"
            >
              ← Back
            </button>
          )}

          {step < steps.length - 1 ? (
            <button
              onClick={next}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-brand-500/30 active:scale-95 transition-all"
            >
              {step === 0 ? "Let's Get Started →" : 'Continue →'}
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={saving}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-brand-500/30 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
                : '✅ Finish Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
