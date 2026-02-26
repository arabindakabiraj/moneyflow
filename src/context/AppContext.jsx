/**
 * AppContext.jsx
 * Global state — Firebase Auth + Firestore backend
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { auth, db } from '../firebase'

const AppContext = createContext(null)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'

export function AppProvider({ children }) {
  const [user, setUser] = useState(undefined)   // undefined = loading
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savingsGoal, setSavingsGoalState] = useState(() => Number(localStorage.getItem('savingsGoal')) || 1000)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '👋 আমি তোমার AI Financial Advisor! তোমার খরচের হিসাব দেখে পরামর্শ দিতে পারি। জিজ্ঞেস করো!' }
  ])
  const [filterDate, setFilterDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  // ─── Dark mode ───────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // ─── Auth state listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null)
    })
    return unsub
  }, [])

  // ─── Firestore real-time listener ────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setTransactions([])
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('date', 'desc')
    )
    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setTransactions(data)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Firestore error:', err)
        setError('Data load করতে সমস্যা হয়েছে।')
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  // ─── CRUD helpers ────────────────────────────────────────────────────────────
  const txCol = () => collection(db, 'users', user.uid, 'transactions')

  const addTransaction = async (tx) => {
    if (!user) return
    try {
      await addDoc(txCol(), {
        ...tx,
        amount: Number(tx.amount),
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      console.error(err)
      setError('Transaction add করতে সমস্যা হয়েছে।')
    }
  }

  const updateTransaction = async (id, updated) => {
    if (!user) return
    try {
      await updateDoc(doc(db, 'users', user.uid, 'transactions', id), updated)
    } catch (err) {
      console.error(err)
      setError('Update করতে সমস্যা হয়েছে।')
    }
  }

  const deleteTransaction = async (id) => {
    if (!user) return
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
    } catch (err) {
      console.error(err)
      setError('Delete করতে সমস্যা হয়েছে।')
    }
  }

  const toggleNeedWant = (id) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) updateTransaction(id, { isWant: !tx.isWant })
  }

  const logout = () => signOut(auth)

  // ─── Savings goal ────────────────────────────────────────────────────────────
  const setSavingsGoal = (v) => {
    setSavingsGoalState(v)
    localStorage.setItem('savingsGoal', v)
  }

  // ─── Computed ────────────────────────────────────────────────────────────────
  const getSummary = (txList = transactions) => {
    const totalCredit = txList.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0)
    const totalDebit = txList.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0)
    return { totalCredit, totalDebit, balance: totalCredit - totalDebit }
  }

  const getFilteredTransactions = () => {
    let filtered = [...transactions]
    if (filterDate) filtered = filtered.filter(t => t.date === filterDate)
    else if (filterMonth) filtered = filtered.filter(t => t.date?.startsWith(filterMonth))
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // ─── Gemini AI ───────────────────────────────────────────────────────────────
  const askGemini = async (userMessage) => {
    const summary = getSummary()
    const categoryBreakdown = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})

    const systemInstruction = `তুমি MoneyFlow-এর AI Financial Advisor। তুমি একজন ছাত্রের সাথে কথা বলছ।
তাদের আর্থিক তথ্য:
- মোট ব্যালেন্স: ₹${summary.balance}
- মোট আয় (Credit): ₹${summary.totalCredit}
- মোট ব্যয় (Debit): ₹${summary.totalDebit}
- বিভাগ অনুযায়ী ব্যয়: ${JSON.stringify(categoryBreakdown)}
- মোট লেনদেন: ${transactions.length}
- সঞ্চয়ের লক্ষ্য: ₹${savingsGoal}

সংক্ষিপ্ত, বন্ধুত্বপূর্ণ এবং ব্যবহারিক পরামর্শ দাও। বাংলা ও ইংরেজি মিশিয়ে দিতে পারো। Emoji ব্যবহার করো।`

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Gemini API Key সেট করা নেই। `.env` ফাইলে `VITE_GEMINI_API_KEY` যোগ করুন।'
      }])
      return
    }

    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }
      )
      if (res.data?.candidates?.[0]?.finishReason === 'SAFETY') {
        setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ এই প্রশ্নের উত্তর দেওয়া সম্ভব হলো না।' }])
        return
      }
      const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'দুঃখিত, উত্তর পাওয়া যায়নি।'
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || err.message || 'Unknown error'
      console.error('Gemini API Error:', errMsg)
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ AI সংযোগে সমস্যা হয়েছে।\n\n**Error:** ${errMsg}\n\nAPI Key ও internet connection চেক করুন।`
      }])
    }
  }

  const value = {
    user, logout,
    darkMode, setDarkMode,
    transactions, loading, error,
    savingsGoal, setSavingsGoal,
    activeTab, setActiveTab,
    chatMessages, setChatMessages,
    filterDate, setFilterDate,
    filterMonth, setFilterMonth,
    addTransaction, updateTransaction, deleteTransaction, toggleNeedWant,
    getSummary, getFilteredTransactions,
    askGemini,
    // Legacy compat
    isDemo: false,
    fetchTransactions: () => { },
    CONFIG: { GEMINI_API_KEY, GEMINI_MODEL },
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
