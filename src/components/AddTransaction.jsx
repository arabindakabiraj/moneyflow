/**
 * AddTransaction.jsx - Form to add or edit a transaction
 * নতুন লেনদেন যোগ বা সম্পাদনার ফর্ম
 */
import { useState, useEffect, useRef } from 'react'
import { PlusCircle, CheckCircle, X, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { suggestCategory } from '../utils/autoCategory'

const ACCOUNTS = ['Cash', 'Bank', 'UPI']

const defaultForm = {
  type: 'debit',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  category: 'Others',
  account: 'Cash',
}

/* ─── Success Toast Popup ──────────────────────────────────────────────────── */
function SuccessToast({ data, onClose }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))
    // Auto dismiss after 3s
    const timer = setTimeout(() => dismiss(), 3000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setExiting(true)
    setTimeout(() => onClose(), 400)
  }

  const isCredit = data.type === 'credit'

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center px-4 pt-6">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity duration-400 ${visible && !exiting ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={dismiss}
      />
      {/* Toast card */}
      <div
        className={`relative pointer-events-auto w-full max-w-sm transition-all duration-500 ease-out ${visible && !exiting
          ? 'translate-y-0 opacity-100 scale-100'
          : '-translate-y-8 opacity-0 scale-95'
          }`}
      >
        <div className={`rounded-3xl p-5 shadow-2xl border ${isCredit
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/30'
          : 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400/30'
          }`}>
          {/* Close button */}
          <button onClick={dismiss}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors">
            <X size={14} />
          </button>

          {/* Animated checkmark */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3 animate-bounce"
              style={{ animationDuration: '0.6s', animationIterationCount: '2' }}>
              <CheckCircle size={32} className="text-white" />
            </div>
            <h3 className="text-white font-display font-bold text-lg mb-1">
              {isCredit ? '💰 Income Added!' : '💸 Expense Added!'}
            </h3>
            <p className="text-white/80 text-sm mb-3">
              সফলভাবে সংরক্ষণ হয়েছে ✅
            </p>
            <div className="bg-white/15 rounded-2xl px-5 py-3 backdrop-blur-sm w-full">
              <p className="text-white font-display font-bold text-2xl">
                {isCredit ? '+' : '-'}₹{Number(data.amount).toLocaleString('en-IN')}
              </p>
              <p className="text-white/70 text-xs mt-1 truncate">
                {data.description} · {data.category} · {data.account === 'Cash' ? '💵 Cash' : data.account === 'UPI' ? '📱 UPI' : '🏦 Bank'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddTransaction({ editData, onEditDone }) {
  const { addTransaction, updateTransaction, customCategories, transactions } = useApp()
  const [form, setForm] = useState(defaultForm)
  const [successData, setSuccessData] = useState(null) // holds submitted tx data for toast
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState(null) // { category, confidence, source }
  const [suggestionApplied, setSuggestionApplied] = useState(false)
  const suggestTimer = useRef(null)

  // Populate form when editing
  useEffect(() => {
    if (editData) setForm({ ...defaultForm, ...editData })
    else setForm(defaultForm)
  }, [editData])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Auto-suggest category when description changes (debounced)
    if (field === 'description') {
      setSuggestionApplied(false)
      if (suggestTimer.current) clearTimeout(suggestTimer.current)
      suggestTimer.current = setTimeout(() => {
        const result = suggestCategory(value, transactions, customCategories)
        setSuggestion(result)
      }, 300)
    }
  }

  const handleSubmit = async () => {
    const amt = Number(form.amount)
    if (!amt || amt <= 0 || !form.description?.trim()) return
    setSubmitting(true)
    try {
      if (editData) {
        await updateTransaction(editData.id, { ...form, amount: amt, description: form.description.trim() })
        onEditDone?.()
      } else {
        const submitted = { ...form, amount: amt, description: form.description.trim() }
        await addTransaction(submitted)
        setForm({ ...defaultForm, date: new Date().toISOString().split('T')[0] })
        setSuccessData(submitted)
      }
    } catch (e) {
      console.error('Submit error:', e)
    }
    setSubmitting(false)
  }

  const isEdit = !!editData

  return (
    <>
      {/* ─── Success Toast Overlay ─── */}
      {successData && (
        <SuccessToast data={successData} onClose={() => setSuccessData(null)} />
      )}

      <div className="space-y-4 animate-slide-up">
        <div>
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
            {isEdit ? '✏️ Edit Transaction' : '➕ New Transaction'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? 'লেনদেন সম্পাদনা করুন' : 'নতুন আয় বা ব্যয় যোগ করুন'}
          </p>
        </div>

        {/* Credit / Debit toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
          {[
            { value: 'debit', label: '💸 Debit (Expense)', color: 'from-rose-400 to-pink-500' },
            { value: 'credit', label: '💰 Credit (Income)', color: 'from-emerald-400 to-brand-500' },
          ].map(({ value, label, color }) => (
            <button key={value} onClick={() => handleChange('type', value)}
              className={`py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${form.type === value
                ? `bg-gradient-to-r ${color} text-white shadow-md`
                : 'text-gray-500 dark:text-gray-400'
                }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Amount (₹) *
          </label>
          <input
            type="number" inputMode="decimal" placeholder="0.00"
            value={form.amount}
            onChange={e => handleChange('amount', e.target.value)}
            className="input-field bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-xl font-display font-bold"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Description *
          </label>
          <input
            type="text" placeholder="যেমন: College tiffin, Bus fare..."
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            className="input-field bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
          />
          {/* Auto-category suggestion chip */}
          {suggestion && !suggestionApplied && form.category !== suggestion.category && (
            <button
              onClick={() => { handleChange('category', suggestion.category); setSuggestionApplied(true) }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/40 animate-fade-in active:scale-95 transition-transform">
              <Sparkles size={12} className="text-violet-500" />
              Auto: <span className="font-bold">{suggestion.category}</span>
              <span className="text-violet-400 dark:text-violet-500">•</span>
              <span className="text-[10px] text-violet-400 dark:text-violet-500">{suggestion.source === 'history' ? 'from your history' : 'suggested'}</span>
            </button>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Date *
          </label>
          <input
            type="date"
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
            className="input-field bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {customCategories.map(cat => (
              <button key={cat} onClick={() => handleChange('category', cat)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 ${form.category === cat
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Account type */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Account Type
          </label>
          <div className="space-y-2">
            {/* Cash - full width */}
            <button onClick={() => handleChange('account', 'Cash')}
              className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${form.account === 'Cash'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
              💵 Cash
            </button>
            {/* Bank & UPI - half half */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleChange('account', 'Bank')}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${form.account === 'Bank'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                🏦 Bank
              </button>
              <button onClick={() => handleChange('account', 'UPI')}
                className={`py-3 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 ${form.account === 'UPI'
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                📱 UPI
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting || !form.amount || !form.description?.trim()}
          className={`w-full py-4 rounded-2xl font-display font-bold text-base transition-all duration-200 flex items-center justify-center gap-2
            ${submitting ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed' :
              'bg-gradient-to-r from-brand-500 to-emerald-500 text-white shadow-lg shadow-brand-500/30 active:scale-98'}`}>
          {submitting ? 'সংরক্ষণ হচ্ছে...' :
            <><PlusCircle size={18} /> {isEdit ? 'Update করুন' : 'Add করুন'}</>}
        </button>

        {isEdit && (
          <button onClick={onEditDone}
            className="w-full py-3 rounded-2xl font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 text-sm">
            বাতিল করুন
          </button>
        )}
      </div>
    </>
  )
}
