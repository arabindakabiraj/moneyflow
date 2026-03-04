/**
 * SmartAdd.jsx — AI-powered natural language transaction entry
 * Type or speak a transaction, AI parses it, then add as Income or Expense
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
    const [input, setInput] = useState('')
    const [parsing, setParsing] = useState(false)
    const [parsedData, setParsedData] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [listening, setListening] = useState(false)
    const [voiceLang, setVoiceLang] = useState('en-US')
    const [showLangPicker, setShowLangPicker] = useState(false)
    const [editing, setEditing] = useState(false)
    const [editForm, setEditForm] = useState({})
    const inputRef = useRef(null)
    const recognRef = useRef(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Voice input via Web Speech API
    const toggleVoice = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SR) { setError('Voice not supported. Use Chrome.'); return }

        if (listening) {
            recognRef.current?.stop()
            setListening(false)
            return
        }

        const recog = new SR()
        recog.lang = voiceLang === 'auto' ? navigator.language : voiceLang
        recog.interimResults = false
        recog.onresult = (e) => {
            const transcript = e.results[0][0].transcript
            setInput(transcript)
            setListening(false)
            // Auto-parse after voice input
            handleParse(transcript)
        }
        recog.onerror = () => setListening(false)
        recog.onend = () => setListening(false)
        recognRef.current = recog
        recog.start()
        setListening(true)
    }

    const handleParse = async (text = input) => {
        if (!text.trim()) return
        setError('')
        setSuccess('')
        setParsedData(null)
        setParsing(true)

        try {
            const result = await parseNLPTransaction(text.trim())
            if (result) {
                setParsedData(result)
                setEditForm({ ...result })
            } else {
                setError('Could not understand. Try something like "spent 200 on food today"')
            }
        } catch (e) {
            setError('AI parsing failed. Please try again.')
        }
        setParsing(false)
    }

    const handleAdd = async (type) => {
        const data = editing ? editForm : parsedData
        if (!data) return

        try {
            await addTransaction({
                ...data,
                type,
                amount: Number(data.amount),
            })
            setSuccess(type === 'credit' ? '💰 Income added!' : '💸 Expense added!')
            setParsedData(null)
            setEditForm({})
            setInput('')
            setEditing(false)
            // Auto navigate home after 1.5s
            setTimeout(() => setActiveTab('dashboard'), 1500)
        } catch (e) {
            setError('Failed to save. Try again.')
        }
    }

    const resetAll = () => {
        setParsedData(null)
        setEditForm({})
        setInput('')
        setError('')
        setSuccess('')
        setEditing(false)
        inputRef.current?.focus()
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => setActiveTab('dashboard')}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Smart Add ✨</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Describe your transaction in natural language</p>
                </div>
            </div>

            {/* Success message */}
            {success && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 animate-slide-up">
                    <CheckCircle size={20} className="text-green-500" />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-400">{success}</p>
                </div>
            )}

            {/* Main input area */}
            {!parsedData && !success && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-4">
                    {/* Text input */}
                    <div className="relative">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border-2 border-gray-200 dark:border-gray-600 rounded-2xl px-4 py-3 focus-within:border-violet-500 dark:focus-within:border-violet-400 transition-colors">
                            <Sparkles size={18} className="text-violet-500 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleParse()}
                                placeholder={listening ? '🎤 Listening...' : 'e.g. "spent 200 on food today"'}
                                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
                                disabled={parsing}
                            />
                            {input && (
                                <button onClick={() => setInput('')} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        {/* Voice button */}
                        <button onClick={toggleVoice}
                            className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${listening
                                    ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600'
                                }`}>
                            {listening ? <><MicOff size={16} /> Stop</> : <><Mic size={16} /> Voice</>}
                        </button>

                        {/* Parse button */}
                        <button onClick={() => handleParse()} disabled={parsing || !input.trim()}
                            className={`flex-[2] py-3.5 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${parsing || !input.trim()
                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30'
                                }`}>
                            {parsing ? <><Loader2 size={16} className="animate-spin" /> Parsing...</> : <><Send size={16} /> Parse with AI</>}
                        </button>
                    </div>

                    {/* Language picker */}
                    <div className="flex items-center justify-between">
                        <button onClick={() => setShowLangPicker(p => !p)}
                            className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-violet-500 transition-colors">
                            <Globe size={12} />
                            Voice: {VOICE_LANGS.find(l => l.code === voiceLang)?.label}
                        </button>
                    </div>

                    {showLangPicker && (
                        <div className="flex gap-1.5 animate-fade-in">
                            {VOICE_LANGS.map(lang => (
                                <button key={lang.code} onClick={() => { setVoiceLang(lang.code); setShowLangPicker(false) }}
                                    className={`text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all ${voiceLang === lang.code
                                            ? 'bg-violet-500 text-white shadow-sm'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}>
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Examples */}
                    <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-2">Try saying</p>
                        <div className="flex flex-wrap gap-1.5">
                            {EXAMPLES.map((ex, i) => (
                                <button key={i} onClick={() => { setInput(ex.replace(/^[^\s]+ /, '').replace(/"/g, '')); }}
                                    className="text-[11px] px-2.5 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-lg font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors">
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 animate-slide-up">
                    <span className="text-rose-500">⚠️</span>
                    <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
                    <button onClick={() => setError('')} className="ml-auto text-rose-400"><X size={14} /></button>
                </div>
            )}

            {/* Parsed result preview */}
            {parsedData && !success && (
                <div className="space-y-3 animate-slide-up">
                    {/* Parsed data card */}
                    <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">AI Parsed Result</p>
                                    <p className="text-[10px] text-gray-400">Review and add as income or expense</p>
                                </div>
                            </div>
                            <div className="flex gap-1.5">
                                <button onClick={() => setEditing(e => !e)}
                                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${editing ? 'bg-violet-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                        }`}>
                                    <Edit3 size={11} className="inline mr-1" />{editing ? 'Done' : 'Edit'}
                                </button>
                                <button onClick={resetAll}
                                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500">
                                    <X size={11} className="inline mr-1" />Clear
                                </button>
                            </div>
                        </div>

                        {/* Data fields */}
                        <div className="space-y-3">
                            {[
                                { label: 'Amount', key: 'amount', prefix: '₹', type: 'number' },
                                { label: 'Description', key: 'description' },
                                { label: 'Category', key: 'category' },
                                { label: 'Date', key: 'date', type: 'date' },
                                { label: 'Account', key: 'account' },
                            ].map(({ label, key, prefix, type }) => (
                                <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium w-24">{label}</span>
                                    {editing ? (
                                        key === 'category' ? (
                                            <select value={editForm[key] || ''} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                                className="flex-1 text-sm text-right bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white outline-none focus:border-violet-500">
                                                {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        ) : key === 'account' ? (
                                            <select value={editForm[key] || 'Cash'} onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                                className="flex-1 text-sm text-right bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white outline-none focus:border-violet-500">
                                                {['Cash', 'Bank', 'UPI'].map(a => <option key={a} value={a}>{a}</option>)}
                                            </select>
                                        ) : (
                                            <input type={type || 'text'} value={editForm[key] || ''}
                                                onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                                className="flex-1 text-sm text-right bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-gray-900 dark:text-white outline-none focus:border-violet-500" />
                                        )
                                    ) : (
                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {prefix}{key === 'amount' ? Number(parsedData[key]).toLocaleString('en-IN') : parsedData[key]}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add buttons — Income / Expense */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleAdd('credit')}
                            className="py-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">
                            <ArrowDownLeft size={18} /> Add as Income
                        </button>
                        <button onClick={() => handleAdd('debit')}
                            className="py-4 rounded-2xl font-display font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-rose-400 to-rose-600 text-white shadow-lg shadow-rose-500/30 active:scale-95 transition-all">
                            <ArrowUpRight size={18} /> Add as Expense
                        </button>
                    </div>

                    {/* Try another */}
                    <button onClick={resetAll}
                        className="w-full py-3 rounded-2xl text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        ← Try another transaction
                    </button>
                </div>
            )}
        </div>
    )
}
