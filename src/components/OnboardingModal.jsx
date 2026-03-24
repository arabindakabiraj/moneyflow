/**
 * OnboardingModal.jsx — Full-screen onboarding (slides + setup wizard)
 * Uses the app's theme system (--mf-* CSS variables) for light/dark mode support
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../context/AppContext'

/* ─── Ambient orb background (theme-aware) ─── */
function LiquidBg() {
  return (
    <>
      <div className="pointer-events-none absolute -right-[10%] -top-[10%] w-80 h-80 rounded-full blur-[40px] opacity-30 dark:opacity-100"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute bottom-[10%] -left-[15%] w-64 h-64 rounded-full blur-[36px] opacity-30 dark:opacity-100"
        style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)' }} />
      <div className="pointer-events-none absolute top-[40%] right-[5%] w-44 h-44 rounded-full blur-[28px] opacity-25 dark:opacity-100"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)' }} />
    </>
  )
}

/* ─── Slide data ─── */
const SLIDES = [
  {
    id: 'track',
    gradient: 'linear-gradient(145deg, #064e3b 0%, #065f46 40%, #047857 100%)',
    glowColor: 'rgba(16,185,129,0.55)',
    orbColor: 'rgba(52,211,153,0.30)',
    iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    iconGlow: 'rgba(16,185,129,0.50)',
    emoji: '💰',
    title: 'Track Every Rupee',
    subtitle: 'Log income & expenses in seconds. Smart categories, tags, and GST support built right in.',
    badge: '🇮🇳 Made for India',
  },
  {
    id: 'ai',
    gradient: 'linear-gradient(145deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
    glowColor: 'rgba(99,102,241,0.55)',
    orbColor: 'rgba(129,140,248,0.28)',
    iconBg: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
    iconGlow: 'rgba(99,102,241,0.50)',
    emoji: '🧠',
    title: 'AI-Powered Insights',
    subtitle: 'Predict next month\'s spending, get smart alerts, and chat with your personal finance AI.',
    badge: '⚡ Powered by AI',
  },
  {
    id: 'split',
    gradient: 'linear-gradient(145deg, #0c1a3a 0%, #1e3a8a 40%, #1d4ed8 100%)',
    glowColor: 'rgba(59,130,246,0.55)',
    orbColor: 'rgba(96,165,250,0.28)',
    iconBg: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    iconGlow: 'rgba(59,130,246,0.50)',
    emoji: '🎯',
    title: 'Goals & Group Splits',
    subtitle: 'Set savings goals, track debts, and split bills with friends — with PDF export.',
    badge: '🤝 Split Made Easy',
  },
]

/* ─── Setup steps ─── */
const SETUP_STEPS = ['balance', 'gst']

export default function OnboardingModal({
  onComplete,
  openingBalance = 0,
  setOpeningBalance,
  gstSettings,
  updateGstSettings,
}) {
  const { darkMode } = useApp()
  const [phase, setPhase] = useState('slides') // 'slides' | 'setup'
  const [slideIdx, setSlideIdx] = useState(0)
  const [setupStep, setSetupStep] = useState(0)

  const [amount, setAmount] = useState(openingBalance > 0 ? String(openingBalance) : '')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [gstRate, setGstRate] = useState(gstSettings?.gstRate ?? 18)
  const [registered, setRegistered] = useState(gstSettings?.registered ?? false)
  const [saving, setSaving] = useState(false)
  const [visible, setVisible] = useState(false)

  /* animation fade-in */
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  /* touch / drag */
  const touchStartX = useRef(null)
  const dragDelta = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const amountRef = useRef(null)

  useEffect(() => {
    if (phase === 'setup' && setupStep === 0) {
      setTimeout(() => amountRef.current?.focus(), 400)
    }
  }, [phase, setupStep])

  const goNext = useCallback(() => {
    if (slideIdx < SLIDES.length - 1) setSlideIdx(i => i + 1)
    else setPhase('setup')
  }, [slideIdx])

  const goPrev = useCallback(() => {
    setSlideIdx(i => Math.max(0, i - 1))
  }, [])

  /* touch handlers */
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    dragDelta.current = 0
    setDragging(true)
  }
  const onTouchMove = (e) => {
    if (!dragging) return
    const d = e.touches[0].clientX - touchStartX.current
    dragDelta.current = d
    setDragOffset(d)
  }
  const onTouchEnd = () => {
    setDragging(false)
    setDragOffset(0)
    if (dragDelta.current < -50) goNext()
    else if (dragDelta.current > 50) goPrev()
  }

  /* mouse drag */
  const mouseStartX = useRef(null)
  const onMouseDown = (e) => { mouseStartX.current = e.clientX; setDragging(true) }
  const onMouseMove = (e) => {
    if (!dragging || mouseStartX.current === null) return
    const d = e.clientX - mouseStartX.current
    dragDelta.current = d
    setDragOffset(d)
  }
  const onMouseUp = () => {
    if (!dragging) return
    setDragging(false)
    setDragOffset(0)
    if (dragDelta.current < -60) goNext()
    else if (dragDelta.current > 60) goPrev()
    mouseStartX.current = null
  }

  const skip = () => { setVisible(false); setTimeout(onComplete, 350) }

  const finish = async () => {
    setSaving(true)
    try {
      if (setOpeningBalance) await setOpeningBalance(Number(amount) || 0, date)
      if (updateGstSettings) await updateGstSettings({ gstRate, registered })
    } catch (e) { console.error(e) }
    setSaving(false)
    setVisible(false)
    setTimeout(onComplete, 350)
  }

  const slide = SLIDES[slideIdx]

  /* ════════════════ SLIDES PHASE ════════════════ */
  if (phase === 'slides') {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex flex-col select-none transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'var(--mf-bg)' }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <LiquidBg />

        {/* ── Skip ── */}
        <div className="absolute top-12 right-5 z-20">
          <button
            onClick={skip}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95"
            style={{ background: 'var(--mf-surface-2)', color: 'var(--mf-text-secondary)', border: '1px solid var(--mf-border)' }}
          >
            Skip
          </button>
        </div>

        {/* ── Logo / brand ── */}
        <div className="relative z-10 flex flex-col items-center pt-16 pb-4">
          <div className="w-14 h-14 rounded-[18px] flex items-center justify-center mb-3 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', boxShadow: '0 12px 36px rgba(34,197,94,0.40)' }}>
            <span className="text-white font-black text-2xl">₹</span>
          </div>
          <span className="font-black text-xl tracking-tight" style={{ fontFamily: 'system-ui', color: 'var(--mf-text-primary)' }}>MoneyFlow</span>
          <span className="text-xs mt-0.5" style={{ color: 'var(--mf-text-muted)' }}>Your Smart Money Tracker</span>
        </div>

        {/* ── Carousel ── */}
        <div
          className="flex-1 flex items-center justify-center relative z-10 overflow-hidden"
          style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="relative w-full flex items-center justify-center" style={{ height: 320 }}>
            {SLIDES.map((s, i) => {
              const rel = i - slideIdx
              const active = rel === 0
              const prev = rel === -1
              const next = rel === 1
              if (!active && !prev && !next) return null

              const baseX = rel * 85
              const dragPct = (dragOffset / window.innerWidth) * 80
              const totalX = `calc(${baseX + dragPct}%)`
              const scale = active ? 1 : 0.80
              const opacity = active ? 1 : 0.45

              return (
                <div
                  key={s.id}
                  onClick={() => { if (!dragging) setSlideIdx(i) }}
                  style={{
                    position: 'absolute',
                    width: '76%',
                    maxWidth: 320,
                    height: 310,
                    transform: `translateX(${totalX}) scale(${scale})`,
                    transformOrigin: 'center center',
                    transition: dragging ? 'none' : 'transform 0.42s cubic-bezier(0.25,1,0.5,1), opacity 0.42s ease',
                    opacity,
                    zIndex: active ? 10 : 1,
                    borderRadius: 28,
                  }}
                >
                  {/* Card */}
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-4 p-7 relative overflow-hidden"
                    style={{
                      background: s.gradient,
                      borderRadius: 28,
                      boxShadow: active
                        ? `0 28px 70px ${s.glowColor}, 0 8px 30px rgba(0,0,0,0.4)`
                        : '0 8px 24px rgba(0,0,0,0.25)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {/* Card ambient glow */}
                    <div style={{
                      position: 'absolute', top: '-30%', right: '-20%',
                      width: 200, height: 200, borderRadius: '50%',
                      background: `radial-gradient(circle, ${s.orbColor} 0%, transparent 70%)`,
                      filter: 'blur(20px)', pointerEvents: 'none',
                    }} />

                    {/* Sparkle dots */}
                    <div className="absolute top-5 left-6 w-1 h-1 rounded-full bg-white opacity-60" />
                    <div className="absolute top-12 left-14 w-0.5 h-0.5 rounded-full bg-white opacity-35" />
                    <div className="absolute bottom-10 right-8 w-1 h-1 rounded-full bg-white opacity-30" />

                    {/* Triple-ring icon */}
                    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
                      {/* outer ring */}
                      <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      {/* mid ring */}
                      <div className="absolute rounded-full" style={{ inset: 10, background: 'rgba(255,255,255,0.09)' }} />
                      {/* icon bg */}
                      <div
                        className="absolute rounded-full flex items-center justify-center"
                        style={{ inset: 20, background: s.iconBg, boxShadow: `0 8px 24px ${s.iconGlow}` }}
                      >
                        <span style={{ fontSize: 22 }}>{s.emoji}</span>
                      </div>
                    </div>

                    <div className="text-center relative z-10">
                      <h2 className="text-white font-black text-xl leading-tight mb-2" style={{ letterSpacing: '-0.01em' }}>
                        {s.title}
                      </h2>
                      <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', maxWidth: 230 }}>
                        {s.subtitle}
                      </p>
                    </div>

                    {/* Badge pill */}
                    <div className="px-3 py-1.5 rounded-full relative z-10"
                      style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.20)' }}>
                      <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.80)' }}>{s.badge}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Bottom section ── */}
        <div className="relative z-10 px-6 pb-10 pt-2 flex flex-col items-center gap-4">
          {/* Dot indicators */}
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlideIdx(i)}
                style={{
                  width: slideIdx === i ? 28 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: slideIdx === i ? '#22c55e' : 'var(--mf-surface-3)',
                  transition: 'all 0.3s cubic-bezier(0.25,1,0.5,1)',
                  boxShadow: slideIdx === i ? '0 0 10px rgba(34,197,94,0.50)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={goNext}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-full font-bold text-base active:scale-95 transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.85) 0%, rgba(16,163,74,0.85) 100%)',
              boxShadow: '0 8px 28px rgba(34,197,94,0.40)',
              border: '1.5px solid rgba(34,197,94,0.40)',
              color: 'white',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
            }}
          >
            {slideIdx < SLIDES.length - 1 ? (
              <>Next <span style={{ opacity: 0.85 }}>›</span></>
            ) : (
              <>Set Up My Account <span style={{ opacity: 0.85 }}>›</span></>
            )}
          </button>

          {/* Home indicator */}
          <div className="w-28 h-1 rounded-full" style={{ background: 'var(--mf-surface-3)' }} />
        </div>
      </div>
    )
  }

  /* ════════════════ SETUP PHASE ════════════════ */
  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col select-none transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'var(--mf-bg)' }}
    >
      <LiquidBg />

      {/* ── Header ── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-14 pb-6">
        {/* Back */}
        {setupStep === 0 ? (
          <button
            onClick={() => setPhase('slides')}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--mf-surface-2)', border: '1px solid var(--mf-border)' }}
          >
            <span style={{ color: 'var(--mf-text-primary)' }} className="text-base">‹</span>
          </button>
        ) : (
          <button
            onClick={() => setSetupStep(s => s - 1)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90"
            style={{ background: 'var(--mf-surface-2)', border: '1px solid var(--mf-border)' }}
          >
            <span style={{ color: 'var(--mf-text-primary)' }} className="text-base">‹</span>
          </button>
        )}

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {SETUP_STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: setupStep === i ? 28 : 8,
                height: 8,
                background: setupStep === i ? '#22c55e' : 'var(--mf-surface-3)',
                boxShadow: setupStep === i ? '0 0 10px rgba(34,197,94,0.50)' : 'none',
              }}
            />
          ))}
        </div>

        <button
          onClick={skip}
          className="text-xs font-semibold px-3 py-1.5 rounded-full"
          style={{ background: 'var(--mf-surface-2)', color: 'var(--mf-text-secondary)', border: '1px solid var(--mf-border)' }}
        >
          Skip
        </button>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex flex-col px-5 overflow-y-auto">

        {/* ── Step 1: Opening Balance ── */}
        {setupStep === 0 && (
          <div className="flex flex-col gap-5 max-w-sm mx-auto w-full">
            {/* Icon */}
            <div className="flex flex-col items-center text-center pt-2 pb-4">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  boxShadow: '0 16px 48px rgba(34,197,94,0.45)',
                }}
              >
                <span style={{ fontSize: 32 }}>🏦</span>
              </div>
              <h1 className="font-black text-2xl mb-1" style={{ letterSpacing: '-0.02em', color: 'var(--mf-text-primary)' }}>Opening Balance</h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--mf-text-secondary)', maxWidth: 260 }}>
                How much money did you have before starting MoneyFlow?
              </p>
            </div>

            {/* Amount input */}
            <div
              className="rounded-3xl p-4 flex flex-col gap-4"
              style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}
            >
              {/* Amount */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--mf-text-muted)' }}>
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold" style={{ color: 'var(--mf-text-muted)' }}>₹</span>
                  <input
                    ref={amountRef}
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && setSetupStep(1)}
                    className="w-full pl-10 pr-4 py-4 rounded-2xl text-2xl font-black font-mono outline-none"
                    style={{
                      background: 'var(--mf-surface-2)',
                      border: '1.5px solid var(--mf-border)',
                      color: 'var(--mf-text-primary)',
                      colorScheme: darkMode ? 'dark' : 'light',
                    }}
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: 'var(--mf-text-muted)' }}>
                  As of Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{
                    background: 'var(--mf-surface-2)',
                    border: '1.5px solid var(--mf-border)',
                    color: 'var(--mf-text-primary)',
                    colorScheme: darkMode ? 'dark' : 'light',
                  }}
                />
              </div>
            </div>

            {/* Tip */}
            <div
              className="flex gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)' }}
            >
              <span className="text-lg shrink-0">💡</span>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(34,197,94,0.80)' }}>
                This ensures your Balance Sheet and Net Worth are accurate from day one.
              </p>
            </div>
          </div>
        )}

        {/* ── Step 2: GST ── */}
        {setupStep === 1 && (
          <div className="flex flex-col gap-5 max-w-sm mx-auto w-full">
            {/* Icon */}
            <div className="flex flex-col items-center text-center pt-2 pb-4">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                  boxShadow: '0 16px 48px rgba(251,191,36,0.40)',
                }}
              >
                <span style={{ fontSize: 32 }}>🧾</span>
              </div>
              <h1 className="font-black text-2xl mb-1" style={{ letterSpacing: '-0.02em', color: 'var(--mf-text-primary)' }}>GST Setup</h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--mf-text-secondary)', maxWidth: 260 }}>
                Optional — for tax-deductible expense tracking
              </p>
            </div>

            {/* GST Rate */}
            <div
              className="rounded-3xl p-4 flex flex-col gap-4"
              style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}
            >
              <div>
                <label className="text-xs font-bold uppercase tracking-widest mb-3 block" style={{ color: 'var(--mf-text-muted)' }}>
                  Your GST Rate
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[0, 5, 12, 18, 28].map(r => (
                    <button
                      key={r}
                      onClick={() => setGstRate(r)}
                      className="py-3 rounded-2xl text-sm font-bold transition-all active:scale-95"
                      style={{
                        background: gstRate === r ? 'rgba(251,191,36,0.90)' : 'var(--mf-surface-2)',
                        color: gstRate === r ? '#000' : 'var(--mf-text-secondary)',
                        border: gstRate === r ? '1px solid #fbbf24' : '1px solid var(--mf-border)',
                        boxShadow: gstRate === r ? '0 4px 14px rgba(251,191,36,0.35)' : 'none',
                      }}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              {/* GST Registered toggle */}
              <div
                className="flex items-center justify-between px-4 py-4 rounded-2xl"
                style={{ background: 'var(--mf-surface-2)', border: '1px solid var(--mf-border)' }}
              >
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--mf-text-primary)' }}>I am GST Registered</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--mf-text-muted)' }}>Track GST input credit on expenses</p>
                </div>
                <button
                  onClick={() => setRegistered(r => !r)}
                  className="relative w-14 h-7 rounded-full transition-all duration-300 shrink-0"
                  style={{ background: registered ? '#22c55e' : 'var(--mf-surface-3)' }}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${registered ? 'left-7' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Tip */}
            <div
              className="flex gap-3 px-4 py-3.5 rounded-2xl"
              style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.18)' }}
            >
              <span className="text-lg shrink-0">💡</span>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(251,191,36,0.75)' }}>
                You can always update GST settings later from the Settings page.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer CTA ── */}
      <div className="relative z-10 px-5 py-6 max-w-sm mx-auto w-full">
        {setupStep < SETUP_STEPS.length - 1 ? (
          <button
            onClick={() => setSetupStep(s => s + 1)}
            className="w-full py-4 rounded-full font-bold text-base text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 8px 28px rgba(34,197,94,0.40)',
            }}
          >
            Continue <span style={{ opacity: 0.85 }}>›</span>
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={saving}
            className="w-full py-4 rounded-full font-bold text-base text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 8px 28px rgba(34,197,94,0.40)',
            }}
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
              : <>✅ Finish Setup</>}
          </button>
        )}

        {/* Home indicator */}
        <div className="flex justify-center mt-4">
          <div className="w-28 h-1 rounded-full" style={{ background: 'var(--mf-surface-3)' }} />
        </div>
      </div>
    </div>
  )
}