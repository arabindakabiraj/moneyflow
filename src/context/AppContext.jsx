/**
 * AppContext.jsx
 * Global state management for MoneyFlow app
 * সমগ্র অ্যাপের জন্য গ্লোবাল স্টেট ম্যানেজমেন্ট
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AppContext = createContext(null)

// ─── Config — এখানে আপনার URL ও API Key বসান ───────────────────────────────
const CONFIG = {
  // Google Apps Script Web App URL (Step 3 এ পাবেন)
  GAS_URL: import.meta.env.VITE_GAS_URL || 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE',
  // Gemini API Key (Step 5 এ পাবেন)
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
  GEMINI_MODEL: 'gemini-2.0-flash',
}

// ─── Sample/Demo data for offline use ────────────────────────────────────────
const DEMO_TRANSACTIONS = [
  { id: '1', date: new Date().toISOString().split('T')[0], description: 'Monthly Allowance', amount: 3000, type: 'credit', category: 'Others', account: 'Cash', isWant: false },
  { id: '2', date: new Date().toISOString().split('T')[0], description: 'Tiffin at college', amount: 120, type: 'debit', category: 'Tiffin', account: 'Cash', isWant: true },
  { id: '3', date: new Date().toISOString().split('T')[0], description: 'Bus fare', amount: 40, type: 'debit', category: 'Travel', account: 'Cash', isWant: false },
  { id: '4', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], description: 'Tuition fee', amount: 800, type: 'debit', category: 'Tuition', account: 'Bank', isWant: false },
  { id: '5', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], description: 'Scholarship credit', amount: 1500, type: 'credit', category: 'Others', account: 'Bank', isWant: false },
]

const HAS_GAS_URL = CONFIG.GAS_URL && CONFIG.GAS_URL !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'

export function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark')
  const [transactions, setTransactions] = useState(HAS_GAS_URL ? [] : DEMO_TRANSACTIONS)
  const [loading, setLoading] = useState(HAS_GAS_URL)
  const [error, setError] = useState(null)
  const [isDemo, setIsDemo] = useState(!HAS_GAS_URL)
  const [savingsGoal, setSavingsGoal] = useState(() => Number(localStorage.getItem('savingsGoal')) || 1000)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', content: '👋 আমি তোমার AI Financial Advisor! তোমার খরচের হিসাব দেখে পরামর্শ দিতে পারি। জিজ্ঞেস করো!' }
  ])
  const [filterDate, setFilterDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  // ─── Dark mode toggle ───────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // ─── Fetch transactions from Google Sheets ──────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    const gasUrl = CONFIG.GAS_URL
    if (!gasUrl || gasUrl === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      setIsDemo(true)
      setTransactions(DEMO_TRANSACTIONS)
      setLoading(false)
      return
    }
    setIsDemo(false)
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(gasUrl)
      if (res.data?.success && res.data?.data) {
        setTransactions(res.data.data)
      } else {
        setTransactions([])
      }
    } catch (err) {
      setError('Google Sheets connection failed. Check your GAS URL.')
      setIsDemo(true)
      setTransactions(DEMO_TRANSACTIONS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  // ─── GAS POST helper — uses no-cors fetch (CORS workaround for GAS) ─────────
  const gasPost = async (payload) => {
    await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    })
  }

  // ─── Add transaction ────────────────────────────────────────────────────────
  const addTransaction = async (tx) => {
    const newTx = { ...tx, id: Date.now().toString() }
    setTransactions(prev => [newTx, ...prev])
    if (!isDemo) {
      try {
        await gasPost({ action: 'add', ...newTx })
        // Re-fetch from DB after a short delay to sync
        setTimeout(() => fetchTransactions(), 2000)
      } catch { setError('Sync failed. Data saved locally.') }
    }
    return newTx
  }

  // ─── Update transaction ─────────────────────────────────────────────────────
  const updateTransaction = async (id, updated) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t))
    if (!isDemo) {
      try {
        await gasPost({ action: 'update', id, ...updated })
        setTimeout(() => fetchTransactions(), 2000)
      } catch { setError('Sync failed.') }
    }
  }

  // ─── Delete transaction ─────────────────────────────────────────────────────
  const deleteTransaction = async (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
    if (!isDemo) {
      try {
        await gasPost({ action: 'delete', id })
        setTimeout(() => fetchTransactions(), 2000)
      } catch { setError('Sync failed.') }
    }
  }

  // ─── Toggle Need/Want ───────────────────────────────────────────────────────
  const toggleNeedWant = (id) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, isWant: !t.isWant } : t))
  }

  // ─── Computed summary ───────────────────────────────────────────────────────
  const getSummary = (txList = transactions) => {
    const totalCredit = txList.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0)
    const totalDebit = txList.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0)
    return { totalCredit, totalDebit, balance: totalCredit - totalDebit }
  }

  // ─── Filter transactions ────────────────────────────────────────────────────
  const getFilteredTransactions = () => {
    let filtered = [...transactions]
    if (filterDate) filtered = filtered.filter(t => t.date === filterDate)
    else if (filterMonth) filtered = filtered.filter(t => t.date?.startsWith(filterMonth))
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
  }

  // ─── Ask Gemini AI ──────────────────────────────────────────────────────────
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

সংক্ষিপ্ত, বন্ধুত্বপূর্ণ এবং ব্যবহারিক পরামর্শ দাও। বাংলা ও ইংরেজি মিশিয়ে দিতে পারো। Emoji ব্যবহার করে আকর্ষণীয় করো।`

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    const apiKey = CONFIG.GEMINI_API_KEY
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Gemini API Key সেট করা নেই। `.env` ফাইলে `VITE_GEMINI_API_KEY` যোগ করুন।'
      }])
      return
    }

    try {
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            { role: 'user', parts: [{ text: userMessage }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        }
      )

      // Check for blocked responses
      if (res.data?.candidates?.[0]?.finishReason === 'SAFETY') {
        setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Safety filter triggered. দয়া করে অন্যভাবে প্রশ্নটি করুন।' }])
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
    darkMode, setDarkMode,
    transactions, loading, error, isDemo,
    savingsGoal, setSavingsGoal: (v) => { setSavingsGoal(v); localStorage.setItem('savingsGoal', v) },
    activeTab, setActiveTab,
    chatMessages, setChatMessages,
    filterDate, setFilterDate,
    filterMonth, setFilterMonth,
    addTransaction, updateTransaction, deleteTransaction, toggleNeedWant,
    getSummary, getFilteredTransactions,
    askGemini, fetchTransactions,
    CONFIG,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
