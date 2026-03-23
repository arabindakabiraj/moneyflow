/**
 * AuthScreen.jsx — Premium minimal dark auth
 * Clean inputs, trust-first design
 */
import { useState } from 'react'
import { Lock, Eye, EyeOff, RefreshCw, UserPlus, LogIn, User, KeyRound, ArrowLeft } from 'lucide-react'
import { registerUser, loginUser, resetPassword, saveSession } from '../authUtils'

/* ── Clean input field ── */
function CleanInput({ icon: Icon, iconColor = 'rgba(255,255,255,0.25)', right, ...props }) {
  return (
    <div
      className="flex items-center rounded-xl overflow-hidden transition-all duration-200 focus-within:border-[#4F8EF7]"
      style={{
        background: 'var(--mf-surface)',
        border: '1.5px solid var(--mf-border)',
      }}
    >
      {Icon && (
        <div className="pl-4 shrink-0">
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      )}
      <input
        {...props}
        className="flex-1 bg-transparent py-4 pl-3 pr-3 text-white text-sm outline-none placeholder-white/25"
      />
      {right && <div className="pr-4 shrink-0">{right}</div>}
    </div>
  )
}

/* ── Phone input ── */
function PhoneInput({ value, onChange, onKeyDown }) {
  return (
    <div
      className="flex items-center rounded-xl overflow-hidden transition-all duration-200 focus-within:border-[#4F8EF7]"
      style={{ background: 'var(--mf-surface)', border: '1.5px solid var(--mf-border)' }}
    >
      <div className="pl-4 flex items-center gap-2 shrink-0">
        <span className="text-lg">🇮🇳</span>
        <span className="font-mono text-sm pr-3 text-gray-400 dark:text-white/30" style={{ borderRight: '1px solid rgba(255,255,255,0.08)' }}>+91</span>
      </div>
      <input
        type="tel"
        inputMode="numeric"
        placeholder="10-digit phone"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent py-4 pl-3 pr-4 text-white font-mono text-sm outline-none placeholder-white/25"
        style={{ caretColor: '#4F8EF7' }}
      />
    </div>
  )
}

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

  const reset = () => { setError(''); setSuccess('') }
  const switchTab = (t) => { setTab(t); reset(); setPassword(''); setConfirm(''); setNewPass('') }

  const handleSubmit = async () => {
    reset()
    const p = phone.replace(/\s/g, '')
    if (p.length < 10) { setError('Enter a valid 10-digit phone number'); return }
    setLoading(true)
    try {
      if (tab === 'login') {
        if (!password) { setError('Enter your password'); setLoading(false); return }
        const uid = await loginUser(p, password)
        saveSession(uid); onAuth(uid)
      } else if (tab === 'register') {
        if (!username.trim()) { setError('Enter your name'); setLoading(false); return }
        if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
        if (password !== confirm) { setError('Passwords do not match'); setLoading(false); return }
        const uid = await registerUser(p, password, username.trim())
        setSuccess('✅ Account created! Welcome ' + username + '!')
        setTimeout(() => { saveSession(uid); onAuth(uid) }, 900)
      } else if (tab === 'forgot') {
        if (newPass.length < 6) { setError('New password must be at least 6 characters'); setLoading(false); return }
        await resetPassword(p, newPass)
        setSuccess('✅ Password has been reset! Please login.')
        setTimeout(() => switchTab('login'), 2000)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const eyeBtn = (
    <button onClick={() => setShowPw(s => !s)} className="transition-opacity hover:opacity-75">
      {showPw
        ? <EyeOff size={16} className="text-gray-400 dark:text-white/30" />
        : <Eye size={16} className="text-gray-400 dark:text-white/30" />}
    </button>
  )

  /* ── accent color per tab ── */
  const accent = tab === 'register'
    ? { btn: '#4F8EF7', glow: 'rgba(79,142,247,0.30)' }
    : { btn: '#4F8EF7', glow: 'rgba(79,142,247,0.30)' }

  /* ══════════════ FORGOT PASSWORD ══════════════ */
  if (tab === 'forgot') {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--mf-bg)' }}>
        {/* Hero */}
        <div className="flex flex-col items-center justify-center px-6 pt-20 pb-8 text-center flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#FBBF24', boxShadow: '0 12px 32px rgba(251,191,36,0.25)' }}>
            <KeyRound size={30} className="text-white" />
          </div>
          <h1 className="text-white font-black text-2xl mb-1" style={{ letterSpacing: '-0.02em' }}>Reset Password</h1>
          <p className="text-sm text-gray-400 dark:text-white/35">Enter your phone & choose a new password</p>
        </div>

        {/* Card */}
        <div className="flex-1 mx-4 mb-8 max-w-sm mx-auto w-full" style={{ maxWidth: 400 }}>
          <div className="rounded-2xl p-6" style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}>
            <button onClick={() => switchTab('login')}
              className="flex items-center gap-1.5 text-sm mb-5 text-gray-400 dark:text-white/30 hover:text-gray-500 dark:text-white/50 transition-colors">
              <ArrowLeft size={14} /> Back to Sign In
            </button>

            <div className="space-y-3 mb-5">
              <PhoneInput value={phone} onChange={setPhone} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
              <CleanInput
                icon={Lock}
                iconColor="#FBBF24"
                type={showPw ? 'text' : 'password'}
                placeholder="New password (min 6)"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                right={eyeBtn}
              />
            </div>

            {error && <div className="text-sm mb-3 px-3 py-2 rounded-xl font-medium" style={{ background: 'rgba(255,107,107,0.10)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.20)' }}>⚠️ {error}</div>}
            {success && <div className="text-sm mb-3 px-3 py-2 rounded-xl font-medium" style={{ background: 'rgba(52,211,153,0.10)', color: '#34D399', border: '1px solid rgba(52,211,153,0.20)' }}>{success}</div>}

            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] transition-all"
              style={{ background: '#FBBF24', boxShadow: '0 8px 24px rgba(251,191,36,0.25)' }}>
              {loading ? <RefreshCw size={17} className="animate-spin" /> : <><KeyRound size={17} /> Reset Password</>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ══════════════ LOGIN / REGISTER ══════════════ */
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--mf-bg)' }}>
      {/* ── Hero section ── */}
      <div className="flex flex-col items-center justify-center px-6 pt-16 pb-6 text-center flex-shrink-0">
        {/* App icon */}
        <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4 relative"
          style={{
            background: '#4F8EF7',
            boxShadow: '0 16px 40px rgba(79,142,247,0.30)',
          }}>
          <span className="text-white font-black text-4xl relative z-10">₹</span>
        </div>

        <h1 className="text-white font-black text-3xl tracking-tight mb-1" style={{ letterSpacing: '-0.025em' }}>
          MoneyFlow
        </h1>
        <p className="text-sm text-gray-400 dark:text-white/35">Your Smart Money Tracker</p>

        {/* Feature pills */}
        <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
          {['💰 Track Expenses', '📊 Analytics', '🤝 Split Bills'].map(f => (
            <span key={f} className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.50)', border: '1px solid var(--mf-border)' }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* ── Auth card ── */}
      <div className="flex-1 px-4 pb-10 flex flex-col" style={{ maxWidth: 420, margin: '0 auto', width: '100%' }}>
        <div className="rounded-2xl p-5 flex-1 flex flex-col"
          style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}>
          
          {/* Tab switcher */}
          <div className="flex gap-1.5 p-1.5 rounded-xl mb-5" style={{ background: 'var(--mf-surface-2)' }}>
            {[{ id: 'login', label: 'Sign In', Icon: LogIn }, { id: 'register', label: 'Sign Up', Icon: UserPlus }].map(({ id, label, Icon }) => (
              <button key={id} onClick={() => switchTab(id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95"
                style={tab === id
                  ? { background: '#4F8EF7', color: 'white', boxShadow: '0 4px 12px rgba(79,142,247,0.25)' }
                  : { color: 'rgba(255,255,255,0.35)', background: 'transparent' }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold mb-4 text-center text-gray-400 dark:text-white/40">
            {tab === 'login' ? 'Welcome back 👋' : 'Create your account'}
          </p>

          <div className="space-y-3 mb-4">
            <PhoneInput value={phone} onChange={setPhone} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

            {tab === 'register' && (
              <CleanInput
                icon={User}
                placeholder="Your full name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            )}

            <CleanInput
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              placeholder={tab === 'register' ? 'Password (min 6 chars)' : 'Password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              right={eyeBtn}
            />

            {tab === 'register' && (
              <CleanInput
                icon={Lock}
                type={showPw ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            )}
          </div>

          {/* Error / Success */}
          {error && <div className="text-sm mb-3 px-3 py-2 rounded-xl font-medium" style={{ background: 'rgba(255,107,107,0.10)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.20)' }}>⚠️ {error}</div>}
          {success && <div className="text-sm mb-3 px-3 py-2 rounded-xl font-medium" style={{ background: 'rgba(52,211,153,0.10)', color: '#34D399', border: '1px solid rgba(52,211,153,0.20)' }}>{success}</div>}

          {/* CTA */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.97] transition-all mb-3"
            style={{
              background: '#4F8EF7',
              boxShadow: '0 8px 24px rgba(79,142,247,0.30)',
            }}>
            {loading
              ? <RefreshCw size={18} className="animate-spin" />
              : tab === 'login'
                ? <><LogIn size={17} /> Sign In</>
                : <><UserPlus size={17} /> Create Account</>}
          </button>

          {/* Forgot password */}
          {tab === 'login' && (
            <button onClick={() => switchTab('forgot')}
              className="w-full text-center text-sm font-semibold py-1 text-gray-400 dark:text-white/30 hover:text-gray-500 dark:text-white/50 transition-colors">
              Forgot password?{' '}
              <span className="text-[#4F8EF7]">Reset it →</span>
            </button>
          )}

          {/* Security note */}
          <p className="text-center text-xs mt-4 flex items-center justify-center gap-1.5 text-gray-300 dark:text-white/20">
            🔒 Your data is securely stored on Firebase
          </p>
        </div>
      </div>
    </div>
  )
}
