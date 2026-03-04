/**
 * AppLock.jsx — PIN + Biometric (WebAuthn) lock screen
 * Supports Face ID / Fingerprint on compatible devices
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Lock, X, Delete, Fingerprint } from 'lucide-react'
import { sha256ForPin } from '../authUtils'

const PIN_KEY = 'mf_pin_hash'
const BIO_KEY = 'mf_biometric_enabled'
const BIO_CRED = 'mf_biometric_cred'
const IDLE_KEY = 'mf_autolock_minutes'

// ─── PIN helpers ───
export function isPinSet() {
    return !!localStorage.getItem(PIN_KEY)
}

export function setupPin(pin) {
    localStorage.setItem(PIN_KEY, sha256ForPin(pin))
}

export function clearPin() {
    localStorage.removeItem(PIN_KEY)
}

export function verifyPin(pin) {
    return localStorage.getItem(PIN_KEY) === sha256ForPin(pin)
}

// ─── Biometric (WebAuthn) helpers ───
export function isBiometricCapable() {
    return !!(window.PublicKeyCredential && navigator.credentials)
}

export function isBiometricEnabled() {
    return localStorage.getItem(BIO_KEY) === 'true' && !!localStorage.getItem(BIO_CRED)
}

export async function checkPlatformAuthenticator() {
    try {
        if (!window.PublicKeyCredential) return false
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        return available
    } catch { return false }
}

export async function registerBiometric() {
    try {
        const challenge = crypto.getRandomValues(new Uint8Array(32))
        const userId = new TextEncoder().encode('moneyflow-user')

        const credential = await navigator.credentials.create({
            publicKey: {
                challenge,
                rp: { name: 'MoneyFlow', id: window.location.hostname || 'localhost' },
                user: { id: userId, name: 'MoneyFlow User', displayName: 'MoneyFlow User' },
                pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
                authenticatorSelection: {
                    authenticatorAttachment: 'platform',
                    userVerification: 'required',
                    residentKey: 'preferred',
                },
                timeout: 60000,
            },
        })

        if (credential) {
            const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
            localStorage.setItem(BIO_CRED, credId)
            localStorage.setItem(BIO_KEY, 'true')
            return true
        }
        return false
    } catch (e) {
        console.warn('Biometric registration failed:', e)
        return false
    }
}

export async function authenticateBiometric() {
    try {
        const credId = localStorage.getItem(BIO_CRED)
        if (!credId) return false

        const rawId = Uint8Array.from(atob(credId), c => c.charCodeAt(0))
        const challenge = crypto.getRandomValues(new Uint8Array(32))

        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge,
                allowCredentials: [{ id: rawId, type: 'public-key', transports: ['internal'] }],
                userVerification: 'required',
                timeout: 60000,
            },
        })

        return !!assertion
    } catch (e) {
        console.warn('Biometric auth failed:', e)
        return false
    }
}

export function clearBiometric() {
    localStorage.removeItem(BIO_KEY)
    localStorage.removeItem(BIO_CRED)
}

// ─── Auto-lock idle helpers ───
export function getAutoLockMinutes() {
    const v = localStorage.getItem(IDLE_KEY)
    return v ? Number(v) : 0 // 0 = disabled
}

export function setAutoLockMinutes(mins) {
    localStorage.setItem(IDLE_KEY, String(mins))
}

// ─── Lock screen component ───
export default function AppLock({ onUnlock }) {
    const [entered, setEntered] = useState('')
    const [error, setError] = useState(false)
    const [shake, setShake] = useState(false)
    const [bioAvailable, setBioAvailable] = useState(false)
    const [bioAttempting, setBioAttempting] = useState(false)
    const triedAuto = useRef(false)

    // Check biometric on mount
    useEffect(() => {
        if (isBiometricEnabled()) {
            checkPlatformAuthenticator().then(ok => {
                setBioAvailable(ok)
                // Auto-trigger biometric on first mount
                if (ok && !triedAuto.current) {
                    triedAuto.current = true
                    attemptBiometric()
                }
            })
        }
    }, [])

    const attemptBiometric = useCallback(async () => {
        setBioAttempting(true)
        const ok = await authenticateBiometric()
        setBioAttempting(false)
        if (ok) onUnlock()
    }, [onUnlock])

    const handleDigit = (d) => {
        if (entered.length >= 4) return
        const next = entered + d
        setEntered(next)
        setError(false)
        if (next.length === 4) {
            setTimeout(() => {
                if (verifyPin(next)) {
                    onUnlock()
                } else {
                    setShake(true)
                    setError(true)
                    setTimeout(() => { setEntered(''); setShake(false) }, 600)
                }
            }, 150)
        }
    }

    const handleDelete = () => setEntered(p => p.slice(0, -1))

    const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex flex-col items-center justify-center px-8">
            <div className={`w-14 h-14 rounded-3xl bg-gradient-to-br from-brand-400 to-emerald-600 flex items-center justify-center mb-6 shadow-2xl shadow-brand-500/30 ${shake ? 'animate-bounce' : ''}`}>
                <Lock size={26} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white mb-1">Enter PIN</h1>
            <p className="text-gray-400 text-sm mb-8">PIN is required to unlock MoneyFlow</p>

            {/* Dots */}
            <div className={`flex gap-4 mb-8 ${shake ? 'translate-x-2' : ''} transition-transform`}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${i < entered.length
                        ? error ? 'bg-rose-500 border-rose-500' : 'bg-brand-400 border-brand-400'
                        : 'border-gray-600'
                        }`} />
                ))}
            </div>

            {error && <p className="text-rose-400 text-xs mb-4 animate-slide-up">❌ Wrong PIN!</p>}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {DIGITS.map((d, i) => (
                    <button key={i}
                        onClick={() => d === '⌫' ? handleDelete() : d !== '' ? handleDigit(d) : null}
                        disabled={d === ''}
                        className={`h-16 rounded-2xl font-display font-bold text-xl transition-all active:scale-90 ${d === '' ? 'invisible' :
                            d === '⌫' ? 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10' :
                                'bg-white/5 text-white border border-white/10 hover:bg-white/15 active:bg-brand-500/30'
                            }`}>
                        {d === '⌫' ? <Delete size={20} className="mx-auto" /> : d}
                    </button>
                ))}
            </div>

            {/* Biometric button */}
            {bioAvailable && (
                <button onClick={attemptBiometric} disabled={bioAttempting}
                    className="mt-8 flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white/10 border border-white/10 text-white font-semibold text-sm hover:bg-white/15 active:scale-95 transition-all disabled:opacity-50">
                    <Fingerprint size={20} className={bioAttempting ? 'animate-pulse text-brand-400' : ''} />
                    {bioAttempting ? 'Verifying…' : 'Use Face ID / Fingerprint'}
                </button>
            )}
        </div>
    )
}
