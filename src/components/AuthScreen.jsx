/**
 * AuthScreen.jsx — Simplified Premium Auth (No OTP)
 * Sign Up: name + email + phone + password
 * Login: single input (email or phone) + password → instant
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  RefreshCw, UserPlus, LogIn, User, Eye, EyeOff,
  CheckCircle2, AlertCircle, Sparkles, Mail, Lock, Phone
} from 'lucide-react'
import { registerUser, loginUser, isEmail, isPhone } from '../authUtils'

/* ═══════ Floating Label Input — Refined ═══════ */
function FloatingInput({
  icon: Icon,
  iconColor = 'var(--mf-text-muted)',
  label,
  type = 'text',
  value,
  onChange,
  onKeyDown,
  right,
  error,
  success,
  autoFocus,
  autoComplete,
  inputMode,
  delay = 0,
}) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const hasValue = value && value.length > 0
  const isFloating = focused || hasValue

  const borderColor = error
    ? 'var(--mf-error)'
    : success
      ? 'var(--mf-success)'
      : focused
        ? '#14B8A6'
        : 'var(--mf-border)'

  return (
    <div className="relative group stagger-item animate-fade-in" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="flex items-center rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--mf-surface-2)',
          border: `1.5px solid ${borderColor}`,
          boxShadow: focused ? `0 0 0 3px ${error ? 'rgba(255,107,107,0.12)' : 'rgba(20,184,166,0.12)'}` : 'none',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {Icon && (
          <div className="pl-4 shrink-0 transition-all duration-200">
            <Icon size={16} style={{ color: focused ? '#14B8A6' : iconColor, transform: focused ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }} />
          </div>
        )}
        <div className="flex-1 relative">
          <label
            className="absolute left-3 transition-all duration-200 pointer-events-none select-none"
            style={{
              top: isFloating ? '6px' : '50%',
              transform: isFloating ? 'none' : 'translateY(-50%)',
              fontSize: isFloating ? '10px' : '14px',
              fontWeight: isFloating ? 600 : 400,
              color: focused ? '#14B8A6' : 'var(--mf-text-muted)',
              letterSpacing: isFloating ? '0.03em' : '0',
            }}
          >
            {label}
          </label>
          <input
            ref={inputRef}
            type={type}
            autoComplete={autoComplete}
            inputMode={inputMode}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus={autoFocus}
            className="w-full bg-transparent pr-3 text-sm outline-none border-none focus:ring-0 focus:outline-none"
            style={{
              color: 'var(--mf-text-primary)',
              caretColor: 'var(--mf-accent)',
              paddingTop: isFloating ? '22px' : '16px',
              paddingBottom: isFloating ? '8px' : '16px',
              paddingLeft: '12px',
            }}
          />
        </div>
        {right && <div className="pr-4 shrink-0">{right}</div>}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[11px] font-medium mt-1.5 ml-1 animate-fade-in" style={{ color: 'var(--mf-error)' }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-1 text-[11px] font-medium mt-1.5 ml-1 animate-fade-in" style={{ color: 'var(--mf-success)' }}>
          <CheckCircle2 size={11} /> {success}
        </p>
      )}
    </div>
  )
}

/* ═══════ Success Checkmark Animation ═══════ */
function SuccessAnimation({ message }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
      <div className="text-center" style={{ animation: 'successPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both' }}>
        {/* Animated rings */}
        <div className="relative w-24 h-24 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full" style={{
            border: '2px solid rgba(52,211,153,0.15)',
            animation: 'authRingPulse 2s ease-out infinite',
          }} />
          <div className="absolute inset-2 rounded-full" style={{
            border: '2px solid rgba(52,211,153,0.25)',
            animation: 'authRingPulse 2s ease-out 0.3s infinite',
          }} />
          <div
            className="absolute inset-4 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.20), rgba(52,211,153,0.10))',
              border: '2px solid rgba(52,211,153,0.30)',
              boxShadow: '0 0 40px rgba(52,211,153,0.20)',
            }}
          >
            <CheckCircle2 size={32} style={{ color: '#34D399' }} />
          </div>
        </div>
        <p className="text-xl font-bold mb-1" style={{ color: 'var(--mf-text-primary)' }}>{message}</p>
        <p className="text-sm" style={{ color: 'var(--mf-text-muted)' }}>Setting up your secure financial cockpit...</p>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   MAIN AUTH SCREEN — Simplified V.2 (No OTP)
   ═══════════════════════════════════════════════════ */
export default function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState('login') // 'login' | 'register'

  // Login fields
  const [identifier, setIdentifier] = useState('') // email or phone
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Register fields
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [showSuccess, setShowSuccess] = useState(false)

  // Prevent double-submit
  const submittingRef = useRef(false)

  const reset = useCallback(() => {
    setError('')
    setFieldErrors({})
  }, [])

  const switchTab = useCallback((t) => {
    setTab(t)
    reset()
  }, [reset])

  // ── Smart identifier icon ──
  const identifierIcon = isEmail(identifier) ? Mail : isPhone(identifier) ? Phone : Mail

  // ── Validation helpers ──
  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)
  const validatePhone = (val) => !val || /^\+?[1-9]\d{6,14}$/.test(val)

  // ── Handle Login ──
  const handleLogin = async () => {
    if (submittingRef.current) return
    reset()

    const trimmed = identifier.trim()
    if (!trimmed) {
      setFieldErrors({ identifier: 'Enter your email or phone number' })
      return
    }
    if (!isEmail(trimmed) && !isPhone(trimmed)) {
      setFieldErrors({ identifier: 'Enter a valid email or phone number' })
      return
    }
    if (!password || password.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters' })
      return
    }

    submittingRef.current = true
    setLoading(true)
    try {
      const user = await loginUser(trimmed, password)
      setShowSuccess(true)
      setTimeout(() => onAuth(user.uid), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  // ── Handle Register ──
  const handleRegister = async () => {
    if (submittingRef.current) return
    reset()

    if (!regName.trim() || regName.trim().length < 2) {
      setFieldErrors({ name: 'Enter your full name (min 2 characters)' })
      return
    }
    if (!regEmail.trim() || !validateEmail(regEmail)) {
      setFieldErrors({ email: 'Enter a valid email address' })
      return
    }
    if (regPhone.trim() && !validatePhone(regPhone.trim())) {
      setFieldErrors({ phone: 'Enter a valid phone number (e.g. +919876543210)' })
      return
    }
    if (!regPassword || regPassword.length < 8) {
      setFieldErrors({ password: 'Password must be at least 8 characters' })
      return
    }

    submittingRef.current = true
    setLoading(true)
    try {
      const user = await registerUser(regName.trim(), regEmail.trim(), regPassword, regPhone.trim())
      setShowSuccess(true)
      setTimeout(() => onAuth(user.uid), 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      submittingRef.current = false
    }
  }

  const handleSubmit = tab === 'login' ? handleLogin : handleRegister

  /* Success overlay */
  if (showSuccess) {
    return <SuccessAnimation message={tab === 'register' ? `Welcome, ${regName || 'User'}! 🎉` : 'Welcome back! 👋'} />
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden animate-fade-in" style={{ background: 'var(--mf-bg)' }}>

      {/* Decorative subtle ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{
          position: 'absolute', top: '-15%', left: '-15%', width: '350px', height: '350px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'authGlowFloat 8s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-15%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'authGlowFloat 8s ease-in-out 4s infinite',
        }} />
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, var(--mf-text-primary) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      {/* ── LEFT PANE (Branding — Desktop only) ── */}
      <div className="hidden lg:flex flex-col w-[45%] xl:w-[48%] p-16 justify-between relative overflow-hidden select-none border-r border-black/[0.04] dark:border-white/[0.04]"
           style={{ background: 'linear-gradient(135deg, #052b22 0%, #021411 100%)' }}>
        <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full opacity-35 pointer-events-none filter blur-[80px]"
             style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] rounded-full opacity-25 pointer-events-none filter blur-[80px]"
             style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }} />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4F8EF7] to-blue-600 flex items-center justify-center shadow-lg shadow-[#4F8EF7]/20 flex-shrink-0">
            <span className="text-white font-display font-black text-xl select-none">₹</span>
          </div>
          <div>
            <h2 className="font-display font-black text-base tracking-tight leading-none text-white">MoneyFlow</h2>
            <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">Premium Cockpit</span>
          </div>
        </div>

        {/* Hero */}
        <div className="my-auto space-y-10 relative z-10">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-display font-black text-white leading-[1.15] tracking-tight">
              Control your wealth.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Optimize every flow.
              </span>
            </h1>
            <p className="text-white/60 text-sm xl:text-base font-body max-w-md leading-relaxed">
              A private, high-fidelity financial dashboard to manage, track, and forecast your net worth with automated SMS ingestion and custom analytics.
            </p>
          </div>

          {/* Mock cockpit cards */}
          <div className="space-y-4 max-w-lg">
            <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-emerald-400/30 hover:bg-white/[0.04]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Available Portfolio</span>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">+14.2% YoY</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-display font-bold text-white tracking-tight">₹18,45,290</span>
                <span className="text-xs text-white/40">.80</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-white/50">
                  <span>CASH (24%)</span><span>BANK (56%)</span><span>ASSETS (20%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{ width: '24%' }} />
                  <div className="h-full bg-sky-400" style={{ width: '56%' }} />
                  <div className="h-full bg-purple-400" style={{ width: '20%' }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-2xl p-4 shadow-xl transition-all duration-300 hover:bg-white/[0.04]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-white/40 block mb-1">Incoming Credit</span>
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">Passive Dividends</p>
                    <span className="text-[9px] text-white/40">Cleared via UPI</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400 font-mono flex-shrink-0 ml-1">+₹4,500</span>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-2xl p-4 shadow-xl relative overflow-hidden transition-all duration-300 hover:bg-white/[0.04]">
                <span className="text-[8px] font-bold uppercase tracking-wider text-purple-400 block mb-1 flex items-center gap-0.5">
                  <Sparkles size={8} /> AI Advisor
                </span>
                <p className="text-[10px] text-white/70 leading-relaxed font-semibold">
                  "Allocating 5% more to savings now will secure your upcoming EMI on the 26th."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom trust */}
        <div className="relative z-10 pt-6 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">🔒 SECURE & AES-256 ENCRYPTED</span>
          <span className="text-[9px] font-bold text-emerald-400/80">Loved by 50k+ users</span>
        </div>
      </div>

      {/* ── RIGHT PANE (Auth Card Container) ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 z-10">

        {/* Mobile Header */}
        <div className="lg:hidden flex flex-col items-center justify-center text-center mb-6 flex-shrink-0">
          <div className="relative mb-4">
            <div className="absolute -inset-3 rounded-[28px]" style={{
              border: '1.5px solid rgba(20,184,166,0.10)',
              animation: 'authRingPulse 3s ease-out infinite',
            }} />
            <div className="w-[64px] h-[64px] rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-teal-500/25"
              style={{ background: 'linear-gradient(145deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)' }}>
              <span className="text-white font-black text-2xl">₹</span>
            </div>
          </div>
          <h1 className="font-display font-black text-2xl tracking-tight mb-0.5" style={{ color: 'var(--mf-text-primary)', letterSpacing: '-0.02em' }}>
            MoneyFlow
          </h1>
          <p className="text-xs" style={{ color: 'var(--mf-text-muted)' }}>Your Smart Money Tracker</p>
        </div>

        {/* MAIN CARD */}
        <div
          className="rounded-3xl overflow-hidden flex flex-col animate-slide-up w-full"
          style={{
            background: 'var(--mf-surface)',
            border: '1px solid var(--mf-border)',
            boxShadow: 'var(--mf-shadow-lg)',
            maxWidth: 440,
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center text-center pt-6 pb-2 px-5 stagger-item">
            <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center mb-3 relative overflow-hidden shadow-md shadow-[#14B8A6]/5">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#14B8A6]/5 to-[#0D9488]/5" />
              <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-[#14B8A6] to-[#2DD4BF] relative z-10 select-none">₹</span>
            </div>
            <p className="text-base font-bold mb-0.5" style={{ color: 'var(--mf-text-primary)' }}>
              {tab === 'login' ? 'Welcome back 👋' : 'Create your account 🚀'}
            </p>
            <p className="text-xs px-2" style={{ color: 'var(--mf-text-muted)' }}>
              {tab === 'login'
                ? 'Sign in with your email or phone number'
                : 'Start tracking your money securely'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="px-5 py-2">
            <div className="relative flex p-1 rounded-2xl" style={{ background: 'var(--mf-surface-2)' }}>
              <div
                className="absolute top-1 bottom-1 rounded-xl transition-all duration-300"
                style={{
                  width: 'calc(50% - 4px)',
                  left: tab === 'login' ? '4px' : 'calc(50% + 0px)',
                  background: '#14B8A6',
                  boxShadow: '0 4px 16px rgba(20,184,166,0.30)',
                }}
              />
              {[
                { id: 'login', label: 'Sign In', Icon: LogIn },
                { id: 'register', label: 'Sign Up', Icon: UserPlus },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => switchTab(id)}
                  className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95 border-none bg-transparent outline-none focus:outline-none cursor-pointer"
                  style={tab === id ? { color: 'white' } : { color: 'var(--mf-text-muted)' }}
                >
                  <Icon size={14} style={{ transition: 'transform 0.2s', transform: tab === id ? 'scale(1.1)' : 'scale(1)' }} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            className="p-5 pt-3 flex-1 flex flex-col"
            onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
          >
            <div className="space-y-4">
              {tab === 'register' ? (
                /* ──── REGISTER FORM ──── */
                <>
                  <FloatingInput
                    icon={User}
                    label="Your full name"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    error={fieldErrors.name}
                    autoComplete="name"
                    autoFocus
                    delay={50}
                  />
                  <FloatingInput
                    icon={Mail}
                    type="email"
                    label="Email address"
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    error={fieldErrors.email}
                    autoComplete="email"
                    delay={100}
                  />
                  <FloatingInput
                    icon={Phone}
                    type="tel"
                    label="Mobile number (e.g. +919876543210)"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    error={fieldErrors.phone}
                    autoComplete="tel"
                    inputMode="tel"
                    delay={150}
                  />
                  <FloatingInput
                    icon={Lock}
                    type={showRegPassword ? 'text' : 'password'}
                    label="Create a password"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    error={fieldErrors.password}
                    autoComplete="new-password"
                    delay={200}
                    right={
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(p => !p)}
                        className="p-1 text-white/30 hover:text-white/60 transition-colors"
                        tabIndex={-1}
                        aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      >
                        {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </>
              ) : (
                /* ──── LOGIN FORM ──── */
                <>
                  <FloatingInput
                    icon={identifierIcon}
                    label="Email or phone number"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    error={fieldErrors.identifier}
                    autoComplete="username"
                    autoFocus
                    delay={50}
                  />
                  <FloatingInput
                    icon={Lock}
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={fieldErrors.password}
                    autoComplete="current-password"
                    delay={100}
                    right={
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="p-1 text-white/30 hover:text-white/60 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                </>
              )}

              {/* Error Banner */}
              {error && (
                <div className="flex items-center gap-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[#FF6B6B] animate-fade-in">
                  <AlertCircle size={13} /> <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="auth-cta-btn w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] border-none outline-none focus:outline-none cursor-pointer mt-2 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)',
                  boxShadow: '0 8px 28px rgba(20,184,166,0.30)',
                }}
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : tab === 'login' ? (
                  <><LogIn size={17} /> Log In</>
                ) : (
                  <><UserPlus size={17} /> Create Account</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
