/**
 * AuthScreen.jsx — Login / Register with Google button + Forgot Password
 */
import { useState } from 'react'
import { Phone, Lock, Eye, EyeOff, RefreshCw, UserPlus, LogIn, User, KeyRound, ArrowLeft } from 'lucide-react'
import { registerUser, loginUser, resetPassword, saveSession } from '../authUtils'

/* Google "G" SVG logo */
const GoogleIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
)

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
    const [googleToast, setGoogleToast] = useState(false)

    const reset = () => { setError(''); setSuccess('') }
    const switchTab = (t) => { setTab(t); reset(); setPassword(''); setConfirm(''); setNewPass('') }

    const handleGoogleClick = () => {
        setGoogleToast(true)
        setTimeout(() => setGoogleToast(false), 3000)
    }

    const handleSubmit = async () => {
        reset()
        const p = phone.replace(/\s/g, '')
        if (p.length < 10) { setError('সঠিক phone number দাও (10 digit)'); return }

        setLoading(true)
        try {
            if (tab === 'login') {
                if (!password) { setError('Password দাও'); setLoading(false); return }
                const uid = await loginUser(p, password)
                saveSession(uid); onAuth(uid)

            } else if (tab === 'register') {
                if (!username.trim()) { setError('তোমার নাম দাও'); setLoading(false); return }
                if (password.length < 6) { setError('Password কমপক্ষে 6 character'); setLoading(false); return }
                if (password !== confirm) { setError('Password দুটো মিলছে না'); setLoading(false); return }
                const uid = await registerUser(p, password, username.trim())
                setSuccess('✅ Account তৈরি হয়েছে! স্বাগতম ' + username + '!')
                setTimeout(() => { saveSession(uid); onAuth(uid) }, 900)

            } else if (tab === 'forgot') {
                if (newPass.length < 6) { setError('নতুন password কমপক্ষে 6 character'); setLoading(false); return }
                await resetPassword(p, newPass)
                setSuccess('✅ Password reset হয়েছে! এখন Login করো।')
                setTimeout(() => switchTab('login'), 2000)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    /* ── Forgot Password screen ─────────────────────────────── */
    if (tab === 'forgot') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm">
                    <button onClick={() => switchTab('login')} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
                        <ArrowLeft size={16} /> Login এ ফিরে যাও
                    </button>

                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                                <KeyRound size={18} className="text-amber-400" />
                            </div>
                            <div>
                                <h2 className="font-display font-bold text-white">Password Reset</h2>
                                <p className="text-xs text-gray-400">Phone number ও নতুন password দাও</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-amber-500/60 transition-all">
                                <div className="pl-4 flex items-center gap-2 shrink-0">
                                    <Phone size={15} className="text-gray-400" />
                                    <span className="text-gray-400 font-mono text-sm">+91</span>
                                </div>
                                <input type="tel" inputMode="numeric" placeholder="Registered phone number"
                                    value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="w-full bg-transparent py-3.5 pr-4 text-white placeholder-gray-500 font-mono text-base outline-none" />
                            </div>

                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-amber-500/60 transition-all">
                                <div className="pl-4"><Lock size={15} className="text-amber-400" /></div>
                                <input type={showPw ? 'text' : 'password'} placeholder="নতুন password (min 6)"
                                    value={newPass} onChange={e => setNewPass(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="flex-1 bg-transparent py-3.5 text-white placeholder-gray-500 text-sm outline-none" />
                                <button onClick={() => setShowPw(s => !s)} className="pr-4 text-gray-400 hover:text-white transition-colors">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {error && <p className="text-rose-400 text-xs mb-3 font-medium">⚠️ {error}</p>}
                        {success && <p className="text-green-400 text-xs mb-3 font-medium">{success}</p>}

                        <button onClick={handleSubmit} disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-display font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-60 active:scale-95 transition-all">
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <><KeyRound size={18} /> Password Reset করো</>}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    /* ── Main Login / Register screen ──────────────────────── */
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-6">

            {/* Google toast */}
            {googleToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3 text-white text-sm font-medium shadow-2xl animate-slide-up">
                    🚧 Google Sign-In coming soon!
                </div>
            )}

            {/* Logo */}
            <div className="mb-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/30 animate-float">
                    <span className="text-4xl font-bold text-white">₹</span>
                </div>
                <h1 className="font-display font-bold text-3xl text-white">MoneyFlow</h1>
                <p className="text-gray-400 text-sm mt-1">Smart Money Tracker</p>
            </div>

            <div className="w-full max-w-sm">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">

                    {/* Google Sign-In button */}
                    <button onClick={handleGoogleClick}
                        className="w-full py-3.5 rounded-2xl bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-95 mb-5">
                        <GoogleIcon />
                        <span className="text-sm">Continue with Google</span>
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-gray-500 text-xs font-medium">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Login / Register tabs */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-5">
                        {[
                            { id: 'login', label: 'Login', Icon: LogIn },
                            { id: 'register', label: 'Register', Icon: UserPlus },
                        ].map(({ id, label, Icon }) => (
                            <button key={id} onClick={() => switchTab(id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'text-gray-400 hover:text-white'
                                    }`}>
                                <Icon size={14} /> {label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-3 mb-4">
                        {/* Phone */}
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                            <div className="pl-4 flex items-center gap-2 shrink-0">
                                <Phone size={15} className="text-gray-400" />
                                <span className="text-gray-400 font-mono text-sm">+91</span>
                            </div>
                            <input type="tel" inputMode="numeric" placeholder="10-digit phone number"
                                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                className="w-full bg-transparent py-3.5 pr-4 text-white placeholder-gray-500 font-mono text-base outline-none" />
                        </div>

                        {/* Username — register only */}
                        {tab === 'register' && (
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-500/60 transition-all">
                                <div className="pl-4"><User size={15} className="text-gray-400" /></div>
                                <input placeholder="তোমার নাম (যেমন: Arabinda)"
                                    value={username} onChange={e => setUsername(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="flex-1 bg-transparent py-3.5 pr-4 text-white placeholder-gray-500 text-sm outline-none" />
                            </div>
                        )}

                        {/* Password */}
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-500/60 transition-all">
                            <div className="pl-4"><Lock size={15} className="text-gray-400" /></div>
                            <input type={showPw ? 'text' : 'password'} placeholder={tab === 'register' ? 'Password (min 6 characters)' : 'Password'}
                                value={password} onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                className="flex-1 bg-transparent py-3.5 text-white placeholder-gray-500 text-sm outline-none" />
                            <button onClick={() => setShowPw(s => !s)} className="pr-4 text-gray-400 hover:text-white transition-colors">
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>

                        {/* Confirm password — register only */}
                        {tab === 'register' && (
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-500/60 transition-all">
                                <div className="pl-4"><Lock size={15} className="text-gray-400" /></div>
                                <input type={showPw ? 'text' : 'password'} placeholder="Confirm password"
                                    value={confirm} onChange={e => setConfirm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="flex-1 bg-transparent py-3.5 text-white placeholder-gray-500 text-sm outline-none" />
                            </div>
                        )}
                    </div>

                    {error && <p className="text-rose-400 text-xs mb-3 font-medium">⚠️ {error}</p>}
                    {success && <p className="text-green-400 text-xs mb-3 font-medium">{success}</p>}

                    {/* Submit button */}
                    <button onClick={handleSubmit} disabled={loading}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-500 text-white font-display font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 disabled:opacity-60 active:scale-95 transition-all">
                        {loading
                            ? <RefreshCw size={18} className="animate-spin" />
                            : tab === 'login'
                                ? <><LogIn size={18} /> Login করো</>
                                : <><UserPlus size={18} /> Account বানাও</>}
                    </button>

                    {/* Forgot password */}
                    {tab === 'login' && (
                        <div className="mt-4 pt-4 border-t border-white/5 text-center">
                            <p className="text-gray-500 text-xs mb-1">Password ভুলে গেছো?</p>
                            <button onClick={() => switchTab('forgot')}
                                className="text-amber-400 hover:text-amber-300 text-sm font-semibold flex items-center gap-1.5 mx-auto transition-colors">
                                <KeyRound size={14} /> Password Reset করো →
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs mt-4">তোমার data securely Firebase এ সংরক্ষিত হবে 🔒</p>
            </div>
        </div>
    )
}
