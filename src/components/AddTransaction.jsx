/**
 * AddTransaction.jsx - Form to add or edit a transaction
 * নতুন লেনদেন যোগ বা সম্পাদনার ফর্ম
 */
import { useState, useEffect } from 'react'
import { PlusCircle, CheckCircle, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const ACCOUNTS = ['Cash', 'Bank']

const defaultForm = {
  type: 'debit',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  category: 'Others',
  account: 'Cash',
  isWant: false,
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
                {data.description} · {data.category} · {data.account === 'Cash' ? '💵 Cash' : '🏦 Bank'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddTransaction({ editData, onEditDone }) {
  const { addTransaction, updateTransaction, customCategories } = useApp()
  const [form, setForm] = useState(defaultForm)
  const [successData, setSuccessData] = useState(null) // holds submitted tx data for toast
  const [submitting, setSubmitting] = useState(false)

  // Populate form when editing
  useEffect(() => {
    if (editData) setForm({ ...defaultForm, ...editData })
    else setForm(defaultForm)
  }, [editData])

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.amount || !form.description || !form.date) return
    setSubmitting(true)
    if (editData) {
      await updateTransaction(editData.id, form)
      onEditDone?.()
    } else {
      const submitted = { ...form, amount: Number(form.amount) }
      await addTransaction(submitted)
      setForm(defaultForm)
      setSuccessData(submitted) // Show toast with submitted data
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
          <div className="flex gap-2">
            {ACCOUNTS.map(acc => (
              <button key={acc} onClick={() => handleChange('account', acc)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${form.account === acc
                  ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}>
                {acc === 'Cash' ? '💵 Cash' : '🏦 Bank'}
              </button>
            ))}
          </div>
        </div>

        {/* Need vs Want toggle (only for debit) */}
        {form.type === 'debit' && (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white text-sm">
                {form.isWant ? '✨ Want' : '✅ Need'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {form.isWant ? 'এটি একটি বিলাসিতার খরচ' : 'এটি একটি প্রয়োজনীয় খরচ'}
              </p>
            </div>
            <button onClick={() => handleChange('isWant', !form.isWant)}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${form.isWant ? 'bg-purple-500' : 'bg-brand-500'
                }`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${form.isWant ? 'left-6' : 'left-0.5'
                }`} />
            </button>
          </div>
        )}

        {/* Submit */}
        <button onClick={handleSubmit} disabled={submitting || !form.amount || !form.description}
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
