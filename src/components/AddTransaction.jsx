/**
 * AddTransaction.jsx — Full Liquid Glass redesign
 * iOS 18 glass inputs, dark backdrop, premium form
 */
import { useState, useEffect, useRef } from 'react'
import { PlusCircle, CheckCircle, X, Sparkles, Wand2, Mic, MicOff, Loader2, Hash, StickyNote, ChevronDown } from 'lucide-react'
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
  tags: [],
  notes: '',
}

/* ── Label helper ── */
const GlassLabel = ({ children }) => (
  <label className="block text-[11px] font-bold uppercase tracking-widest mb-2"
    style={{ color: 'rgba(255,255,255,0.40)' }}>
    {children}
  </label>
)

/* ── Glass Input field ── */
const GlassInput = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all duration-200 ${className}`}
    style={{
      background: 'rgba(255,255,255,0.08)',
      border: '1.5px solid rgba(255,255,255,0.16)',
      color: 'rgba(255,255,255,0.92)',
      ...props.style,
    }}
    onFocus={e => {
      e.target.style.borderColor = 'rgba(34,197,94,0.65)'
      e.target.style.boxShadow   = '0 0 0 3px rgba(34,197,94,0.18)'
    }}
    onBlur={e => {
      e.target.style.borderColor = 'rgba(255,255,255,0.16)'
      e.target.style.boxShadow   = 'none'
    }}
  />
)

/* ── Success floating toast ── */
function SuccessToast({ data, onClose, onGoHome }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const isCredit = data.type === 'credit'

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => dismiss(), 4000)
    return () => clearTimeout(t)
  }, [])

  const dismiss = () => {
    setExiting(true)
    setTimeout(() => onClose(), 400)
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:top-6 z-[100] max-w-sm w-auto">
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .toast-progress-bar {
          animation: toastProgress 4s linear forwards;
        }
      `}</style>

      <div 
        className={`relative overflow-hidden rounded-2xl p-4 flex gap-3.5 backdrop-blur-xl shadow-2xl transition-all duration-300 border ${
          visible && !exiting 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-[-20px] opacity-0 scale-95'
        }`}
        style={{
          background: 'rgba(26, 26, 29, 0.88)',
          borderColor: isCredit ? 'rgba(52, 211, 153, 0.25)' : 'rgba(239, 68, 68, 0.25)',
          boxShadow: isCredit 
            ? '0 12px 40px rgba(52, 211, 153, 0.15), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 12px 40px rgba(239, 68, 68, 0.15), 0 0 0 1px rgba(255,255,255,0.05)'
        }}
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            background: isCredit ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            borderColor: isCredit ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: isCredit ? '#34D399' : '#FF6B6B'
          }}
        >
          <CheckCircle size={20} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-white text-[13px] font-bold tracking-wide">
              {isCredit ? 'Income Saved' : 'Expense Saved'}
            </h4>
            <span 
              className="text-xs font-mono font-bold shrink-0"
              style={{ color: isCredit ? '#34D399' : '#FF6B6B' }}
            >
              {isCredit ? '+' : '-'}₹{Number(data.amount).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-white/50 truncate mt-0.5">
            {data.description} · <span className="font-semibold text-white/70">{data.category}</span>
          </p>
          
          <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-white/[0.06]">
            <button 
              onClick={() => { dismiss(); setTimeout(() => onGoHome?.(), 300) }}
              className="text-[10px] font-extrabold text-[#4F8EF7] hover:text-[#76a7f9] flex items-center gap-1 active:scale-95 transition-all bg-transparent border-none cursor-pointer"
            >
              🏠 Go to Home
            </button>
            <span className="text-white/20 text-[10px]">|</span>
            <button 
              onClick={dismiss}
              className="text-[10px] font-bold text-white/40 hover:text-white/60 active:scale-95 transition-all bg-transparent border-none cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/10">
          <div 
            className="h-full toast-progress-bar"
            style={{
              background: isCredit ? 'linear-gradient(90deg, #34D399, #10B981)' : 'linear-gradient(90deg, #FF6B6B, #EF4444)'
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Tags input ── */
function TagsInput({ tags, onChange, allTransactions }) {
  const [input, setInput]               = useState('')
  const [showSuggestions, setShowSugs]  = useState(false)
  const allTags = [...new Set((allTransactions||[]).flatMap(t=>t.tags||[]).filter(Boolean))].sort()
  const suggestions = input.trim()
    ? allTags.filter(t => t.toLowerCase().includes(input.toLowerCase()) && !tags.includes(t)).slice(0,5)
    : allTags.filter(t => !tags.includes(t)).slice(0,8)

  const addTag = tag => { const c=tag.replace(/^#/,'').trim().toLowerCase(); if(c&&!tags.includes(c))onChange([...tags,c]); setInput(''); setShowSugs(false) }
  const removeTag = tag => onChange(tags.filter(t=>t!==tag))
  const handleKey = e => {
    if((e.key==='Enter'||e.key===',')&&input.trim()){e.preventDefault();addTag(input)}
    if(e.key==='Backspace'&&!input&&tags.length>0)removeTag(tags[tags.length-1])
  }

  return (
    <div>
      <GlassLabel><Hash size={11} className="inline mr-1" />Tags (optional)</GlassLabel>
      <div className="flex flex-wrap gap-1.5 p-2.5 min-h-[48px] items-center rounded-2xl"
        style={{ background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.16)' }}>
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background:'rgba(139,92,246,0.25)', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.35)' }}>
            #{tag}
            <button onClick={() => removeTag(tag)} style={{ color:'#a78bfa' }}><X size={10}/></button>
          </span>
        ))}
        <input value={input} onChange={e=>{setInput(e.target.value);setShowSugs(true)}}
          onKeyDown={handleKey} onFocus={()=>setShowSugs(true)}
          onBlur={()=>setTimeout(()=>setShowSugs(false),200)}
          placeholder={tags.length===0?'e.g. #trip, #office...':'Add tag...'}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none"
          style={{ color:'rgba(255,255,255,0.90)', caretColor:'#4ade80' }} />
      </div>
      {showSuggestions && suggestions.length>0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 animate-fade-in">
          {suggestions.map(s=>(
            <button key={s} onClick={()=>addTag(s)}
              className="text-[10px] px-2 py-1 rounded-lg font-medium transition-colors"
              style={{ background:'rgba(139,92,246,0.15)', color:'#a78bfa', border:'1px solid rgba(139,92,246,0.25)' }}>
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Smart Add bar (inline in Add form) ── */
function SmartAddBar({ nlpInput, setNlpInput, nlpParsing, nlpResult, nlpError, nlpListening, onParse, onVoice, onClearResult }) {
  const [showExamples, setShowExamples] = useState(false)
  const NLP_EXAMPLES = [
    '🍱 "yesterday 50 rupees tiffin expense"',
    '🚌 "spent 30 on bus today"',
    '💰 "got 5000 salary yesterday"',
  ]

  return (
    <div className="lg-surface rounded-3xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 relative z-10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center"
          style={{ boxShadow:'0 4px 12px rgba(139,92,246,0.45)' }}>
          <Wand2 size={14} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color:'rgba(255,255,255,0.90)' }}>Smart Add ✨</h3>
          <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.40)' }}>Type in any language — AI fills the form</p>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex gap-2 items-center rounded-2xl px-2 py-1.5 relative z-10"
        style={{ background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.14)' }}>
        <button onClick={onVoice}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${nlpListening ? 'animate-pulse' : ''}`}
          style={nlpListening
            ? { background:'rgba(244,63,94,0.80)', color:'white' }
            : { background:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.50)' }}>
          {nlpListening ? <MicOff size={14}/> : <Mic size={14}/>}
        </button>
        <input type="text" value={nlpInput}
          onChange={e=>setNlpInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&onParse()}
          placeholder={nlpListening?'🎤 Listening...':'e.g. "spent 200 on bus yesterday"'}
          className="flex-1 text-sm bg-transparent outline-none px-1"
          style={{ color:'rgba(255,255,255,0.90)', caretColor:'#4ade80' }} />
        <button onClick={onParse} disabled={nlpParsing||!nlpInput.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={nlpParsing||!nlpInput.trim()
            ? { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.25)', cursor:'not-allowed' }
            : { background:'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(109,40,217,0.85))', color:'white', boxShadow:'0 4px 12px rgba(139,92,246,0.40)' }}>
          {nlpParsing?<Loader2 size={14} className="animate-spin"/>:<Wand2 size={14}/>}
        </button>
      </div>

      {/* Examples */}
      <div className="relative z-10">
        <button onClick={()=>setShowExamples(p=>!p)}
          className="text-[10px] font-semibold" style={{ color:'#a78bfa' }}>
          {showExamples?'Hide examples ▲':'Show examples ▼'}
        </button>
        {showExamples && (
          <div className="mt-2 space-y-1 animate-fade-in">
            {NLP_EXAMPLES.map((ex,i)=>(
              <p key={i} className="text-[11px]" style={{ color:'rgba(139,92,246,0.80)' }}>{ex}</p>
            ))}
          </div>
        )}
      </div>

      {/* Result */}
      {nlpResult && (
        <div className="p-3 rounded-2xl relative z-10 animate-fade-in"
          style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase" style={{ color:'#4ade80' }}>✅ Parsed — form filled!</span>
            <button onClick={onClearResult} style={{ color:'rgba(255,255,255,0.40)' }}><X size={12}/></button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: nlpResult.type,        bg:'rgba(34,197,94,0.20)',   color:'#4ade80' },
              { label: `₹${nlpResult.amount}`, bg:'rgba(59,130,246,0.20)', color:'#60a5fa' },
              { label: nlpResult.description,  bg:'rgba(255,255,255,0.10)', color:'rgba(255,255,255,0.75)' },
              { label: nlpResult.category,     bg:'rgba(139,92,246,0.20)', color:'#a78bfa' },
              { label: nlpResult.date,         bg:'rgba(251,191,36,0.15)', color:'#fbbf24' },
            ].map((t,i)=>(
              <span key={i} className="text-[10px] font-semibold px-2 py-0.5 rounded-lg"
                style={{ background:t.bg, color:t.color }}>{t.label}</span>
            ))}
          </div>
        </div>
      )}

      {nlpError && (
        <p className="text-xs font-medium relative z-10 animate-fade-in" style={{ color:'#f87171' }}>❌ {nlpError}</p>
      )}
    </div>
  )
}

/* ── MAIN FORM ── */
export default function AddTransaction({ editData, onEditDone, defaultType, onTypeConsumed }) {
  const { addTransaction, updateTransaction, customCategories, transactions, parseNLPTransaction, setActiveTab } = useApp()
  const [form, setForm]             = useState(defaultForm)
  const [successData, setSuccessData] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [suggestionApplied, setSuggestionApplied] = useState(false)
  const suggestTimer = useRef(null)

  const [nlpInput, setNlpInput]       = useState('')
  const [nlpParsing, setNlpParsing]   = useState(false)
  const [nlpResult, setNlpResult]     = useState(null)
  const [nlpError, setNlpError]       = useState('')
  const [nlpListening, setNlpListening] = useState(false)
  const nlpRecogRef = useRef(null)

  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const catDropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(event.target)) {
        setCatDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (editData) setForm({ ...defaultForm, ...editData })
    else setForm(defaultForm)
  }, [editData])

  useEffect(() => {
    if (defaultType && !editData) { setForm(p => ({ ...p, type: defaultType })); onTypeConsumed?.() }
  }, [defaultType, editData, onTypeConsumed])

  const handleChange = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (field === 'description') {
      setSuggestionApplied(false)
      if (suggestTimer.current) clearTimeout(suggestTimer.current)
      suggestTimer.current = setTimeout(() => {
        const r = suggestCategory(value, transactions, customCategories)
        setSuggestion(r)
      }, 300)
    }
  }

  const handleSubmit = async () => {
    const amt = Number(form.amount)
    if (!amt || amt <= 0 || !form.description?.trim()) return
    setSubmitting(true)
    try {
      if (editData) { await updateTransaction(editData.id, { ...form, amount: amt, description: form.description.trim() }); onEditDone?.() }
      else { const sub = { ...form, amount: amt, description: form.description.trim() }; await addTransaction(sub); setForm({ ...defaultForm, date: new Date().toISOString().split('T')[0] }); setSuccessData(sub) }
    } catch(e) { console.error(e) }
    setSubmitting(false)
  }

  const isEdit = !!editData

  return (
    <>
      {successData && (
        <SuccessToast data={successData} onClose={()=>setSuccessData(null)} onGoHome={()=>setActiveTab('dashboard')} />
      )}

      <div className="space-y-4 animate-slide-up">
        {/* Page title */}
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color:'rgba(255,255,255,0.95)' }}>
            {isEdit ? '✏️ Edit Transaction' : '➕ New Transaction'}
          </h2>
          <p className="text-sm mt-1" style={{ color:'rgba(255,255,255,0.45)' }}>
            {isEdit ? 'Edit your transaction' : 'Add new income or expense'}
          </p>
        </div>

        {/* Responsive dual-column layout on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Transaction Core Data */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Smart Add bar */}
            {!isEdit && (
              <SmartAddBar
                nlpInput={nlpInput} setNlpInput={setNlpInput}
                nlpParsing={nlpParsing} nlpResult={nlpResult}
                nlpError={nlpError} nlpListening={nlpListening}
                onParse={async () => {
                  if (!nlpInput.trim() || nlpParsing) return
                  setNlpParsing(true); setNlpError(''); setNlpResult(null)
                  const r = await parseNLPTransaction(nlpInput)
                  if (r) { setNlpResult(r); setForm(r); setNlpInput('') }
                  else setNlpError('Could not parse. Try again!')
                  setNlpParsing(false)
                }}
                onVoice={() => {
                  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
                  if (!SR) { alert('Voice input not supported. Use Chrome.'); return }
                  if (nlpListening) { nlpRecogRef.current?.stop(); setNlpListening(false); return }
                  const r = new SR(); r.lang = navigator.language || 'en-US'; r.interimResults = false
                  r.onresult = e => { setNlpInput(e.results[0][0].transcript); setNlpListening(false) }
                  r.onerror = r.onend = () => setNlpListening(false)
                  nlpRecogRef.current = r; r.start(); setNlpListening(true)
                }}
                onClearResult={() => setNlpResult(null)}
              />
            )}

            {/* Debit / Credit toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl"
              style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)' }}>
              {[
                { value:'debit',  label:'💸 Debit (Expense)', activeGrad:'linear-gradient(135deg,rgba(244,63,94,0.85),rgba(239,68,68,0.80))', activeShadow:'rgba(244,63,94,0.40)' },
                { value:'credit', label:'💰 Credit (Income)', activeGrad:'linear-gradient(135deg,rgba(34,197,94,0.85),rgba(16,185,129,0.80))', activeShadow:'rgba(34,197,94,0.40)' },
              ].map(({ value, label, activeGrad, activeShadow }) => (
                <button key={value} onClick={() => handleChange('type', value)}
                  className="py-3 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95"
                  style={form.type === value
                    ? { background:activeGrad, color:'white', boxShadow:`0 4px 16px ${activeShadow}` }
                    : { color:'rgba(255,255,255,0.40)' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <GlassLabel>Amount (₹) *</GlassLabel>
              <GlassInput
                type="number" inputMode="decimal" placeholder="0.00"
                value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
                className="font-display font-bold text-2xl"
              />
            </div>

            {/* Description */}
            <div>
              <GlassLabel>Description *</GlassLabel>
              <GlassInput
                type="text" placeholder="e.g. College tiffin, Bus fare..."
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
              />
              {suggestion && !suggestionApplied && form.category !== suggestion.category && (
                <button onClick={() => { handleChange('category', suggestion.category); setSuggestionApplied(true) }}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold animate-fade-in active:scale-95 transition-transform"
                  style={{ background:'rgba(139,92,246,0.18)', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.30)' }}>
                  <Sparkles size={12} />
                  Auto: <span className="font-bold">{suggestion.category}</span>
                  <span style={{ color:'rgba(167,139,250,0.60)' }}>· {suggestion.source==='history'?'from history':'suggested'}</span>
                </button>
              )}
            </div>

          </div>

          {/* Right Column: Transaction Parameters & Metadata */}
          <div className="lg:col-span-7 space-y-4 bg-white/[0.01] dark:bg-[#1A1A1D]/25 border border-black/[0.04] dark:border-white/[0.04] lg:p-6 lg:rounded-3xl shadow-xs">
            
            {/* Date */}
            <div>
              <GlassLabel>Date *</GlassLabel>
              <GlassInput
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
              />
            </div>

            {/* Category selection */}
            <div className="relative" ref={catDropdownRef}>
              <GlassLabel>Category</GlassLabel>
              <button
                type="button"
                onClick={() => setCatDropdownOpen(p => !p)}
                className="w-full px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 flex items-center justify-between active:scale-[0.99]"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1.5px solid rgba(255,255,255,0.16)',
                  color: 'rgba(255,255,255,0.92)',
                }}
              >
                <span>{form.category}</span>
                <ChevronDown size={15} className={`transition-transform duration-200 ${catDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'rgba(255,255,255,0.40)' }} />
              </button>

              {catDropdownOpen && (
                <div className="absolute left-0 right-0 mt-2 p-2 rounded-2xl backdrop-blur-xl border border-white/[0.08] shadow-2xl z-[100] max-h-60 overflow-y-auto"
                  style={{
                    background: 'rgba(26, 26, 29, 0.96)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {customCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          handleChange('category', cat);
                          setCatDropdownOpen(false);
                        }}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 text-left flex items-center justify-between hover:bg-white/[0.06] active:scale-95"
                        style={form.category === cat
                          ? { background: 'linear-gradient(135deg,rgba(34,197,94,0.18),rgba(16,185,129,0.15))', color: '#4ade80', border: '1px solid rgba(34,197,94,0.30)' }
                          : { background: 'transparent', color: 'rgba(255,255,255,0.60)', border: '1px solid transparent' }}
                      >
                        <span className="truncate">{cat}</span>
                        {form.category === cat && <span className="text-[8px] text-[#4ade80]">●</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <TagsInput tags={form.tags||[]} onChange={t => handleChange('tags',t)} allTransactions={transactions} />

            {/* Notes */}
            <div>
              <GlassLabel><StickyNote size={11} className="inline mr-1" />Notes (optional)</GlassLabel>
              <textarea
                placeholder="Add any extra notes..."
                value={form.notes||''}
                onChange={e => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none transition-all duration-200"
                style={{ background:'rgba(255,255,255,0.08)', border:'1.5px solid rgba(255,255,255,0.16)', color:'rgba(255,255,255,0.90)' }}
                onFocus={e => { e.target.style.borderColor='rgba(34,197,94,0.65)'; e.target.style.boxShadow='0 0 0 3px rgba(34,197,94,0.18)' }}
                onBlur={e => { e.target.style.borderColor='rgba(255,255,255,0.16)'; e.target.style.boxShadow='none' }}
              />
            </div>

            {/* Account type selection */}
            <div>
              <GlassLabel>Account Type</GlassLabel>
              <div className="space-y-2">
                <button onClick={() => handleChange('account','Cash')}
                  className="w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 active:scale-95"
                  style={form.account==='Cash'
                    ? { background:'linear-gradient(135deg,rgba(34,197,94,0.85),rgba(16,185,129,0.80))', color:'white', boxShadow:'0 4px 16px rgba(34,197,94,0.40)' }
                    : { background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.50)', border:'1px solid rgba(255,255,255,0.12)' }}>
                  💵 Cash
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key:'Bank', emoji:'🏦', grad:'linear-gradient(135deg,rgba(59,130,246,0.85),rgba(99,102,241,0.80))', glow:'rgba(59,130,246,0.40)' },
                    { key:'UPI',  emoji:'📱', grad:'linear-gradient(135deg,rgba(139,92,246,0.85),rgba(109,40,217,0.80))', glow:'rgba(139,92,246,0.40)' },
                  ].map(({ key, emoji, grad, glow }) => (
                    <button key={key} onClick={() => handleChange('account', key)}
                      className="py-3 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2 active:scale-95"
                      style={form.account===key
                        ? { background:grad, color:'white', boxShadow:`0 4px 16px ${glow}` }
                        : { background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.50)', border:'1px solid rgba(255,255,255,0.12)' }}>
                      {emoji} {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5 pt-2">
              <button onClick={handleSubmit}
                disabled={submitting || !form.amount || !form.description?.trim()}
                className="w-full py-4 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-95"
                style={submitting || !form.amount || !form.description?.trim()
                  ? { background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.28)', cursor:'not-allowed', border:'1px solid rgba(255,255,255,0.10)' }
                  : { background:'linear-gradient(135deg,rgba(34,197,94,0.90),rgba(16,185,129,0.85))', color:'white', boxShadow:'0 6px 24px rgba(34,197,94,0.45)', border:'1px solid rgba(34,197,94,0.50)' }}>
                {submitting ? 'Saving...' : <><PlusCircle size={18}/> {isEdit ? 'Update Transaction' : 'Add Transaction'}</>}
              </button>

              {isEdit && (
                <button onClick={onEditDone}
                  className="w-full py-3 rounded-2xl font-semibold text-sm transition-colors active:scale-95"
                  style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.45)', border:'1px solid rgba(255,255,255,0.12)' }}>
                  Cancel
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </>
  )
}
