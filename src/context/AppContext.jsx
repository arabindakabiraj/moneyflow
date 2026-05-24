/**
 * AppContext.jsx — Global state with budget alerts + anomaly detection + custom categories
 * + Group Expenses, Family Mode, Local Notifications
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { onAuthStateChanged, updateEmail as authUpdateEmail } from 'firebase/auth'
import { getSession, clearSession, saveSession, logoutUser, normalizePhone } from '../authUtils'
import {
  DEFAULT_CATEGORIES,
  OPERATING_CATS, INVESTING_CATS, FINANCING_CATS,
} from '../constants'

const AppContext = createContext(null)
const OR_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || ''
const OR_MODEL = 'google/gemini-2.5-flash'

// Pre-built Set lookups for O(1) cash flow classification
const INVESTING_SET = new Set(INVESTING_CATS.map(c => c.toLowerCase()))
const FINANCING_SET = new Set(FINANCING_CATS.map(c => c.toLowerCase()))

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

  // Session load & Firebase Auth sync
  useEffect(() => {
    // 1. Initial quick load from local cache
    const cachedUid = getSession()
    if (cachedUid) {
      setUid(cachedUid)
    } else {
      setUid(null)
    }

    // 2. Listen to real-time auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid)
        saveSession(user.uid)
      } else {
        setUid(null)
        clearSession()
      }
    })
    return unsubscribe
  }, [])

  // Passwordless Email sign-in checks are removed in favor of FastAPI OTP verification.


  // Load username + photo + email + phone from Firestore when uid changes (localStorage is primary cache)
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
    getDoc(doc(db, 'users', uid, 'profile', 'info'))
      .then(snap => {
        if (snap.exists()) {
          const name = snap.data().username || ''
          const photo = snap.data().photoURL || null
          const emailVal = snap.data().email || ''
          const phoneVal = snap.data().phone || ''
          setUsername(name)
          setProfilePhoto(photo)
          setEmailState(emailVal)
          setPhoneState(phoneVal)
          // Cache locally for instant load next time
          if (name) localStorage.setItem('mf_username', name)
          if (photo) localStorage.setItem('mf_profile_photo', photo)
          else localStorage.removeItem('mf_profile_photo')
        }
      })
      .catch(console.error)
  }, [uid])

  const updateUsername = async (newName) => {
    if (!uid || !newName.trim()) return
    const trimmed = newName.trim()
    setUsername(trimmed)
    localStorage.setItem('mf_username', trimmed)
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), { username: trimmed }, { merge: true })
  }

  const updateEmail = async (newEmail) => {
    if (!uid) throw new Error("No user logged in")
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("Authentication state is invalid")

    const cleanEmail = newEmail.trim().toLowerCase()
    if (!cleanEmail) {
      throw new Error("Email address cannot be empty")
    }

    if (cleanEmail === email) return

    if (cleanEmail.endsWith('@moneyflow.local')) {
      throw new Error("Invalid email domain")
    }

    try {
      await authUpdateEmail(currentUser, cleanEmail)
    } catch (authErr) {
      console.error("Auth update email failed:", authErr)
      if (authErr.code === 'auth/requires-recent-login') {
        throw new Error("For security, you must log out and log back in before changing your email.")
      }
      if (authErr.code === 'auth/email-already-in-use') {
        throw new Error("This email is already in use by another account.")
      }
      throw new Error(authErr.message || "Failed to update email in authentication.")
    }

    if (phone) {
      await setDoc(doc(db, 'phoneIndex', phone), {
        uid,
        email: cleanEmail,
        createdAt: serverTimestamp()
      }, { merge: true })
    }

    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      email: cleanEmail,
      updatedAt: serverTimestamp()
    }, { merge: true })

    setEmailState(cleanEmail)
  }

  const updatePhone = async (newPhone) => {
    if (!uid) throw new Error("No user logged in")
    const cleanPhone = newPhone ? normalizePhone(newPhone) : ''
    if (cleanPhone === phone) return

    if (cleanPhone) {
      const phoneSnap = await getDoc(doc(db, 'phoneIndex', cleanPhone))
      if (phoneSnap.exists() && phoneSnap.data().uid !== uid) {
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
      const currentUser = auth.currentUser
      if (!currentUser) throw new Error("Authentication state is invalid")
      try {
        await authUpdateEmail(currentUser, targetEmail)
      } catch (authErr) {
        console.error("Auth update email failed for synthetic email update:", authErr)
        if (authErr.code === 'auth/requires-recent-login') {
          throw new Error("For security, you must log out and log back in before changing your phone number.")
        }
        throw new Error(authErr.message || "Failed to update internal email reference.")
      }
    }

    const oldPhone = phone
    if (oldPhone) {
      try {
        await deleteDoc(doc(db, 'phoneIndex', oldPhone))
      } catch (e) {
        console.warn("Failed to delete old phone index:", e)
      }
    }

    if (cleanPhone) {
      await setDoc(doc(db, 'phoneIndex', cleanPhone), {
        uid,
        email: targetEmail,
        createdAt: serverTimestamp()
      })
    }

    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      phone: cleanPhone,
      email: targetEmail,
      updatedAt: serverTimestamp()
    }, { merge: true })

    setPhoneState(cleanPhone)
    if (authEmailChanged) {
      setEmailState(targetEmail)
    }
  }

  const updateProfileDetails = async (newName, newEmail, newPhone) => {
    if (!uid) throw new Error("No user logged in")
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error("Authentication state is invalid")

    const cleanName = newName.trim()
    const cleanEmail = newEmail.trim().toLowerCase()
    const cleanPhone = newPhone ? normalizePhone(newPhone) : ''

    if (!cleanName) throw new Error("Name cannot be empty")

    // Determine the email to set
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
      const phoneSnap = await getDoc(doc(db, 'phoneIndex', cleanPhone))
      if (phoneSnap.exists() && phoneSnap.data().uid !== uid) {
        throw new Error("This phone number is already registered to another account.")
      }
    }

    if (emailChanged) {
      try {
        await authUpdateEmail(currentUser, targetEmail)
      } catch (authErr) {
        console.error("Auth update email failed:", authErr)
        if (authErr.code === 'auth/requires-recent-login') {
          throw new Error("For security, you must log out and log back in before changing your email.")
        }
        if (authErr.code === 'auth/email-already-in-use') {
          throw new Error("This email is already in use by another account.")
        }
        throw new Error(authErr.message || "Failed to update email in authentication.")
      }
    }

    if (phoneChanged || emailChanged) {
      if (oldPhone) {
        try {
          await deleteDoc(doc(db, 'phoneIndex', oldPhone))
        } catch (e) {
          console.warn("Failed to delete old phone index:", e)
        }
      }

      if (cleanPhone) {
        await setDoc(doc(db, 'phoneIndex', cleanPhone), {
          uid,
          email: targetEmail,
          createdAt: serverTimestamp()
        })
      }
    }

    const updatedProfile = {
      username: cleanName,
      email: targetEmail,
      phone: cleanPhone,
      updatedAt: serverTimestamp()
    }
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), updatedProfile, { merge: true })

    setUsername(cleanName)
    localStorage.setItem('mf_username', cleanName)
    setEmailState(targetEmail)
    setPhoneState(cleanPhone)
  }


  // Update profile photo — stores compressed base64 in Firestore + localStorage cache
  const updateProfilePhoto = async (base64) => {
    if (!uid || !base64) return
    // Immediately show in UI + cache locally
    setProfilePhoto(base64)
    localStorage.setItem('mf_profile_photo', base64)
    try {
      await setDoc(doc(db, 'users', uid, 'profile', 'info'), { photoURL: base64 }, { merge: true })
    } catch (err) {
      console.error('Photo save error:', err)
      // localStorage still has it, so it persists locally even if Firestore fails
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

  // Firestore — Opening Balance + GST settings real-time
  useEffect(() => {
    if (!uid) {
      setOpeningBalanceState(0)
      setOpeningDateState('')
      setGstSettingsState({ gstRate: 18, registered: false })
      setOnboardingDoneState(null)
      return
    }
    const unsub = onSnapshot(
      doc(db, 'users', uid, 'settings', 'finance'),
      snap => {
        if (snap.exists()) {
          const d = snap.data()
          setOpeningBalanceState(Number(d.openingBalance) || 0)
          setOpeningDateState(d.openingDate || '')
          setGstSettingsState({ gstRate: Number(d.gstRate) || 18, registered: !!d.registered })
          setOnboardingDoneState(!!d.onboardingDone)
        } else {
          setOnboardingDoneState(false)
        }
      },
      err => console.error('Finance settings err:', err)
    )
    return unsub
  }, [uid])

  const setOpeningBalance = async (amount, date) => {
    if (!uid) return
    const val = { openingBalance: Number(amount) || 0, openingDate: date || new Date().toISOString().split('T')[0] }
    setOpeningBalanceState(val.openingBalance)
    setOpeningDateState(val.openingDate)
    await setDoc(doc(db, 'users', uid, 'settings', 'finance'), val, { merge: true })
  }

  const completeOnboarding = async () => {
    setOnboardingDoneState(true)
    if (!uid) return
    await setDoc(doc(db, 'users', uid, 'settings', 'finance'), { onboardingDone: true }, { merge: true })
  }

  const updateGstSettings = async (settings) => {
    if (!uid) return
    const updated = { ...gstSettings, ...settings }
    setGstSettingsState(updated)
    await setDoc(doc(db, 'users', uid, 'settings', 'finance'), { gstRate: updated.gstRate, registered: updated.registered }, { merge: true })
  }

  // Firestore — Groups real-time
  useEffect(() => {
    if (!uid) { setGroups([]); return }
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'groups'),
      snap => setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      err => console.error('Groups err:', err)
    )
    return unsub
  }, [uid])

  const addGroup = async (g) => {
    if (!uid) return
    await addDoc(collection(db, 'users', uid, 'groups'), { ...g, expenses: [], createdAt: serverTimestamp() })
  }

  const deleteGroup = async (id) => {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'groups', id))
  }

  const updateGroup = async (id, data) => {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'groups', id), data)
  }

  const addGroupExpense = async (groupId, expense) => {
    if (!uid) return
    const groupDoc = doc(db, 'users', uid, 'groups', groupId)
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    const expenses = [...(group.expenses || []), expense]
    await updateDoc(groupDoc, { expenses })
  }

  const deleteGroupExpense = async (groupId, expenseIndex) => {
    if (!uid) return
    const group = groups.find(g => g.id === groupId)
    if (!group) return
    const expenses = group.expenses.filter((_, i) => i !== expenseIndex)
    await updateDoc(doc(db, 'users', uid, 'groups', groupId), { expenses })
  }

  // Calculate minimum transfers for settlement (greedy algorithm)
  const getSettlements = (groupId) => {
    const group = groups.find(g => g.id === groupId)
    if (!group || !group.expenses?.length) return []

    // Calculate net balance for each person
    const balances = {}
    group.members.forEach(m => { balances[m] = 0 })

    group.expenses.forEach(exp => {
      // Person who paid gets credited
      balances[exp.paidBy] = (balances[exp.paidBy] || 0) + Number(exp.amount)
      // Each person owes their split
      Object.entries(exp.splits || {}).forEach(([person, amt]) => {
        balances[person] = (balances[person] || 0) - Number(amt)
      })
    })

    // Separate into creditors and debtors
    const creditors = []
    const debtors = []
    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0.01) creditors.push({ person, amount: balance })
      else if (balance < -0.01) debtors.push({ person, amount: -balance })
    })

    // Sort by amount
    creditors.sort((a, b) => b.amount - a.amount)
    debtors.sort((a, b) => b.amount - a.amount)

    // Greedy matching
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

  // Firestore — Family Settings real-time
  useEffect(() => {
    if (!uid) { setFamilySettings(null); setFamilyTransactions([]); return }
    const unsub = onSnapshot(
      doc(db, 'users', uid, 'settings', 'family'),
      snap => {
        if (snap.exists()) {
          setFamilySettings(snap.data())
        } else {
          setFamilySettings(null)
        }
      },
      err => console.error('Family settings err:', err)
    )
    return unsub
  }, [uid])

  // Real-time handshake for invite code generator
  useEffect(() => {
    if (!uid || !familySettings?.inviteCode || familySettings?.linkedUid) return

    const unsub = onSnapshot(
      doc(db, 'familyLinks', familySettings.inviteCode),
      async snap => {
        if (snap.exists()) {
          const data = snap.data()
          if (data.linkedUid) {
            console.log('[Family] Partner entered invite code. Completing link...')
            // Link partner in our own settings
            await setDoc(doc(db, 'users', uid, 'settings', 'family'), {
              linkedUid: data.linkedUid,
              linkedName: data.linkedName || 'Partner'
            }, { merge: true })

            // Clean up the invite code document so it can't be reused
            try {
              await deleteDoc(doc(db, 'familyLinks', familySettings.inviteCode))
            } catch (e) {
              console.warn('[Family] Failed to delete invite code doc (not critical):', e)
            }
          }
        }
      },
      err => console.error('Invite code listener err:', err)
    )
    return unsub
  }, [uid, familySettings?.inviteCode, familySettings?.linkedUid])

  // Listen to partner's transactions when linked
  useEffect(() => {
    if (!familySettings?.linkedUid) {
      setFamilyTransactions([])
      return
    }
    const unsub = onSnapshot(
      query(collection(db, 'users', familySettings.linkedUid, 'transactions'), orderBy('date', 'desc')),
      snap => setFamilyTransactions(snap.docs.map(d => ({ id: d.id, ...d.data(), isPartner: true }))),
      err => {
        console.error('Family transactions err:', err)
        // If we get permission denied, it means partner unlinked us! Let's clear our link too.
        if (err.code === 'permission-denied') {
          console.log('[Family] Partner unlinked us. Cleaning up local link...')
          unlinkPartner()
        }
      }
    )
    return unsub
  }, [familySettings?.linkedUid])

  const generateInviteCode = async () => {
    if (!uid) return null
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Store in global familyLinks collection (readable by any authenticated user)
    await setDoc(doc(db, 'familyLinks', code), {
      uid,
      name: username || 'Partner',
      createdAt: serverTimestamp()
    })

    // Store in own family settings
    await setDoc(doc(db, 'users', uid, 'settings', 'family'), {
      inviteCode: code,
      linkedUid: null,
      linkedName: null
    }, { merge: true })

    return code
  }

  const linkPartner = async (code) => {
    if (!uid || !code) return { success: false, error: 'Invalid code' }

    try {
      const linkDoc = await getDoc(doc(db, 'familyLinks', code.toUpperCase()))
      if (!linkDoc.exists()) {
        return { success: false, error: 'Invalid invite code' }
      }

      const partnerData = linkDoc.data()
      if (partnerData.uid === uid) {
        return { success: false, error: 'Cannot link to yourself' }
      }

      // Update the invite code document to tell the partner we linked
      await updateDoc(doc(db, 'familyLinks', code.toUpperCase()), {
        linkedUid: uid,
        linkedName: username || 'Partner'
      })

      // Update own family settings
      await setDoc(doc(db, 'users', uid, 'settings', 'family'), {
        linkedUid: partnerData.uid,
        linkedName: partnerData.name,
        inviteCode: '' // Clear code since link is established
      }, { merge: true })

      return { success: true }
    } catch (err) {
      console.error('Link partner error:', err)
      return { success: false, error: 'Failed to link' }
    }
  }

  const unlinkPartner = async () => {
    if (!uid) return

    // Remove link from own settings only (partner will see change via their listener)
    await setDoc(doc(db, 'users', uid, 'settings', 'family'), {
      linkedUid: null,
      linkedName: null,
      inviteCode: ''
    }, { merge: true })
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
    return openingBalance + totalCredit - totalDebit
  }

  // ── Net Worth History — month-by-month cumulative balance (memoized) ──
  const netWorthHistoryCache = useMemo(() => {
    // Sort all transactions by date ascending
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
    if (!sorted.length) return []

    // Group by month, track running balance starting from openingBalance
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
  // Uses pre-built Set lookups for O(1) category classification (defined at module top)
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
      // O(1) Set lookup instead of O(k) .some() loop
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

  // ── P&L Statement — monthly income vs expense breakdown ──
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

  // ── Double-Entry Ledger — every transaction as Debit/Credit row with running balance ──
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
    // First row = Opening Balance entry
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

  // ── ML Spending Prediction — weighted avg of last 3 months per category (memoized) ──
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
      // Weighted average: most recent month weight=3, middle=2, oldest=1
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

    // Sort the small sliced subset by createdAt descending (extremely fast for small k)
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
      ? activeDebts.map(d => `${d.name || d.person || 'Someone'}: ₹${d.amount} (${d.type})`).join(', ')
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
    user: uid ? { uid } : null,
    username, updateUsername,
    email, updateEmail,
    phone, updatePhone,
    updateProfileDetails,
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
    groups, addGroup, updateGroup, deleteGroup, addGroupExpense, deleteGroupExpense, getSettlements,
    familySettings, familyTransactions, generateInviteCode, linkPartner, unlinkPartner, getFamilySummary,
    getBudgetAlerts, getAnomalies,
    sendBudgetNotification, requestNotificationPermission,
    addTransaction, updateTransaction, deleteTransaction, toggleNeedWant,
    getSummary, getFilteredTransactions,
    askGemini, askGeminiRaw, parseNLPTransaction,
    // ── Commerce & AI Features ──
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
