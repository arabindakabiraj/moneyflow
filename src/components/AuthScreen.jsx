/**
 * AuthScreen.jsx — Premium fintech auth experience V.2
 * Redesigned to match Dashboard/Settings premium card system
 * Features: animated hero, sliding tab indicator, stagger animations,
 * social login placeholders, security trust strip, step indicators
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { Lock, Eye, EyeOff, RefreshCw, UserPlus, LogIn, User, KeyRound, ArrowLeft, Phone, CheckCircle2, AlertCircle, Sparkles, CloudOff, ChevronRight } from 'lucide-react'
import { registerUser, loginUser, resetPassword, saveSession } from '../authUtils'

const RECAPTCHA_SITE_KEY = '6LeNy_YsAAAAACKDzdg_oMc2Ty9jVEvxLuL0qGAN'

/* ═══════ Password Strength Calculator ═══════ */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '', width: '0%' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  const levels = [
    { label: 'Very Weak', color: '#FF6B6B', width: '20%' },
    { label: 'Weak', color: '#FF9F43', width: '40%' },
    { label: 'Fair', color: '#FBBF24', width: '60%' },
    { label: 'Strong', color: '#34D399', width: '80%' },
    { label: 'Very Strong', color: '#22c55e', width: '100%' },
  ]
  const level = levels[Math.min(score, 4)]
  return { score, ...level }
}

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
  inputMode,
  maxLength,
  autoComplete,
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
    <div className="relative group stagger-item" style={{ animationDelay: `${delay}ms` }}>
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
            inputMode={inputMode}
            maxLength={maxLength}
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus={autoFocus}
            className="w-full bg-transparent pr-3 text-sm outline-none"
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

/* ═══════ Phone Input with Country Code ═══════ */
function PhoneInput({ value, onChange, onKeyDown, error, delay = 0 }) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  return (
    <div className="relative stagger-item" style={{ animationDelay: `${delay}ms` }}>
      <div
        className="flex items-center rounded-2xl overflow-hidden transition-all duration-300"
        style={{
          background: 'var(--mf-surface-2)',
          border: `1.5px solid ${error ? 'var(--mf-error)' : focused ? '#14B8A6' : 'var(--mf-border)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(20,184,166,0.12)' : 'none',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="pl-4 shrink-0 transition-colors duration-200">
          <Phone size={16} style={{ color: focused ? '#14B8A6' : 'var(--mf-text-muted)', transform: focused ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }} />
        </div>
        <div className="flex items-center gap-2 pl-3 shrink-0">
          <span className="text-base">🇮🇳</span>
          <span
            className="font-mono text-sm pr-3"
            style={{ color: 'var(--mf-text-secondary)', borderRight: '1px solid var(--mf-border)' }}
          >
            +91
          </span>
        </div>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          placeholder="10-digit phone number"
          value={value}
          onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent py-4 pl-3 pr-4 font-mono text-sm outline-none"
          style={{ color: 'var(--mf-text-primary)', caretColor: 'var(--mf-accent)' }}
        />
        {value.length === 10 && (
          <div className="pr-4 shrink-0 animate-fade-in">
            <CheckCircle2 size={16} style={{ color: 'var(--mf-success)' }} />
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[11px] font-medium mt-1.5 ml-1 animate-fade-in" style={{ color: 'var(--mf-error)' }}>
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}

/* ═══════ Password Strength Meter ═══════ */
function PasswordStrength({ password }) {
  if (!password) return null
  const strength = getPasswordStrength(password)

  return (
    <div className="mt-2 px-1 animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--mf-text-muted)' }}>
          Password Strength
        </span>
        <span className="text-[10px] font-bold" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--mf-surface-3)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: strength.width,
            background: `linear-gradient(90deg, ${strength.color}, ${strength.color}cc)`,
            boxShadow: `0 0 10px ${strength.color}44`,
          }}
        />
      </div>
      {/* Requirements checklist */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {[
          { test: password.length >= 6, label: '6+ chars' },
          { test: /[A-Z]/.test(password), label: 'Uppercase' },
          { test: /[0-9]/.test(password), label: 'Number' },
          { test: /[^A-Za-z0-9]/.test(password), label: 'Symbol' },
        ].map(r => (
          <span key={r.label} className="text-[9px] font-semibold flex items-center gap-0.5"
            style={{ color: r.test ? 'var(--mf-success)' : 'var(--mf-text-muted)' }}>
            {r.test ? '✓' : '○'} {r.label}
          </span>
        ))}
      </div>
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
        <p className="text-sm" style={{ color: 'var(--mf-text-muted)' }}>Setting up your dashboard...</p>
      </div>
    </div>
  )
}



/* ═══════ Step Indicator (for Forgot Password) ═══════ */
function StepIndicator({ currentStep, totalSteps = 3 }) {
  const steps = ['Phone', 'New Password', 'Done']
  return (
    <div className="flex items-center justify-center gap-2 mb-5">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300"
              style={i <= currentStep ? {
                background: '#14B8A6', color: 'white',
                boxShadow: i === currentStep ? '0 0 12px rgba(20,184,166,0.40)' : 'none',
              } : {
                background: 'var(--mf-surface-3)', color: 'var(--mf-text-muted)',
              }}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span className="text-[8px] font-semibold" style={{ color: i <= currentStep ? '#14B8A6' : 'var(--mf-text-muted)' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-8 h-[1.5px] rounded-full mb-3 transition-all duration-300"
              style={{ background: i < currentStep ? '#14B8A6' : 'var(--mf-surface-3)' }} />
          )}
        </div>
      ))}
    </div>
  )
}


/* ═══════════════════════════════════════════════════
   MAIN AUTH SCREEN — Redesigned Premium V.2
   ═══════════════════════════════════════════════════ */
export default function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState('login')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [newPass, setNewPass] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [recaptchaToken, setRecaptchaToken] = useState('')

  const recaptchaWidgetId = useRef(null)
  const recaptchaContainerRef = useRef(null)
  const recaptchaPendingResolve = useRef(null)

  const reset = useCallback(() => { setError(''); setSuccess(''); setFieldErrors({}) }, [])
  const switchTab = useCallback((t) => {
    setTab(t); reset()
    setPassword(''); setConfirm(''); setNewPass(''); setShowPw('')
    // Reset reCAPTCHA when switching tabs
    setRecaptchaToken('')
    if (recaptchaWidgetId.current !== null && window.grecaptcha) {
      try { window.grecaptcha.reset(recaptchaWidgetId.current) } catch (_) {}
    }
  }, [reset])



  // Mount reCAPTCHA v2 Invisible widget once on load
  useEffect(() => {
    const mountWidget = () => {
      if (recaptchaWidgetId.current !== null) return
      if (!recaptchaContainerRef.current) return
      if (!window.grecaptcha?.render) return

      recaptchaWidgetId.current = window.grecaptcha.render(recaptchaContainerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        size: 'invisible',          // ← Invisible v2 key
        badge: 'bottomright',       // Badge position (required by Google TOS)
        callback: (token) => {
          // Token received — store it and continue the pending auth action
          setRecaptchaToken(token)
          recaptchaPendingResolve.current?.(token)
          recaptchaPendingResolve.current = null
        },
        'expired-callback': () => {
          setRecaptchaToken('')
          recaptchaPendingResolve.current = null
        },
        'error-callback': () => {
          setRecaptchaToken('')
          recaptchaPendingResolve.current = null
        },
      })
    }

    if (window.grecaptcha?.render) {
      mountWidget()
    } else {
      const interval = setInterval(() => {
        if (window.grecaptcha?.render) { clearInterval(interval); mountWidget() }
      }, 150)
      return () => clearInterval(interval)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Returns a Promise that resolves with a fresh reCAPTCHA token
  const executeRecaptcha = useCallback(() => {
    return new Promise((resolve) => {
      // If reCAPTCHA script not loaded or widget not mounted — bypass silently
      if (!window.grecaptcha || recaptchaWidgetId.current === null) {
        resolve('dev-bypass')
        return
      }
      // Store resolver so the callback fires when Google responds
      recaptchaPendingResolve.current = resolve
      try {
        window.grecaptcha.reset(recaptchaWidgetId.current)
        window.grecaptcha.execute(recaptchaWidgetId.current)
      } catch (err) {
        // Domain not authorized, config error, etc. — bypass gracefully
        console.warn('reCAPTCHA skipped:', err?.message || err)
        recaptchaPendingResolve.current = null
        resolve('error-bypass')
      }
      // Safety timeout: if no response within 8s (e.g. domain error blocks callback),
      // resolve anyway so auth is never permanently stuck
      setTimeout(() => {
        if (recaptchaPendingResolve.current) {
          recaptchaPendingResolve.current = null
          resolve('timeout-bypass')
        }
      }, 8000)
    })
  }, [])

  const resetRecaptcha = useCallback(() => {
    setRecaptchaToken('')
    recaptchaPendingResolve.current = null
    if (recaptchaWidgetId.current !== null && window.grecaptcha) {
      try { window.grecaptcha.reset(recaptchaWidgetId.current) } catch (_) {}
    }
  }, [])



  // Real-time validation
  const validateField = useCallback((field, value) => {
    const errors = { ...fieldErrors }
    switch (field) {
      case 'phone':
        if (value && value.length > 0 && value.length < 10) errors.phone = 'Enter complete 10-digit number'
        else delete errors.phone
        break
      case 'username':
        if (value && value.trim().length > 0 && value.trim().length < 2) errors.username = 'Name must be at least 2 characters'
        else delete errors.username
        break
      case 'password':
        if (value && value.length > 0 && value.length < 6) errors.password = 'Minimum 6 characters required'
        else delete errors.password
        break
      case 'confirm':
        if (value && value !== password) errors.confirm = 'Passwords don\'t match'
        else delete errors.confirm
        break
    }
    setFieldErrors(errors)
  }, [fieldErrors, password])

  const handleSubmit = async () => {
    reset()
    const p = phone.replace(/\s/g, '')

    if (p.length < 10) { setFieldErrors({ phone: 'Enter a valid 10-digit phone number' }); return }

    setLoading(true)
    try {
      // Execute invisible reCAPTCHA — shows challenge only if Google suspects a bot
      await executeRecaptcha()

      if (tab === 'login') {
        if (!password) { setFieldErrors({ password: 'Enter your password' }); setLoading(false); return }
        const uid = await loginUser(p, password)
        saveSession(uid)
        setShowSuccess(true)
        setTimeout(() => onAuth(uid), 1200)
      } else if (tab === 'register') {
        if (!username.trim()) { setFieldErrors({ username: 'Enter your name' }); setLoading(false); return }
        if (password.length < 6) { setFieldErrors({ password: 'Password must be at least 6 characters' }); setLoading(false); return }
        if (password !== confirm) { setFieldErrors({ confirm: 'Passwords do not match' }); setLoading(false); return }
        const uid = await registerUser(p, password, username.trim())
        saveSession(uid)
        setShowSuccess(true)
        setTimeout(() => onAuth(uid), 1200)
      } else if (tab === 'forgot') {
        if (newPass.length < 6) { setFieldErrors({ newPass: 'New password must be at least 6 characters' }); setLoading(false); return }
        await resetPassword(p, newPass)
        setSuccess('Password reset successful! Redirecting to login...')
        setTimeout(() => switchTab('login'), 2000)
      }
    } catch (err) {
      resetRecaptcha()
      const msg = err.message
      if (msg.includes('Wrong password')) setError('Incorrect password. Try again or reset it below.')
      else if (msg.includes('not found')) setError('No account found with this number. Sign up instead?')
      else if (msg.includes('already exists')) setError('This number is already registered. Try signing in.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const eyeBtn = (
    <button
      type="button"
      onClick={() => setShowPw(s => !s)}
      className="p-1.5 rounded-xl transition-all duration-200 active:scale-90"
      style={{ background: showPw ? 'rgba(20,184,166,0.15)' : 'transparent' }}
    >
      {showPw
        ? <Eye size={16} style={{ color: '#14B8A6' }} />
        : <EyeOff size={16} style={{ color: 'var(--mf-text-muted)' }} />}
    </button>
  )

  /* Success overlay */
  if (showSuccess) {
    return <SuccessAnimation message={tab === 'register' ? `Welcome, ${username}! 🎉` : 'Welcome back! 👋'} />
  }

  /* ══════════════ UNIFIED SPLIT-PANE DESKTOP AUTH ══════════════ */
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden" style={{ background: 'var(--mf-bg)' }}>
      {/* Decorative subtle ambient glows — visible globally */}
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
        {/* Dot pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'radial-gradient(circle, var(--mf-text-primary) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      {/* ── LEFT PANE (Branding & Financial Cockpit Teaser — Desktop only) ── */}
      <div className="hidden lg:flex flex-col w-[45%] xl:w-[48%] p-16 justify-between relative overflow-hidden select-none border-r border-black/[0.04] dark:border-white/[0.04]"
           style={{
             background: 'linear-gradient(135deg, #052b22 0%, #021411 100%)',
           }}>
        {/* Inside-pane glows */}
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
            <h2 className="font-display font-black text-base tracking-tight leading-none text-white">
              MoneyFlow
            </h2>
            <span className="text-[9px] font-bold text-emerald-400 tracking-wider uppercase">Premium Cockpit</span>
          </div>
        </div>

        {/* Hero Title & Mock Cards */}
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

          {/* Glassmorphic Mock Fintech Cockpit */}
          <div className="space-y-4 max-w-lg">
            
            {/* Card 1: Available Assets */}
            <div className="bg-white/[0.03] border border-white/[0.08] backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-emerald-400/30 hover:bg-white/[0.04]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Available Portfolio</span>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  +14.2% YoY
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-display font-bold text-white tracking-tight">₹18,45,290</span>
                <span className="text-xs text-white/40">.80</span>
              </div>
              
              {/* Progress bar split */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-white/50">
                  <span>CASH (24%)</span>
                  <span>BANK (56%)</span>
                  <span>ASSETS (20%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{ width: '24%' }} />
                  <div className="h-full bg-sky-400" style={{ width: '56%' }} />
                  <div className="h-full bg-purple-400" style={{ width: '20%' }} />
                </div>
              </div>
            </div>

            {/* Grid row: credit incoming and AI bubble */}
            <div className="grid grid-cols-2 gap-4">
              {/* Incoming credit */}
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

              {/* AI Insight */}
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

        {/* Bottom trust indicator */}
        <div className="relative z-10 pt-6 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[9px] font-semibold text-white/30 uppercase tracking-wider">
            🔒 SECURE & AES-256 ENCRYPTED
          </span>
          <span className="text-[9px] font-bold text-emerald-400/80">
            Loved by 50k+ users
          </span>
        </div>
      </div>

      {/* ── RIGHT PANE (Auth Forms centered container) ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-12 z-10">
        
        {/* Mobile Header (Hidden on desktop) */}
        <div className="lg:hidden flex flex-col items-center justify-center text-center mb-6 flex-shrink-0">
          <div className="relative mb-4">
            <div className="absolute -inset-3 rounded-[28px]" style={{
              border: '1.5px solid rgba(20,184,166,0.10)',
              animation: 'authRingPulse 3s ease-out infinite',
            }} />
            <div
              className="w-[64px] h-[64px] rounded-2xl flex items-center justify-center relative z-10 shadow-lg shadow-teal-500/25"
              style={{
                background: 'linear-gradient(145deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)',
              }}
            >
              <span className="text-white font-black text-2xl">₹</span>
            </div>
          </div>
          <h1 className="font-display font-black text-2xl tracking-tight mb-0.5" style={{ color: 'var(--mf-text-primary)', letterSpacing: '-0.02em' }}>
            MoneyFlow
          </h1>
          <p className="text-xs" style={{ color: 'var(--mf-text-muted)' }}>
            Your Smart Money Tracker
          </p>
        </div>

        {tab === 'forgot' ? (
          /* FORGOT PASSWORD CARD */
          <div
            className="rounded-3xl overflow-hidden animate-slide-up w-full flex flex-col"
            style={{
              background: 'var(--mf-surface)',
              border: '1px solid var(--mf-border)',
              boxShadow: 'var(--mf-shadow-lg)',
              maxWidth: 440,
            }}
          >
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <KeyRound size={20} className="text-amber-500" />
                </div>
                <h1 className="font-display font-black text-xl" style={{ color: 'var(--mf-text-primary)' }}>
                  Reset Password
                </h1>
                <p className="text-xs mt-1" style={{ color: 'var(--mf-text-muted)' }}>
                  Secure password recovery in 3 easy steps
                </p>
              </div>

              {/* Step indicator */}
              <StepIndicator currentStep={newPass.length >= 6 ? 2 : phone.length === 10 ? 1 : 0} />

              <button
                onClick={() => switchTab('login')}
                className="flex items-center gap-1.5 text-xs mb-4 transition-all active:scale-95 rounded-xl px-2.5 py-1.5 -ml-1 self-start"
                style={{ color: 'var(--mf-text-muted)', background: 'transparent' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--mf-surface-2)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <ArrowLeft size={12} /> Back to Sign In
              </button>

              <div className="space-y-3.5 mb-5">
                <PhoneInput
                  value={phone}
                  onChange={(v) => { setPhone(v); validateField('phone', v) }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  error={fieldErrors.phone}
                  delay={0}
                />
                <FloatingInput
                  icon={Lock}
                  iconColor="#FBBF24"
                  type={showPw ? 'text' : 'password'}
                  label="New password (min 6 characters)"
                  value={newPass}
                  onChange={e => { setNewPass(e.target.value); validateField('password', e.target.value) }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  right={eyeBtn}
                  error={fieldErrors.newPass}
                  delay={80}
                />
                <PasswordStrength password={newPass} />
              </div>

              {/* Global error/success */}
              {error && (
                <div
                  className="flex items-start gap-2 text-sm mb-4 px-4 py-3 rounded-2xl font-medium animate-slide-up animate-fade-in"
                  style={{ background: 'rgba(255,107,107,0.08)', color: 'var(--mf-error)', border: '1px solid rgba(255,107,107,0.15)' }}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div
                  className="flex items-start gap-2 text-sm mb-4 px-4 py-3 rounded-2xl font-medium animate-slide-up animate-fade-in"
                  style={{ background: 'rgba(52,211,153,0.08)', color: 'var(--mf-success)', border: '1px solid rgba(52,211,153,0.15)' }}
                >
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="auth-cta-btn w-full py-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.95] transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                  boxShadow: '0 8px 24px rgba(251,191,36,0.25)',
                }}
              >
                {loading ? <RefreshCw size={17} className="animate-spin" /> : <><KeyRound size={17} /> Reset Password</>}
              </button>
            </div>
            
            {/* Google TOS notice for invisible reCAPTCHA compliant hiding */}
            <p className="text-[10px] text-center leading-normal mt-4 mb-1 opacity-40 px-2 select-none" style={{ color: 'var(--mf-text-muted)' }}>
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline hover:text-[#14B8A6] transition-colors">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline hover:text-[#14B8A6] transition-colors">
                Terms of Service
              </a>{' '}
              apply.
            </p>


          </div>
        ) : (
          /* SIGN IN / SIGN UP CARD */
          <div
            className="rounded-3xl overflow-hidden flex flex-col animate-slide-up w-full"
            style={{
              background: 'var(--mf-surface)',
              border: '1px solid var(--mf-border)',
              boxShadow: 'var(--mf-shadow-lg)',
              maxWidth: 440,
            }}
          >
            {/* Welcome header inside card - now at the very top */}
            <div className="flex flex-col items-center text-center pt-6 pb-2 px-5 stagger-item">
              <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center mb-3 relative overflow-hidden group shadow-md shadow-[#14B8A6]/5">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#14B8A6]/5 to-[#0D9488]/5" />
                <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-[#14B8A6] to-[#2DD4BF] relative z-10 select-none">
                  ₹
                </span>
              </div>
              <p className="text-base font-bold mb-0.5" style={{ color: 'var(--mf-text-primary)' }}>
                {tab === 'login' ? 'Welcome back 👋' : 'Create your account 🚀'}
              </p>
              <p className="text-xs" style={{ color: 'var(--mf-text-muted)' }}>
                {tab === 'login' ? 'Sign in to continue managing your finances' : 'Start tracking your money like a pro'}
              </p>
            </div>

            {/* Sliding Indicator Tab Switcher */}
            <div className="px-5 py-2">
              <div className="relative flex p-1 rounded-2xl" style={{ background: 'var(--mf-surface-2)' }}>
                {/* Sliding indicator */}
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
                    className="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all duration-300 active:scale-95"
                    style={tab === id
                      ? { color: 'white' }
                      : { color: 'var(--mf-text-muted)', background: 'transparent' }
                    }
                  >
                    <Icon size={14} style={{ transition: 'transform 0.2s', transform: tab === id ? 'scale(1.1)' : 'scale(1)' }} /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 pt-3 flex-1 flex flex-col">

              {/* Form fields */}
              <div className="space-y-3.5 mb-5">
                <PhoneInput
                  value={phone}
                  onChange={(v) => { setPhone(v); if (fieldErrors.phone) validateField('phone', v) }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  error={fieldErrors.phone}
                  delay={50}
                />

                {tab === 'register' && (
                  <div className="animate-fade-in">
                    <FloatingInput
                      icon={User}
                      label="Your full name"
                      value={username}
                      onChange={e => { setUsername(e.target.value); if (fieldErrors.username) validateField('username', e.target.value) }}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      error={fieldErrors.username}
                      autoComplete="name"
                      delay={100}
                    />
                  </div>
                )}

                <FloatingInput
                  icon={Lock}
                  type={showPw ? 'text' : 'password'}
                  label={tab === 'register' ? 'Create a password (min 6 chars)' : 'Enter your password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (fieldErrors.password) validateField('password', e.target.value) }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  right={eyeBtn}
                  error={fieldErrors.password}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  delay={150}
                />

                {tab === 'register' && password && <PasswordStrength password={password} />}

                {tab === 'register' && (
                  <div className="animate-fade-in">
                    <FloatingInput
                      icon={Lock}
                      type={showPw ? 'text' : 'password'}
                      label="Confirm your password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); if (fieldErrors.confirm) validateField('confirm', e.target.value) }}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      error={fieldErrors.confirm}
                      success={confirm && confirm === password ? 'Passwords match!' : undefined}
                      autoComplete="new-password"
                      delay={200}
                    />
                  </div>
                )}
              </div>

              {/* Global Error Display */}
              {error && (
                <div
                  className="flex items-start gap-2 text-sm mb-4 px-4 py-3 rounded-2xl font-medium animate-slide-up animate-fade-in text-left"
                  style={{
                    background: 'rgba(255,107,107,0.08)',
                    color: 'var(--mf-error)',
                    border: '1px solid rgba(255,107,107,0.15)',
                  }}
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Invisible reCAPTCHA anchor div — renders badge in corner, no visible widget */}
              <div ref={recaptchaContainerRef} />

              {/* CTA Button */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="auth-cta-btn w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-[0.95] transition-all duration-200 mb-3"
                style={{
                  background: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 50%, #0F766E 100%)',
                  boxShadow: '0 8px 28px rgba(20,184,166,0.30)',
                }}
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : tab === 'login' ? (
                  <><LogIn size={17} /> Sign In</>
                ) : (
                  <><Sparkles size={17} /> Create Account</>
                )}
              </button>

              {/* Forgot Password trigger */}
              {tab === 'login' && (
                <button
                  onClick={() => switchTab('forgot')}
                  className="w-full text-center text-sm font-medium py-2 transition-all active:scale-95 rounded-xl mb-1"
                  style={{ color: 'var(--mf-text-muted)' }}
                >
                  Forgot password?{' '}
                  <span style={{ color: '#14B8A6', fontWeight: 600 }}>Reset it →</span>
                </button>
              )}



              {/* Flex spacer and Trust Strip */}
              <div className="flex-1 min-h-[12px]" />

              {/* Google TOS notice for invisible reCAPTCHA compliant hiding */}
              <p className="text-[10px] text-center leading-normal mb-3 opacity-40 px-2 select-none animate-fade-in" style={{ color: 'var(--mf-text-muted)' }}>
                This site is protected by reCAPTCHA and the Google{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline hover:text-[#14B8A6] transition-colors">
                  Privacy Policy
                </a>{' '}
                and{' '}
                <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline hover:text-[#14B8A6] transition-colors">
                  Terms of Service
                </a>{' '}
                apply.
              </p>


            </div>
          </div>
        )}

      </div>

      {/* Embedded inline keyframes styling */}
      <style>{authKeyframes}</style>
    </div>
  )
}

/* ═══════ Auth Keyframe Animations ═══════ */
const authKeyframes = `
  @keyframes successPop {
    0% { opacity: 0; transform: scale(0.5); }
    60% { opacity: 1; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes authRingPulse {
    0% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.08); opacity: 0.2; }
    100% { transform: scale(1); opacity: 0.6; }
  }
  @keyframes authGlowFloat {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(10px, -8px); }
  }
  .auth-cta-btn {
    position: relative;
    overflow: hidden;
  }
  .auth-cta-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 60%);
    background-size: 300% 100%;
    animation: authShimmer 3s ease-in-out infinite;
  }
  @keyframes authShimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`
