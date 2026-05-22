/**
 * NetWorthTracker.jsx — Track multi-account net worth with timeline
 * Shows total assets, liabilities, and net worth trend over time
 */
import { useState, useMemo } from 'react'
import { ChevronLeft, TrendingUp, TrendingDown, Wallet, AlertCircle, LineChart, Target, PieChart } from 'lucide-react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { useApp } from '../context/AppContext'

export default function NetWorthTracker() {
  const { accounts, transactions, savingsGoals, debts, setActiveTab } = useApp()
  const [viewType, setViewType] = useState('timeline') // timeline, breakdown, goals

  // Calculate current net worth
  const netWorthData = useMemo(() => {
    // Assets: accounts + goals
    const accountsTotal = Object.values(accounts || {}).reduce((sum, acc) => sum + Number(acc.balance || 0), 0)
    const goalsTotal = Object.values(savingsGoals || {}).reduce((sum, goal) => sum + Number(goal.saved || 0), 0)
    
    // Liabilities: debts
    const debtsTotal = Object.values(debts || {}).reduce((sum, debt) => sum + Number(debt.amount || 0), 0)
    
    // Net Worth = Assets - Liabilities
    const totalAssets = accountsTotal + goalsTotal
    const netWorth = totalAssets - debtsTotal
    
    return {
      totalAssets,
      accountsTotal,
      goalsTotal,
      debtsTotal,
      netWorth,
      hasData: accountsTotal > 0 || goalsTotal > 0 || debtsTotal > 0
    }
  }, [accounts, savingsGoals, debts])

  // Breakdown of assets
  const assetBreakdown = useMemo(() => {
    const breakdown = []
    
    // Add individual accounts
    Object.entries(accounts || {}).forEach(([name, account]) => {
      if (Number(account.balance) > 0) {
        breakdown.push({
          name: `💳 ${account.name || name}`,
          value: Number(account.balance),
          type: 'account',
          icon: '💳'
        })
      }
    })
    
    // Add goals
    Object.entries(savingsGoals || {}).forEach(([name, goal]) => {
      if (Number(goal.saved) > 0) {
        breakdown.push({
          name: `🎯 ${goal.name}`,
          value: Number(goal.saved),
          type: 'goal',
          icon: '🎯'
        })
      }
    })
    
    // Add debts as negative
    Object.entries(debts || {}).forEach(([name, debt]) => {
      if (Number(debt.amount) > 0) {
        breakdown.push({
          name: `💳 ${debt.description || name}`,
          value: -Number(debt.amount),
          type: 'debt',
          icon: '💳'
        })
      }
    })
    
    return breakdown.sort((a, b) => b.value - a.value)
  }, [accounts, savingsGoals, debts])

  // Calculate historical net worth trend (from transactions)
  const netWorthTimeline = useMemo(() => {
    const timeline = {}
    const now = new Date()
    
    // Start from 6 months ago
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now)
      d.setMonth(d.getMonth() - i)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      timeline[monthKey] = { income: 0, expense: 0 }
    }
    
    // Fill with transaction data
    transactions.forEach(t => {
      const monthKey = (t.date || '').substring(0, 7)
      if (timeline[monthKey]) {
        if (t.type === 'income') {
          timeline[monthKey].income += Number(t.amount)
        } else if (t.type === 'expense') {
          timeline[monthKey].expense += Number(t.amount)
        }
      }
    })
    
    // Convert to trend data
    let runningBalance = netWorthData.netWorth
    return Object.entries(timeline).map(([month, data]) => {
      const netFlow = data.income - data.expense
      return {
        month: month.substring(5), // Just MM format
        netWorth: runningBalance,
        income: data.income,
        expense: data.expense
      }
    })
  }, [transactions, netWorthData])

  // Goal progress
  const goalsProgress = useMemo(() => {
    return Object.values(savingsGoals || {}).map(goal => ({
      name: goal.name,
      saved: Number(goal.saved || 0),
      target: Number(goal.target || 0),
      progress: goal.target > 0 ? (Number(goal.saved || 0) / Number(goal.target)) * 100 : 0,
      daysLeft: goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : 0
    }))
  }, [savingsGoals])

  if (!netWorthData.hasData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 px-6 pb-20">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
          <AlertCircle size={28} className="text-emerald-400" />
        </div>
        <h2 className="font-black text-white text-lg">Add Your Accounts</h2>
        <p className="text-gray-400 text-sm">Set up bank accounts, credit cards, or savings goals to track your net worth.</p>
        <button onClick={() => setActiveTab('settings')}
          className="px-6 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">
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
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Wallet size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-white">Net Worth</h1>
          </div>
          <p className="text-[10px] text-gray-500 mt-0.5 ml-10">Total assets minus liabilities</p>
        </div>
      </div>

      {/* Net Worth Hero Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/40 p-6 gradient-border"
        style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(20,184,166,0.08) 100%)' }}>
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10" 
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(40px)' }} />
        
        <div className="relative z-10 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">Current Net Worth</p>
          <div className="flex items-end gap-2">
            <p className="font-black text-4xl text-emerald-400 font-mono">₹{netWorthData.netWorth.toLocaleString('en-IN')}</p>
            <span className="text-sm font-bold text-emerald-400 mb-1">
              {netWorthData.netWorth >= 0 ? '✓ Positive' : '⚠ Negative'}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-emerald-500/20">
            <div>
              <p className="text-[9px] text-emerald-300 uppercase font-bold">Assets</p>
              <p className="font-bold text-emerald-400">₹{netWorthData.totalAssets.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[9px] text-rose-300 uppercase font-bold">Liabilities</p>
              <p className="font-bold text-rose-400">₹{netWorthData.debtsTotal.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[9px] text-indigo-300 uppercase font-bold">Freedom Ratio</p>
              <p className="font-bold text-indigo-400">{netWorthData.debtsTotal > 0 ? (netWorthData.totalAssets / netWorthData.debtsTotal).toFixed(1) : '∞'}x</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Type Selector */}
      <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl">
        {[
          { id: 'timeline', label: 'Timeline', icon: '📈' },
          { id: 'breakdown', label: 'Breakdown', icon: '📊' },
          { id: 'goals', label: 'Goals', icon: '🎯' }
        ].map(v => (
          <button key={v.id}
            onClick={() => setViewType(v.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${viewType === v.id 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'text-gray-400 hover:text-gray-300'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Timeline View */}
      {viewType === 'timeline' && netWorthTimeline.length > 0 && (
        <div className="bg-gray-900 border border-white/8 rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={netWorthTimeline}>
              <defs>
                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} />
              <YAxis stroke="rgba(255,255,255,0.4)" style={{ fontSize: '10px' }} />
              <Tooltip 
                contentStyle={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="netWorth" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorNetWorth)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown View */}
      {viewType === 'breakdown' && (
        <div className="space-y-3">
          {assetBreakdown.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No assets or liabilities to show</p>
            </div>
          ) : (
            assetBreakdown.map(item => {
              const isDebt = item.value < 0
              const percentage = Math.abs(item.value) / (netWorthData.totalAssets + netWorthData.debtsTotal) * 100
              
              return (
                <div key={item.name} className="rounded-2xl border border-white/8 overflow-hidden hover:bg-white/5 transition-all">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-white">{item.name}</p>
                      <p className={`font-mono font-bold text-sm ${isDebt ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isDebt ? '−' : '+'}₹{Math.abs(item.value).toLocaleString('en-IN')}
                      </p>
                    </div>
                    
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isDebt ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(percentage * 3, 100)}%` }}
                      />
                    </div>
                    
                    <p className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Goals Progress View */}
      {viewType === 'goals' && (
        <div className="space-y-3">
          {goalsProgress.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No savings goals set yet</p>
            </div>
          ) : (
            goalsProgress.map(goal => (
              <div key={goal.name} className="rounded-2xl border border-white/8 overflow-hidden hover:bg-white/5 transition-all">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-white">{goal.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {goal.daysLeft > 0 ? `${goal.daysLeft} days left` : goal.daysLeft === 0 ? 'Due today!' : 'Deadline passed'}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${goal.progress >= 100 ? 'bg-emerald-500/20 text-emerald-400' : goal.progress >= 75 ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                      {goal.progress.toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${goal.progress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'}`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">₹{goal.saved.toLocaleString('en-IN')}</span>
                    <span className="text-gray-500">/ ₹{goal.target.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Asset Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-900/30 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 mb-2">Cash Accounts</p>
            <p className="font-black text-lg text-emerald-400 font-mono">₹{netWorthData.accountsTotal.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-500 mt-1">{Object.keys(accounts || {}).length} accounts</p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-indigo-900/30 p-4"
          style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.08) 0%, rgba(79,70,229,0.02) 100%)' }}>
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-5" 
            style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 70%)', filter: 'blur(20px)' }} />
          <div className="relative">
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 mb-2">Savings Goals</p>
            <p className="font-black text-lg text-indigo-400 font-mono">₹{netWorthData.goalsTotal.toLocaleString('en-IN')}</p>
            <p className="text-[9px] text-gray-500 mt-1">{Object.keys(savingsGoals || {}).length} goals</p>
          </div>
        </div>
      </div>
    </div>
  )
}
