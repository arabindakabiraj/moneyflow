/**
 * AppContext.jsx — Global state with budget alerts + anomaly detection + custom categories
 * + Group Expenses, Family Mode, Local Notifications (Supabase Version)
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { supabase } from '../supabase'
import { getSession, clearSession, saveSession, logoutUser, normalizePhone } from '../authUtils'
import {
  DEFAULT_CATEGORIES,
  OPERATING_CATS, INVESTING_CATS, FINANCING_CATS,
} from '../constants'

const AppContext = createContext(null)
const OR_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
const OR_MODEL = 'google/gemini-2.5-flash'
const askGeminiCache = new Map()

// Pre-built Set lookups for O(1) cash flow classification
const INVESTING_SET = new Set(INVESTING_CATS.map(c => c.toLowerCase()))
const FINANCING_SET = new Set(FINANCING_CATS.map(c => c.toLowerCase()))

// Helper to convert ISO Timestamp string to Firestore-like Timestamp interface for compatibility
const parseTimestamp = (isoStr) => {
  if (!isoStr) return null
  const date = new Date(isoStr)
  const ms = date.getTime()
  return {
    toMillis: () => ms,
    seconds: Math.floor(ms / 1000)
  }
}

// Db to JS Mapping Functions
const mapTxFromDb = t => {
  if (!t) return null
  return {
    id: t.id,
    user_id: t.user_id,
    amount: Number(t.amount),
    category: t.category,
    description: t.description,
    date: t.date,
    type: t.type,
    account: t.account,
    isWant: !!t.is_want,
    createdAt: parseTimestamp(t.created_at)
  }
}

const mapDebtFromDb = d => {
  if (!d) return null
  return {
    id: d.id,
    user_id: d.user_id,
    name: d.name,
    amount: Number(d.amount),
    type: d.type,
    repaid: !!d.repaid,
    date: d.date,
    createdAt: parseTimestamp(d.created_at)
  }
}

const mapGoalFromDb = g => {
  if (!g) return null
  return {
    id: g.id,
    user_id: g.user_id,
    name: g.name,
    target: Number(g.target),
    current: Number(g.current) || 0,
    createdAt: parseTimestamp(g.created_at)
  }
}

const mapBillFromDb = b => {
  if (!b) return null
  return {
    id: b.id,
    user_id: b.user_id,
    dueDate: b.due_date,
    amount: Number(b.amount),
    paid: !!b.paid,
    description: b.description,
    createdAt: parseTimestamp(b.created_at)
  }
}

const mapRecurringFromDb = r => {
  if (!r) return null
  return {
    id: r.id,
    user_id: r.user_id,
    amount: Number(r.amount),
    description: r.description,
    category: r.category,
    createdAt: parseTimestamp(r.created_at)
  }
}

const mapGroupFromDb = gr => {
  if (!gr) return null
  return {
    id: gr.id,
    user_id: gr.user_id,
    name: gr.name,
    members: gr.members || [],
    expenses: gr.expenses || [],
    createdAt: parseTimestamp(gr.created_at)
  }
}

// Binary search helper to find boundary index of contiguous date match in sorted array
function findBoundary(arr, target, isStart, prefixSearch = false) {
  let low = 0
  let high = arr.length - 1
  let result = -1

  while (low <= high) {
    const mid = (low + high) >> 1
    const val = arr[mid].date || ''
    
    let match = false
    let cmp = 0
    
    if (prefixSearch) {
      const valPrefix = val.slice(0, target.length)
      if (valPrefix === target) {
        match = true
        cmp = valPrefix.localeCompare(target)
      } else {
        cmp = val.localeCompare(target)
      }
    } else {
      if (val === target) {
        match = true
      }
      cmp = val.localeCompare(target)
    }

    if (match) {
      result = mid
      if (isStart) {
        high = mid - 1
      } else {
        low = mid + 1
      }
    } else if (cmp < 0) {
      high = mid - 1
    } else {
      low = mid + 1
    }
  }
  return result
}

export function AppProvider({ children }) {
  const [uid, setUid] = useState(undefined)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') !== 'light')
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
  const [username, setUsername] = useState(() => localStorage.getItem('mf_username') || '')
  const [profilePhoto, setProfilePhoto] = useState(() => localStorage.getItem('mf_profile_photo') || null)
  const [accounts, setAccounts] = useState({ cash: 0, bank: 0, upi: 0 })
  const [debts, setDebts] = useState([])
  const [goals, setGoals] = useState([])
  const [bills, setBills] = useState([])
  const [recurringTx, setRecurringTx] = useState([])

  // ── Opening Balance + GST state ──
  const [openingBalance, setOpeningBalanceState] = useState(0)
  const [openingDate, setOpeningDateState] = useState('')
  const [gstSettings, setGstSettingsState] = useState({ gstRate: 18, registered: false })
  const [onboardingDone, setOnboardingDoneState] = useState(null) // null = loading, false = needed, true = done
  const [email, setEmailState] = useState('')
  const [phone, setPhoneState] = useState('')
  const [balanceHidden, setBalanceHiddenState] = useState(
    () => localStorage.getItem('mf_balance_hidden') === 'true'
  )
  const setBalanceHidden = useCallback((val) => {
    setBalanceHiddenState(h => {
      const nextVal = typeof val === 'function' ? val(h) : val
      localStorage.setItem('mf_balance_hidden', String(nextVal))
      return nextVal
    })
  }, [])

  // ── Group Expenses state ──
  const [groups, setGroups] = useState([])

  // ── Family Mode state ──
  const [familySettings, setFamilySettings] = useState(null)
  const [familyTransactions, setFamilyTransactions] = useState([])

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Session load & Supabase Auth sync
  useEffect(() => {
    const cachedUid = getSession()
    if (cachedUid) {
      setUid(cachedUid)
    } else {
      setUid(null)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUid(session.user.id)
        saveSession(session.user.id)
      } else {
        setUid(null)
        clearSession()
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUid(session.user.id)
        saveSession(session.user.id)
      } else {
        setUid(null)
        clearSession()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Load username + photo + email + phone from Supabase Profiles
  useEffect(() => {
    if (!uid) {
      setUsername('')
      setProfilePhoto(null)
      setEmailState('')
      setPhoneState('')
      localStorage.removeItem('mf_username')
      localStorage.removeItem('mf_profile_photo')
      return
    }

    supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) throw error
        if (data) {
          const name = data.username || ''
          const photo = data.photo_url || null
          const emailVal = data.email || ''
          const phoneVal = data.phone || ''
          setUsername(name)
          setProfilePhoto(photo)
          setEmailState(emailVal)
          setPhoneState(phoneVal)
          if (name) localStorage.setItem('mf_username', name)
          if (photo) localStorage.setItem('mf_profile_photo', photo)
          else localStorage.removeItem('mf_profile_photo')
        }
      })
      .catch(console.error)
  }, [uid])

  // Reset chat messages when logging out
  useEffect(() => {
    if (!uid) {
      setChatMessages([
        { role: 'assistant', content: '👋 I am your AI Financial Advisor! Ask me anything!' }
      ])
    }
  }, [uid])

  const clearChatHistory = async () => {
    setChatMessages([
      { role: 'assistant', content: '👋 I am your AI Financial Advisor! Ask me anything!' }
    ])
  }

  const updateUsername = async (newName) => {
    if (!uid || !newName.trim()) return
    const trimmed = newName.trim()
    setUsername(trimmed)
    localStorage.setItem('mf_username', trimmed)
    await supabase
      .from('profiles')
      .update({ username: trimmed, updated_at: new Date().toISOString() })
      .eq('id', uid)
  }

  const updateEmail = async (newEmail) => {
    if (!uid) throw new Error("No user logged in")
    const cleanEmail = newEmail.trim().toLowerCase()
    if (!cleanEmail) {
      throw new Error("Email address cannot be empty")
    }

    if (cleanEmail === email) return
    if (cleanEmail.endsWith('@moneyflow.local')) {
      throw new Error("Invalid email domain")
    }

    try {
      const { error: authErr } = await supabase.auth.updateUser({ email: cleanEmail })
      if (authErr) throw authErr
    } catch (authErr) {
      console.error("Auth update email failed:", authErr)
      throw new Error(authErr.message || "Failed to update email in authentication.")
    }

    await supabase
      .from('profiles')
      .update({
        email: cleanEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', uid)

    setEmailState(cleanEmail)
  }

  const updatePhone = async (newPhone) => {
    if (!uid) throw new Error("No user logged in")
    const cleanPhone = newPhone ? normalizePhone(newPhone) : ''
    if (cleanPhone === phone) return

    if (cleanPhone) {
      const { data: phoneSnap } = await supabase
        .from('phone_index')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (phoneSnap && phoneSnap.uid !== uid) {
        throw new Error("This phone number is already registered to another account.")
      }
    }

    let targetEmail = email
    let authEmailChanged = false
    
    if (email && email.endsWith('@moneyflow.local')) {
      if (cleanPhone) {
        const newSyntheticEmail = `phone_${cleanPhone.replace('+', '')}@moneyflow.local`
        if (newSyntheticEmail !== email) {
          targetEmail = newSyntheticEmail
          authEmailChanged = true
        }
      } else {
        throw new Error("You must add a valid email address before removing your phone number.")
      }
    }

    if (authEmailChanged) {
      try {
        const { error: authErr } = await supabase.auth.updateUser({ email: targetEmail })
        if (authErr) throw authErr
      } catch (authErr) {
        console.error("Auth update email failed for synthetic email update:", authErr)
        throw new Error(authErr.message || "Failed to update internal email reference.")
      }
    }

    await supabase
      .from('profiles')
      .update({
        phone: cleanPhone,
        email: targetEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', uid)

    setPhoneState(cleanPhone)
    if (authEmailChanged) {
      setEmailState(targetEmail)
    }
  }

  const updateProfileDetails = async (newName, newEmail, newPhone) => {
    if (!uid) throw new Error("No user logged in")

    const cleanName = newName.trim()
    const cleanEmail = newEmail.trim().toLowerCase()
    const cleanPhone = newPhone ? normalizePhone(newPhone) : ''

    if (!cleanName) throw new Error("Name cannot be empty")

    let targetEmail = cleanEmail
    if (!targetEmail) {
      if (email && email.endsWith('@moneyflow.local')) {
        if (cleanPhone) {
          targetEmail = `phone_${cleanPhone.replace('+', '')}@moneyflow.local`
        } else {
          throw new Error("You must provide either an email address or a phone number.")
        }
      } else {
        targetEmail = email
      }
    }

    if (!targetEmail) {
      throw new Error("You must provide either an email address or a phone number.")
    }

    const emailChanged = targetEmail !== email
    const oldPhone = phone
    const phoneChanged = cleanPhone !== oldPhone

    if (phoneChanged && cleanPhone) {
      const { data: phoneSnap } = await supabase
        .from('phone_index')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle()

      if (phoneSnap && phoneSnap.uid !== uid) {
        throw new Error("This phone number is already registered to another account.")
      }
    }

    if (emailChanged) {
      try {
        const { error: authErr } = await supabase.auth.updateUser({ email: targetEmail })
        if (authErr) throw authErr
      } catch (authErr) {
        console.error("Auth update email failed:", authErr)
        throw new Error(authErr.message || "Failed to update email in authentication.")
      }
    }

    const updatedProfile = {
      username: cleanName,
      email: targetEmail,
      phone: cleanPhone,
      updated_at: new Date().toISOString()
    }
    await supabase.from('profiles').update(updatedProfile).eq('id', uid)

    setUsername(cleanName)
    localStorage.setItem('mf_username', cleanName)
    setEmailState(targetEmail)
    setPhoneState(cleanPhone)
  }

  // Update profile photo — stores compressed base64 in database
  const updateProfilePhoto = async (base64) => {
    if (!uid || !base64) return
    setProfilePhoto(base64)
    localStorage.setItem('mf_profile_photo', base64)
    try {
      await supabase
        .from('profiles')
        .update({ photo_url: base64, updated_at: new Date().toISOString() })
        .eq('id', uid)
    } catch (err) {
      console.error('Photo save error:', err)
    }
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

  // Supabase — transactions real-time
  useEffect(() => {
    if (!uid) { setTx([]); return }
    setLoading(true)

    const fetchTx = () => {
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', uid)
        .order('date', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error(error)
            setError('Data load error.')
          } else {
            setTx((data || []).map(mapTxFromDb))
            setError(null)
          }
          setLoading(false)
        })
    }

    fetchTx()

    const channel = supabase
      .channel('public:transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchTx()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  // Supabase — Settings load and real-time subscription (budgets, accounts, finance, family)
  useEffect(() => {
    if (!uid) {
      setBudgets({})
      setAccounts({ cash: 0, bank: 0, upi: 0 })
      setOpeningBalanceState(0)
      setOpeningDateState('')
      setGstSettingsState({ gstRate: 18, registered: false })
      setOnboardingDoneState(null)
      setFamilySettings(null)
      return
    }

    const fetchSettings = () => {
      supabase
        .from('settings')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            console.error('Settings load err:', error)
          } else if (data) {
            setBudgets(data.budgets || {})
            setAccounts(data.accounts || { cash: 0, bank: 0, upi: 0 })
            
            const fin = data.finance || {}
            setOpeningBalanceState(Number(fin.openingBalance) || 0)
            setOpeningDateState(fin.openingDate || '')
            setGstSettingsState({ gstRate: Number(fin.gstRate) || 18, registered: !!fin.registered })
            setOnboardingDoneState(!!fin.onboardingDone)
            
            setFamilySettings(data.family || null)
          }
        })
    }

    fetchSettings()

    const channel = supabase
      .channel('public:settings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'settings',
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchSettings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  const updateAccountBalance = async (key, amount) => {
    if (!uid) return
    const updated = { ...accounts, [key]: amount }
    setAccounts(updated)
    await supabase
      .from('settings')
      .update({ accounts: updated })
      .eq('user_id', uid)
  }

  // Supabase — debts real-time
  useEffect(() => {
    if (!uid) { setDebts([]); return }
    const fetchDebts = () => {
      supabase
        .from('debts')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .then(({ data }) => setDebts((data || []).map(mapDebtFromDb)))
    }
    fetchDebts()

    const channel = supabase
      .channel('public:debts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'debts',
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchDebts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  const addDebt = async (d) => {
    if (!uid) return
    const { error } = await supabase
      .from('debts')
      .insert({
        user_id: uid,
        name: d.name,
        amount: Number(d.amount),
        type: d.type,
        repaid: false,
        date: d.date
      })
    if (error) console.error(error)
  }

  const markDebtRepaid = async (id) => {
    if (!uid) return
    const { error } = await supabase
      .from('debts')
      .update({ repaid: true })
      .eq('id', id)
    if (error) console.error(error)
  }

  const deleteDebt = async (id) => {
    if (!uid) return
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
  }

  // Supabase — Goals real-time
  useEffect(() => {
    if (!uid) { setGoals([]); return }
    const fetchGoals = () => {
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .then(({ data }) => setGoals((data || []).map(mapGoalFromDb)))
    }
    fetchGoals()

    const channel = supabase
      .channel('public:goals')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'goals',
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchGoals()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  const addGoal = async (g) => {
    if (!uid) return
    const { error } = await supabase
      .from('goals')
      .insert({
        user_id: uid,
        name: g.name,
        target: Number(g.target),
        current: Number(g.current) || 0
      })
    if (error) console.error(error)
  }

  const deleteGoal = async (id) => {
    if (!uid) return
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
  }

  // Supabase — Bills real-time
  useEffect(() => {
    if (!uid) { setBills([]); return }
    const fetchBills = () => {
      supabase
        .from('bills')
        .select('*')
        .eq('user_id', uid)
        .order('due_date', { ascending: true })
        .then(({ data }) => setBills((data || []).map(mapBillFromDb)))
    }
    fetchBills()

    const channel = supabase
      .channel('public:bills')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bills',
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchBills()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  const addBill = async (b) => {
    if (!uid) return
    const { error } = await supabase
      .from('bills')
      .insert({
        user_id: uid,
        due_date: b.dueDate,
        amount: Number(b.amount),
        paid: false,
        description: b.description
      })
    if (error) console.error(error)
  }

  const deleteBill = async (id) => {
    if (!uid) return
    const { error } = await supabase
      .from('bills')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
  }

  const markBillPaid = async (id) => {
    if (!uid) return
    const { error } = await supabase
      .from('bills')
      .update({ paid: true })
      .eq('id', id)
    if (error) console.error(error)
  }

  // Supabase — Recurring Transactions real-time
  useEffect(() => {
    if (!uid) { setRecurringTx([]); return }
    const fetchRecurring = () => {
      supabase
        .from('recurring')
        .select('*')
        .eq('user_id', uid)
        .then(({ data }) => setRecurringTx((data || []).map(mapRecurringFromDb)))
    }
    fetchRecurring()

    const channel = supabase
      .channel('public:recurring')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recurring',
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchRecurring()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  const addRecurring = async (r) => {
    if (!uid) return
    const { error } = await supabase
      .from('recurring')
      .insert({
        user_id: uid,
        amount: Number(r.amount),
        description: r.description,
        category: r.category
      })
    if (error) console.error(error)
  }

  const deleteRecurring = async (id) => {
    if (!uid) return
    const { error } = await supabase
      .from('recurring')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
  }

  const setOpeningBalance = async (amount, date) => {
    if (!uid) return
    const val = { openingBalance: Number(amount) || 0, openingDate: date || new Date().toISOString().split('T')[0] }
    setOpeningBalanceState(val.openingBalance)
    setOpeningDateState(val.openingDate)

    const { data: current } = await supabase.from('settings').select('finance').eq('user_id', uid).maybeSingle()
    const updatedFinance = { ...(current?.finance || {}), ...val }
    await supabase.from('settings').update({ finance: updatedFinance }).eq('user_id', uid)
  }

  const completeOnboarding = async () => {
    setOnboardingDoneState(true)
    if (!uid) return
    const { data: current } = await supabase.from('settings').select('finance').eq('user_id', uid).maybeSingle()
    const updatedFinance = { ...(current?.finance || {}), onboardingDone: true }
    await supabase.from('settings').update({ finance: updatedFinance }).eq('user_id', uid)
  }

  const updateGstSettings = async (settings) => {
    if (!uid) return
    const updated = { ...gstSettings, ...settings }
    setGstSettingsState(updated)
    const { data: current } = await supabase.from('settings').select('finance').eq('user_id', uid).maybeSingle()
    const updatedFinance = { ...(current?.finance || {}), gstRate: updated.gstRate, registered: updated.registered }
    await supabase.from('settings').update({ finance: updatedFinance }).eq('user_id', uid)
  }

  // Supabase — Groups real-time
  useEffect(() => {
    if (!uid) { setGroups([]); return }
    const fetchGroups = () => {
      supabase
        .from('groups')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .then(({ data }) => setGroups((data || []).map(mapGroupFromDb)))
    }
    fetchGroups()

    const channel = supabase
      .channel('public:groups')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'groups',
        filter: `user_id=eq.${uid}`
      }, () => {
        fetchGroups()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid])

  const addGroup = async (g) => {
    if (!uid) return
    const { error } = await supabase
      .from('groups')
      .insert({
        user_id: uid,
        name: g.name,
        members: g.members || [],
        expenses: []
      })
    if (error) console.error(error)
  }

  const deleteGroup = async (id) => {
    if (!uid) return
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)
    if (error) console.error(error)
  }

  const updateGroup = async (id, data) => {
    if (!uid) return
    const { error } = await supabase
      .from('groups')
      .update(data)
      .eq('id', id)
    if (error) console.error(error)
  }

  const addGroupExpense = async (groupId, expense) => {
    if (!uid) return
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    const expenses = [...(group.expenses || []), expense]
    const { error } = await supabase
      .from('groups')
      .update({ expenses })
      .eq('id', groupId)
    if (error) console.error(error)
  }

  const deleteGroupExpense = async (groupId, expenseIndex) => {
    if (!uid) return
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    const expenses = group.expenses.filter((_, i) => i !== expenseIndex)
    const { error } = await supabase
      .from('groups')
      .update({ expenses })
      .eq('id', groupId)
    if (error) console.error(error)
  }

  // Calculate minimum transfers for settlement (greedy algorithm)
  const getSettlements = (groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group || !group.expenses?.length) return []

    // Calculate net balance for each person
    const balances = {}
    group.members.forEach(m => { balances[m] = 0 })

    group.expenses.forEach(exp => {
      balances[exp.paidBy] = (balances[exp.paidBy] || 0) + Number(exp.amount)
      Object.entries(exp.splits || {}).forEach(([person, amt]) => {
        balances[person] = (balances[person] || 0) - Number(amt)
      })
    })

    const creditors = []
    const debtors = []
    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0.01) creditors.push({ person, amount: balance })
      else if (balance < -0.01) debtors.push({ person, amount: -balance })
    })

    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)

    const settlements = []
    let i = 0, j = 0
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]
      const creditor = creditors[j]
      const amount = Math.min(debtor.amount, creditor.amount)

      if (amount > 0.01) {
        settlements.push({
          from: debtor.person,
          to: creditor.person,
          amount: Math.round(amount)
        })
      }

      debtor.amount -= amount
      creditor.amount -= amount

      if (debtor.amount < 0.01) i++
      if (creditor.amount < 0.01) j++
    }

    return settlements
  }

  // Real-time handshake for invite code generator
  useEffect(() => {
    if (!uid || !familySettings?.inviteCode || familySettings?.linkedUid) return

    const checkInviteCode = () => {
      supabase
        .from('family_links')
        .select('*')
        .eq('code', familySettings.inviteCode)
        .maybeSingle()
        .then(async ({ data, error }) => {
          if (error) {
            console.error('Invite code query err:', error)
          } else if (data && data.linked_uid) {
            console.log('[Family] Partner entered invite code. Completing link...')
            const updatedFamily = {
              ...familySettings,
              linkedUid: data.linked_uid,
              linkedName: data.linked_name || 'Partner',
              inviteCode: '' // Clear code
            }
            await supabase
              .from('settings')
              .update({ family: updatedFamily })
              .eq('user_id', uid)

            try {
              await supabase.from('family_links').delete().eq('code', familySettings.inviteCode)
            } catch (e) {
              console.warn('[Family] Failed to delete invite code doc:', e)
            }
          }
        })
    }

    checkInviteCode()

    const channel = supabase
      .channel('public:family_links')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'family_links',
        filter: `code=eq.${familySettings.inviteCode}`
      }, () => {
        checkInviteCode()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [uid, familySettings?.inviteCode, familySettings?.linkedUid])

  // Listen to partner's transactions when linked
  useEffect(() => {
    if (!familySettings?.linkedUid) {
      setFamilyTransactions([])
      return
    }

    const fetchPartnerTx = () => {
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', familySettings.linkedUid)
        .order('date', { ascending: false })
        .then(({ data, error }) => {
          if (error) {
            console.error('Family transactions err:', error)
            if (error.message.includes('permission') || error.code === '42501') {
              console.log('[Family] Partner unlinked us or permission denied. Cleaning up local link...')
              unlinkPartner()
            }
          } else {
            setFamilyTransactions((data || []).map(t => ({ ...mapTxFromDb(t), isPartner: true })))
          }
        })
    }

    fetchPartnerTx()

    const channel = supabase
      .channel('public:partner_transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${familySettings.linkedUid}`
      }, () => {
        fetchPartnerTx()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familySettings?.linkedUid])

  const generateInviteCode = async () => {
    if (!uid) return null
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error: linkErr } = await supabase
      .from('family_links')
      .insert({
        code,
        uid,
        name: username || 'Partner'
      })
    if (linkErr) {
      console.error('Invite code link insert err:', linkErr)
      return null
    }

    const updatedFamily = {
      ...(familySettings || {}),
      inviteCode: code,
      linkedUid: null,
      linkedName: null
    }
    await supabase
      .from('settings')
      .update({ family: updatedFamily })
      .eq('user_id', uid)

    return code
  }

  const linkPartner = async (code) => {
    if (!uid || !code) return { success: false, error: 'Invalid code' }

    try {
      const { data: linkData, error: linkErr } = await supabase
        .from('family_links')
        .select('*')
        .eq('code', code.toUpperCase())
        .maybeSingle()

      if (linkErr) throw linkErr
      if (!linkData) {
        return { success: false, error: 'Invalid invite code' }
      }

      if (linkData.uid === uid) {
        return { success: false, error: 'Cannot link to yourself' }
      }

      const { error: updateLinkErr } = await supabase
        .from('family_links')
        .update({
          linked_uid: uid,
          linked_name: username || 'Partner'
        })
        .eq('code', code.toUpperCase())

      if (updateLinkErr) throw updateLinkErr

      const updatedFamily = {
        ...(familySettings || {}),
        linkedUid: linkData.uid,
        linkedName: linkData.name,
        inviteCode: '' 
      }
      await supabase
        .from('settings')
        .update({ family: updatedFamily })
        .eq('user_id', uid)

      return { success: true }
    } catch (err) {
      console.error('Link partner error:', err)
      return { success: false, error: 'Failed to link' }
    }
  }

  const unlinkPartner = async () => {
    if (!uid) return
    const updatedFamily = {
      ...(familySettings || {}),
      linkedUid: null,
      linkedName: null,
      inviteCode: ''
    }
    await supabase
      .from('settings')
      .update({ family: updatedFamily })
      .eq('user_id', uid)
  }

  // Single-pass O(n) family summary instead of 8 separate filter+reduce passes
  const getFamilySummary = useCallback(() => {
    let myCredit = 0, myDebit = 0, partnerCredit = 0, partnerDebit = 0

    for (const t of transactions) {
      const amt = Number(t.amount)
      if (t.type === 'credit') myCredit += amt
      else myDebit += amt
    }
    for (const t of familyTransactions) {
      const amt = Number(t.amount)
      if (t.type === 'credit') partnerCredit += amt
      else partnerDebit += amt
    }

    return {
      combined: {
        income: myCredit + partnerCredit,
        expense: myDebit + partnerDebit,
        balance: (myCredit + partnerCredit) - (myDebit + partnerDebit),
      },
      me: { income: myCredit, expense: myDebit },
      partner: { income: partnerCredit, expense: partnerDebit },
    }
  }, [transactions, familyTransactions])

  const addTransaction = async (tx) => {
    if (!uid) return
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: uid,
          amount: Number(tx.amount),
          category: tx.category,
          description: tx.description || '',
          date: tx.date,
          type: tx.type,
          account: tx.account || 'Cash',
          is_want: !!tx.isWant
        })
      if (error) throw error
    } catch (e) {
      console.error(e)
      setError('Save error.')
    }
  }

  const updateTransaction = async (id, updated) => {
    if (!uid) return
    try {
      const dbUpdates = {}
      if (updated.amount !== undefined) dbUpdates.amount = Number(updated.amount)
      if (updated.category !== undefined) dbUpdates.category = updated.category
      if (updated.description !== undefined) dbUpdates.description = updated.description
      if (updated.date !== undefined) dbUpdates.date = updated.date
      if (updated.type !== undefined) dbUpdates.type = updated.type
      if (updated.account !== undefined) dbUpdates.account = updated.account
      if (updated.isWant !== undefined) dbUpdates.is_want = !!updated.isWant

      const { error } = await supabase
        .from('transactions')
        .update(dbUpdates)
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error(e)
    }
  }

  const deleteTransaction = async (id) => {
    if (!uid) return
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
      if (error) throw error
    } catch (e) {
      console.error(e)
    }
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
    await supabase
      .from('settings')
      .update({ budgets: newBudgets })
      .eq('user_id', uid)
  }

  const removeBudget = async (category) => {
    if (!uid) return
    const nb = { ...budgets }
    delete nb[category]
    setBudgets(nb)
    await supabase
      .from('settings')
      .update({ budgets: nb })
      .eq('user_id', uid)
  }

  // Budget alerts — categories over limit this month (memoized)
  const budgetAlertsCache = useMemo(() => {
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
  }, [transactions, budgets])
  const getBudgetAlerts = useCallback(() => budgetAlertsCache, [budgetAlertsCache])

  // Anomaly detection — transactions > 2x category average (memoized)
  const anomaliesCache = useMemo(() => {
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
  }, [transactions])
  const getAnomalies = useCallback(() => anomaliesCache, [anomaliesCache])

  const logout = async () => {
    await logoutUser()
    setUid(null)
    setTx([])
    setBudgets({})
  }
  const setSavingsGoal = (v) => { setSavingsGoalState(v); localStorage.setItem('savingsGoal', v) }

  const getSummary = useCallback((txList = transactions) => {
    const totalCredit = txList.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0)
    const totalDebit = txList.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0)
    return { totalCredit, totalDebit, balance: totalCredit - totalDebit }
  }, [transactions])

  // ── True Balance (Opening Balance + all transactions) ──
  const getTrueBalance = () => {
    const { totalCredit, totalDebit } = getSummary()
    return Math.max(0, openingBalance + totalCredit - totalDebit)
  }

  // ── Net Worth History — month-by-month cumulative balance (memoized) ──
  const netWorthHistoryCache = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
    if (!sorted.length) return []

    const monthMap = {}
    sorted.forEach(t => {
      const month = t.date?.slice(0, 7)
      if (!month) return
      if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 }
      if (t.type === 'credit') monthMap[month].income += Number(t.amount)
      else monthMap[month].expense += Number(t.amount)
    })

    const months = Object.keys(monthMap).sort()
    let running = openingBalance
    return months.map(m => {
      running += (monthMap[m].income - monthMap[m].expense)
      return { month: m, netWorth: Math.round(running) }
    })
  }, [transactions, openingBalance])
  const getNetWorthHistory = useCallback(() => netWorthHistoryCache, [netWorthHistoryCache])

  // ── Cash Flow Statement — Operating / Investing / Financing ──
  const getCashFlowData = useCallback((month = '') => {
    const filtered = month ? transactions.filter(t => t.date?.startsWith(month)) : transactions
    const result = {
      operating: { inflow: 0, outflow: 0, items: [] },
      investing: { inflow: 0, outflow: 0, items: [] },
      financing: { inflow: 0, outflow: 0, items: [] },
    }
    for (const t of filtered) {
      const amt = Number(t.amount)
      const catLower = (t.category || 'Others').toLowerCase()
      const section = INVESTING_SET.has(catLower) ? 'investing'
        : FINANCING_SET.has(catLower) ? 'financing'
        : 'operating'
      if (t.type === 'credit') {
        result[section].inflow += amt
        result[section].items.push({ ...t, flowType: 'inflow' })
      } else {
        result[section].outflow += amt
        result[section].items.push({ ...t, flowType: 'outflow' })
      }
    }
    result.operating.net = result.operating.inflow - result.operating.outflow
    result.investing.net = result.investing.inflow - result.investing.outflow
    result.financing.net = result.financing.inflow - result.financing.outflow
    result.totalNet = result.operating.net + result.investing.net + result.financing.net
    return result
  }, [transactions])

  // ── P&L Statement ──
  const getPLStatement = useCallback((month = '') => {
    const target = month || new Date().toISOString().slice(0, 7)
    const filtered = transactions.filter(t => t.date?.startsWith(target))
    
    let income = 0
    let expense = 0
    const catBreakdown = {}
    const incomeBreakdown = {}

    for (const t of filtered) {
      const amt = Number(t.amount)
      if (t.type === 'credit') {
        income += amt
        const cat = t.category || 'Income'
        incomeBreakdown[cat] = (incomeBreakdown[cat] || 0) + amt
      } else {
        expense += amt
        const cat = t.category || 'Others'
        catBreakdown[cat] = (catBreakdown[cat] || 0) + amt
      }
    }

    const grossSavings = income - expense
    const savingsRate = income > 0 ? Math.round((grossSavings / income) * 100) : 0
    return { month: target, income, expense, grossSavings, savingsRate, catBreakdown, incomeBreakdown }
  }, [transactions])

  // ── Double-Entry Ledger ──
  const getLedgerEntries = useCallback(() => {
    const sorted = [...transactions].sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date)
      if (dateDiff !== 0) return dateDiff
      const aT = a.createdAt?.toMillis?.() || (a.createdAt?.seconds || 0) * 1000
      const bT = b.createdAt?.toMillis?.() || (b.createdAt?.seconds || 0) * 1000
      return aT - bT
    })
    let balance = openingBalance
    const entries = []
    if (openingBalance > 0 && openingDate) {
      entries.push({
        id: 'opening',
        date: openingDate,
        description: 'Opening Balance',
        category: '—',
        debit: 0,
        credit: openingBalance,
        balance: openingBalance,
        isOpening: true,
      })
    }
    sorted.forEach(t => {
      const amt = Number(t.amount)
      if (t.type === 'credit') {
        balance += amt
        entries.push({ ...t, debit: 0, credit: amt, balance })
      } else {
        balance -= amt
        entries.push({ ...t, debit: amt, credit: 0, balance })
      }
    })
    return entries
  }, [transactions, openingBalance, openingDate])

  // ── ML Spending Prediction ──
  const mlPredictionsCache = useMemo(() => {
    const monthsData = {}
    transactions.filter(t => t.type === 'debit').forEach(t => {
      const m = t.date?.slice(0, 7)
      if (!m) return
      if (!monthsData[m]) monthsData[m] = {}
      monthsData[m][t.category] = (monthsData[m][t.category] || 0) + Number(t.amount)
    })
    const sortedMonths = Object.keys(monthsData).sort().slice(-3) // last 3 months
    if (!sortedMonths.length) return []

    const allCats = [...new Set(sortedMonths.flatMap(m => Object.keys(monthsData[m])))]
    return allCats.map(cat => {
      const weights = [1, 2, 3]
      let weightedSum = 0, totalWeight = 0
      sortedMonths.forEach((m, i) => {
        const w = weights[i] || 1
        weightedSum += (monthsData[m][cat] || 0) * w
        totalWeight += w
      })
      const predicted = Math.round(weightedSum / totalWeight)
      const lastMonth = monthsData[sortedMonths[sortedMonths.length - 1]][cat] || 0
      return { category: cat, predicted, lastMonth, change: predicted - lastMonth }
    }).sort((a, b) => b.predicted - a.predicted)
  }, [transactions])
  const getMLPredictions = useCallback(() => mlPredictionsCache, [mlPredictionsCache])

  const getFilteredTransactions = useCallback(() => {
    if (!filterDate && !filterMonth) return transactions

    let sliced = []
    if (filterDate) {
      const start = findBoundary(transactions, filterDate, true, false)
      if (start !== -1) {
        const end = findBoundary(transactions, filterDate, false, false)
        sliced = transactions.slice(start, end + 1)
      }
    } else if (filterMonth) {
      const start = findBoundary(transactions, filterMonth, true, true)
      if (start !== -1) {
        const end = findBoundary(transactions, filterMonth, false, true)
        sliced = transactions.slice(start, end + 1)
      }
    }

    return sliced.sort((a, b) => {
      const aT = a.createdAt?.toMillis?.() || (a.createdAt?.seconds ?? 0) * 1000
      const bT = b.createdAt?.toMillis?.() || (b.createdAt?.seconds ?? 0) * 1000
      return bT - aT
    })
  }, [transactions, filterDate, filterMonth])

  const askGemini = async (userMessage) => {
    const summary = getSummary()
    const anomalies = getAnomalies()
    const alerts = getBudgetAlerts()
    const catBreakdown = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc }, {})

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

    const catMonthly = {}
    transactions.filter(t => t.type === 'debit').forEach(t => {
      const m = t.date?.slice(0, 7)
      if (!m) return
      if (!catMonthly[m]) catMonthly[m] = {}
      catMonthly[m][t.category] = (catMonthly[m][t.category] || 0) + Number(t.amount)
    })

    const recentTx = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20)
      .map(t => `${t.date} ${t.type === 'credit' ? '+' : '-'}₹${t.amount} ${t.description} [${t.category}]`)
      .join('\n')

    const accountInfo = `Cash: ₹${accounts.cash || 0}, Bank: ₹${accounts.bank || 0}, UPI: ₹${accounts.upi || 0}`

    const activeDebts = debts.filter(d => !d.repaid)
    const debtInfo = activeDebts.length > 0
      ? activeDebts.map(d => `${d.name || d.person || 'Someone'}: ₹${d.amount} (${d.type})`).join(', ')
      : 'No active debts'

    // ── Cache Lookup (0ms latency for repeating messages under the same financial state) ──
    const stateKey = `${uid || 'guest'}_${userMessage.trim().toLowerCase()}_${summary.balance}_${transactions.length}_${debts.length}`
    if (askGeminiCache.has(stateKey)) {
      const cachedReply = askGeminiCache.get(stateKey)
      setChatMessages(prev => [...prev, { role: 'assistant', content: cachedReply }])
      return cachedReply
    }

    // ── Local Rule-Based Fast Response Engine (0ms latency for basic state queries) ──
    const lowerMsg = userMessage.toLowerCase().trim()

    // 1. Balance Queries
    if (
      /balance|bal|taka|paisa|koto acche|rem|account|hisab|amount|rupee/i.test(lowerMsg) &&
      !/spend|add|buy|goal|debt|loan/i.test(lowerMsg)
    ) {
      const balReply = `💵 *Your Current Balance Summary*:\n\n• **Total Balance**: ₹${summary.balance}\n• **Cash Wallet**: ₹${accounts.cash || 0}\n• **Bank Account**: ₹${accounts.bank || 0}\n• **UPI Wallet**: ₹${accounts.upi || 0}\n\nHope this helps! Let me know if you need saving advice.`
      setChatMessages(prev => [...prev, { role: 'assistant', content: balReply }])
      return balReply
    }

    // 2. Goal Creation Queries (e.g. "add goal Bike with target 80000", "create goal laptop 50000")
    const goalRegex = /(?:add|create|new|set)\s+goal\s+([a-zA-Z0-9\s]+?)(?:\s+(?:with|of|target|price)\s+(\d+))?/i
    const goalMatchLocal = lowerMsg.match(goalRegex) || lowerMsg.match(/([a-zA-Z0-9\s]+?)\s+goal\s+(?:create|add)(?:\s+(?:with|of|target|price)\s+(\d+))?/i)
    if (goalMatchLocal) {
      const name = (goalMatchLocal[1] || 'Savings Goal').trim().replace(/^(for|a|an)\s+/i, '')
      const targetVal = Number(goalMatchLocal[2] || 50000)
      if (name && targetVal > 0) {
        await addGoal({ name, target: targetVal, current: 0 })
        window.dispatchEvent(new CustomEvent('ai-goal-created', { detail: { name, target: targetVal } }))
        
        const goalReply = `🎯 **Savings Goal Created Automatically!**\n\nI have successfully added a new savings goal for you:\n• **Goal**: "${name}"\n• **Target Amount**: ₹${targetVal.toLocaleString()}\n\nYou can track this goal directly on your dashboard. Good luck with your savings!`
        setChatMessages(prev => [...prev, { role: 'assistant', content: goalReply }])
        return goalReply
      }
    }

    // 3. Debt Summary Query
    if (/debt|borrow|lent|loan|dhar|baki|dena|lena/i.test(lowerMsg) && !/add|create|repay|pay/i.test(lowerMsg)) {
      let debtReply = `💸 *Your Debt Summary*:\n\n`
      if (activeDebts.length === 0) {
        debtReply += `• You have no active debts! All set.`
      } else {
        const borrowed = activeDebts.filter(d => d.type === 'borrowed').reduce((acc, d) => acc + d.amount, 0)
        const lent = activeDebts.filter(d => d.type === 'lent').reduce((acc, d) => acc + d.amount, 0)
        debtReply += `• **Total You Owe (Borrowed)**: ₹${borrowed}\n• **Total Owed to You (Lent)**: ₹${lent}\n\n*Details*:\n`
        activeDebts.forEach(d => {
          debtReply += `• ${d.name}: ₹${d.amount} (${d.type === 'borrowed' ? 'You owe them' : 'They owe you'})\n`
        })
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: debtReply }])
      return debtReply
    }

    // 4. Budget Queries
    if (/budget|limit|alert/i.test(lowerMsg) && !/set|change|add|update/i.test(lowerMsg)) {
      let budgetReply = `🎯 *Your Active Budgets*:\n\n`
      const categories = Object.keys(budgets)
      if (categories.length === 0) {
        budgetReply += `• No budgets configured yet. You can set them in Settings!`
      } else {
        categories.forEach(cat => {
          const limit = budgets[cat]
          const spent = catBreakdown[cat] || 0
          const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0
          budgetReply += `• **${cat}**: ₹${spent} / ₹${limit} (${pct}% used)\n`
        })
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: budgetReply }])
      return budgetReply
    }

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
- CRITICAL: Keep your response extremely brief, short, and to-the-point (under 60 words / 2-3 sentences max). Never write long paragraphs or explanations. Be highly direct and immediate.
- Respond in the SAME LANGUAGE as the user's message. If they write in English, reply in English. If Bengali, reply in Bengali. If mixed, reply mixed.
- Be concise, friendly, and actionable.
- Use emojis for visual clarity.
- When asked to compare months, use the monthly trend data above.
- When asked about specific categories, use category-wise and monthly data.
- For budget advice, consider actual spending vs budget limits.
- Give specific numbers, not vague advice.
- If user asks to show data as a table/chart, format with clear structure.
- CRITICAL: If the user talks about a new savings goal or purchase plan (e.g. buying a bike, laptop, car, mobile, trip, etc.), formulate a savings plan. Tell the user you can set up this goal automatically (e.g. "I can add this to your Savings Goals for you!") and you MUST append a command block EXACTLY like this at the end of your response:
  [AUTO_GOAL:{"name":"Bike Savings","target":80000}]
  (The JSON payload must be single-line, minified, and contain valid "name" and "target". Ensure the target matches what the user specified or is a reasonable estimate based on the product.)`

    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    if (!OR_API_KEY) {
      const errText = '⚠️ OpenRouter API Key is not set. Add VITE_OPENROUTER_API_KEY to your .env file.'
      setChatMessages(prev => [...prev, { role: 'assistant', content: errText }])
      return errText
    }

    try {
      const res = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OR_MODEL,
          messages: [
            { role: 'system', content: systemInstruction },
            ...chatMessages.slice(-4),
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 300,
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

      // Auto-create goal if command tag is found
      const goalMatch = reply.match(/\[AUTO_GOAL:\s*(\{[\s\S]*?\})\s*\]/)
      if (goalMatch) {
        try {
          const goalData = JSON.parse(goalMatch[1])
          if (goalData.name && goalData.target) {
            await addGoal({
              name: goalData.name,
              target: Number(goalData.target),
              current: 0
            })
            window.dispatchEvent(new CustomEvent('ai-goal-created', { detail: goalData }))
          }
        } catch (e) {
          console.error('Failed to auto-create goal:', e)
        }
      }

      // Clean the reply from command tags
      const cleanReply = reply.replace(/\[AUTO_GOAL:[\s\S]*?\]/g, '').trim()

      // Save to cache map
      askGeminiCache.set(stateKey, cleanReply)

      setChatMessages(prev => [...prev, { role: 'assistant', content: cleanReply }])

      return cleanReply
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message
      const errReply = `❌ AI error: ${msg}`
      setChatMessages(prev => [...prev, { role: 'assistant', content: errReply }])
      return errReply
    }
  }

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
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
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
    user: uid ? { uid } : null,
    username, updateUsername,
    email, updateEmail,
    phone, updatePhone,
    updateProfileDetails,
    profilePhoto, updateProfilePhoto,
    darkMode, setDarkMode,
    balanceHidden, setBalanceHidden,
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
    groups, addGroup, updateGroup, deleteGroup, addGroupExpense, deleteGroupExpense, getSettlements,
    familySettings, familyTransactions, generateInviteCode, linkPartner, unlinkPartner, getFamilySummary,
    getBudgetAlerts, getAnomalies,
    sendBudgetNotification, requestNotificationPermission,
    addTransaction, updateTransaction, deleteTransaction, toggleNeedWant,
    getSummary, getFilteredTransactions,
    askGemini, askGeminiRaw, parseNLPTransaction,
    clearChatHistory,
    openingBalance, openingDate, setOpeningBalance,
    gstSettings, updateGstSettings,
    onboardingDone, completeOnboarding,
    getTrueBalance, getNetWorthHistory,
    getCashFlowData, getPLStatement,
    getLedgerEntries, getMLPredictions,
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
