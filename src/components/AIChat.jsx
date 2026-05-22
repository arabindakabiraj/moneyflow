/**
 * AIChat.jsx — Modern dark-themed AI chat
 * Clean bubbles, typing indicator, voice input
 */
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Sparkles, Mic, MicOff, BarChart3, TrendingUp, Wallet, Calendar, AlertTriangle, Lightbulb, Globe } from 'lucide-react'
import { useApp } from '../context/AppContext'

const QUICK_PROMPT_GROUPS = [
  {
    label: '📊 Analysis',
    prompts: [
      { icon: '💸', text: 'What am I spending most on?' },
      { icon: '📊', text: 'Give me this month\'s summary' },
      { icon: '📈', text: 'Last 3 months comparison' },
      { icon: '🔥', text: 'Top 5 biggest expenses this month' },
    ],
  },
  {
    label: '💡 Advice',
    prompts: [
      { icon: '🎯', text: 'How are my savings going?' },
      { icon: '🤖', text: 'Suggest a smart budget' },
      { icon: '💡', text: 'Tips to reduce spending' },
      { icon: '⚠️', text: 'Show unusual spending' },
    ],
  },
  {
    label: '🔮 Predict',
    prompts: [
      { icon: '🔮', text: 'How much will I spend next month?' },
      { icon: '📅', text: 'Week-wise spending pattern' },
      { icon: '🏦', text: 'Debt repayment strategy' },
      { icon: '🎉', text: 'Am I on track for my savings goal?' },
    ],
  },
]

// All prompts flattened for horizontal scroll
const ALL_QUICK_PROMPTS = QUICK_PROMPT_GROUPS.flatMap(g => g.prompts)

// Language options for voice
const VOICE_LANGS = [
  { code: 'bn-BD', label: '🇧🇩 Bengali' },
  { code: 'en-US', label: '🇺🇸 English' },
  { code: 'hi-IN', label: '🇮🇳 हिन्दी' },
  { code: 'auto', label: '🌐 Auto' },
]

export default function AIChat() {
  const { chatMessages, askGemini, getAnomalies, transactions } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceLang, setVoiceLang] = useState('bn-BD')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const bottomRef = useRef(null)
  const recognRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  const sendMessage = async (msg = input) => {
    if (!msg.trim() || loading) return
    setInput('')
    setLoading(true)
    await askGemini(msg.trim())
    setLoading(false)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Voice input via Web Speech API
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input is not supported in your browser. Use Chrome.'); return }

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
    }
    recog.onerror = () => setListening(false)
    recog.onend = () => setListening(false)
    recognRef.current = recog
    recog.start()
    setListening(true)
  }

  // Rich message renderer — handles bold, lists, code blocks, tables
  const renderMessage = (content) => {
    const lines = content.split('\n')
    return lines.map((line, j) => {
      // Code block line
      if (line.startsWith('```')) return null
      // Bullet list
      if (line.match(/^[-*•]\s/)) {
        const text = line.replace(/^[-*•]\s/, '')
        return <div key={j} className="flex gap-1.5 ml-1"><span className="text-gray-400 dark:text-white/30 flex-shrink-0">•</span><span>{renderInline(text)}</span></div>
      }
      // Numbered list
      if (line.match(/^\d+[.)]\s/)) {
        return <div key={j} className="ml-1">{renderInline(line)}</div>
      }
      // Normal line
      return <span key={j}>{renderInline(line)}{j < lines.length - 1 && <br />}</span>
    })
  }

  // Inline formatting: **bold**, `code`, _italic_
  const renderInline = (text) => {
    return text.split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/).map((part, k) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={k} className="font-bold">{part.slice(2, -2)}</strong>
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={k} className="px-1 py-0.5 bg-white/[0.06] rounded text-[11px] font-mono text-[#4F8EF7]">{part.slice(1, -1)}</code>
      if (part.startsWith('_') && part.endsWith('_'))
        return <em key={k}>{part.slice(1, -1)}</em>
      return part
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] lg:h-[calc(100vh-80px)] max-h-[1200px]">

      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(79,142,247,0.15)' }}>
            <Sparkles size={18} className="text-[#4F8EF7]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-gray-900 dark:text-white/95">AI Advisor</h2>
            <p className="text-xs text-gray-400 dark:text-white/35">Gemini-powered · Smart Financial Insights</p>
          </div>
          {/* Transaction count badge */}
          <div className="ml-auto px-2 py-1 rounded-lg" style={{ background: 'rgba(79,142,247,0.10)' }}>
            <span className="text-[10px] font-mono font-semibold text-[#4F8EF7]">{transactions.length} txns</span>
          </div>
        </div>

        {/* Quick prompts — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2 -mx-1 px-1">
          {ALL_QUICK_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => sendMessage(`${p.icon} ${p.text}`)}
              className="flex-shrink-0 text-xs px-3 py-2 rounded-xl font-medium transition-colors whitespace-nowrap"
              style={{
                background: 'rgba(79,142,247,0.08)',
                color: '#4F8EF7',
                border: '1px solid rgba(79,142,247,0.15)',
              }}>
              {p.icon} {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-none space-y-4 pb-4">
        {chatMessages.map((msg, i) => {
          const isError = msg.role === 'assistant' && msg.content.startsWith('❌')
          return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              {msg.role === 'assistant' && (
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2 flex-shrink-0 mt-1`}
                  style={{ background: isError ? 'rgba(255,107,107,0.15)' : 'rgba(79,142,247,0.15)' }}>
                  <Bot size={13} style={{ color: isError ? '#FF6B6B' : '#4F8EF7' }} />
                </div>
              )}
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                ? 'bg-[#4F8EF7] text-white rounded-br-sm'
                : isError
                  ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20 rounded-bl-sm'
                  : 'bg-white dark:bg-[#1A1A1D] text-gray-800 dark:text-white/85 border border-black/[0.06] dark:border-white/[0.06] rounded-bl-sm'
                }`}>
                {msg.role === 'assistant' ? renderMessage(msg.content) : msg.content}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start items-center gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(79,142,247,0.15)' }}>
              <Bot size={13} className="text-[#4F8EF7]" />
            </div>
            <div className="bg-white dark:bg-[#1A1A1D] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#4F8EF7] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Language picker (above input) */}
      {showLangPicker && (
        <div className="flex-shrink-0 flex gap-1.5 pb-2 animate-fade-in">
          {VOICE_LANGS.map(lang => (
            <button key={lang.code} onClick={() => { setVoiceLang(lang.code); setShowLangPicker(false) }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all"
              style={voiceLang === lang.code
                ? { background: '#4F8EF7', color: 'white' }
                : { background: 'var(--mf-surface-2)', color: 'rgba(255,255,255,0.50)' }
              }>
              {lang.label}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 pt-2 pb-1">
        <div className="flex gap-2 items-end rounded-2xl p-2"
          style={{ background: 'var(--mf-surface)', border: '1px solid var(--mf-border)' }}>
          {/* Voice button */}
          <button onClick={toggleVoice} onContextMenu={(e) => { e.preventDefault(); setShowLangPicker(p => !p) }}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={listening
              ? { background: '#FF6B6B', color: 'white' }
              : { background: 'var(--mf-surface-2)', color: 'rgba(255,255,255,0.35)' }
            }
            title="Tap: voice input · Right-click: change language">
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={listening ? '🎤 Speak now...' : 'Ask anything in any language...'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-800 dark:text-white/90 placeholder-white/25 resize-none outline-none py-1.5 px-2 max-h-24 leading-relaxed"
          />

          {/* Language indicator */}
          <button onClick={() => setShowLangPicker(p => !p)}
            className="flex-shrink-0 text-gray-300 dark:text-white/25 hover:text-[#4F8EF7] transition-colors px-1">
            <Globe size={12} />
          </button>

          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={loading || !input.trim()
              ? { background: 'var(--mf-surface-2)', color: 'rgba(255,255,255,0.25)' }
              : { background: '#4F8EF7', color: 'white', boxShadow: '0 4px 12px rgba(79,142,247,0.30)' }
            }>
            <Send size={16} />
          </button>
        </div>
        <p className="text-[9px] text-gray-300 dark:text-white/20 text-center mt-1">
          Voice: {VOICE_LANGS.find(l => l.code === voiceLang)?.label} · Right-click mic to change
        </p>
      </div>
    </div>
  )
}