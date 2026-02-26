/**
 * AuthScreen.jsx — Phone OTP Login
 * Mobile number দিয়ে OTP login screen
 */
import { useState, useEffect, useRef } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../firebase'
import { Phone, ArrowRight, Shield, RefreshCw } from 'lucide-react'

export default function AuthScreen() {
    const [step, setStep] = useState('phone')   // 'phone' | 'otp'
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [countdown, setCountdown] = useState(0)
    const confirmRef = useRef(null)
    const otpRefs = useRef([])

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return
        const t = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [countdown])

    const setupRecaptcha = () => {
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear()
        }
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => { },
        })
    }

    const sendOTP = async () => {
        const cleaned = phone.replace(/\s/g, '')
        if (cleaned.length < 10) {
            setError('সঠিক phone number দাও')
            return
        }
        setLoading(true)
        setError('')
        try {
            setupRecaptcha()
            // Add +91 if no country code
            const fullPhone = cleaned.startsWith('+') ? cleaned : `+91${cleaned}`
            const confirm = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier)
            confirmRef.current = confirm
            setStep('otp')
            setCountdown(30)
            setTimeout(() => otpRefs.current[0]?.focus(), 300)
        } catch (err) {
            console.error(err)
            setError(err.message?.includes('invalid') ? 'Invalid phone number' : 'OTP পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করো।')
        } finally {
            setLoading(false)
        }
    }

    const handleOtpChange = (val, index) => {
        if (!/^\d?$/.test(val)) return
        const next = [...otp]
        next[index] = val
        setOtp(next)
        if (val && index < 5) otpRefs.current[index + 1]?.focus()
        if (next.every(d => d !== '') && next.join('').length === 6) {
            verifyOTP(next.join(''))
        }
    }

    const handleOtpKey = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const verifyOTP = async (code) => {
        if (!confirmRef.current) return
        setLoading(true)
        setError('')
        try {
            await confirmRef.current.confirm(code)
            // Auth state change handled by App.jsx → user logged in
        } catch (err) {
            setError('ভুল OTP! আবার চেষ্টা করো।')
            setOtp(['', '', '', '', '', ''])
            setTimeout(() => otpRefs.current[0]?.focus(), 100)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-6">
            {/* Invisible reCAPTCHA */}
            <div id="recaptcha-container" />

            {/* Logo */}
            <div className="mb-8 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/30">
                    <span className="text-4xl">₹</span>
                </div>
                <h1 className="font-display font-bold text-3xl text-white">MoneyFlow</h1>
                <p className="text-gray-400 text-sm mt-1">Smart Money Tracker for Students</p>
            </div>

            {/* Card */}
            <div className="w-full max-w-sm animate-slide-up">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">

                    {step === 'phone' ? (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 flex items-center justify-center">
                                    <Phone size={18} className="text-brand-400" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-white">Login করো</h2>
                                    <p className="text-xs text-gray-400">তোমার phone number দাও</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-brand-500/60 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
                                    <span className="pl-4 text-gray-400 font-mono text-sm font-semibold shrink-0">+91</span>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="10-digit number"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/[^\d\s+]/g, ''))}
                                        onKeyDown={e => e.key === 'Enter' && sendOTP()}
                                        maxLength={15}
                                        className="w-full bg-transparent py-4 pr-4 text-white placeholder-gray-500 font-mono text-lg outline-none"
                                    />
                                </div>
                            </div>

                            {error && <p className="text-rose-400 text-xs mb-4 animate-slide-up">⚠️ {error}</p>}

                            <button
                                onClick={sendOTP}
                                disabled={loading || phone.replace(/\s/g, '').length < 10}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-emerald-500 text-white font-display font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {loading
                                    ? <RefreshCw size={18} className="animate-spin" />
                                    : <><span>OTP পাঠাও</span><ArrowRight size={18} /></>}
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                                    <Shield size={18} className="text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="font-display font-bold text-white">OTP দাও</h2>
                                    <p className="text-xs text-gray-400">+91 {phone} তে পাঠানো হয়েছে</p>
                                </div>
                            </div>

                            {/* 6-digit OTP input */}
                            <div className="flex gap-2 justify-between mb-4">
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => otpRefs.current[i] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleOtpChange(e.target.value, i)}
                                        onKeyDown={e => handleOtpKey(e, i)}
                                        className="w-12 h-14 text-center text-white text-xl font-display font-bold bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    />
                                ))}
                            </div>

                            {error && <p className="text-rose-400 text-xs mb-4 animate-slide-up">⚠️ {error}</p>}

                            <button
                                onClick={() => verifyOTP(otp.join(''))}
                                disabled={loading || otp.join('').length < 6}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-display font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 disabled:opacity-50 transition-all active:scale-95 mb-3"
                            >
                                {loading
                                    ? <RefreshCw size={18} className="animate-spin" />
                                    : 'Verify করো ✅'}
                            </button>

                            <div className="text-center">
                                {countdown > 0 ? (
                                    <p className="text-gray-500 text-xs">{countdown}s পরে Resend করতে পারবে</p>
                                ) : (
                                    <button onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError('') }}
                                        className="text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
                                        ← নতুন OTP পাঠাও
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs mt-4">
                    Login করলে তোমার data সুরক্ষিতভাবে সংরক্ষিত হবে 🔒
                </p>
            </div>
        </div>
    )
}
