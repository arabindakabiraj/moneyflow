/**
 * SmartAdd.jsx — AI-powered natural language transaction entry
 * iOS 18 Liquid Glass design with glowing focused input panel
 */
import { useState, useRef, useEffect } from 'react'
import { Sparkles, Mic, MicOff, Send, ArrowLeft, ArrowDownLeft, ArrowUpRight, Loader2, X, CheckCircle, Edit3, Globe } from 'lucide-react'
import { useApp } from '../context/AppContext'

const VOICE_LANGS = [
  { code: 'en-US', label: '🇺🇸 English' },
  { code: 'bn-BD', label: '🇧🇩 Bengali' },
  { code: 'hi-IN', label: '🇮🇳 Hindi' },
  { code: 'auto', label: '🌐 Auto' },
]

const EXAMPLES = [
  '💸 "spent 200 on bus today"',
  '🍱 "lunch 150 yesterday"',
  '💰 "received 5000 salary"',
  '☕ "coffee 80 rupees"',
  '🚌 "uber 350 last friday"',
]

export default function SmartAdd() {
  const { parseNLPTransaction, addTransaction, setActiveTab, customCategories } = useApp()
  const [input, setInput]             = useState('')
  const [parsing, setParsing]         = useState(false)
  const [parsedData, setParsedData]   = useState(null)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')
  const [listening, setListening]     = useState(false)
  const [voiceLang, setVoiceLang]     = useState('en-US')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState({})
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef  = useRef(null)
  const recognRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('Voice not supported. Use Chrome.'); return }
    if (listening) { recognRef.current?.stop(); setListening(false); return }
    const recog = new SR()
    recog.lang = voiceLang === 'auto' ? navigator.language : voiceLang
    recog.interimResults = false
    recog.onresult = (e) => { const t = e.results[0][0].transcript; setInput(t); setListening(false); handleParse(t) }
    recog.onerror  = () => setListening(false)
    recog.onend    = () => setListening(false)
    recognRef.current = recog
    recog.start()
    setListening(true)
  }

  const handleParse = async (text = input) => {
    if (!text.trim()) return
    setError(''); setSuccess(''); setParsedData(null); setParsing(true)
    try {
      const result = await parseNLPTransaction(text.trim())
      if (result) { setParsedData(result); setEditForm({ ...result }) }
      else setError('Could not understand. Try something like "spent 200 on food today"')
    } catch { setError('AI parsing failed. Please try again.') }
    setParsing(false)
  }

  const handleAdd = async (type) => {
    const data = editing ? editForm : parsedData
    if (!data) return
    try {
      await addTransaction({ ...data, type, amount: Number(data.amount) })
      setSuccess(type === 'credit' ? '💰 Income added!' : '💸 Expense added!')
      setParsedData(null); setEditForm({}); setInput(''); setEditing(false)
      setTimeout(() => setActiveTab('dashboard'), 1500)
    } catch { setError('Failed to save. Try again.') }
  }

  const resetAll = () => {
    setParsedData(null); setEditForm({}); setInput(''); setError(''); setSuccess(''); setEditing(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setActiveTab('dashboard')}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 lg-chip">
          <ArrowLeft size={18} style={{ color: 'rgba(255,255,255,0.70)' }} />
        </button>
        <div>
          <h2 className="font-display font-bold text-xl" style={{ color: 'rgba(255,255,255,0.95)' }}>Smart Add ✨</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Describe your transaction in natural language</p>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl animate-slide-up"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.30)' }}>
          <CheckCircle size={20} style={{ color: '#4ade80' }} />
          <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>{success}</p>
        </div>
      )}

      {/* Main input panel */}
      {!parsedData && !success && (
        <div className={`lg-surface rounded-3xl p-4 space-y-4 transition-all duration-300 ${inputFocused ? 'lg-input focused' : ''}`}>
          {/* Text input */}
          <div className="relative">
            <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-300 ${inputFocused ? 'lg-input focused' : 'lg-surface-2'}`}>
              <Sparkles size={18} style={{ color: listening ? '#4ade80' : 'rgba(139,92,246,1)', flexShrink: 0 }}
                className={listening ? 'animate-pulse' : ''} />
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleParse()}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={listening ? '🎤 Listening...' : 'e.g. "spent 200 on food today"'}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{ color: 'rgba(255,255,255,0.90)', caretColor: '#4ade80' }}
                disabled={parsing}
              />
              {input && (
                <button onClick={() => setInput('')} style={{ color: 'rgba(255,255,255,0.40)' }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 relative z-10">
            {/* Voice */}
            <button onClick={toggleVoice}
              className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${listening ? 'animate-pulse' : ''}`}
              style={listening
                ? { background: 'rgba(244,63,94,0.80)', color: 'white', boxShadow: '0 4px 20px rgba(244,63,94,0.50)', border: '1px solid rgba(244,63,94,0.50)' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.14)' }}>
              {listening ? <><MicOff size={16} /> Stop</> : <><Mic size={16} /> Voice</>}
            </button>

            {/* Parse */}
            <button onClick={() => handleParse()} disabled={parsing || !input.trim()}
              className="flex-[2] py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={parsing || !input.trim()
                ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.28)', border: '1px solid rgba(255,255,255,0.10)', cursor: 'not-allowed' }
                : { background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(109,40,217,0.85))', color: 'white', boxShadow: '0 4px 20px rgba(139,92,246,0.45)', border: '1px solid rgba(139,92,246,0.40)' }}>
              {parsing ? <><Loader2 size={16} className="animate-spin" /> Parsing...</> : <><Send size={16} /> Parse with AI</>}
            </button>
          </div>

          {/* Language picker */}
          <div className="flex items-center justify-between relative z-10">
            <button onClick={() => setShowLangPicker(p => !p)}
              className="flex items-center gap-1.5 text-[11px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.38)' }}>
              <Globe size={12} />
              Voice: {VOICE_LANGS.find(l => l.code === voiceLang)?.label}
            </button>
          </div>

          {showLangPicker && (
            <div className="flex gap-1.5 animate-fade-in relative z-10">
              {VOICE_LANGS.map(lang => (
                <button key={lang.code} onClick={() => { setVoiceLang(lang.code); setShowLangPicker(false) }}
                  className="text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition-all"
                  style={voiceLang === lang.code
                    ? { background: 'rgba(139,92,246,0.80)', color: 'white', boxShadow: '0 2px 8px rgba(139,92,246,0.40)' }
                    : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  {lang.label}
                </button>
              ))}
            </div>
          )}

          {/* Examples */}
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Try saying
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex, i) => (
                <button key={i}
                  onClick={() => setInput(ex.replace(/^[^\s]+ /, '').replace(/"/g, ''))}
                  className="text-[11px] px-2.5 py-1.5 rounded-xl font-medium transition-all active:scale-95 lg-chip"
                  style={{ color: 'rgba(139,92,246,1)' }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl animate-slide-up"
          style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.28)' }}>
          <span style={{ color: '#f87171' }}>⚠️</span>
          <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
          <button onClick={() => setError('')} className="ml-auto" style={{ color: 'rgba(255,255,255,0.40)' }}><X size={14} /></button>
        </div>
      )}

      {/* Parsed result */}
      {parsedData && !success && (
        <div className="space-y-3 animate-slide-up">
          <div className="lg-surface rounded-3xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
                  style={{ boxShadow: '0 4px 12px rgba(139,92,246,0.45)' }}>
                  <Sparkles size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>AI Parsed Result</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>Review and add as income or expense</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => setEditing(e => !e)}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
                  style={editing
                    ? { background: 'rgba(139,92,246,0.80)', color: 'white' }
                    : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <Edit3 size={11} className="inline mr-1" />{editing ? 'Done' : 'Edit'}
                </button>
                <button onClick={resetAll}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <X size={11} className="inline mr-1" />Clear
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-3 relative z-10">
              {[
                { label: 'Amount',      key: 'amount',      prefix: '₹', type: 'number' },
                { label: 'Description', key: 'description' },
                { label: 'Category',    key: 'category' },
                { label: 'Date',        key: 'date',        type: 'date' },
                { label: 'Account',     key: 'account' },
              ].map(({ label, key, prefix, type }) => (
                <div key={key} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <span className="text-xs font-medium w-24" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                  {editing ? (
                    key === 'category' ? (
                      <select value={editForm[key]||''} onChange={e => setEditForm(f => ({...f,[key]:e.target.value}))}
                        className="flex-1 text-sm text-right rounded-lg px-2 py-1.5 outline-none"
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.90)' }}>
                        {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : key === 'account' ? (
                      <select value={editForm[key]||'Cash'} onChange={e => setEditForm(f => ({...f,[key]:e.target.value}))}
                        className="flex-1 text-sm text-right rounded-lg px-2 py-1.5 outline-none"
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.90)' }}>
                        {['Cash','Bank','UPI'].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    ) : (
                      <input type={type||'text'} value={editForm[key]||''}
                        onChange={e => setEditForm(f => ({...f,[key]:e.target.value}))}
                        className="flex-1 text-sm text-right rounded-lg px-2 py-1.5 outline-none"
                        style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.90)' }} />
                    )
                  ) : (
                    <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.90)' }}>
                      {prefix}{key === 'amount' ? Number(parsedData[key]).toLocaleString('en-IN') : parsedData[key]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Add buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleAdd('credit')}
              className="py-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 text-white active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.85), rgba(16,185,129,0.85))', boxShadow: '0 4px 20px rgba(34,197,94,0.45)', border: '1px solid rgba(34,197,94,0.40)' }}>
              <ArrowDownLeft size={18} /> Add as Income
            </button>
            <button onClick={() => handleAdd('debit')}
              className="py-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 text-white active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.85), rgba(239,68,68,0.80))', boxShadow: '0 4px 20px rgba(244,63,94,0.45)', border: '1px solid rgba(244,63,94,0.40)' }}>
              <ArrowUpRight size={18} /> Add as Expense
            </button>
          </div>

          <button onClick={resetAll}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-colors active:scale-95 lg-chip"
            style={{ color: 'rgba(255,255,255,0.55)' }}>
            ← Try another transaction
          </button>
        </div>
      )}
    </div>
  )
}
