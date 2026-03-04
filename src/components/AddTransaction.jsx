/**
 * AddTransaction.jsx - Form to add or edit a transaction
 * Form to add or edit a transaction
 */
import { useState, useEffect, useRef } from 'react'
import { PlusCircle, CheckCircle, X, Sparkles, Wand2, Mic, MicOff, Loader2 } from 'lucide-react'
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

/* ─── Success Bottom Sheet Popup ──────────────────────────────────────────── */
function SuccessToast({ data, onClose, onGoHome }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => dismiss(), 5000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    setExiting(true)
    setTimeout(() => onClose(), 400)
  }

  const isCredit = data.type === 'credit'

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-400 ${visible && !exiting ? 'opacity-100' : 'opacity-0'}`}
        onClick={dismiss}
      />
      {/* Bottom sheet */}
      <div
        className={`relative w-full max-w-md transition-all duration-500 ease-out ${visible && !exiting
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
          }`}
      >
        <div className={`rounded-t-3xl p-6 pb-8 shadow-2xl border-t ${isCredit
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400/30'
          : 'bg-gradient-to-br from-rose-500 to-pink-600 border-rose-400/30'
          }`}>
          {/* Handle bar */}
          <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-5" />

          {/* Close button */}
          <button onClick={dismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/80 hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>

          {/* Content */}
          <div className="flex flex-col items-center text-center">
            <div className="w-18 h-18 rounded-full bg-white/20 flex items-center justify-center mb-4"
              style={{ width: 72, height: 72, animation: 'bounceIn 0.6s ease-out' }}>
              <CheckCircle size={36} className="text-white" />
            </div>
            <h3 className="text-white font-display font-bold text-xl mb-1">
              {isCredit ? '💰 Income Added!' : '💸 Expense Added!'}
            </h3>
            <p className="text-white/80 text-sm mb-4">
              Saved successfully ✅
            </p>
            <div className="bg-white/15 rounded-2xl px-6 py-4 backdrop-blur-sm w-full mb-5">
              <p className="text-white font-display font-bold text-3xl">
                {isCredit ? '+' : '-'}₹{Number(data.amount).toLocaleString('en-IN')}
              </p>
              <p className="text-white/70 text-xs mt-1.5 truncate">
                {data.description} · {data.category} · {data.account === 'Cash' ? '💵 Cash' : data.account === 'UPI' ? '📱 UPI' : '🏦 Bank'}
              </p>
            </div>

            {/* Go to Home button */}
            <button onClick={() => { dismiss(); setTimeout(() => onGoHome?.(), 300) }}
              className="w-full py-3.5 rounded-2xl bg-white/20 backdrop-blur-sm text-white font-bold text-sm hover:bg-white/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              🏠 Go to Home
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.1); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

/* ─── NLP Smart Add Bar ──────────────────────────────────────────────────── */
function SmartAddBar({ nlpInput, setNlpInput, nlpParsing, nlpResult, nlpError, nlpListening, onParse, onVoice, onClearResult }) {
  const NLP_EXAMPLES = [
    '🍱 "yesterday 50 rupees tiffin expense"',
    '🚌 "spent 30 on bus today"',
    '💰 "got 5000 salary yesterday"',
  ]
  const [showExamples, setShowExamples] = useState(false)

  return (
    <div className="card bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 dark:from-violet-900/15 dark:via-indigo-900/15 dark:to-blue-900/15 border border-violet-200/60 dark:border-violet-800/40 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
          <Wand2 size={13} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Smart Add ✨</h3>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Type in any language — AI fills the form</p>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex gap-2 items-center bg-white dark:bg-gray-800 rounded-xl p-1.5 border border-gray-200 dark:border-gray-700">
        <button onClick={onVoice}
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${nlpListening
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-violet-500'
            }`}>
          {nlpListening ? <MicOff size={14} /> : <Mic size={14} />}
        </button>
        <input
          type="text"
          value={nlpInput}
          onChange={e => setNlpInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onParse()}
          placeholder={nlpListening ? '🎤 Listening...' : 'e.g. "spent 200 on bus yesterday"'}
          className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none px-1"
        />
        <button onClick={onParse} disabled={nlpParsing || !nlpInput.trim()}
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${nlpParsing || !nlpInput.trim()
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md active:scale-90'
            }`}>
          {nlpParsing ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
        </button>
      </div>

      {/* Examples hint */}
      <button onClick={() => setShowExamples(p => !p)} className="text-[10px] text-violet-500 font-semibold mt-2">
        {showExamples ? 'Hide examples ▲' : 'Show examples ▼'}
      </button>
      {showExamples && (
        <div className="mt-1.5 space-y-1 animate-fade-in">
          {NLP_EXAMPLES.map((ex, i) => (
            <p key={i} className="text-[11px] text-gray-500 dark:text-gray-400">{ex}</p>
          ))}
        </div>
      )}

      {/* Parsed result preview */}
      {nlpResult && (
        <div className="mt-2.5 p-2.5 bg-emerald-50 dark:bg-emerald-900/15 rounded-xl border border-emerald-200 dark:border-emerald-800/40 animate-fade-in">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">✅ Parsed — form filled!</span>
            <button onClick={onClearResult} className="text-emerald-400 hover:text-emerald-600"><X size={12} /></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: nlpResult.type, color: nlpResult.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700' },
              { label: `₹${nlpResult.amount}`, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
              { label: nlpResult.description, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
              { label: nlpResult.category, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
              { label: nlpResult.date, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
            ].map((tag, i) => (
              <span key={i} className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${tag.color}`}>{tag.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {nlpError && (
        <p className="mt-2 text-xs text-rose-500 font-medium animate-fade-in">❌ {nlpError}</p>
      )}
    </div>
  )
}

export default function AddTransaction({ editData, onEditDone, defaultType, onTypeConsumed }) {
  const { addTransaction, updateTransaction, customCategories, transactions, parseNLPTransaction, setActiveTab } = useApp()
  const [form, setForm] = useState(defaultForm)
  const [successData, setSuccessData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [suggestionApplied, setSuggestionApplied] = useState(false)
  const suggestTimer = useRef(null)

  // ── NLP Smart Add State ──
  const [nlpInput, setNlpInput] = useState('')
  const [nlpParsing, setNlpParsing] = useState(false)
  const [nlpResult, setNlpResult] = useState(null)
  const [nlpError, setNlpError] = useState('')
  const [nlpListening, setNlpListening] = useState(false)
  const nlpRecogRef = useRef(null)

  // Populate form when editing
  useEffect(() => {
    if (editData) setForm({ ...defaultForm, ...editData })
    else setForm(defaultForm)
  }, [editData])

  // Pre-select type when coming from Dashboard quick actions
  useEffect(() => {
    if (defaultType && !editData) {
      setForm(prev => ({ ...prev, type: defaultType }))
      onTypeConsumed?.()
    }
  }, [defaultType, editData, onTypeConsumed])

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
      {/* ─── Success Bottom Sheet Overlay ─── */}
      {successData && (
        <SuccessToast
          data={successData}
          onClose={() => setSuccessData(null)}
          onGoHome={() => setActiveTab('dashboard')}
        />
      )}

      <div className="space-y-4 animate-slide-up">
        <div>
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
            {isEdit ? '✏️ Edit Transaction' : '➕ New Transaction'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isEdit ? 'Edit your transaction' : 'Add new income or expense'}
          </p>
        </div>

        {/* ── NLP Smart Add ──────────────────────────────── */}
        {!isEdit && <SmartAddBar
          nlpInput={nlpInput} setNlpInput={setNlpInput}
          nlpParsing={nlpParsing} nlpResult={nlpResult}
          nlpError={nlpError} nlpListening={nlpListening}
          onParse={async () => {
            if (!nlpInput.trim() || nlpParsing) return
            setNlpParsing(true); setNlpError(''); setNlpResult(null)
            const result = await parseNLPTransaction(nlpInput)
            if (result) {
              setNlpResult(result)
              setForm(result)
              setNlpInput('')
            } else { setNlpError('Could not parse. Please try again!') }
            setNlpParsing(false)
          }}
          onVoice={() => {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition
            if (!SR) { alert('Voice input not supported. Use Chrome.'); return }
            if (nlpListening) { nlpRecogRef.current?.stop(); setNlpListening(false); return }
            const recog = new SR()
            recog.lang = navigator.language || 'en-US'
            recog.interimResults = false
            recog.onresult = (e) => { setNlpInput(e.results[0][0].transcript); setNlpListening(false) }
            recog.onerror = () => setNlpListening(false)
            recog.onend = () => setNlpListening(false)
            nlpRecogRef.current = recog; recog.start(); setNlpListening(true)
          }}
          onClearResult={() => setNlpResult(null)}
        />}

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
            type="text" placeholder="e.g. College tiffin, Bus fare..."
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
          {submitting ? 'Saving...' :
            <><PlusCircle size={18} /> {isEdit ? 'Update' : 'Add Transaction'}</>}
        </button>

        {isEdit && (
          <button onClick={onEditDone}
            className="w-full py-3 rounded-2xl font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 text-sm">
            Cancel
          </button>
        )}
      </div>
    </>
  )
}
