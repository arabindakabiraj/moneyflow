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
    { role: 'assistant', content: '👋 আমি তোমার AI Financial Advisor! জিজ্ঞেস করো!' }
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
        body: `${category} budget ${pct}% use হয়েছে!`,
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
      err => { console.error(err); setError('Data load সমস্যা।'); setLoading(false) }
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

  const col = () => collection(db, 'users', uid, 'transactions')

  const addTransaction = async (tx) => {
    if (!uid) return
    try { await addDoc(col(), { ...tx, amount: Number(tx.amount), createdAt: serverTimestamp() }) }
    catch (e) { console.error(e); setError('Save সমস্যা।') }
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

    const systemInstruction = `তুমি MoneyFlow-এর AI Financial Advisor। একজন ছাত্রের সাথে কথা বলছ।
আর্থিক তথ্য:
- Balance: ₹${summary.balance}, Income: ₹${summary.totalCredit}, Expense: ₹${summary.totalDebit}
- Category খরচ: ${JSON.stringify(catBreakdown)}
- Budget alerts: ${JSON.stringify(alerts)}
- অস্বাভাবিক খরচ (anomalies): ${JSON.stringify(anomalies.map(a => ({ desc: a.description, amt: a.amount, cat: a.category })))}
- Savings goal: ₹${savingsGoal}, Transactions: ${transactions.length}
সংক্ষিপ্ত, বন্ধুত্বপূর্ণ পরামর্শ দাও। বাংলা+English মিশিয়ে। Emoji ব্যবহার করো।`

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    if (!OR_API_KEY) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ OpenRouter API Key সেট নেই। .env এ VITE_OPENROUTER_API_KEY যোগ করো।' }])
      return
    }

    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OR_MODEL,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
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
      const reply = res.data?.choices?.[0]?.message?.content || 'দুঃখিত, উত্তর পাওয়া যায়নি।'
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message
      setChatMessages(prev => [...prev, { role: 'assistant', content: `❌ AI error: ${msg}` }])
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
    getBudgetAlerts, getAnomalies,
    sendBudgetNotification, requestNotificationPermission,
    addTransaction, updateTransaction, deleteTransaction, toggleNeedWant,
    getSummary, getFilteredTransactions,
    askGemini,
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
