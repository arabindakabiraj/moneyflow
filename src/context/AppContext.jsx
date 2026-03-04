/**
 * AppContext.jsx — Global state with budget alerts + anomaly detection + custom categories
 */
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getSession, clearSession } from '../authUtils'

const AppContext = createContext(null)
const OR_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
const OR_MODEL = 'google/gemini-2.5-flash'

const DEFAULT_CATEGORIES = ['Tiffin', 'Books', 'Travel', 'Tuition', 'Entertainment', 'Health', 'Rent', 'Others']

export function AppProvider({ children }) {
  const [uid, setUid] = useState(undefined)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [transactions, setTx] = useState([])
  const [budgets, setBudgets] = useState({})   // { category: limitAmount }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savingsGoal, setSavingsGoalState] = useState(() => Number(localStorage.getItem('savingsGoal')) || 1000)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '👋 I am your AI Financial Advisor! Ask me anything!' }
  ])
  const [filterDate, setFilterDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [customCategories, setCustomCats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mf_cats') || 'null') || DEFAULT_CATEGORIES }
    catch { return DEFAULT_CATEGORIES }
  })
  const [username, setUsername] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null) // base64 string
  const [accounts, setAccounts] = useState({ cash: 0, bank: 0, upi: 0 })
  const [debts, setDebts] = useState([])
  const [goals, setGoals] = useState([])
  const [bills, setBills] = useState([])
  const [recurringTx, setRecurringTx] = useState([])

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Session load
  useEffect(() => { setUid(getSession()) }, [])

  // Load username + photo from Firestore when uid changes
  useEffect(() => {
    if (!uid) { setUsername(''); setProfilePhoto(null); return }
    getDoc(doc(db, 'users', uid, 'profile', 'info'))
      .then(snap => {
        if (snap.exists()) {
          setUsername(snap.data().username || '')
          setProfilePhoto(snap.data().photoURL || null)
        }
      })
      .catch(console.error)
  }, [uid])

  const updateUsername = async (newName) => {
    if (!uid || !newName.trim()) return
    setUsername(newName.trim())
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), { username: newName.trim() }, { merge: true })
  }

  // Load username + profile photo from Firestore
  const updateProfilePhoto = async (base64) => {
    if (!uid) return
    setProfilePhoto(base64)
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), { photoURL: base64 }, { merge: true })
  }

  // Push notification helper
  const sendBudgetNotification = (category, pct) => {
    if (!('Notification' in window)) return
    if (Notification.permission === 'granted') {
      new Notification(`⚠️ Budget Alert — ${category}`, {
        body: `${category} budget ${pct}% used!`,
        icon: '/logo192.png',
      })
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return
    const perm = await Notification.requestPermission()
    return perm
  }

  // Save custom categories
  useEffect(() => {
    localStorage.setItem('mf_cats', JSON.stringify(customCategories))
  }, [customCategories])

  const addCategory = (cat) => {
    if (!customCategories.includes(cat)) setCustomCats(p => [...p, cat])
  }

  // Firestore — transactions real-time
  useEffect(() => {
    if (!uid) { setTx([]); return }
    setLoading(true)
    const q = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'))
    const unsub = onSnapshot(q,
      snap => { setTx(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); setError(null) },
      err => { console.error(err); setError('Data load error.'); setLoading(false) }
    )
    return unsub
  }, [uid])

  // Firestore — budgets real-time
  useEffect(() => {
    if (!uid) { setBudgets({}); return }
    const unsub = onSnapshot(doc(db, 'users', uid, 'settings', 'budgets'),
      snap => { if (snap.exists()) setBudgets(snap.data()) },
      err => console.error('Budget load err:', err)
    )
    return unsub
  }, [uid])

  // Firestore — accounts real-time (Cash / Bank / UPI)
  useEffect(() => {
    if (!uid) { setAccounts({ cash: 0, bank: 0, upi: 0 }); return }
    const unsub = onSnapshot(doc(db, 'users', uid, 'settings', 'accounts'),
      snap => { if (snap.exists()) setAccounts({ cash: 0, bank: 0, upi: 0, ...snap.data() }) },
      err => console.error('Accounts err:', err)
    )
    return unsub
  }, [uid])

  const updateAccountBalance = async (key, amount) => {
    if (!uid) return
    const updated = { ...accounts, [key]: amount }
    setAccounts(updated)
    await setDoc(doc(db, 'users', uid, 'settings', 'accounts'), updated)
  }

  // Firestore — debts real-time
  useEffect(() => {
    if (!uid) { setDebts([]); return }
    const unsub = onSnapshot(
      query(collection(db, 'users', uid, 'debts'), orderBy('date', 'desc')),
      snap => setDebts(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Debts err:', err)
    )
    return unsub
  }, [uid])

  const addDebt = async (d) => { if (!uid) return; await addDoc(collection(db, 'users', uid, 'debts'), { ...d, repaid: false, createdAt: serverTimestamp() }) }
  const markDebtRepaid = async (id) => { if (!uid) return; await updateDoc(doc(db, 'users', uid, 'debts', id), { repaid: true }) }
  const deleteDebt = async (id) => { if (!uid) return; await deleteDoc(doc(db, 'users', uid, 'debts', id)) }

  // Firestore — Goals real-time
  useEffect(() => {
    if (!uid) { setGoals([]); return }
    const unsub = onSnapshot(
      query(collection(db, 'users', uid, 'goals'), orderBy('createdAt', 'desc')),
      snap => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Goals err:', err)
    )
    return unsub
  }, [uid])

  const addGoal = async (g) => { if (!uid) return; await addDoc(collection(db, 'users', uid, 'goals'), { ...g, createdAt: serverTimestamp() }) }
  const deleteGoal = async (id) => { if (!uid) return; await deleteDoc(doc(db, 'users', uid, 'goals', id)) }

  // Firestore — Bills real-time
  useEffect(() => {
    if (!uid) { setBills([]); return }
    const unsub = onSnapshot(
      query(collection(db, 'users', uid, 'bills'), orderBy('dueDate', 'asc')),
      snap => setBills(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Bills err:', err)
    )
    return unsub
  }, [uid])

  const addBill = async (b) => { if (!uid) return; await addDoc(collection(db, 'users', uid, 'bills'), { ...b, createdAt: serverTimestamp() }) }
  const deleteBill = async (id) => { if (!uid) return; await deleteDoc(doc(db, 'users', uid, 'bills', id)) }
  const markBillPaid = async (id) => { if (!uid) return; await updateDoc(doc(db, 'users', uid, 'bills', id), { paid: true }) }

  // Firestore — Recurring Transactions real-time
  useEffect(() => {
    if (!uid) { setRecurringTx([]); return }
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'recurring'),
      snap => setRecurringTx(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Recurring err:', err)
    )
    return unsub
  }, [uid])

  const addRecurring = async (r) => { if (!uid) return; await addDoc(collection(db, 'users', uid, 'recurring'), { ...r, createdAt: serverTimestamp() }) }
  const deleteRecurring = async (id) => { if (!uid) return; await deleteDoc(doc(db, 'users', uid, 'recurring', id)) }

  const col = () => collection(db, 'users', uid, 'transactions')

  const addTransaction = async (tx) => {
    if (!uid) return
    try { await addDoc(col(), { ...tx, amount: Number(tx.amount), createdAt: serverTimestamp() }) }
    catch (e) { console.error(e); setError('Save error.') }
  }

  const updateTransaction = async (id, updated) => {
    if (!uid) return
    try { await updateDoc(doc(db, 'users', uid, 'transactions', id), updated) }
    catch (e) { console.error(e) }
  }

  const deleteTransaction = async (id) => {
    if (!uid) return
    try { await deleteDoc(doc(db, 'users', uid, 'transactions', id)) }
    catch (e) { console.error(e) }
  }

  const toggleNeedWant = (id) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) updateTransaction(id, { isWant: !tx.isWant })
  }

  // Budget CRUD
  const saveBudget = async (category, limit) => {
    if (!uid) return
    const newBudgets = { ...budgets, [category]: Number(limit) }
    setBudgets(newBudgets)
    await setDoc(doc(db, 'users', uid, 'settings', 'budgets'), newBudgets, { merge: true })
  }

  const removeBudget = async (category) => {
    if (!uid) return
    const nb = { ...budgets }
    delete nb[category]
    setBudgets(nb)
    await setDoc(doc(db, 'users', uid, 'settings', 'budgets'), nb)
  }

  // Budget alerts — categories over limit this month
  const getBudgetAlerts = () => {
    const now = new Date().toISOString().slice(0, 7)
    const monthlySpend = {}
    transactions
      .filter(t => t.type === 'debit' && t.date?.startsWith(now))
      .forEach(t => { monthlySpend[t.category] = (monthlySpend[t.category] || 0) + Number(t.amount) })
    return Object.entries(budgets)
      .filter(([cat, limit]) => (monthlySpend[cat] || 0) >= limit * 0.8)
      .map(([cat, limit]) => ({
        category: cat,
        spent: monthlySpend[cat] || 0,
        limit,
        exceeded: (monthlySpend[cat] || 0) >= limit,
        pct: Math.round(((monthlySpend[cat] || 0) / limit) * 100),
      }))
  }

  // Anomaly detection — transactions > 2x category average
  const getAnomalies = () => {
    const catAvg = {}
    const catCount = {}
    transactions.filter(t => t.type === 'debit').forEach(t => {
      catAvg[t.category] = (catAvg[t.category] || 0) + Number(t.amount)
      catCount[t.category] = (catCount[t.category] || 0) + 1
    })
    Object.keys(catAvg).forEach(c => { catAvg[c] /= catCount[c] })
    return transactions
      .filter(t => t.type === 'debit' && Number(t.amount) > catAvg[t.category] * 2)
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5)
  }

  const logout = () => { clearSession(); setUid(null); setTx([]); setBudgets({}) }
  const setSavingsGoal = (v) => { setSavingsGoalState(v); localStorage.setItem('savingsGoal', v) }

  const getSummary = (txList = transactions) => {
    const totalCredit = txList.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0)
    const totalDebit = txList.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0)
    return { totalCredit, totalDebit, balance: totalCredit - totalDebit }
  }

  const getFilteredTransactions = () => {
    let f = [...transactions]
    if (filterDate) f = f.filter(t => t.date === filterDate)
    else if (filterMonth) f = f.filter(t => t.date?.startsWith(filterMonth))
    return f.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  const askGemini = async (userMessage) => {
    const summary = getSummary()
    const anomalies = getAnomalies()
    const alerts = getBudgetAlerts()
    const catBreakdown = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})

    // ── Enhanced: monthly trend data for smart chat ──
    const monthlyData = {}
    transactions.forEach(t => {
      const m = t.date?.slice(0, 7)
      if (!m) return
      if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0 }
      if (t.type === 'credit') monthlyData[m].income += Number(t.amount)
      else monthlyData[m].expense += Number(t.amount)
    })
    const sortedMonths = Object.keys(monthlyData).sort().slice(-6)
    const monthlyTrend = sortedMonths.map(m => `${m}: Income ₹${monthlyData[m].income}, Expense ₹${monthlyData[m].expense}`).join(' | ')

    // ── Enhanced: per-category monthly data for comparisons ──
    const catMonthly = {}
    transactions.filter(t => t.type === 'debit').forEach(t => {
      const m = t.date?.slice(0, 7)
      if (!m) return
      if (!catMonthly[m]) catMonthly[m] = {}
      catMonthly[m][t.category] = (catMonthly[m][t.category] || 0) + Number(t.amount)
    })

    // ── Enhanced: recent transactions for context ──
    const recentTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)
      .map(t => `${t.date} ${t.type === 'credit' ? '+' : '-'}₹${t.amount} ${t.description} [${t.category}]`)
      .join('\n')

    // ── Enhanced: account balances ──
    const accountInfo = `Cash: ₹${accounts.cash || 0}, Bank: ₹${accounts.bank || 0}, UPI: ₹${accounts.upi || 0}`

    // ── Enhanced: debt info ──
    const activeDebts = debts.filter(d => !d.repaid)
    const debtInfo = activeDebts.length > 0
      ? activeDebts.map(d => `${d.person}: ₹${d.amount} (${d.type})`).join(', ')
      : 'No active debts'

    const systemInstruction = `You are MoneyFlow's AI Financial Advisor. You are talking to a student user.

══ Financial Data ══
- Balance: ₹${summary.balance}, Total Income: ₹${summary.totalCredit}, Total Expense: ₹${summary.totalDebit}
- Accounts: ${accountInfo}
- Category-wise spending: ${JSON.stringify(catBreakdown)}
- Budget alerts (≥80% used): ${JSON.stringify(alerts)}
- Anomalies (>2x avg): ${JSON.stringify(anomalies.map(a => ({ desc: a.description, amt: a.amount, cat: a.category })))}
- Savings goal: ₹${savingsGoal}, Total Transactions: ${transactions.length}
- Active debts: ${debtInfo}

══ Monthly Trends (last 6 months) ══
${monthlyTrend}

══ Recent 20 Transactions ══
${recentTx}

══ Instructions ══
- Respond in the SAME LANGUAGE as the user's message. If they write in English, reply in English. If Bengali, reply in Bengali. If mixed, reply mixed.
- Be concise, friendly, and actionable
- Use emojis for visual clarity
- When asked to compare months, use the monthly trend data above
- When asked about specific categories, use category-wise and monthly data
- For budget advice, consider actual spending vs budget limits
- Give specific numbers, not vague advice
- If user asks to show data as a table/chart, format with clear structure`

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    if (!OR_API_KEY) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ OpenRouter API Key is not set. Add VITE_OPENROUTER_API_KEY to your .env file.' }])
      return
    }

    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OR_MODEL,
          messages: [
            { role: 'system', content: systemInstruction },
            // Include last 6 chat messages for context continuity
            ...chatMessages.slice(-6),
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        },
        {
          headers: {
            'Authorization': `Bearer ${OR_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://moneyflow-xyz.vercel.app',
            'X-Title': 'MoneyFlow AI',
          },
        }
      )
      const reply = res.data?.choices?.[0]?.message?.content || 'Sorry, no response received.'
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message
      setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ AI error: ${msg}` }])
    }
  }

  /**
   * askGeminiRaw — Direct prompt → response (no chat history, for internal use)
   */
  const askGeminiRaw = async (prompt) => {
    if (!OR_API_KEY) return null
    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OR_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 512,
        },
        {
          headers: {
            'Authorization': `Bearer ${OR_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://moneyflow-xyz.vercel.app',
            'X-Title': 'MoneyFlow AI',
          },
        }
      )
      return res.data?.choices?.[0]?.message?.content || null
    } catch (e) {
      console.error('askGeminiRaw error:', e)
      return null
    }
  }

  /**
   * parseNLPTransaction — Parse natural language in ANY language into transaction fields
   * E.g. "yesterday spent 200 on bus" → { type: 'debit', amount: 200, description: 'Bus fare', ... }
   */
  const parseNLPTransaction = async (text) => {
    if (!OR_API_KEY || !text.trim()) return null

    const today = new Date().toISOString().split('T')[0]
    const categories = customCategories.join(', ')

    const prompt = `You are a transaction parser for a finance app. Parse the following natural language input into a structured transaction.

The input can be in ANY language (Bengali, Hindi, English, Spanish, or mixed). Extract:
1. type: "debit" (expense/spent/খরচ) or "credit" (income/earned/আয়)
2. amount: number (extract from text, handle words like "টাকা", "rupees", "rs", "₹")
3. description: Short English description of what the transaction is about
4. date: YYYY-MM-DD format. Today is ${today}. Handle "yesterday", "কাল", "আজ", "today", "last monday", etc.
5. category: Best match from these categories: ${categories}
6. account: "Cash", "Bank", or "UPI" (infer from context, default "Cash")

User input: "${text}"

RESPOND WITH ONLY valid JSON, no markdown, no explanation:
{"type":"debit","amount":0,"description":"","date":"${today}","category":"Others","account":"Cash"}`

    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OR_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 256,
        },
        {
          headers: {
            'Authorization': `Bearer ${OR_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://moneyflow-xyz.vercel.app',
            'X-Title': 'MoneyFlow AI',
          },
        }
      )
      const raw = res.data?.choices?.[0]?.message?.content || ''
      // Extract JSON from response (handle possible markdown wrapping)
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        // Validate required fields
        if (parsed.amount && parsed.description) {
          return {
            type: parsed.type === 'credit' ? 'credit' : 'debit',
            amount: Math.abs(Number(parsed.amount)) || 0,
            description: String(parsed.description).trim(),
            date: parsed.date || today,
            category: customCategories.includes(parsed.category) ? parsed.category : 'Others',
            account: ['Cash', 'Bank', 'UPI'].includes(parsed.account) ? parsed.account : 'Cash',
          }
        }
      }
      return null
    } catch (e) {
      console.error('NLP parse error:', e)
      return null
    }
  }

  const value = {
    uid, setUid, logout,
    user: uid ? { phoneNumber: uid } : null,
    username, updateUsername,
    profilePhoto, updateProfilePhoto,
    darkMode, setDarkMode,
    transactions, loading, error,
    savingsGoal, setSavingsGoal,
    activeTab, setActiveTab,
    chatMessages, setChatMessages,
    filterDate, setFilterDate,
    filterMonth, setFilterMonth,
    customCategories, addCategory,
    budgets, saveBudget, removeBudget,
    accounts, updateAccountBalance,
    debts, addDebt, markDebtRepaid, deleteDebt,
    goals, addGoal, deleteGoal,
    bills, addBill, deleteBill, markBillPaid,
    recurringTx, addRecurring, deleteRecurring,
    getBudgetAlerts, getAnomalies,
    sendBudgetNotification, requestNotificationPermission,
    addTransaction, updateTransaction, deleteTransaction, toggleNeedWant,
    getSummary, getFilteredTransactions,
    askGemini, askGeminiRaw, parseNLPTransaction,
    isDemo: false,
    fetchTransactions: () => { },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
