/**
 * AuthScreen.jsx — Phone + Password + Username | Login | Forgot Password
 */
import { useState } from 'react'
import { Phone, Lock, Eye, EyeOff, ArrowRight, RefreshCw, UserPlus, LogIn, User, KeyRound } from 'lucide-react'
import { registerUser, loginUser, resetPassword, saveSession, normalizePhone } from '../authUtils'

const TABS = [
    { id: 'login', label: 'Login', Icon: LogIn },
    { id: 'register', label: 'Register', Icon: UserPlus },
    { id: 'forgot', label: 'Forgot Pass', Icon: KeyRound },
]

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
        if (p.length < 10) { setError('সঠিক phone number দাও (10 digit)'); return }

        if (tab === 'login') {
            if (!password) { setError('Password দাও'); return }
            setLoading(true)
            try {
                const uid = await loginUser(p, password)
                saveSession(uid)
                onAuth(uid)
            } catch (err) { setError(err.message) }
            finally { setLoading(false) }

        } else if (tab === 'register') {
            if (!username.trim()) { setError('তোমার নাম দাও'); return }
            if (password.length < 6) { setError('Password কমপক্ষে 6 character'); return }
            if (password !== confirm) { setError('Password দুটো মিলছে না'); return }
            setLoading(true)
            try {
                const uid = await registerUser(p, password, username.trim())
                setSuccess('✅ Account তৈরি হয়েছে! স্বাগতম ' + username + '!')
                setTimeout(() => { saveSession(uid); onAuth(uid) }, 900)
            } catch (err) { setError(err.message) }
            finally { setLoading(false) }

        } else if (tab === 'forgot') {
            if (newPass.length < 6) { setError('নতুন password কমপক্ষে 6 character'); return }
            setLoading(true)
            try {
                await resetPassword(p, newPass)
                setSuccess('✅ Password reset হয়েছে! এখন Login করো।')
                setTimeout(() => switchTab('login'), 2000)
            } catch (err) { setError(err.message) }
            finally { setLoading(false) }
        }
    }

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

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-white/5 rounded-2xl mb-6">
                        {TABS.map(({ id, label, Icon }) => (
                            <button key={id} onClick={() => switchTab(id)}
                                className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all ${tab === id
                                        ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                                        : 'text-gray-400 hover:text-white'
                                    }`}>
                                <Icon size={12} /> {label}
                            </button>
                        ))}
                    </div>

                    {/* Phone number — shared */}
                    <div className="space-y-3 mb-4">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                            <div className="pl-4 flex items-center gap-2 shrink-0">
                                <Phone size={15} className="text-gray-400" />
                                <span className="text-gray-400 font-mono text-sm">+91</span>
                            </div>
                            <input type="tel" inputMode="numeric"
                                placeholder="10-digit phone number"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                className="w-full bg-transparent py-3.5 pr-4 text-white placeholder-gray-500 font-mono text-base outline-none"
                            />
                        </div>

                        {/* Username (register only) */}
                        {tab === 'register' && (
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-violet-500/60 focus-within:ring-2 focus-within:ring-violet-500/20 transition-all">
                                <div className="pl-4"><User size={15} className="text-gray-400" /></div>
                                <input
                                    placeholder="তোমার নাম (যেমন: Arabinda)"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="flex-1 bg-transparent py-3.5 pr-4 text-white placeholder-gray-500 text-sm outline-none"
                                />
                            </div>
                        )}

                        {/* Password */}
                        {tab !== 'forgot' && (
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-500/60 transition-all">
                                <div className="pl-4"><Lock size={15} className="text-gray-400" /></div>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Password (min 6 characters)"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="flex-1 bg-transparent py-3.5 text-white placeholder-gray-500 text-sm outline-none"
                                />
                                <button onClick={() => setShowPw(s => !s)} className="pr-4 text-gray-400 hover:text-white transition-colors">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        )}

                        {/* Confirm password (register only) */}
                        {tab === 'register' && (
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-violet-500/60 transition-all">
                                <div className="pl-4"><Lock size={15} className="text-gray-400" /></div>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="Confirm password"
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="flex-1 bg-transparent py-3.5 text-white placeholder-gray-500 text-sm outline-none"
                                />
                            </div>
                        )}

                        {/* New password (forgot only) */}
                        {tab === 'forgot' && (
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-amber-500/60 transition-all">
                                <div className="pl-4"><Lock size={15} className="text-amber-400" /></div>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    placeholder="নতুন password দাও (min 6)"
                                    value={newPass}
                                    onChange={e => setNewPass(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    className="flex-1 bg-transparent py-3.5 text-white placeholder-gray-500 text-sm outline-none"
                                />
                                <button onClick={() => setShowPw(s => !s)} className="pr-4 text-gray-400 hover:text-white transition-colors">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error / Success */}
                    {error && <p className="text-rose-400 text-xs mb-3 font-medium">⚠️ {error}</p>}
                    {success && <p className="text-green-400 text-xs mb-3 font-medium">{success}</p>}

                    {/* Submit */}
                    <button onClick={handleSubmit} disabled={loading}
                        className={`w-full py-4 rounded-2xl text-white font-display font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 transition-all active:scale-95 ${tab === 'forgot'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30'
                                : 'bg-gradient-to-r from-brand-500 to-emerald-500 shadow-brand-500/30'
                            }`}>
                        {loading
                            ? <RefreshCw size={18} className="animate-spin" />
                            : tab === 'login'
                                ? <><LogIn size={18} /> Login করো</>
                                : tab === 'register'
                                    ? <><UserPlus size={18} /> Account বানাও</>
                                    : <><KeyRound size={18} /> Password Reset করো</>}
                    </button>

                    {/* Forgot password hint */}
                    {tab === 'login' && (
                        <button onClick={() => switchTab('forgot')} className="w-full text-center text-xs text-gray-500 hover:text-brand-400 mt-3 transition-colors">
                            Forgot password? →
                        </button>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs mt-4">তোমার data securely Firebase এ সংরক্ষিত হবে 🔒</p>
            </div>
        </div>
    )
}
