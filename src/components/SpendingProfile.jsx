/**
 * SpendingProfile.jsx — AI Spending Personality Profile Page
 */
import { useMemo } from 'react'
import { ArrowLeft, Sparkles, TrendingUp, Shield, Lightbulb, BarChart3 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { analyzePersonality } from '../utils/personalityEngine'

function TraitBar({ label, score }) {
  const color = score >= 70 ? 'from-emerald-400 to-emerald-500' :
    score >= 40 ? 'from-amber-400 to-amber-500' : 'from-gray-300 to-gray-400'
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 w-24 text-right">{label}</span>
      <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000`}
          style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400 w-8">{Math.round(score)}%</span>
    </div>
  )
}

export default function SpendingProfile() {
  const { transactions, budgets, goals, setActiveTab } = useApp()

  const analysis = useMemo(
    () => analyzePersonality(transactions, budgets, goals),
    [transactions, budgets, goals]
  )

  const { profile, traits, insights, scores, hasEnoughData, savingsRate, weekendRatio } = analysis

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('settings')}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Spending Personality</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered financial profile</p>
        </div>
      </div>

      {!hasEnoughData ? (
        <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-12">
          <div className="w-16 h-16 rounded-3xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Not Enough Data</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Add at least 5 transactions to see your spending personality</p>
        </div>
      ) : (
        <>
          {/* Profile Hero Card */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${profile.color} p-6 shadow-xl`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/40" />
              <div className="absolute -left-6 -bottom-6 w-36 h-36 rounded-full bg-white/20" />
            </div>
            <div className="relative z-10 text-center">
              <div className="text-6xl mb-3">{profile.emoji}</div>
              <h3 className="font-display font-bold text-2xl text-white mb-1">{profile.name}</h3>
              <p className="text-white/80 text-sm leading-relaxed max-w-[280px] mx-auto">{profile.description}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="card bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/30 text-center p-3">
              <p className="text-[10px] text-emerald-500 font-semibold uppercase mb-0.5">Savings Rate</p>
              <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">{savingsRate}%</p>
            </div>
            <div className="card bg-violet-50 dark:bg-violet-900/15 border border-violet-100 dark:border-violet-800/30 text-center p-3">
              <p className="text-[10px] text-violet-500 font-semibold uppercase mb-0.5">Weekend %</p>
              <p className="font-mono font-bold text-sm text-violet-600 dark:text-violet-400">{weekendRatio}%</p>
            </div>
            <div className="card bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/30 text-center p-3">
              <p className="text-[10px] text-blue-500 font-semibold uppercase mb-0.5">Transactions</p>
              <p className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">{transactions.length}</p>
            </div>
          </div>

          {/* Traits */}
          <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
                <BarChart3 size={13} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Your Traits</h3>
            </div>
            <div className="space-y-2.5">
              {traits.map(t => <TraitBar key={t.label} label={t.label} score={t.score} />)}
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                  <Lightbulb size={13} className="text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Insights</h3>
              </div>
              <div className="space-y-2">
                {insights.map((ins, i) => (
                  <div key={i} className={`text-[11px] font-medium px-3 py-2 rounded-lg ${
                    ins.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/15 text-amber-700 dark:text-amber-400' :
                    ins.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400' :
                    ins.type === 'danger' ? 'bg-rose-50 dark:bg-rose-900/15 text-rose-700 dark:text-rose-400' :
                    'bg-blue-50 dark:bg-blue-900/15 text-blue-700 dark:text-blue-400'
                  }`}>
                    {ins.text}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                <Shield size={13} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Your Strengths</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.strengths.map(s => (
                <span key={s} className="text-xs px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-medium border border-emerald-100 dark:border-emerald-800/30">
                  ✅ {s}
                </span>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                <TrendingUp size={13} className="text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Growth Tips</h3>
            </div>
            <div className="space-y-2">
              {profile.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600 dark:text-gray-400 font-medium px-3 py-2 bg-blue-50 dark:bg-blue-900/15 rounded-lg border border-blue-100 dark:border-blue-800/30">
                  <span className="text-blue-500 flex-shrink-0">💡</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-3">Score Breakdown</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Savings', value: scores.savingsScore, icon: '💰' },
                { label: 'Impulse', value: scores.impulseScore, icon: '⚡' },
                { label: 'Social', value: scores.socialScore, icon: '🎉' },
                { label: 'Consistency', value: scores.consistencyScore, icon: '📊' },
                { label: 'Budget', value: scores.budgetScore, icon: '🎯' },
                { label: 'Goals', value: scores.goalScore, icon: '🏆' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">{s.label}</p>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden mt-0.5">
                      <div className="h-full bg-gradient-to-r from-brand-400 to-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(s.value || 0, 100)}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-gray-500 w-8 text-right">{Math.round(s.value || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
