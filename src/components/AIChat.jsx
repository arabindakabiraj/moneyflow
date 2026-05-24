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
  const [voiceLang, setVoiceLang] = useState('auto')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [createdGoalToast, setCreatedGoalToast] = useState(null)
  
  const [availableVoices, setAvailableVoices] = useState([])
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => localStorage.getItem('mf_selected_voice') || '')

  const bottomRef = useRef(null)
  const recognRef = useRef(null)
  const sendTimeoutRef = useRef(null)
  const voiceTranscriptRef = useRef('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  useEffect(() => {
    const handleGoalCreated = (e) => {
      setCreatedGoalToast(e.detail)
      const timer = setTimeout(() => {
        setCreatedGoalToast(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
    window.addEventListener('ai-goal-created', handleGoalCreated)
    return () => {
      window.removeEventListener('ai-goal-created', handleGoalCreated)
    }
  }, [])

  // Helper to fetch matching voices for active language and sort female voices to the top
  const getLanguageMatchingVoices = () => {
    if (!('speechSynthesis' in window)) return []
    const voices = window.speechSynthesis.getVoices()
    
    let currentLang = voiceLang
    if (voiceLang === 'auto') {
      currentLang = navigator.language
    }
    const primaryLang = currentLang.split('-')[0].toLowerCase()

    const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(primaryLang))

    // Exclude compact robotic voices
    const filtered = langVoices.filter(v => !v.name.toLowerCase().includes('compact'))
    
    const isFemale = (name) => {
      const femaleNames = [
        'female', 'woman', 'lady', 'girl', 'samantha', 'sangeeta', 'lekha', 'oishi', 
        'kalpana', 'karen', 'moira', 'tessa', 'fiona', 'veena', 'victoria', 'hazel', 
        'zira', 'susan', 'ava', 'allison', 'zoe', 'siri', 'heera', 'haruka', 'sayaka', 
        'nanami', 'jiatong', 'xiaoxiao', 'huihui', 'yaoyao', 'kanya', 'nora', 'google'
      ]
      return femaleNames.some(f => name.toLowerCase().includes(f))
    }

    return filtered.sort((a, b) => {
      const aFem = isFemale(a.name) ? 1 : 0
      const bFem = isFemale(b.name) ? 1 : 0
      return bFem - aFem
    })
  }

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    
    const updateVoices = () => {
      const matching = getLanguageMatchingVoices()
      setAvailableVoices(matching)
      
      const stored = localStorage.getItem('mf_selected_voice')
      if (stored && matching.some(v => v.name === stored)) {
        setSelectedVoiceName(stored)
      } else if (matching.length > 0) {
        setSelectedVoiceName(matching[0].name)
      }
    }

    updateVoices()
    
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices)
    }
  }, [voiceLang])

  useEffect(() => {
    // Warm up the voices list early for low latency and correct voice matching
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices()
      }
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current)
      }
    }
  }, [])

  // Clean and speak messages via Text-to-Speech
  const speakMessage = (text) => {
    if (!('speechSynthesis' in window)) return

    // Ensure the speech synthesis is not paused before canceling to clear the queue properly
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
    window.speechSynthesis.cancel()

    // Strip out markdown, code blocks, lists, emojis, and replace Indian rupee symbol with text
    // Replace structural list bullets and newlines with commas to introduce natural human conversational pauses.
    let cleanText = text
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/\*\*|`|_/g, '')      // remove markdown indicators
      .replace(/[-*•]\s+/g, ', ')     // replace list bullets with a comma for a natural pause
      .replace(/₹/g, 'Rupees ')       // speak currency symbol
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]|[\u{1F191}-\u{1F19A}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F0F5}]|[\u{1F300}-\u{1F5FF}]|[\u{1F900}-\u{1F9FF}]/gu, '') // remove emojis
      .replace(/\p{Emoji_Presentation}/gu, '') // remove presentation emojis
      .replace(/\p{Extended_Pictographic}/gu, '') // remove pictographic emojis
      .replace(/\n+/g, ', ')          // replace newlines with commas for natural phrasing pauses
      .trim()

    if (!cleanText) return

    const utterance = new SpeechSynthesisUtterance(cleanText)
    let langCode = voiceLang === 'auto' ? navigator.language : voiceLang

    // Smart auto-detect helper for Bengali and Hindi scripts
    if (voiceLang === 'auto') {
      if (/[\u0980-\u09FF]/.test(cleanText)) {
        langCode = 'bn-BD'
      } else if (/[\u0900-\u097F]/.test(cleanText)) {
        langCode = 'hi-IN'
      } else {
        langCode = 'en-US'
      }
    }

    utterance.lang = langCode

    const primaryLang = langCode.split('-')[0].toLowerCase()
    
    // Set parameters for crystal clear, natural human-like voice quality
    utterance.pitch = 0.97 // Standard human pitch (prevents synthetic chipmunk or robotic distortion)
    utterance.rate = 0.88  // Relaxed, natural human conversational pacing
    utterance.volume = 1.0 // Ensure full clarity and volume

    // Match voices by primary language prefix (e.g. 'bn' covers 'bn-IN' and 'bn-BD')
    const voices = window.speechSynthesis.getVoices()
    const matchingLangVoices = voices.filter(v => 
      v.lang.toLowerCase().startsWith(primaryLang)
    )

    // Score voices to select the best human-like premium female voice
    const scoreVoice = (v) => {
      const name = v.name.toLowerCase()
      let score = 0
      
      // Avoid compact/robotic voice versions
      if (name.includes('compact')) score -= 30
      
      // Avoid male voices
      const maleNames = ['male', 'guy', 'man', 'david', 'george', 'mark', 'ravi', 'niloy', 'microsoft david', 'microsoft james', 'google male']
      if (maleNames.some(m => name.includes(m))) score -= 50

      // Priority high-quality indicators (enhanced, premium, siri, neural, natural, wavenet)
      const premiumQualityKeys = ['enhanced', 'premium', 'siri', 'neural', 'natural', 'wavenet']
      premiumQualityKeys.forEach(k => {
        if (name.includes(k)) score += 25
      })

      // Premium sweet/natural female names/keys
      const premiumFemaleNames = [
        'samantha', 'sangeeta', 'lekha', 'oishi', 'oishik', 'kalpana', 'karen', 
        'moira', 'tessa', 'fiona', 'veena', 'victoria', 'hazel', 'zira', 'susan', 
        'anna', 'linda', 'sara', 'zofia', 'ting-ting', 'yating', 'kyoko', 'amira',
        'ava', 'allison', 'zoe', 'siri', 'heera', 'haruka', 'sayaka', 'nanami', 
        'jiatong', 'xiaoxiao', 'huihui', 'yaoyao', 'kanya', 'nora',
        'female', 'woman', 'lady', 'girl', 'sweet', 'natural', 'google'
      ]
      
      premiumFemaleNames.forEach(keyword => {
        if (name.includes(keyword)) {
          score += 10
        }
      })

      return score
    }

    let selectedVoice = null
    if (selectedVoiceName) {
      selectedVoice = voices.find(v => v.name === selectedVoiceName)
    }

    if (!selectedVoice && matchingLangVoices.length > 0) {
      // Sort matching voices by score descending to choose the absolute best female voice
      const sortedVoices = [...matchingLangVoices].sort((a, b) => scoreVoice(b) - scoreVoice(a))
      selectedVoice = sortedVoices[0]
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice
    }

    utterance.onstart = () => console.log('Speech synthesis started.')
    utterance.onend = () => console.log('Speech synthesis ended.')
    utterance.onerror = (e) => console.error('Speech synthesis utterance error:', e)

    window.speechSynthesis.speak(utterance)
  }

  const sendMessage = async (msg = input, isVoice = false) => {
    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current)
      sendTimeoutRef.current = null
    }

    // Stop active voice recognition if user sends a message
    if (recognRef.current) {
      try {
        recognRef.current.stop()
      } catch (e) {
        console.error('Error stopping recognition:', e)
      }
    }
    setListening(false)
    voiceTranscriptRef.current = ''

    if (!msg.trim() || loading) return
    setInput('')
    setLoading(true)
    const reply = await askGemini(msg.trim())
    setLoading(false)
    if (isVoice && reply) {
      speakMessage(reply)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Voice input via Web Speech API
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice input is not supported in your browser. Use Chrome.'); return }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      // Prime the speech engine with an empty utterance under user-gesture context to bypass browser restrictions
      try {
        const primingUtterance = new SpeechSynthesisUtterance('')
        primingUtterance.volume = 0
        window.speechSynthesis.speak(primingUtterance)
      } catch (e) {
        console.error('Speech synthesis priming failed:', e)
      }
    }

    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current)
      sendTimeoutRef.current = null
    }

    if (listening) {
      recognRef.current?.stop()
      setListening(false)
      return
    }

    voiceTranscriptRef.current = ''

    const recog = new SR()
    recog.lang = voiceLang === 'auto' ? navigator.language : voiceLang
    recog.interimResults = false
    recog.continuous = true // Keep listening to capture pauses
    
    recog.onresult = (e) => {
      let finalTranscript = ''
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript
        }
      }
      
      const newText = finalTranscript.trim()
      if (!newText) return

      // Accumulate text and update input area
      voiceTranscriptRef.current = voiceTranscriptRef.current
        ? `${voiceTranscriptRef.current} ${newText}`
        : newText
      setInput(voiceTranscriptRef.current)
      
      // Reset the 1.5-second silence detection timer
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current)
      }
      
      sendTimeoutRef.current = setTimeout(() => {
        const textToSend = voiceTranscriptRef.current
        sendMessage(textToSend, true)
        recog.stop()
        setListening(false)
      }, 1500)
    }
    
    recog.onerror = (err) => {
      console.error('SpeechRecognition error:', err)
      setListening(false)
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current)
        sendTimeoutRef.current = null
      }
    }
    
    recog.onend = () => {
      if (!sendTimeoutRef.current) {
        setListening(false)
      }
    }
    
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
    <div className="flex flex-col h-[calc(100vh-150px)] lg:h-[calc(100vh-80px)] max-h-[1200px] relative">

      {/* AI Automated Goal Confirmation Toast */}
      {createdGoalToast && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-[100] max-w-sm w-full bg-[#0b1b17]/95 border border-[#14b8a6]/30 rounded-2xl shadow-[0_20px_50px_rgba(20,184,166,0.15)] p-4 flex gap-3.5 animate-modal-toast-slide-in backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/20 flex items-center justify-center shrink-0 text-[#14B8A6]">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">AI Goal Automated</span>
              <button
                type="button"
                onClick={() => setCreatedGoalToast(null)}
                className="text-white/40 hover:text-white/70 text-xs border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-semibold text-white/90 leading-tight">
              Successfully created goal: <strong className="text-[#34D399]">"{createdGoalToast.name}"</strong> with a target of <strong className="text-[#34D399]">₹{Number(createdGoalToast.target).toLocaleString()}</strong>!
            </p>
          </div>
        </div>
      )}

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

      {/* Voice Settings Panel */}
      {showLangPicker && (
        <div className="flex-shrink-0 bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl p-3 mb-2 animate-fade-in space-y-3 shadow-lg">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider">Voice Language</span>
            <div className="flex flex-wrap gap-1.5">
              {VOICE_LANGS.map(lang => (
                <button key={lang.code} onClick={() => { setVoiceLang(lang.code) }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all"
                  style={voiceLang === lang.code
                    ? { background: '#4F8EF7', color: 'white' }
                    : { background: 'var(--mf-surface-2)', color: 'rgba(255,255,255,0.50)' }
                  }>
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {availableVoices.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-wider">Select Voice Model</span>
                <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-400/10 px-1.5 py-0.5 rounded-md">Female voices prioritized</span>
              </div>
              <select
                value={selectedVoiceName}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedVoiceName(val)
                  localStorage.setItem('mf_selected_voice', val)
                  // Play a quick test sound of the voice
                  if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel()
                    const voicesList = window.speechSynthesis.getVoices()
                    const voiceObj = voicesList.find(v => v.name === val)
                    const currentLang = voiceLang === 'auto' ? navigator.language : voiceLang
                    const primaryLang = currentLang.split('-')[0].toLowerCase()
                    const testUtterance = new SpeechSynthesisUtterance(
                      primaryLang === 'bn' 
                        ? 'নমস্কার, আমি আপনার ফাইন্যান্সিয়াল এডভাইজার।' 
                        : primaryLang === 'hi' 
                          ? 'नमस्ते, मैं आपका वित्तीय सलाहकार हूँ।' 
                          : 'Hello, this is your AI financial advisor.'
                    )
                    testUtterance.lang = val ? voiceObj?.lang : currentLang
                    if (val && voiceObj) {
                      testUtterance.voice = voiceObj
                    }
                    testUtterance.pitch = 0.97
                    testUtterance.rate = 0.88
                    window.speechSynthesis.speak(testUtterance)
                  }
                }}
                className="w-full text-gray-800 dark:text-white/80 border border-black/[0.08] dark:border-white/[0.08] rounded-xl text-xs px-2.5 py-2 outline-none cursor-pointer focus:border-[#4F8EF7] transition-all"
                style={{ background: 'var(--mf-surface-2)' }}
              >
                {availableVoices.map(voice => (
                  <option key={voice.name} value={voice.name} className="dark:bg-[#1A1A1D] text-gray-800 dark:text-white/85">
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}
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
            className="w-8 h-10 flex items-center justify-center flex-shrink-0 text-gray-400 dark:text-white/35 hover:text-[#4F8EF7] active:scale-95 transition-all"
            title="Change voice language">
            <Globe size={16} />
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