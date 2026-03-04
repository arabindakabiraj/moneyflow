/**
 * EMICalculator.jsx — Monthly EMI & amortization calculator
 */
import { useState, useMemo } from 'react'
import { ArrowLeft, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
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
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('settings')}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 active:scale-95 transition-all">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">EMI Calculator 🏦</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Calculate your monthly loan payments</p>
                </div>
            </div>

            <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-3">
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Loan Amount (₹)</label>
                    <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)}
                        placeholder="e.g. 500000"
                        className="w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-lg outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Annual Interest Rate (%)</label>
                    <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                        placeholder="e.g. 8.5"
                        className="w-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-lg outline-none focus:ring-2 focus:ring-brand-500/50" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Tenure</label>
                    <div className="flex gap-2">
                        <input type="number" value={tenure} onChange={e => setTenure(e.target.value)}
                            placeholder="e.g. 24"
                            className="flex-1 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-lg outline-none focus:ring-2 focus:ring-brand-500/50" />
                        <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
                            {['months', 'years'].map(t => (
                                <button key={t} onClick={() => setTenureType(t)}
                                    className={`px-3 py-2 text-sm font-semibold transition-all capitalize ${tenureType === t ? 'bg-brand-500 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-500'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {result && (
                <div className="space-y-3 animate-slide-up">
                    {/* Result card */}
                    <div className="card bg-gradient-to-br from-brand-500 to-emerald-600 text-white">
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Monthly EMI</p>
                        <p className="font-display font-bold text-4xl mb-4">₹{result.emi.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/15 rounded-xl p-3">
                                <p className="text-white/70 text-[10px] uppercase font-semibold">Total Payment</p>
                                <p className="font-bold text-lg">₹{result.totalPayment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="bg-white/15 rounded-xl p-3">
                                <p className="text-white/70 text-[10px] uppercase font-semibold">Total Interest</p>
                                <p className="font-bold text-lg">₹{result.totalInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>

                    {/* Amortization */}
                    <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <button onClick={() => setShowSchedule(p => !p)}
                            className="w-full flex items-center justify-between">
                            <span className="font-semibold text-sm text-gray-800 dark:text-white">Payment Schedule</span>
                            {showSchedule ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                        </button>
                        {showSchedule && (
                            <div className="mt-3 space-y-2 animate-fade-in">
                                <div className="grid grid-cols-4 text-[10px] font-bold text-gray-400 uppercase px-1">
                                    <span>Mo.</span><span className="text-right">Principal</span><span className="text-right">Interest</span><span className="text-right">Balance</span>
                                </div>
                                {result.schedule.map(row => (
                                    <div key={row.month} className="grid grid-cols-4 text-xs py-1.5 px-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <span className="text-gray-500">{row.month}</span>
                                        <span className="text-right text-emerald-600 font-mono">₹{row.principalPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        <span className="text-right text-rose-500 font-mono">₹{row.interest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        <span className="text-right font-mono text-gray-700 dark:text-gray-300">₹{row.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                ))}
                                {result.N > 12 && (
                                    <p className="text-[11px] text-center text-gray-400 pt-1">Showing first 12 of {result.N} months</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
