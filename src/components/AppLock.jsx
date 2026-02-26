/**
 * AppLock.jsx — 4-digit PIN lock screen
 * App open করলে PIN দিতে হবে
 */
import { useState, useEffect, useRef } from 'react'
import { Lock, X, Delete } from 'lucide-react'
import { sha256ForPin } from '../authUtils'

const PIN_KEY = 'mf_pin_hash'

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

// PIN lock screen
export default function AppLock({ onUnlock }) {
    const [entered, setEntered] = useState('')
    const [error, setError] = useState(false)
    const [shake, setShake] = useState(false)

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
            <h1 className="font-display font-bold text-2xl text-white mb-1">PIN দাও</h1>
            <p className="text-gray-400 text-sm mb-8">MoneyFlow unlock করতে PIN প্রয়োজন</p>

            {/* Dots */}
            <div className={`flex gap-4 mb-8 ${shake ? 'translate-x-2' : ''} transition-transform`}>
                {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${i < entered.length
                            ? error ? 'bg-rose-500 border-rose-500' : 'bg-brand-400 border-brand-400'
                            : 'border-gray-600'
                        }`} />
                ))}
            </div>

            {error && <p className="text-rose-400 text-xs mb-4 animate-slide-up">❌ ভুল PIN!</p>}

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
        </div>
    )
}
