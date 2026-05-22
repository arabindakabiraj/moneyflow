/**
 * BudgetVsActual.jsx — Compare budgeted vs actual vs forecasted spending
 * Premium dashboard showing budget performance across categories
 */
import { useState, useMemo } from 'react'
import { ChevronLeft, TrendingUp, TrendingDown, Target, AlertCircle, BarChart3, Info } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { useApp } from '../context/AppContext'
import { predictSpending } from '../utils/spendingPredictor'

export default function BudgetVsActual() {
  const { transactions, budgets, setActiveTab } = useApp()
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [viewType, setViewType] = useState('monthly') // monthly, category, trend

  // Calculate current month spending by category
  const currentMonthData = useMemo(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    
    const spending = {}
    transactions
      .filter(t => t.type === 'expense' && t.date?.startsWith(currentMonth))
      .forEach(t => {
        const cat = t.category || 'Others'
        spending[cat] = (spending[cat] || 0) + Number(t.amount)
      })
    
    return spending
  }, [transactions])

  // Compare budgets with actuals
  const budgetComparison = useMemo(() => {
    return Object.entries(budgets || {}).map(([cat, budgetAmount]) => {
      const actual = currentMonthData[cat] || 0
      const budget = Number(budgetAmount)
      const variance = budget - actual
      const variancePercent = budget > 0 ? (variance / budget) * 100 : 0
      const status = actual > budget ? 'over' : variance < budget * 0.2 ? 'warning' : 'good'
      
      return {
        category: cat,
        budget,
        actual,
        variance,
        variancePercent,
        remaining: Math.max(0, budget - actual),
        status
      }
    }).sort((a, b) => b.budget - a.budget)
  }, [budgets, currentMonthData])

  // Forecast for current month
  const forecast = useMemo(() => {
    const pred = predictSpending(transactions)
    return pred.categoryPredictions || []
  }, [transactions])

  // Summary stats
  const summary = useMemo(() => {
    const totalBudget = budgetComparison.reduce((sum, b) => sum + b.budget, 0)
    const totalActual = budgetComparison.reduce((sum, b) => sum + b.actual, 0)
    const totalRemaining = budgetComparison.reduce((sum, b) => sum + b.remaining, 0)
    const overBudgetCount = budgetComparison.filter(b => b.status === 'over').length
    
    return { totalBudget, totalActual, totalRemaining, overBudgetCount }
  }, [budgetComparison])

  // Chart data for monthly trend
  const monthlyTrendData = useMemo(() => {
    return budgetComparison.slice(0, 8).map(b => ({
      category: b.category.substring(0, 8),
      Budget: b.budget,
      Actual: b.actual,
      Remaining: b.remaining
    }))
  }, [budgetComparison])

  if (budgetComparison.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 px-6 pb-20">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
          <AlertCircle size={28} className="text-indigo-400" />
        </div>
        <h2 className="font-black text-white text-lg">No Budgets Set</h2>
        <p className="text-gray-400 text-sm">Create budgets in Settings → Budgets to track your spending performance.</p>
        <button onClick={() => setActiveTab('settings')}
          className="px-6 py-3 rounded-2xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">
          Go to Settings
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all hover:bg-white/10">
          <ChevronLeft size={18} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <BarChart3 size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-white">Budget vs Actual</h1>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 ml-10">Track your spending against budgets</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="relative overflow-hidden rounded-2xl border border-indigo-900/30 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(79,70,229,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 mb-2">Total Budget</p>
            <p className="font-black text-lg text-indigo-400 font-mono">₹{summary.totalBudget.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-500 mt-1">{budgetComparison.length} categories</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-rose-900/30 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(251,113,113,0.08) 0%, rgba(251,113,113,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #fb7171 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-rose-300 mb-2">Spent This Month</p>
            <p className="font-black text-lg text-rose-400 font-mono">₹{summary.totalActual.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-500 mt-1">{((summary.totalActual / summary.totalBudget) * 100).toFixed(0)}% of budget</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-emerald-900/30 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 mb-2">Remaining</p>
            <p className="font-black text-lg text-emerald-400 font-mono">₹{summary.totalRemaining.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-500 mt-1">Stay within budget</p>
          </div>
        </div>

        <div className={`relative overflow-hidden rounded-2xl border p-4 ${summary.overBudgetCount > 0 ? 'border-amber-900/30' : 'border-emerald-900/30'}`}
          style={{ background: summary.overBudgetCount > 0 
            ? 'linear-gradient(135deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.02) 100%)' 
            : 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(52,211,153,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: `radial-gradient(circle, ${summary.overBudgetCount > 0 ? '#fbbf24' : '#34d399'} 0%, transparent 70%)`, filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-amber-300 mb-2">Over Budget</p>
            <p className="font-black text-lg text-amber-400 font-mono">{summary.overBudgetCount}</p>
            <p className="text-[9px] text-gray-500 mt-1">{summary.overBudgetCount > 0 ? 'Categories' : 'All good! ✓'}</p>
          </div>
        </div>
      </div>

      {/* View Type Selector */}
      <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl">
        {[
          { id: 'monthly', label: 'Monthly', icon: '📊' },
          { id: 'category', label: 'Categories', icon: '📂' },
          { id: 'trend', label: 'Trend', icon: '📈' }
        ].map(v => (
          <button key={v.id}
            onClick={() => setViewType(v.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${viewType === v.id 
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
              : 'text-gray-400 hover:text-gray-300'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Chart View */}
      {viewType === 'monthly' && monthlyTrendData.length > 0 && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="category" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} />
              <Tooltip 
                contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Bar dataKey="Budget" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Actual" fill="#fb7171" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Remaining" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown */}
      {viewType === 'category' && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Category Performance</p>
          {budgetComparison.map(b => {
            const fillPercent = (b.actual / b.budget) * 100
            const statusColor = b.status === 'over' ? 'from-rose-500 to-rose-600' : b.status === 'warning' ? 'from-amber-500 to-amber-600' : 'from-emerald-500 to-emerald-600'
            
            return (
              <button key={b.category}
                onClick={() => setSelectedCategory(b)}
                className="w-full text-left rounded-2xl border border-white/8 p-3.5 hover:bg-white/5 transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-white">{b.category}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${b.status === 'over' ? 'bg-rose-500/20 text-rose-400' : b.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    {b.status === 'over' ? '⚠ Over' : b.status === 'warning' ? '⚡ Alert' : '✓ On track'}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                  <div 
                    className={`h-full bg-gradient-to-r ${statusColor} transition-all`}
                    style={{ width: `${Math.min(fillPercent, 100)}%` }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">₹{b.actual.toLocaleString('en-IN')} / ₹{b.budget.toLocaleString('en-IN')}</span>
                  <span className={`font-mono font-bold ${b.variance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {b.variance >= 0 ? '+' : ''}₹{b.variance.toLocaleString('en-IN')}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Trend View */}
      {viewType === 'trend' && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">Spending Forecast</p>
          {forecast.slice(0, 6).map(f => (
            <div key={f.category} className="rounded-2xl border border-white/8 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm text-white">{f.category}</p>
                <span className={`text-xs font-bold ${f.trend === 'up' ? 'text-rose-400' : f.trend === 'down' ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {f.trend === 'up' ? '↑' : f.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
              <p className="font-mono text-sm font-bold text-indigo-400">
                Predicted: ₹{f.predicted.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-500 mt-1">Based on {f.dataPoints} months of history</p>
            </div>
          ))}
        </div>
      )}

      {/* Selected Category Detail */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setSelectedCategory(null)}>
          <div className="w-full bg-gray-900 border-t border-white/10 rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black text-white">{selectedCategory.category}</h2>
              <button onClick={() => setSelectedCategory(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Budget</p>
                  <p className="font-black text-lg text-indigo-400">₹{selectedCategory.budget.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Actual</p>
                  <p className="font-black text-lg text-rose-400">₹{selectedCategory.actual.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Remaining</p>
                  <p className="font-black text-lg text-emerald-400">₹{selectedCategory.remaining.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 mb-1">Usage</p>
                  <p className="font-black text-lg">{((selectedCategory.actual / selectedCategory.budget) * 100).toFixed(0)}%</p>
                </div>
              </div>
              
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-500 to-rose-600 transition-all"
                  style={{ width: `${Math.min((selectedCategory.actual / selectedCategory.budget) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
