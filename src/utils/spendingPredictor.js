/**
 * spendingPredictor.js — Spending Prediction & Forecasting Engine
 * Uses weighted moving averages + trend analysis to predict future spending
 */

/**
 * Group transactions by month
 */
function groupByMonth(transactions) {
  const months = {}
  transactions.filter(t => t.type === 'debit').forEach(t => {
    const month = t.date?.slice(0, 7)
    if (!month) return
    if (!months[month]) months[month] = {}
    months[month][t.category] = (months[month][t.category] || 0) + Number(t.amount)
  })
  return months
}

/**
 * Weighted Moving Average — recent periods get more weight
 */
function weightedAverage(values) {
  if (values.length === 0) return 0
  if (values.length === 1) return values[0]
  const recent = values.slice(-6)
  const weights = recent.map((_, i) => i + 1)
  const totalWeight = weights.reduce((s, w) => s + w, 0)
  return recent.reduce((sum, val, i) => sum + val * weights[i], 0) / totalWeight
}

/**
 * Calculate trend direction
 */
function getTrend(values) {
  if (values.length < 2) return 'stable'
  const recent = values.slice(-3)
  if (recent.length < 2) return 'stable'
  const first = recent[0]
  const last = recent[recent.length - 1]
  const change = first === 0 ? 0 : ((last - first) / first) * 100
  if (change > 10) return 'up'
  if (change < -10) return 'down'
  return 'stable'
}

/**
 * Main prediction function
 */
export function predictSpending(transactions) {
  if (!transactions || transactions.length < 3) {
    return { totalPredicted: 0, categoryPredictions: [], monthlyTrend: 'stable', insights: [], hasEnoughData: false }
  }

  const monthlyData = groupByMonth(transactions)
  const sortedMonths = Object.keys(monthlyData).sort()

  if (sortedMonths.length < 2) {
    return { totalPredicted: 0, categoryPredictions: [], monthlyTrend: 'stable', insights: [], hasEnoughData: false }
  }

  const allCategories = new Set()
  Object.values(monthlyData).forEach(m => Object.keys(m).forEach(c => allCategories.add(c)))

  const categoryPredictions = []
  let totalPredicted = 0

  allCategories.forEach(cat => {
    const monthlyValues = sortedMonths.map(m => monthlyData[m]?.[cat] || 0)
    const nonZeroValues = monthlyValues.filter(v => v > 0)
    if (nonZeroValues.length === 0) return

    const predicted = Math.round(weightedAverage(nonZeroValues))
    const trend = getTrend(nonZeroValues)
    const avgSpend = Math.round(nonZeroValues.reduce((s, v) => s + v, 0) / nonZeroValues.length)

    const adjusted = trend === 'up'
      ? Math.round(predicted * 1.05)
      : trend === 'down'
        ? Math.round(predicted * 0.95)
        : predicted

    categoryPredictions.push({
      category: cat,
      predicted: adjusted,
      trend,
      avgSpend,
      monthsOfData: nonZeroValues.length,
    })

    totalPredicted += adjusted
  })

  categoryPredictions.sort((a, b) => b.predicted - a.predicted)

  const monthlyTotals = sortedMonths.map(m =>
    Object.values(monthlyData[m]).reduce((s, v) => s + v, 0)
  )
  const monthlyTrend = getTrend(monthlyTotals)
  const insights = generateInsights(categoryPredictions, monthlyTotals, monthlyTrend)

  return {
    totalPredicted,
    categoryPredictions,
    monthlyTrend,
    insights,
    hasEnoughData: true,
    dataMonths: sortedMonths.length,
  }
}

function generateInsights(catPredictions, monthlyTotals, trend) {
  const insights = []

  if (trend === 'up') {
    insights.push({ type: 'warning', text: 'Your spending is trending upward' })
  } else if (trend === 'down') {
    insights.push({ type: 'success', text: 'Great! Spending is decreasing' })
  }

  if (catPredictions.length > 0) {
    const top = catPredictions[0]
    insights.push({
      type: 'info',
      text: 'Highest predicted: ' + top.category + ' at Rs.' + top.predicted.toLocaleString('en-IN'),
    })
  }

  const rising = catPredictions.filter(c => c.trend === 'up')
  if (rising.length > 0) {
    insights.push({
      type: 'warning',
      text: 'Rising: ' + rising.map(c => c.category).join(', '),
    })
  }

  if (monthlyTotals.length >= 2) {
    const last = monthlyTotals[monthlyTotals.length - 1]
    const prev = monthlyTotals[monthlyTotals.length - 2]
    const changePct = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0
    if (Math.abs(changePct) > 5) {
      insights.push({
        type: changePct > 0 ? 'warning' : 'success',
        text: 'Last month was ' + Math.abs(changePct) + '% ' + (changePct > 0 ? 'higher' : 'lower') + ' than before',
      })
    }
  }

  return insights
}

/**
 * Get days remaining and daily budget
 */
export function getDailyBudgetInfo(budgets, transactions) {
  const now = new Date()
  const month = now.toISOString().slice(0, 7)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysRemaining = daysInMonth - now.getDate() + 1

  const totalBudget = Object.values(budgets).reduce((s, v) => s + Number(v), 0)
  const monthlySpent = transactions
    .filter(t => t.type === 'debit' && t.date?.startsWith(month))
    .reduce((s, t) => s + Number(t.amount), 0)

  const remaining = totalBudget - monthlySpent
  const dailyBudget = daysRemaining > 0 ? Math.round(remaining / daysRemaining) : 0

  return {
    daysRemaining,
    totalBudget,
    monthlySpent,
    remaining,
    dailyBudget,
    isOverBudget: remaining < 0,
  }
}