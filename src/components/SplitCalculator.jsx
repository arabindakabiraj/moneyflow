/**
 * SplitCalculator.jsx — Bill split calculator
 * Split a total bill among multiple people
 */
import { useState } from 'react'
import { Users, Calculator, Plus, Minus, ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'

export default function SplitCalculator() {
    const { setActiveTab } = useApp()
    const [total, setTotal] = useState('')
    const [people, setPeople] = useState(2)
    const [extras, setExtras] = useState([]) // { name, amount }

    const baseShare = total ? Number(total) / people : 0
    const totalExtras = extras.reduce((s, e) => s + Number(e.amount || 0), 0)
    const perPerson = baseShare - totalExtras / people

    const addExtra = () => setExtras(e => [...e, { name: '', amount: '' }])
    const removeExtra = (i) => setExtras(e => e.filter((_, idx) => idx !== i))
    const updateExtra = (i, field, val) => setExtras(e => e.map((ex, idx) => idx === i ? { ...ex, [field]: val } : ex))

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('settings')}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Bill Split 🧮</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Split the bill and calculate</p>
                </div>
            </div>

            {/* Input */}
            <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-4">
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">Total Bill</label>
                    <input type="number" value={total} onChange={e => setTotal(e.target.value)}
                        placeholder="e.g. 600"
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-mono text-lg" />
                </div>

                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">How many people?</label>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setPeople(p => Math.max(1, p - 1))}
                            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                            <Minus size={16} />
                        </button>
                        <div className="flex-1 text-center">
                            <span className="font-display font-bold text-3xl text-gray-900 dark:text-white">{people}</span>
                            <p className="text-xs text-gray-400 mt-0.5">people</p>
                        </div>
                        <button onClick={() => setPeople(p => p + 1)}
                            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>
                </div>

                {/* Extra deductions */}
                {extras.length > 0 && (
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 block">Extra items to exclude (tips, separate items)</label>
                        <div className="space-y-2">
                            {extras.map((ex, i) => (
                                <div key={i} className="flex gap-2 items-center">
                                    <input value={ex.name} onChange={e => updateExtra(i, 'name', e.target.value)}
                                        placeholder="Name" className="flex-1 input-field bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white py-2 text-sm" />
                                    <input type="number" value={ex.amount} onChange={e => updateExtra(i, 'amount', e.target.value)}
                                        placeholder="₹0" className="w-20 input-field bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white py-2 text-sm font-mono" />
                                    <button onClick={() => removeExtra(i)} className="text-rose-400 hover:text-rose-600 transition-colors">
                                        <Minus size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <button onClick={addExtra} className="text-xs text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1 hover:text-brand-700 transition-colors">
                    <Plus size={13} /> Add extra item
                </button>
            </div>

            {/* Result */}
            {total && Number(total) > 0 && (
                <div className="card bg-gradient-to-br from-brand-500 to-emerald-600 text-white text-center shadow-lg shadow-brand-500/20">
                    <p className="text-white/80 text-sm mb-1">Payment per person</p>
                    <p className="font-display font-bold text-4xl mb-1">
                        ₹{perPerson.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-white/70 text-xs">
                        {people} people splitting ₹{Number(total).toLocaleString('en-IN')}
                        {totalExtras > 0 ? ` (₹${totalExtras} extras excluded)` : ''}
                    </p>
                </div>
            )}
        </div>
    )
}
