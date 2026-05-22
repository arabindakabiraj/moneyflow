/**
 * SplashScreen.jsx — Animated splash screen on app open (once per session)
 */
import { useState, useEffect } from 'react'

export default function SplashScreen({ onFinish }) {
    const [phase, setPhase] = useState('enter') // enter → exit → done

    useEffect(() => {
        // Check if already shown this session
        if (sessionStorage.getItem('mf_splash_done')) {
            onFinish()
            return
        }
        const t1 = setTimeout(() => setPhase('exit'), 1800)
        const t2 = setTimeout(() => {
            sessionStorage.setItem('mf_splash_done', '1')
            onFinish()
        }, 2200)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [onFinish])

    if (phase === 'done') return null

    return (
        <div className={`splash-overlay ${phase === 'exit' ? 'animate-splash-out' : ''}`}
            style={{ background: 'linear-gradient(135deg, #062f26 0%, #031411 100%)' }}>
            {/* Animated rings */}
            <div className="splash-ring" style={{ width: 120, height: 120, animationDelay: '0s', borderColor: 'rgba(20, 184, 166, 0.15)' }} />
            <div className="splash-ring" style={{ width: 200, height: 200, animationDelay: '0.5s', borderColor: 'rgba(20, 184, 166, 0.15)' }} />
            <div className="splash-ring" style={{ width: 280, height: 280, animationDelay: '1s', borderColor: 'rgba(20, 184, 166, 0.15)' }} />

            {/* Logo icon */}
            <div className={`w-24 h-24 rounded-3xl bg-white/[0.07] border border-white/[0.12] backdrop-blur-md flex items-center justify-center mb-6 relative overflow-hidden group ${phase === 'enter' ? 'animate-bounce-in' : ''}`}
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.2)' }}>
                {/* Radiant subtle glow bg */}
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10" />
                <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-teal-300 relative z-10 select-none"
                    style={{ filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.4))' }}>
                    ₹
                </span>
            </div>

            {/* App name */}
            <div className={`text-center z-10 ${phase === 'enter' ? 'animate-scale-up' : ''}`}>
                <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 to-teal-50 font-display font-bold text-3xl tracking-tight"
                    style={{ textShadow: '0 2px 20px rgba(16,185,129,0.1)' }}>
                    MoneyFlow
                </h1>
                <p className="text-emerald-400/60 text-sm text-center mt-1 font-body font-medium tracking-wide">Smart Money Tracker</p>
            </div>

            {/* Loading bar */}
            <div className="absolute bottom-20 w-32 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                    style={{ animation: 'loadBar 1.8s ease-in-out forwards' }} />
            </div>

            <style>{`
        @keyframes loadBar {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
        </div>
    )
}
