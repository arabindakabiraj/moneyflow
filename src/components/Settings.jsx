/**
 * Settings.jsx — Clean, modern profile & settings page
 * v2.2: Fixed light-mode profile card, removed UID display, modal fixes
 */
import { useState, useEffect, useRef, useMemo } from 'react'
import { Target, LogOut, User, CheckCircle, Lock, Plus, Trash2, AlertTriangle, Pencil, X, ChevronRight, Camera, Shield, Tag, Wallet, Info, Moon, Sun, RefreshCw, Bell, TrendingUp, TrendingDown, Download, BarChart3, Calculator, Scissors, Share2, Fingerprint, Clock, ShieldAlert, Users, Heart, MessageSquare, Smartphone, FileText, UserX, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
// ThemeContext import removed — Accent Theme section removed
import { setupPin, clearPin, isPinSet, isBiometricCapable, isBiometricEnabled, checkPlatformAuthenticator, registerBiometric, clearBiometric, getAutoLockMinutes, setAutoLockMinutes } from './AppLock'
import { exportToCSV } from '../utils/csvExport'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { deactivateAccount, scheduleAccountDeletion } from '../authUtils'

/* ── Section header ── */
const SectionHeader = ({ children, icon: Icon, iconBg, iconColor }) => (
  <div className="flex items-center gap-2.5 mb-3 px-1">
    {Icon && (
      <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center`}>
        <Icon size={13} className={iconColor} />
      </div>
    )}
    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/35">
      {children}
    </p>
  </div>
)

/* ── Settings list row ── */
const SettingsRow = ({ icon: Icon, iconBg, iconColor, label, desc, right, onClick, danger }) => (
  <button onClick={onClick} disabled={!onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors ${onClick ? 'active:bg-white/[0.04]' : ''}`}>
    <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
      {typeof Icon === 'string' ? <span className="text-lg">{Icon}</span> : <Icon size={18} className={iconColor} />}
    </div>
    <div className="flex-1 min-w-0 text-left">
      <p className={`text-sm font-semibold ${danger ? 'text-[#FF6B6B]' : 'text-gray-900 dark:text-white/95'}`}>{label}</p>
      {desc && <p className="text-[11px] text-gray-400 dark:text-white/35 mt-0.5">{desc}</p>}
    </div>
    {right || (onClick && <ChevronRight size={16} className="text-gray-300 dark:text-white/20" />)}
  </button>
)

export default function Settings() {
  const { savingsGoal, setSavingsGoal, user, logout, customCategories, addCategory,
    budgets, saveBudget, removeBudget, getBudgetAlerts,
    username, updateUsername, email, phone, updateProfileDetails, profilePhoto, updateProfilePhoto,
    darkMode, setDarkMode, transactions, setActiveTab,
    requestNotificationPermission, familySettings,
    openingBalance, openingDate, setOpeningBalance,
    gstSettings, updateGstSettings } = useApp()


  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()


  const fileRef = useRef(null)
  const [goalInput, setGoalInput] = useState(savingsGoal)
  const [saved, setSaved] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [nameSaved, setNameSaved] = useState(false)

  // Personal Details form states
  const [detailsName, setDetailsName] = useState('')
  const [detailsEmail, setDetailsEmail] = useState('')
  const [detailsPhone, setDetailsPhone] = useState('')
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [detailsSaved, setDetailsSaved] = useState(false)

  // Sync state values when context loads
  useEffect(() => {
    setDetailsName(username || '')
    if (email && email.endsWith('@moneyflow.local')) {
      setDetailsEmail('')
    } else {
      setDetailsEmail(email || '')
    }
    setDetailsPhone(phone || '')
  }, [username, email, phone])

  const cleanMobileInput = (val) => {
    let clean = val.replace(/\D/g, '')
    if (clean.length === 12 && clean.startsWith('91')) {
      clean = clean.slice(2)
    } else if (clean.length === 11 && clean.startsWith('0')) {
      clean = clean.slice(1)
    }
    return clean.slice(0, 10)
  }

  const isValidMobile = (phone) => {
    const digits = phone.replace(/\D/g, '')
    if (digits.length !== 10) return false
    if (!/^[6-9]/.test(digits)) return false
    if (/^(\d)\1{9}$/.test(digits)) return false
    return true
  }

  const handleSaveDetails = async () => {
    setDetailsLoading(true)
    setDetailsError('')
    setDetailsSaved(false)

    if (detailsPhone) {
      if (!isValidMobile(detailsPhone)) {
        setDetailsError('Enter a valid 10-digit mobile number starting with 6-9. Repeated digits like 1111111111 are invalid.')
        setDetailsLoading(false)
        return
      }
    }

    try {
      await updateProfileDetails(detailsName, detailsEmail, detailsPhone)
      setDetailsSaved(true)
      setTimeout(() => setDetailsSaved(false), 3000)
    } catch (err) {
      console.error(err)
      setDetailsError(err.message || 'Failed to update profile details')
    } finally {
      setDetailsLoading(false)
    }
  }

  // PIN state
  const [pinStep, setPinStep] = useState('idle')
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinMsg, setPinMsg] = useState('')

  // Biometric / Auto-lock state
  const [bioCapable, setBioCapable] = useState(false)
  const [bioEnabled, setBioEnabled] = useState(isBiometricEnabled())
  const [bioLoading, setBioLoading] = useState(false)
  const [autoLock, setAutoLock] = useState(getAutoLockMinutes())
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  // Account Management modal states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Budget state
  const [budgetCat, setBudgetCat] = useState('')
  const [budgetAmt, setBudgetAmt] = useState('')
  const [newCat, setNewCat] = useState('')

  // Opening Balance state
  const [obInput, setObInput] = useState(openingBalance || '')
  const [obDate, setObDate] = useState(openingDate || new Date().toISOString().split('T')[0])
  const [obSaved, setObSaved] = useState(false)

  const saveOpeningBalance = async () => {
    await setOpeningBalance(Number(obInput) || 0, obDate)
    setObSaved(true)
    setTimeout(() => setObSaved(false), 2000)
  }

  // Expandable sections
  const [expandBudget, setExpandBudget] = useState(false)
  const [expandCategories, setExpandCategories] = useState(false)

  // Check biometric capability on mount
  useEffect(() => {
    checkPlatformAuthenticator().then(ok => setBioCapable(ok)).catch(() => { })
  }, [])

  const alerts = getBudgetAlerts()

  const saveGoal = () => {
    setSavingsGoal(Number(goalInput))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSetPin = () => {
    if (pin1.length !== 4) { setPinMsg('Enter a 4 digit PIN'); return }
    if (pinStep === 'setup' && pin2.length !== 4) { setPinMsg('Confirm your PIN'); return }
    if (pinStep === 'setup' && pin1 !== pin2) { setPinMsg('PINs do not match!'); return }
    if (pinStep === 'setup') {
      setupPin(pin1)
      setPinMsg('✅ PIN has been set!')
      setTimeout(() => { setPinStep('idle'); setPin1(''); setPin2(''); setPinMsg('') }, 1500)
    }
  }

  const [photoUploading, setPhotoUploading] = useState(false)

  // Compress image to max 256×256 JPEG ≤150KB for reliable Firestore storage
  const compressImage = (file, maxSize = 256, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        let w = img.width, h = img.height
        if (w > h) { if (w > maxSize) { h = Math.round(h * maxSize / w); w = maxSize } }
        else { if (h > maxSize) { w = Math.round(w * maxSize / h); h = maxSize } }
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = url
    })
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const compressed = await compressImage(file)
      await updateProfilePhoto(compressed)
    } catch (err) {
      console.error('Photo upload error:', err)
    }
    setPhotoUploading(false)
    // Reset input so re-selecting the same file triggers onChange
    if (fileRef.current) fileRef.current.value = ''
  }

  const initials = (username || 'M').charAt(0).toUpperCase()

  // Monthly stats
  const { monthIncome, monthExpense, savingsPct, personality, txCount } = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    const monthTx = transactions.filter(t => t.date?.startsWith(month))
    const monthIncome = monthTx.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount), 0)
    const monthExpense = monthTx.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount), 0)
    const savingsPct = monthIncome > 0 ? Math.round(((monthIncome - monthExpense) / monthIncome) * 100) : 0
    let personality = { label: 'Balanced', emoji: '⚖️', color: 'bg-[#4F8EF7]/15 text-[#4F8EF7]' }
    if (savingsPct >= 40) personality = { label: 'Saver', emoji: '🏆', color: 'bg-[#34D399]/15 text-[#34D399]' }
    else if (savingsPct < 0 || monthExpense > monthIncome * 1.2) personality = { label: 'Spender', emoji: '🔥', color: 'bg-[#FF6B6B]/15 text-[#FF6B6B]' }
    return { monthIncome, monthExpense, savingsPct, personality, txCount: monthTx.length }
  }, [transactions])

  const monthName = new Date().toLocaleString('en', { month: 'long' })

  // WhatsApp share
  const shareOnWhatsApp = () => {
    const month = new Date().toLocaleString('en', { month: 'long', year: 'numeric' })
    const text = `💰 *MoneyFlow — ${month}*\n✅ Income: ₹${monthIncome.toLocaleString('en-IN')}\n💸 Expense: ₹${monthExpense.toLocaleString('en-IN')}\n📊 Savings: ${savingsPct}%\n\nTracked with MoneyFlow ✨`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">

      {/* ═══════════ 1. PROFILE HERO CARD ═══════════ */}
      <div className="relative overflow-hidden rounded-3xl"
        style={{
          background: darkMode
            ? 'linear-gradient(145deg, #1E1E22 0%, #16161A 100%)'
            : 'linear-gradient(145deg, #f0f4ff 0%, #e8f0fe 100%)',
          border: darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(79,142,247,0.18)',
          boxShadow: darkMode ? '0 8px 24px rgba(0,0,0,0.6)' : '0 4px 20px rgba(79,142,247,0.12)',
        }}
      >
        {/* decorative accents */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute right-12 bottom-6 h-16 w-16 rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)' }} />

        <div className="relative px-6 pt-8 pb-6 flex flex-col items-center" style={{ color: darkMode ? 'white' : '#1a1a2e' }}>
          {/* Avatar */}
          <button onClick={() => fileRef.current?.click()} disabled={photoUploading} className="group relative mb-4">
            <div className={`w-24 h-24 rounded-full ring-4 ring-white/10 overflow-hidden flex items-center justify-center shadow-2xl transition-transform group-active:scale-95 ${photoUploading ? 'animate-pulse' : ''}`} style={{ background: 'var(--mf-surface-2)' }}>
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-display font-bold" style={{ color: darkMode ? 'rgba(255,255,255,0.9)' : '#1a1a2e' }}>{initials}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full shadow-lg flex items-center justify-center group-active:scale-90 transition-transform" style={{ background: '#4F8EF7' }}>
              {photoUploading
                ? <RefreshCw size={14} className="text-white animate-spin" />
                : <Camera size={14} className="text-white" />}
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />

          {/* Name + edit */}
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-[260px] mb-2">
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && nameInput.trim()) {
                    updateUsername(nameInput)
                    setEditingName(false)
                    setNameSaved(true)
                    setTimeout(() => setNameSaved(false), 2000)
                  }
                  if (e.key === 'Escape') setEditingName(false)
                }}
                style={{
                  background: darkMode ? '#222226' : 'rgba(255,255,255,0.6)',
                  color: darkMode ? 'white' : '#1a1a2e',
                  border: darkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(79,142,247,0.25)',
                }}
                className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#4F8EF7] text-center"
                placeholder="Your name…"
              />
              <button onClick={() => { if (nameInput.trim()) { updateUsername(nameInput); setEditingName(false); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000) } }}
                className="w-9 h-9 rounded-xl bg-[#4F8EF7] flex items-center justify-center hover:bg-[#4F8EF7]/80 transition-colors text-white">
                <CheckCircle size={16} />
              </button>
              <button onClick={() => setEditingName(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', color: darkMode ? 'rgba(255,255,255,0.7)' : '#555' }}>
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="text-center mb-1">
              <div className="flex items-center justify-center gap-2">
                <h2 className="font-display font-bold text-xl leading-tight" style={{ color: 'inherit' }}>
                  {nameSaved ? '✅ Saved!' : username || 'MoneyFlow User'}
                </h2>
                <button onClick={() => { setNameInput(username); setEditingName(true) }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors active:scale-90"
                  style={{ background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(79,142,247,0.12)', color: darkMode ? 'rgba(255,255,255,0.7)' : '#4F8EF7' }}>
                  <Pencil size={12} />
                </button>
              </div>
              {/* ✅ FIX: Do NOT show user.phoneNumber — it contains the raw UID, not a phone number */}
            </div>
          )}

          {/* Personality badge */}
          <span className="mt-2 text-[11px] font-bold px-3 py-1 rounded-full"
            style={{
              background: darkMode ? 'rgba(79,142,247,0.15)' : 'rgba(79,142,247,0.12)',
              color: '#4F8EF7',
            }}>
            {personality.emoji} {personality.label}
          </span>
        </div>
      </div>

      {/* ═══════════ 2. MONTHLY OVERVIEW CARD ═══════════ */}
      <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/35">
            {monthName} Overview
          </p>
        </div>
        <div className="grid grid-cols-4 gap-1 p-3">
          <div className="text-center py-3 rounded-2xl bg-[#34D399]/10">
            <TrendingUp size={14} className="text-emerald-500 mx-auto mb-1.5" />
            <p className="font-mono font-bold text-sm text-[#34D399]">
              ₹{monthIncome.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-emerald-500/70 font-semibold uppercase mt-0.5">Income</p>
          </div>
          <div className="text-center py-3 rounded-2xl bg-[#FF6B6B]/10">
            <TrendingDown size={14} className="text-rose-500 mx-auto mb-1.5" />
            <p className="font-mono font-bold text-sm text-[#FF6B6B]">
              ₹{monthExpense.toLocaleString('en-IN')}
            </p>
            <p className="text-[9px] text-rose-500/70 font-semibold uppercase mt-0.5">Expense</p>
          </div>
          <div className="text-center py-3 rounded-2xl bg-[#4F8EF7]/10">
            <BarChart3 size={14} className="text-blue-500 mx-auto mb-1.5" />
            <p className={`font-mono font-bold text-sm ${savingsPct >= 0 ? 'text-[#4F8EF7]' : 'text-[#FF6B6B]'}`}>
              {savingsPct}%
            </p>
            <p className="text-[9px] text-blue-500/70 font-semibold uppercase mt-0.5">Saved</p>
          </div>
          <div className="text-center py-3 rounded-2xl bg-violet-50 dark:bg-violet-900/15">
            <RefreshCw size={14} className="text-violet-500 mx-auto mb-1.5" />
            <p className="font-mono font-bold text-sm text-violet-400">{txCount}</p>
            <p className="text-[9px] text-violet-500/70 font-semibold uppercase mt-0.5">Txns</p>
          </div>
        </div>
      </div>

      {/* ═══════════ 3. BUDGET ALERTS ═══════════ */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map(a => (
            <div key={a.category} className={`rounded-2xl border p-4 flex items-start gap-3 ${a.exceeded
              ? 'bg-[#FF6B6B]/10 border-[#FF6B6B]/20'
              : 'bg-[#FBBF24]/10 border-[#FBBF24]/20'
              }`}>
              <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${a.exceeded ? 'text-rose-500' : 'text-amber-500'}`} />
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${a.exceeded ? 'text-[#FF6B6B]' : 'text-[#FBBF24]'}`}>
                  {a.category} budget {a.exceeded ? 'exceeded' : 'almost full'}
                </p>
                <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)' }}>
                  <div className={`h-full rounded-full transition-all ${a.exceeded ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(a.pct, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-1.5">
                  ₹{a.spent.toLocaleString('en-IN')} / ₹{a.limit.toLocaleString('en-IN')} ({a.pct}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      )}      {/* ═══════════ PERSONAL DETAILS ═══════════ */}
      <div>
        <SectionHeader icon={User} iconBg="bg-[#4F8EF7]/15" iconColor="text-[#4F8EF7]">
          Personal Details
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] p-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-white/35 mb-1.5 uppercase tracking-wide">
              Full Name
            </label>
            <input
              type="text"
              value={detailsName}
              onChange={e => {
                setDetailsName(e.target.value)
                setDetailsError('')
                setDetailsSaved(false)
              }}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white/95 text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-white/35 mb-1.5 uppercase tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              value={detailsEmail}
              onChange={e => {
                setDetailsEmail(e.target.value)
                setDetailsError('')
                setDetailsSaved(false)
              }}
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white/95 text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-white/35 mb-1.5 uppercase tracking-wide">
              Phone Number
            </label>
            <input
              type="tel"
              value={detailsPhone}
              onChange={e => {
                setDetailsPhone(cleanMobileInput(e.target.value))
                setDetailsError('')
                setDetailsSaved(false)
              }}
              placeholder="Phone number"
              className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white/95 text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 transition font-mono font-medium"
            />
          </div>

          {detailsError && (
            <p className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold mt-1">
              <AlertCircle size={14} /> {detailsError}
            </p>
          )}

          {detailsSaved && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold mt-1">
              <CheckCircle size={14} /> Profile details updated successfully!
            </p>
          )}

          <button
            onClick={handleSaveDetails}
            disabled={detailsLoading}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-[#4F8EF7] text-white active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-[#4F8EF7]/20 border-none cursor-pointer"
          >
            {detailsLoading ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : (
              'Save Details'
            )}
          </button>
        </div>
      </div>

      <div>
        <SectionHeader icon={Sun} iconBg="bg-[#FBBF24]/15" iconColor="text-amber-500">
          Preferences
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.06]">

          {/* Day / Night Mode Toggle */}
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
              {darkMode ? <Moon size={18} className="text-violet-400" /> : <Sun size={18} className="text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white/95">Appearance</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35">{darkMode ? 'Dark mode' : 'Light mode'}</p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${darkMode ? 'bg-violet-500' : 'bg-amber-400'}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-all duration-300 ${darkMode ? 'left-7' : 'left-0.5'}`}>
                {darkMode ? <Moon size={12} className="text-violet-500" /> : <Sun size={12} className="text-amber-500" />}
              </div>
            </button>
          </div>

          {/* Savings Goal */}
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-2xl bg-[#4F8EF7]/15 flex items-center justify-center shrink-0">
              <Target size={18} className="text-[#4F8EF7]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white/95">Monthly Savings Goal</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35">Your target savings per month</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-white/30">₹</span>
              <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)}
                className="w-20 text-right text-sm font-mono font-semibold text-[#4F8EF7] bg-transparent outline-none" />
              <button onClick={saveGoal}
                className={`ml-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${saved ? 'bg-[#4F8EF7] text-white scale-95' : 'bg-[#4F8EF7]/10 text-[#4F8EF7] hover:bg-brand-100 active:scale-95'}`}>
                {saved ? '✓' : 'Save'}
              </button>
            </div>
          </div>

          {/* Custom Categories — expandable */}
          <div>
            <button onClick={() => setExpandCategories(v => !v)}
              className="w-full flex items-center gap-3 px-4 py-4 active:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-[#FBBF24]/15 flex items-center justify-center shrink-0">
                <Tag size={18} className="text-[#FBBF24]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-gray-900 dark:text-white/95">Custom Categories</p>
                <p className="text-[11px] text-gray-400 dark:text-white/35">{customCategories.length} categories</p>
              </div>
              <ChevronRight size={16} className={`text-gray-300 dark:text-white/20 transition-transform duration-200 ${expandCategories ? 'rotate-90' : ''}`} />
            </button>
            {expandCategories && (
              <div className="px-4 pb-4 animate-fade-in">
                <div className="flex flex-wrap gap-2 mb-3">
                  {customCategories.map(c => (
                    <span key={c} className="text-[11px] px-3 py-1.5 bg-gray-100 dark:bg-[#222226] text-gray-600 dark:text-white/60 rounded-xl font-medium">{c}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newCat} onChange={e => setNewCat(e.target.value)}
                    placeholder="New category name…"
                    className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-sm text-gray-900 dark:text-white/95 outline-none focus:ring-2 focus:ring-[#4F8EF7]/50 transition"
                    onKeyDown={e => { if (e.key === 'Enter' && newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }} />
                  <button onClick={() => { if (newCat.trim()) { addCategory(newCat.trim()); setNewCat('') } }}
                    className="w-10 h-10 rounded-xl bg-[#4F8EF7] text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-sm shadow-[#4F8EF7]/20">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ 6. BUDGET MANAGEMENT ═══════════ */}
      <div>
        <SectionHeader icon={Wallet} iconBg="bg-[#4F8EF7]/15" iconColor="text-blue-500">
          Budget
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
          <button onClick={() => setExpandBudget(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-4 active:bg-white/[0.04] transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-[#4F8EF7]/15 flex items-center justify-center shrink-0">
              <Wallet size={18} className="text-[#4F8EF7]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white/95">Budget Limits</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35">
                {Object.keys(budgets).length === 0 ? 'No limits set yet' : `${Object.keys(budgets).length} active limit${Object.keys(budgets).length > 1 ? 's' : ''}`}
              </p>
            </div>
            <ChevronRight size={16} className={`text-gray-300 dark:text-white/20 transition-transform duration-200 ${expandBudget ? 'rotate-90' : ''}`} />
          </button>

          {expandBudget && (
            <div className="px-4 pb-4 animate-fade-in border-t border-black/[0.08] dark:border-white/[0.08]/60 pt-4">
              {Object.keys(budgets).length > 0 ? (
                <div className="space-y-3 mb-4">
                  {Object.entries(budgets).map(([cat, limit]) => (
                    <div key={cat} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-gray-100 dark:bg-[#222226]/50">
                      <span className="text-sm font-medium text-gray-600 dark:text-white/60">{cat}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold text-[#4F8EF7]">
                          ₹{limit.toLocaleString('en-IN')}<span className="text-gray-400 dark:text-white/30 font-normal text-[10px]">/mo</span>
                        </span>
                        <button onClick={() => removeBudget(cat)}
                          className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-400 hover:text-[#FF6B6B] active:scale-90 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-white/35 mb-4 text-center py-2">Set budget limits to track spending by category</p>
              )}
              <div className="flex gap-2">
                <select value={budgetCat} onChange={e => setBudgetCat(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-sm text-gray-900 dark:text-white/95 outline-none focus:ring-2 focus:ring-[#4F8EF7]/50">
                  <option value="">Category</option>
                  {customCategories.map(c => <option key={c}>{c}</option>)}
                </select>
                <input type="number" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)}
                  placeholder="₹ Limit"
                  className="w-24 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-sm font-mono text-gray-900 dark:text-white/95 outline-none focus:ring-2 focus:ring-[#4F8EF7]/50" />
                <button onClick={() => { if (budgetCat && budgetAmt) { saveBudget(budgetCat, budgetAmt); setBudgetCat(''); setBudgetAmt('') } }}
                  className="w-10 h-10 rounded-xl bg-[#4F8EF7] text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform shadow-sm shadow-[#4F8EF7]/20">
                  <Plus size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ 6b. FINANCIAL SETUP ═══════════ */}
      <div>
        <SectionHeader icon={'📒'} iconBg="bg-[#4F8EF7]/15" iconColor="text-indigo-500">
          Financial Setup
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-[#4F8EF7]/20 overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.06]">

          {/* Opening Balance */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-[#4F8EF7]/15 flex items-center justify-center shrink-0">
                <span className="text-lg">🏦</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white/95">Opening Balance</p>
                <p className="text-[11px] text-gray-400 dark:text-white/35">Money you had before tracking started</p>
              </div>
              {openingBalance > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-[#34D399]/15 text-[#34D399]">
                  ₹{openingBalance.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="number"
                  value={obInput}
                  onChange={e => setObInput(e.target.value)}
                  placeholder="Enter opening balance ₹"
                  className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-sm font-mono text-gray-900 dark:text-white/95 outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex gap-2 items-center">
                <label className="text-xs text-gray-400 dark:text-white/40 shrink-0">As of:</label>
                <input
                  type="date"
                  value={obDate}
                  onChange={e => setObDate(e.target.value)}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-sm text-gray-900 dark:text-white/95 outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
                <button
                  onClick={saveOpeningBalance}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] shrink-0 ${obSaved ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}>
                  {obSaved ? '✓ Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          {/* GST Rate */}
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FBBF24]/15 flex items-center justify-center shrink-0">
              <span className="text-lg">🧾</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white/95">GST Rate</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35">Used for GST tracking in transactions</p>
            </div>
            <select
              value={gstSettings.gstRate}
              onChange={e => updateGstSettings({ gstRate: Number(e.target.value) })}
              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-xs font-bold text-gray-600 dark:text-white/60 outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              {[0, 5, 12, 18, 28].map(r => (
                <option key={r} value={r}>{r}%</option>
              ))}
            </select>
          </div>

          {/* GST Registered */}
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF6B6B]/15 flex items-center justify-center shrink-0">
              <span className="text-lg">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white/95">GST Registered</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35">I am registered for GST</p>
            </div>
            <button
              onClick={() => updateGstSettings({ registered: !gstSettings.registered })}
              className={`relative w-12 h-7 rounded-full transition-all duration-300 ${gstSettings.registered ? 'bg-[#4F8EF7]' : 'bg-white/[0.06]'}`}>
              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${gstSettings.registered ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          {/* Accounting shortcuts */}
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30 mb-2">Quick Access</p>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('ledger')}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#4F8EF7] bg-indigo-50 dark:bg-indigo-900/20 py-2.5 rounded-xl hover:bg-[#4F8EF7]/15 transition-colors">
                📒 Ledger
              </button>
              <button onClick={() => setActiveTab('cashflow')}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#34D399] bg-emerald-50 dark:bg-emerald-900/20 py-2.5 rounded-xl hover:bg-[#34D399]/15 transition-colors">
                💵 Cash Flow
              </button>
              <button onClick={() => setActiveTab('groups')}
                className="flex-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#4F8EF7] bg-violet-500/10 py-2.5 rounded-xl hover:bg-violet-500/12 transition-colors">
                👥 Groups
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        <SectionHeader icon={Shield} iconBg="bg-violet-500/15" iconColor="text-violet-500">
          Security
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <Lock size={18} className="text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white/95">App Lock</p>
                <p className="text-[11px] text-gray-400 dark:text-white/35">
                  {isPinSet() ? 'PIN protection enabled' : 'Protect your data with a PIN'}
                </p>
              </div>
              {isPinSet() && (
                <span className="px-2.5 py-1 rounded-lg bg-[#34D399]/15 text-[#34D399] text-[10px] font-bold uppercase tracking-wide">Active</span>
              )}
            </div>

            {pinStep === 'idle' ? (
              <div className="flex gap-2">
                <button onClick={() => setPinStep('setup')}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-500/20 hover:bg-violet-500/15 transition-colors active:scale-[0.98]">
                  {isPinSet() ? 'Change PIN' : 'Set PIN'}
                </button>
                {isPinSet() && (
                  <button onClick={() => { clearPin(); setPinMsg('🔓 PIN removed') }}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-50 dark:bg-rose-900/20 text-[#FF6B6B] border border-[#FF6B6B]/20 hover:bg-[#FF6B6B]/15 transition-colors active:scale-[0.98]">
                    Remove
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 animate-fade-in">
                <input type="password" inputMode="numeric" maxLength={4} value={pin1} onChange={e => setPin1(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit PIN"
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white/95 font-mono tracking-[0.3em] text-center text-lg outline-none focus:ring-2 focus:ring-violet-500/50 transition" />
                <input type="password" inputMode="numeric" maxLength={4} value={pin2} onChange={e => setPin2(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Confirm PIN"
                  className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-gray-900 dark:text-white/95 font-mono tracking-[0.3em] text-center text-lg outline-none focus:ring-2 focus:ring-violet-500/50 transition" />
                {pinMsg && <p className="text-xs text-center text-[#4F8EF7] font-medium">{pinMsg}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setPinStep('idle'); setPin1(''); setPin2(''); setPinMsg('') }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-[#222226] text-gray-400 dark:text-white/40 active:scale-[0.98] transition-transform">Cancel</button>
                  <button onClick={handleSetPin}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-violet-500 text-white active:scale-[0.98] transition-transform shadow-sm shadow-violet-500/20">Set PIN</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Biometric Lock ── */}
          {bioCapable && isPinSet() && (
            <div className="border-t border-black/[0.08] dark:border-white/[0.08]/60">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#4F8EF7]/15 flex items-center justify-center shrink-0">
                  <Fingerprint size={18} className="text-[#4F8EF7]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/95">Biometric Unlock</p>
                  <p className="text-[11px] text-gray-400 dark:text-white/35">
                    {bioEnabled ? 'Face ID / Fingerprint enabled' : 'Use Face ID or Fingerprint'}
                  </p>
                </div>
                <button
                  disabled={bioLoading}
                  onClick={async () => {
                    setBioLoading(true)
                    try {
                      if (bioEnabled) {
                        clearBiometric()
                        setBioEnabled(false)
                      } else {
                        await registerBiometric()
                        setBioEnabled(true)
                      }
                    } catch { /* user cancelled */ }
                    setBioLoading(false)
                  }}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${bioEnabled ? 'bg-[#4F8EF7]' : 'bg-white/[0.06]'} ${bioLoading ? 'opacity-50' : ''}`}>
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${bioEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}

          {/* ── Auto-Lock Timer ── */}
          {isPinSet() && (
            <div className="border-t border-black/[0.08] dark:border-white/[0.08]/60">
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FBBF24]/15 flex items-center justify-center shrink-0">
                  <Clock size={18} className="text-[#FBBF24]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white/95">Auto-Lock</p>
                  <p className="text-[11px] text-gray-400 dark:text-white/35">Lock app after inactivity</p>
                </div>
                <select
                  value={autoLock}
                  onChange={e => { const v = Number(e.target.value); setAutoLock(v); setAutoLockMinutes(v) }}
                  className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#222226] border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold text-gray-600 dark:text-white/60 outline-none focus:ring-2 focus:ring-amber-500/50">
                  <option value={0}>Off</option>
                  <option value={1}>1 min</option>
                  <option value={5}>5 min</option>
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ 8. EXPORT & SHARE ═══════════ */}
      <div>
        <SectionHeader icon={Share2} iconBg="bg-[#34D399]/15" iconColor="text-emerald-500">
          Export & Share
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.06]">
          <SettingsRow
            icon={Download} iconBg="bg-[#34D399]/15" iconColor="text-[#34D399]"
            label="Export as CSV" desc="Download all transactions"
            onClick={() => exportToCSV(transactions)}
          />
          <SettingsRow
            icon={MessageSquare} iconBg="bg-[#4F8EF7]/15" iconColor="text-[#4F8EF7]"
            label="Import from SMS" desc="Parse bank SMS to add transactions"
            onClick={() => setActiveTab('smsimport')}
          />
          <SettingsRow
            icon="📤" iconBg="bg-[#34D399]/15"
            label="Share on WhatsApp" desc="Share monthly summary with friends"
            onClick={shareOnWhatsApp}
          />
        </div>
      </div>

      {/* ═══════════ 9. ACCOUNT MANAGEMENT ═══════════ */}
      <div>
        <SectionHeader icon={UserX} iconBg="bg-[#FF6B6B]/15" iconColor="text-red-400">
          Account Management
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.06]">
          <SettingsRow
            icon={UserX} iconBg="bg-amber-500/15" iconColor="text-amber-500"
            label="Deactivate Account"
            desc="Temporarily hide your account — reactivate anytime"
            onClick={() => setShowDeactivateModal(true)}
          />
          <SettingsRow
            icon={Trash2} iconBg="bg-[#FF6B6B]/15" iconColor="text-[#FF6B6B]"
            label="Delete Account" danger
            desc="Permanently delete your data after 30 days"
            onClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      {/* ═══════════ 10. ABOUT & ACCOUNT ═══════════ */}
      <div>
        <SectionHeader icon={Info} iconBg="bg-gray-100 dark:bg-[#222226]" iconColor="text-gray-400 dark:text-white/40">
          About
        </SectionHeader>
        <div className="rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/[0.06]">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-[#4F8EF7]/20">
              <span className="text-white text-sm font-bold">₹</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white/95">MoneyFlow</p>
              <p className="text-[11px] text-gray-400 dark:text-white/35">React + Firebase + Gemini AI</p>
            </div>
            <span className="text-xs font-mono text-gray-400 dark:text-white/35 bg-gray-100 dark:bg-[#222226] px-2.5 py-1 rounded-lg">v2.1</span>
          </div>
          <SettingsRow
            icon={Shield} iconBg="bg-[#34D399]/15" iconColor="text-[#34D399]"
            label="Privacy Policy" desc="Read our privacy policy"
            onClick={() => setActiveTab('privacy')}
          />
          <SettingsRow
            icon={FileText} iconBg="bg-[#4F8EF7]/15" iconColor="text-[#4F8EF7]"
            label="Terms of Service" desc="Read our terms of service"
            onClick={() => setActiveTab('terms')}
          />
          <SettingsRow
            icon={LogOut} iconBg="bg-[#FF6B6B]/15" iconColor="text-[#FF6B6B]"
            label="Log Out" danger onClick={() => setShowLogoutModal(true)}
          />
        </div>
      </div>

      {/* ═══════ LOGOUT ENCRYPTION WARNING MODAL ═══════ */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowLogoutModal(false)}>
          <div className="w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-3xl shadow-2xl overflow-hidden animate-slide-up" style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FBBF24]/15 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert size={28} className="text-[#FBBF24]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white/95 mb-1">Data Security Notice</h3>
              <p className="text-sm text-gray-400 dark:text-white/40 leading-relaxed">
                Logging out will clear all locally stored security data from this device.
              </p>
            </div>

            {/* Warning items */}
            <div className="px-6 pb-4 space-y-2.5">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20">
                <Lock size={16} className="text-[#FBBF24] mt-0.5 shrink-0" />
                <p className="text-xs text-[#FBBF24]">Your <strong>PIN &amp; biometric data</strong> will be removed from this device</p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20">
                <Shield size={16} className="text-[#FBBF24] mt-0.5 shrink-0" />
                <p className="text-xs text-[#FBBF24]">Local settings &amp; preferences will be <strong>cleared</strong></p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20">
                <CheckCircle size={16} className="text-[#34D399] mt-0.5 shrink-0" />
                <p className="text-xs text-[#34D399]">Your <strong>cloud data</strong> (transactions, budgets) stays safe in Firebase</p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-[#222226] text-gray-600 dark:text-white/60 active:scale-[0.98] transition-transform">
                Cancel
              </button>
              <button onClick={() => { clearPin(); clearBiometric(); setAutoLockMinutes(0); setShowLogoutModal(false); logout() }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-rose-500 text-white active:scale-[0.98] transition-transform shadow-sm shadow-red-500/20">
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DEACTIVATE MODAL ═══════ */}
      {showDeactivateModal && (
        <DeactivateModal
          uid={user?.uid}
          onClose={() => setShowDeactivateModal(false)}
          onDeactivated={() => {
            setShowDeactivateModal(false)
            // Clear local state and sign out (deactivateAccount already calls logoutUser)
            logout()
          }}
        />
      )}

      {/* ═══════ DELETE MODAL ═══════ */}
      {showDeleteModal && (
        <DeleteModal
          uid={user?.uid}
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            setShowDeleteModal(false)
            // scheduleAccountDeletion already calls logoutUser
            logout()
          }}
        />
      )}

      {/* Bottom safe area */}
      <div className="h-4" />
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   DEACTIVATE ACCOUNT MODAL
   Like Instagram — data preserved, user can reactivate by logging back in
   ════════════════════════════════════════════════════════ */
function DeactivateModal({ uid, onClose, onDeactivated }) {
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDeactivate = async () => {
    if (!password || password.length < 8) {
      setError('Please enter your current password to confirm')
      return
    }
    setLoading(true)
    setError('')
    try {
      await deactivateAccount(uid, password)
      onDeactivated()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}>
      <div className="w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
            <UserX size={28} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white/95 mb-1">Deactivate Account?</h3>
          <p className="text-sm text-gray-400 dark:text-white/40 leading-relaxed">
            Your account will be hidden from others. Your data stays safe — just log back in to reactivate.
          </p>
        </div>

        {/* What happens */}
        <div className="px-6 pb-4 space-y-2.5">
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <UserX size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">Your <strong>profile &amp; activity</strong> will be hidden from others</p>
          </div>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20">
            <CheckCircle size={16} className="text-[#34D399] mt-0.5 shrink-0" />
            <p className="text-xs text-[#34D399]">All your <strong>transactions &amp; data</strong> remain completely safe</p>
          </div>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#4F8EF7]/10 border border-[#4F8EF7]/20">
            <CheckCircle size={16} className="text-[#4F8EF7] mt-0.5 shrink-0" />
            <p className="text-xs text-[#4F8EF7]">Reactivate anytime by simply <strong>logging in again</strong></p>
          </div>
        </div>

        {/* Password confirm */}
        <div className="px-6 pb-4">
          <label className="block text-xs font-semibold text-gray-400 dark:text-white/40 mb-2 uppercase tracking-wide">Confirm with your password</label>
          <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'var(--mf-surface-2)', border: '1.5px solid var(--mf-border)' }}>
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Enter your password"
              className="flex-1 bg-transparent px-4 py-3 text-sm outline-none border-none focus:outline-none"
              style={{ color: 'var(--mf-text-primary)' }}
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPw(p => !p)} className="pr-4 text-gray-400 dark:text-white/30">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {error && (
            <p className="flex items-center gap-1 text-[11px] font-medium mt-1.5 text-[#FF6B6B] animate-fade-in">
              <AlertCircle size={11} /> {error}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-[#222226] text-gray-600 dark:text-white/60 active:scale-[0.98] transition-transform border-none cursor-pointer">
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-amber-500 text-white active:scale-[0.98] transition-transform shadow-sm shadow-amber-500/20 border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5">
            {loading ? <RefreshCw size={15} className="animate-spin" /> : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════
   DELETE ACCOUNT MODAL — 3-step wizard
   Step 1: Sobering warning
   Step 2: Type DELETE to confirm
   Step 3: Enter password + fire
   ════════════════════════════════════════════════════════ */
function DeleteModal({ uid, onClose, onDeleted }) {
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleScheduleDeletion = async () => {
    if (!password || password.length < 8) {
      setError('Please enter your current password')
      return
    }
    setLoading(true)
    setError('')
    try {
      await scheduleAccountDeletion(uid, password)
      onDeleted()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const deletionDate = new Date()
  deletionDate.setDate(deletionDate.getDate() + 30)
  const formattedDate = deletionDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={step === 1 ? onClose : undefined}>
      <div className="w-full max-w-sm mx-4 mb-6 sm:mb-0 rounded-3xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ background: 'var(--mf-surface)', border: '1px solid rgba(255,107,107,0.20)' }}
        onClick={e => e.stopPropagation()}>

        {/* ── STEP 1: Warning ── */}
        {step === 1 && (
          <>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FF6B6B]/15 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-[#FF6B6B]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white/95 mb-1">Delete Account?</h3>
              <p className="text-sm text-gray-400 dark:text-white/40 leading-relaxed">
                This is <strong className="text-[#FF6B6B]">permanent and irreversible</strong>. Please read carefully before proceeding.
              </p>
            </div>
            <div className="px-6 pb-4 space-y-2.5">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20">
                <AlertTriangle size={16} className="text-[#FF6B6B] mt-0.5 shrink-0" />
                <p className="text-xs text-[#FF6B6B]">All <strong>transactions, budgets, goals</strong> will be permanently erased</p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/20">
                <AlertTriangle size={16} className="text-[#FF6B6B] mt-0.5 shrink-0" />
                <p className="text-xs text-[#FF6B6B]">Your <strong>Firebase Auth account</strong> will be permanently deleted</p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20">
                <Clock size={16} className="text-[#FBBF24] mt-0.5 shrink-0" />
                <p className="text-xs text-[#FBBF24]">You have a <strong>30-day grace period</strong> — log back in to cancel before {formattedDate}</p>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-[#222226] text-gray-600 dark:text-white/60 active:scale-[0.98] transition-transform border-none cursor-pointer">
                Keep Account
              </button>
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30 active:scale-[0.98] transition-transform cursor-pointer">
                Continue →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Type DELETE ── */}
        {step === 2 && (
          <>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/15 flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-black text-[#FF6B6B]">2/3</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white/95 mb-1">Confirm Deletion</h3>
              <p className="text-sm text-gray-400 dark:text-white/40">
                Type <strong className="text-[#FF6B6B] font-mono">DELETE</strong> in the box below to continue
              </p>
            </div>
            <div className="px-6 pb-4">
              <input
                autoFocus
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE here"
                className="w-full px-4 py-3.5 rounded-2xl text-sm font-mono font-bold text-center outline-none border-none focus:outline-none"
                style={{
                  background: 'var(--mf-surface-2)',
                  border: `2px solid ${confirmText === 'DELETE' ? '#FF6B6B' : 'var(--mf-border)'}`,
                  color: confirmText === 'DELETE' ? '#FF6B6B' : 'var(--mf-text-primary)',
                  letterSpacing: '0.15em',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
              />
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-[#222226] text-gray-600 dark:text-white/60 active:scale-[0.98] transition-transform border-none cursor-pointer">
                ← Back
              </button>
              <button
                onClick={() => confirmText === 'DELETE' && setStep(3)}
                disabled={confirmText !== 'DELETE'}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#FF6B6B] text-white active:scale-[0.98] transition-transform border-none cursor-pointer disabled:opacity-40">
                Next →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Enter password ── */}
        {step === 3 && (
          <>
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#FF6B6B]/15 flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-black text-[#FF6B6B]">3/3</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white/95 mb-1">Final Step</h3>
              <p className="text-sm text-gray-400 dark:text-white/40">
                Enter your password to schedule deletion.
                Your account will be deleted on <strong style={{ color: '#FF6B6B' }}>{formattedDate}</strong>.
              </p>
            </div>
            <div className="px-6 pb-4">
              <div className="flex items-center rounded-xl overflow-hidden" style={{ background: 'var(--mf-surface-2)', border: '1.5px solid var(--mf-border)' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Your current password"
                  autoFocus
                  className="flex-1 bg-transparent px-4 py-3 text-sm outline-none border-none focus:outline-none"
                  style={{ color: 'var(--mf-text-primary)' }}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(p => !p)} className="pr-4 text-gray-400 dark:text-white/30">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && (
                <p className="flex items-center gap-1 text-[11px] font-medium mt-1.5 text-[#FF6B6B] animate-fade-in">
                  <AlertCircle size={11} /> {error}
                </p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => { setStep(2); setError('') }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-gray-100 dark:bg-[#222226] text-gray-600 dark:text-white/60 active:scale-[0.98] transition-transform border-none cursor-pointer">
                ← Back
              </button>
              <button
                onClick={handleScheduleDeletion}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold bg-[#FF6B6B] text-white active:scale-[0.98] transition-transform border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/25">
                {loading ? <RefreshCw size={15} className="animate-spin" /> : '🗑️ Schedule Deletion'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
