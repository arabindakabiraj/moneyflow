/**
 * AppContext.jsx
 * Global state — Custom Phone+Password auth + Firestore
 */
import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { getSession, clearSession } from '../authUtils'

const AppContext = createContext(null)

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.0-flash'

export function AppProvider({ children }) {
  const [uid, setUid] = useState(undefined)  // undefined=loading, null=not logged in
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [transactions, setTx] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [savingsGoal, setSavingsGoalState] = useState(() => Number(localStorage.getItem('savingsGoal')) || 1000)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '👋 আমি তোমার AI Financial Advisor! জিজ্ঞেস করো!' }
  ])
  const [filterDate, setFilterDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Load session on mount
  useEffect(() => {
    const saved = getSession()
    setUid(saved)   // null if not logged in
  }, [])

  // Firestore real-time listener — runs when uid available
  useEffect(() => {
    if (!uid) {
      setTx([])
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'users', uid, 'transactions'),
      orderBy('date', 'desc')
    )
    const unsub = onSnapshot(q,
      snap => {
        setTx(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setError(null)
      },
      err => {
        console.error(err)
        setError('Data load করতে সমস্যা হয়েছে।')
        setLoading(false)
      }
    )
    return unsub
  }, [uid])

  const col = () => collection(db, 'users', uid, 'transactions')

  const addTransaction = async (tx) => {
    if (!uid) return
    try {
      await addDoc(col(), { ...tx, amount: Number(tx.amount), createdAt: serverTimestamp() })
    } catch (e) { console.error(e); setError('Transaction save হয়নি।') }
  }

  const updateTransaction = async (id, updated) => {
    if (!uid) return
    try {
      await updateDoc(doc(db, 'users', uid, 'transactions', id), updated)
    } catch (e) { console.error(e) }
  }

  const deleteTransaction = async (id) => {
    if (!uid) return
    try {
      await deleteDoc(doc(db, 'users', uid, 'transactions', id))
    } catch (e) { console.error(e) }
  }

  const toggleNeedWant = (id) => {
    const tx = transactions.find(t => t.id === id)
    if (tx) updateTransaction(id, { isWant: !tx.isWant })
  }

  const logout = () => {
    clearSession()
    setUid(null)
    setTx([])
    setChatMessages([{ role: 'assistant', content: '👋 আমি তোমার AI Financial Advisor!' }])
    setActiveTab('dashboard')
  }

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
    const catBreakdown = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})

    const systemInstruction = `তুমি MoneyFlow-এর AI Financial Advisor। একজন ছাত্রের সাথে কথা বলছ।
তথ্য: Balance ₹${summary.balance}, Income ₹${summary.totalCredit}, Expense ₹${summary.totalDebit}
Category: ${JSON.stringify(catBreakdown)}, Transactions: ${transactions.length}, Goal: ₹${savingsGoal}
সংক্ষিপ্ত, বন্ধুত্বপূর্ণ পরামর্শ দাও। বাংলা+ইংরেজি মিশিয়ে। Emoji ব্যবহার করো।`

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    if (!GEMINI_API_KEY) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Gemini API Key সেট করা নেই।' }])
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
      const reply = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'দুঃখিত, উত্তর পাওয়া যায়নি।'
      setChatMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ AI সংযোগে সমস্যা।\n\n**Error:** ${msg}`
      }])
    }
  }

  const value = {
    uid, setUid, logout,
    // expose phone number from uid for display
    user: uid ? { phoneNumber: uid } : null,
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
