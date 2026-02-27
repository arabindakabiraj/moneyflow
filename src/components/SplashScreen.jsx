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
        <div className={`splash-overlay ${phase === 'exit' ? 'animate-splash-out' : ''}`}>
            {/* Animated rings */}
            <div className="splash-ring" style={{ width: 120, height: 120, animationDelay: '0s' }} />
            <div className="splash-ring" style={{ width: 200, height: 200, animationDelay: '0.5s' }} />
            <div className="splash-ring" style={{ width: 280, height: 280, animationDelay: '1s' }} />

            {/* Logo icon */}
            <div className={`w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 ${phase === 'enter' ? 'animate-bounce-in' : ''}`}
                style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <span className="text-5xl font-bold text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>₹</span>
            </div>

            {/* App name */}
            <div className={phase === 'enter' ? 'animate-scale-up' : ''}>
                <h1 className="text-white font-display font-bold text-3xl tracking-tight">MoneyFlow</h1>
                <p className="text-white/60 text-sm text-center mt-1 font-body">Smart Money Tracker</p>
            </div>

            {/* Loading bar */}
            <div className="absolute bottom-20 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white/50 rounded-full"
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
