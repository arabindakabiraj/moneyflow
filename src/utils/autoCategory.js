/**
 * autoCategory.js — Smart auto-categorization engine
 * Learns from past transactions to suggest categories based on description keywords.
 */

// Common keyword → category mappings (fallback when no history exists)
const KEYWORD_MAP = {
  // Food
  tiffin: 'Tiffin', breakfast: 'Tiffin', lunch: 'Tiffin', dinner: 'Tiffin',
  swiggy: 'Tiffin', zomato: 'Tiffin', food: 'Tiffin', snack: 'Tiffin',
  tea: 'Tiffin', coffee: 'Tiffin', chai: 'Tiffin', restaurant: 'Tiffin',
  canteen: 'Tiffin', mess: 'Tiffin', biryani: 'Tiffin', pizza: 'Tiffin',
  burger: 'Tiffin', momo: 'Tiffin', roll: 'Tiffin', juice: 'Tiffin',
  // Travel
  bus: 'Travel', auto: 'Travel', uber: 'Travel', ola: 'Travel',
  rapido: 'Travel', train: 'Travel', metro: 'Travel', rickshaw: 'Travel',
  petrol: 'Travel', fuel: 'Travel', cab: 'Travel', flight: 'Travel',
  fare: 'Travel', ticket: 'Travel',
  // Books / Education
  book: 'Books', notebook: 'Books', pen: 'Books', stationery: 'Books',
  xerox: 'Books', photocopy: 'Books', print: 'Books', amazon: 'Books',
  flipkart: 'Books',
  // Tuition
  tuition: 'Tuition', coaching: 'Tuition', class: 'Tuition', course: 'Tuition',
  fees: 'Tuition', college: 'Tuition', school: 'Tuition', exam: 'Tuition',
  // Entertainment
  movie: 'Entertainment', netflix: 'Entertainment', spotify: 'Entertainment',
  game: 'Entertainment', youtube: 'Entertainment', subscription: 'Entertainment',
  recharge: 'Entertainment', data: 'Entertainment', sim: 'Entertainment',
  // Health
  medicine: 'Health', doctor: 'Health', hospital: 'Health', pharmacy: 'Health',
  medical: 'Health', gym: 'Health', health: 'Health',
  // Rent
  rent: 'Rent', electricity: 'Rent', bill: 'Rent', wifi: 'Rent',
  internet: 'Rent', water: 'Rent', gas: 'Rent',
}

/**
 * Build a frequency map from past transactions: description_word → { category: count }
 */
function buildFrequencyMap(transactions) {
  const map = {} // word → { category: hitCount }
  for (const tx of transactions) {
    if (!tx.description || !tx.category) continue
    const words = tx.description.toLowerCase().split(/\s+/)
    for (const word of words) {
      const clean = word.replace(/[^a-z0-9]/gi, '')
      if (clean.length < 2) continue
      if (!map[clean]) map[clean] = {}
      map[clean][tx.category] = (map[clean][tx.category] || 0) + 1
    }
  }
  return map
}

/**
 * Given a description string and past transactions, suggest the most likely category.
 * Returns { category: string, confidence: number (0-1) } or null
 */
export function suggestCategory(description, transactions, customCategories = []) {
  if (!description || description.trim().length < 2) return null

  const words = description.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/gi, '')).filter(w => w.length >= 2)
  if (words.length === 0) return null

  const validCategories = new Set(customCategories)

  // Step 1: Check user's past transaction patterns (highest priority)
  if (transactions.length > 0) {
    const freqMap = buildFrequencyMap(transactions)
    const scores = {} // category → score

    for (const word of words) {
      if (freqMap[word]) {
        for (const [cat, count] of Object.entries(freqMap[word])) {
          if (validCategories.size === 0 || validCategories.has(cat)) {
            scores[cat] = (scores[cat] || 0) + count
          }
        }
      }
    }

    // Find best match from history
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
    if (best && best[1] >= 1) {
      const total = Object.values(scores).reduce((s, v) => s + v, 0)
      return { category: best[0], confidence: Math.min(best[1] / total, 1), source: 'history' }
    }
  }

  // Step 2: Fallback to keyword map
  for (const word of words) {
    const mapped = KEYWORD_MAP[word]
    if (mapped && (validCategories.size === 0 || validCategories.has(mapped))) {
      return { category: mapped, confidence: 0.6, source: 'keywords' }
    }
  }

  return null
}

/**
 * Get top N category suggestions ranked by confidence
 */
export function getTopSuggestions(description, transactions, customCategories = [], limit = 3) {
  if (!description || description.trim().length < 2) return []

  const words = description.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/gi, '')).filter(w => w.length >= 2)
  if (words.length === 0) return []

  const validCategories = new Set(customCategories)
  const scores = {}

  // From history
  if (transactions.length > 0) {
    const freqMap = buildFrequencyMap(transactions)
    for (const word of words) {
      if (freqMap[word]) {
        for (const [cat, count] of Object.entries(freqMap[word])) {
          if (validCategories.size === 0 || validCategories.has(cat)) {
            scores[cat] = (scores[cat] || 0) + count * 2 // history gets 2x weight
          }
        }
      }
    }
  }

  // From keyword map
  for (const word of words) {
    const mapped = KEYWORD_MAP[word]
    if (mapped && (validCategories.size === 0 || validCategories.has(mapped))) {
      scores[mapped] = (scores[mapped] || 0) + 1
    }
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([cat, score]) => ({ category: cat, score }))
}
