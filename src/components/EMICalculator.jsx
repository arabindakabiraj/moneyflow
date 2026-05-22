/**
 * EMICalculator.jsx — Monthly EMI & amortization calculator
 * Premium styling with comparison charts
 */
import { useState, useMemo } from 'react'
import { ArrowLeft, Calculator, ChevronDown, ChevronUp, TrendingDown, DollarSign, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function EMICalculator() {
    const { setActiveTab } = useApp()
    const [principal, setPrincipal] = useState('')
    const [rate, setRate] = useState('')
    const [tenure, setTenure] = useState('')
    const [tenureType, setTenureType] = useState('months') // months | years
    const [showSchedule, setShowSchedule] = useState(false)

    const result = useMemo(() => {
        const P = Number(principal)
        const R = Number(rate) / 12 / 100
        const N = tenureType === 'years' ? Number(tenure) * 12 : Number(tenure)
        if (!P || !R || !N) return null
        const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1)
        const totalPayment = emi * N
        const totalInterest = totalPayment - P

        // Amortization schedule (first 12 months)
        const schedule = []
        let balance = P
        for (let i = 1; i <= Math.min(N, 12); i++) {
            const interest = balance * R
            const principalPaid = emi - interest
            balance -= principalPaid
            schedule.push({ month: i, emi, interest, principalPaid, balance: Math.max(0, balance) })
        }

        return { emi, totalPayment, totalInterest, N, schedule }
    }, [principal, rate, tenure, tenureType])

    return (
        <div className="space-y-4 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('dashboard')}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all hover:bg-white/10">
                    <ArrowLeft size={18} className="text-gray-400" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                            <Calculator size={14} className="text-white" />
                        </div>
                        <h1 className="text-lg font-black text-white">EMI Calculator</h1>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5 ml-10">Calculate your monthly loan payments</p>
                </div>
            </div>

            {/* Input Card */}
            <div className="rounded-2xl border border-white/8 bg-white/5 p-5 space-y-4">
                {/* Loan Amount */}
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5 block">
                        <DollarSign size={12} /> Loan Amount
                    </label>
                    <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)}
                        placeholder="e.g. 500000"
                        className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:bg-white/10 text-white placeholder-gray-600 font-mono text-lg outline-none transition-all" />
                </div>

                {/* Interest Rate */}
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5 block">
                        <TrendingDown size={12} /> Annual Interest Rate
                    </label>
                    <div className="flex items-center gap-2">
                        <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                            placeholder="e.g. 8.5"
                            className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:bg-white/10 text-white placeholder-gray-600 font-mono text-lg outline-none transition-all" />
                        <span className="text-white/40 font-bold">%</span>
                    </div>
                </div>

                {/* Tenure */}
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5 flex items-center gap-1.5 block">
                        <Clock size={12} /> Loan Period
                    </label>
                    <div className="flex gap-2">
                        <input type="number" value={tenure} onChange={e => setTenure(e.target.value)}
                            placeholder="e.g. 24"
                            className="flex-1 px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 focus:bg-white/10 text-white placeholder-gray-600 font-mono text-lg outline-none transition-all" />
                        <div className="flex rounded-xl overflow-hidden border border-white/10 bg-white/5">
                            {['months', 'years'].map(t => (
                                <button key={t} onClick={() => setTenureType(t)}
                                    className={`px-4 py-3.5 text-sm font-bold transition-all capitalize ${tenureType === t 
                                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                                        : 'text-gray-400 hover:text-gray-300'}`}>
                                    {t === 'months' ? 'Mo.' : 'Yr.'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {result && (
                <div className="space-y-4 animate-slide-up">
                    {/* Result Card */}
                    <div className="relative overflow-hidden rounded-2xl border border-purple-900/40 p-6"
                        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(139,92,246,0.08) 100%)' }}>
                        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10" 
                            style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(40px)' }} />
                        
                        <div className="relative z-10 space-y-4">
                            <p className="text-xs font-bold uppercase tracking-wider text-purple-300">Monthly EMI</p>
                            <p className="font-black text-4xl text-purple-400 font-mono">₹{result.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            
                            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-purple-500/20">
                                <div>
                                    <p className="text-[9px] text-purple-300 uppercase font-bold mb-1">Total Payment</p>
                                    <p className="font-black text-lg text-purple-300">₹{result.totalPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] text-rose-300 uppercase font-bold mb-1">Total Interest</p>
                                    <p className="font-black text-lg text-rose-400">₹{result.totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-1.5">Principal</p>
                            <p className="font-black text-sm text-indigo-400 font-mono">₹{Number(principal).toLocaleString('en-IN')}</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-1.5">Tenure</p>
                            <p className="font-black text-sm text-cyan-400 font-mono">{result.N} Mo.</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-1.5">Interest %</p>
                            <p className="font-black text-sm text-amber-400 font-mono">{Number(rate).toFixed(2)}%</p>
                        </div>
                    </div>

                    {/* Amortization Schedule */}
                    <div className="rounded-2xl border border-white/8 bg-white/5 overflow-hidden">
                        <button onClick={() => setShowSchedule(p => !p)}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/[0.08] transition-colors">
                            <span className="font-bold text-sm text-white">Payment Schedule</span>
                            {showSchedule ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>
                        {showSchedule && (
                            <div className="border-t border-white/8 px-4 py-3 space-y-2 bg-white/[0.02] animate-fade-in">
                                <div className="grid grid-cols-4 text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-3">
                                    <span>Mo.</span><span className="text-right">Principal</span><span className="text-right">Interest</span><span className="text-right">Balance</span>
                                </div>
                                {result.schedule.map((row, i) => (
                                    <div key={row.month} className="grid grid-cols-4 text-xs py-2.5 px-2 rounded-lg hover:bg-white/[0.06] transition-colors border-b border-white/5 last:border-b-0">
                                        <span className="text-gray-500 font-bold">{row.month}</span>
                                        <span className="text-right text-emerald-400 font-mono font-bold">₹{row.principalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        <span className="text-right text-rose-400 font-mono font-bold">₹{row.interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        <span className="text-right text-indigo-300 font-mono font-bold">₹{row.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                ))}
                                {result.N > 12 && (
                                    <p className="text-[10px] text-center text-gray-500 pt-2">Showing first 12 of {result.N} months</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
