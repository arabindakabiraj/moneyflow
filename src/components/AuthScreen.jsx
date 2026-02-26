/**
 * AuthScreen.jsx — Login / Register tabs + Forgot Password link below Login
 */
import { useState } from 'react'
import { Phone, Lock, Eye, EyeOff, RefreshCw, UserPlus, LogIn, User, KeyRound, ArrowLeft } from 'lucide-react'
import { registerUser, loginUser, resetPassword, saveSession } from '../authUtils'

export default function AuthScreen({ onAuth }) {
    const [tab, setTab] = useState('login')     // 'login' | 'register' | 'forgot'
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
                    {/* Back button */}
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
                            {/* Phone */}
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

                            {/* New Password */}
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

            {/* Logo */}
            <div className="mb-8 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/30">
                    <span className="text-4xl font-bold text-white">₹</span>
                </div>
                <h1 className="font-display font-bold text-3xl text-white">MoneyFlow</h1>
                <p className="text-gray-400 text-sm mt-1">Smart Money Tracker</p>
            </div>

            <div className="w-full max-w-sm">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">

                    {/* Login / Register tabs only */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
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
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-violet-500/60 transition-all">
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
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-violet-500/60 transition-all">
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

                    {/* Forgot password — Login tab এর নিচে শুধু */}
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
