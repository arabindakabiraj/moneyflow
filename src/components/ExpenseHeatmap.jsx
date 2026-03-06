/**
 * ExpenseHeatmap.jsx — GitHub-style expense heatmap showing daily spending intensity
 */
import { useState, useMemo } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Flame, Calendar } from 'lucide-react'
import { useApp } from '../context/AppContext'

const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getWeeksInRange(startDate, endDate) {
  const weeks = []
  let current = new Date(startDate)
  // Align to Monday
  const day = current.getDay()
  current.setDate(current.getDate() - ((day + 6) % 7))

  while (current <= endDate) {
    const week = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(current)
      d.setDate(d.getDate() + i)
      week.push(d.toISOString().split('T')[0])
    }
    weeks.push(week)
    current.setDate(current.getDate() + 7)
  }
  return weeks
}

function getIntensityClass(amount, max) {
  if (!amount || amount <= 0) return 'bg-gray-100 dark:bg-gray-800'
  const ratio = amount / max
  if (ratio < 0.15) return 'bg-emerald-200 dark:bg-emerald-900/40'
  if (ratio < 0.35) return 'bg-emerald-400 dark:bg-emerald-700/60'
  if (ratio < 0.55) return 'bg-amber-400 dark:bg-amber-600/60'
  if (ratio < 0.75) return 'bg-orange-400 dark:bg-orange-600/70'
  return 'bg-rose-500 dark:bg-rose-600/80'
}

function getIntensityLabel(amount, max) {
  if (!amount || amount <= 0) return 'No spending'
  const ratio = amount / max
  if (ratio < 0.25) return 'Low'
  if (ratio < 0.5) return 'Moderate'
  if (ratio < 0.75) return 'High'
  return 'Very High'
}

export default function ExpenseHeatmap() {
  const { transactions, setActiveTab } = useApp()
  const [yearOffset, setYearOffset] = useState(0)

  const now = new Date()
  const viewYear = now.getFullYear() + yearOffset

  // Build daily spending map for the selected year
  const { dailyMap, maxSpend, totalDays, totalSpent, avgDaily } = useMemo(() => {
    const map = {}
    let max = 0
    let total = 0
    let days = 0

    transactions
      .filter(t => t.type === 'debit' && t.date?.startsWith(String(viewYear)))
      .forEach(t => {
        const d = t.date
        map[d] = (map[d] || 0) + Number(t.amount)
        if (map[d] > max) max = map[d]
      })

    Object.values(map).forEach(v => { total += v; days++ })

    return {
      dailyMap: map,
      maxSpend: max,
      totalDays: days,
      totalSpent: total,
      avgDaily: days > 0 ? Math.round(total / days) : 0,
    }
  }, [transactions, viewYear])

  // Generate weeks for the year
  const startDate = new Date(viewYear, 0, 1)
  const endDate = new Date(viewYear, 11, 31)
  const weeks = useMemo(() => getWeeksInRange(startDate, endDate), [viewYear])

  // Tooltip state
  const [tooltip, setTooltip] = useState(null)

  // Month labels positioned at the correct week index
  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const firstDay = new Date(week[0])
      const month = firstDay.getMonth()
      if (month !== lastMonth && firstDay.getFullYear() === viewYear) {
        labels.push({ month: MONTHS[month], weekIdx: wi })
        lastMonth = month
      }
    })
    return labels
  }, [weeks, viewYear])

  // Best & worst days
  const { bestDay, worstDay } = useMemo(() => {
    let best = null, worst = null
    Object.entries(dailyMap).forEach(([date, amt]) => {
      if (!worst || amt > worst.amount) worst = { date, amount: amt }
      if (!best || amt < best.amount) best = { date, amount: amt }
    })
    return { bestDay: best, worstDay: worst }
  }, [dailyMap])

  const today = now.toISOString().split('T')[0]

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('charts')}
          className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Expense Heatmap</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Daily spending intensity</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setYearOffset(y => y - 1)}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-bold text-gray-800 dark:text-white px-2">{viewYear}</span>
          <button onClick={() => setYearOffset(y => Math.min(y + 1, 0))} disabled={yearOffset >= 0}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="card bg-rose-50 dark:bg-rose-900/15 border border-rose-100 dark:border-rose-800/30 text-center p-3">
          <p className="text-[10px] text-rose-500 font-semibold uppercase mb-0.5">Total Spent</p>
          <p className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">₹{totalSpent.toLocaleString('en-IN')}</p>
        </div>
        <div className="card bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-800/30 text-center p-3">
          <p className="text-[10px] text-blue-500 font-semibold uppercase mb-0.5">Active Days</p>
          <p className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">{totalDays}</p>
        </div>
        <div className="card bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/30 text-center p-3">
          <p className="text-[10px] text-amber-500 font-semibold uppercase mb-0.5">Avg / Day</p>
          <p className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">₹{avgDaily.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-sm">
            <Flame size={13} className="text-white" />
          </div>
          <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Spending Intensity</h3>
        </div>

        {/* Month labels */}
        <div className="flex ml-8 mb-1 overflow-hidden">
          {monthLabels.map(({ month, weekIdx }) => (
            <span key={`${month}-${weekIdx}`}
              className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold absolute"
              style={{ left: `${32 + weekIdx * 14}px` }}>
              {month}
            </span>
          ))}
        </div>

        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-[2px] relative mt-4">
            {/* Day labels */}
            <div className="flex flex-col gap-[2px] flex-shrink-0 pr-1">
              {DAYS.map((day, i) => (
                <div key={i} className="h-[12px] flex items-center">
                  <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium w-6 text-right">{day}</span>
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((date, di) => {
                  const amount = dailyMap[date] || 0
                  const isToday = date === today
                  const dateObj = new Date(date)
                  const inYear = dateObj.getFullYear() === viewYear
                  const inFuture = date > today

                  return (
                    <div
                      key={date}
                      className={`w-[12px] h-[12px] rounded-[2px] transition-all cursor-pointer hover:scale-150 hover:z-10 relative
                        ${!inYear || inFuture ? 'bg-gray-50 dark:bg-gray-900/30 opacity-30' :
                          getIntensityClass(amount, maxSpend)}
                        ${isToday ? 'ring-2 ring-brand-500 ring-offset-1 dark:ring-offset-gray-800' : ''}`}
                      onMouseEnter={(e) => {
                        const rect = e.target.getBoundingClientRect()
                        setTooltip({
                          date,
                          amount,
                          x: rect.left + rect.width / 2,
                          y: rect.top - 8,
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                      onClick={() => setTooltip(tooltip?.date === date ? null : {
                        date, amount,
                        x: 0, y: 0, sticky: true
                      })}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/60">
          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">Less</span>
          <div className="w-[12px] h-[12px] rounded-[2px] bg-gray-100 dark:bg-gray-800" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-emerald-200 dark:bg-emerald-900/40" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-emerald-400 dark:bg-emerald-700/60" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-amber-400 dark:bg-amber-600/60" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-orange-400 dark:bg-orange-600/70" />
          <div className="w-[12px] h-[12px] rounded-[2px] bg-rose-500 dark:bg-rose-600/80" />
          <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">More</span>
        </div>
      </div>

      {/* Tooltip (sticky for mobile) */}
      {tooltip && tooltip.sticky && (
        <div className="card bg-gray-900 dark:bg-gray-700 text-white p-3 flex items-center justify-between animate-fade-in">
          <div>
            <p className="text-xs font-semibold">{new Date(tooltip.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p className="text-[11px] text-gray-300 mt-0.5">
              {tooltip.amount > 0 ? `₹${tooltip.amount.toLocaleString('en-IN')} spent` : 'No spending'}
              {tooltip.amount > 0 && ` · ${getIntensityLabel(tooltip.amount, maxSpend)}`}
            </p>
          </div>
          <button onClick={() => setTooltip(null)} className="text-gray-400 hover:text-white">
            <Calendar size={14} />
          </button>
        </div>
      )}

      {/* Desktop tooltip (follows mouse) */}
      {tooltip && !tooltip.sticky && (
        <div className="fixed z-[200] pointer-events-none animate-fade-in"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}>
          <div className="bg-gray-900 dark:bg-gray-700 text-white text-[10px] px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
            <p className="font-semibold">{new Date(tooltip.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            <p className="text-gray-300">
              {tooltip.amount > 0 ? `₹${tooltip.amount.toLocaleString('en-IN')} spent` : 'No spending'}
            </p>
          </div>
        </div>
      )}

      {/* Best & worst day cards */}
      {bestDay && worstDay && bestDay.date !== worstDay.date && (
        <div className="grid grid-cols-2 gap-2">
          <div className="card bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-100 dark:border-emerald-800/30 p-3">
            <p className="text-[10px] text-emerald-500 font-semibold uppercase mb-1">💚 Lowest Day</p>
            <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">₹{bestDay.amount.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{new Date(bestDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
          </div>
          <div className="card bg-rose-50 dark:bg-rose-900/15 border border-rose-100 dark:border-rose-800/30 p-3">
            <p className="text-[10px] text-rose-500 font-semibold uppercase mb-1">🔥 Highest Day</p>
            <p className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">₹{worstDay.amount.toLocaleString('en-IN')}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{new Date(worstDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
          </div>
        </div>
      )}

      {/* Day of week breakdown */}
      <DayOfWeekBreakdown transactions={transactions} viewYear={viewYear} />
    </div>
  )
}

/* Day of week analysis */
function DayOfWeekBreakdown({ transactions, viewYear }) {
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const data = useMemo(() => {
    const totals = Array(7).fill(0)
    const counts = Array(7).fill(0)
    transactions
      .filter(t => t.type === 'debit' && t.date?.startsWith(String(viewYear)))
      .forEach(t => {
        const day = new Date(t.date).getDay()
        totals[day] += Number(t.amount)
        counts[day]++
      })
    const max = Math.max(...totals, 1)
    return DOW.map((name, i) => ({
      name,
      total: totals[i],
      avg: counts[i] > 0 ? Math.round(totals[i] / counts[i]) : 0,
      pct: (totals[i] / max) * 100,
    }))
  }, [transactions, viewYear])

  if (data.every(d => d.total === 0)) return null

  return (
    <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
      <h3 className="font-semibold text-gray-800 dark:text-white text-sm mb-3">Spending by Day of Week</h3>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 w-8">{d.name}</span>
            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${d.pct}%` }} />
            </div>
            <span className="text-[10px] font-mono font-semibold text-gray-600 dark:text-gray-300 w-16 text-right">
              ₹{d.total.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
