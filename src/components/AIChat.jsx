/**
 * AIChat.jsx — Gemini AI with voice input + rich prompts + anomaly prompts
 */
import { useState, useRef, useEffect } from 'react'
import { Send, Bot, Sparkles, Mic, MicOff } from 'lucide-react'
import { useApp } from '../context/AppContext'

const QUICK_PROMPTS = [
  '💸 কোন বিষয়ে বেশি খরচ?',
  '🎯 সঞ্চয় কেমন হচ্ছে?',
  '📊 এই মাসের summary দাও',
  '🤖 Smart budget suggest করো',
  '⚠️ অস্বাভাবিক খরচ দেখাও',
  '💡 খরচ কমানোর টিপস',
]

export default function AIChat() {
  const { chatMessages, askGemini, getAnomalies } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
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

  // Voice input via Web Speech API (Chrome only)
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('তোমার browser এ voice input support নেই। Chrome ব্যবহার করো।'); return }

    if (listening) {
      recognRef.current?.stop()
      setListening(false)
      return
    }

    const recog = new SR()
    recog.lang = 'bn-BD'
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

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px - 72px)' }}>

      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h2 className="font-display font-bold text-gray-900 dark:text-white">AI Advisor</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gemini-powered financial insights</p>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-2 -mx-1 px-1">
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => sendMessage(p)}
              className="flex-shrink-0 text-xs px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl border border-purple-100 dark:border-purple-800/40 font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors whitespace-nowrap">
              {p}
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
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center mr-2 flex-shrink-0 mt-1 ${isError ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'
                  }`}>
                  <Bot size={13} className="text-white" />
                </div>
              )}
              <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-violet-600 text-white rounded-br-none shadow-md'
                  : isError
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 rounded-bl-none shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-sm'
                }`}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>
                    {line.split(/(\*\*[^*]+\*\*)/).map((part, k) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={k} className="font-bold">{part.slice(2, -2)}</strong>
                        : part
                    )}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          )
        })}

        {loading && (
          <div className="flex justify-start items-center gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot size={13} className="text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 pt-2 pb-1">
        <div className="flex gap-2 items-end bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-2 shadow-lg">
          {/* Voice button */}
          <button onClick={toggleVoice}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${listening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30'
              }`}>
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder={listening ? '🎤 কথা বলো...' : 'তোমার প্রশ্ন লিখো বা বলো...'}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none outline-none py-1.5 px-2 max-h-24 leading-relaxed"
          />

          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${loading || !input.trim()
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md active:scale-95'
              }`}>
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}