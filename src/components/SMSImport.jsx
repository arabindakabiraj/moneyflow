/**
 * SMSImport.jsx — Import transactions from bank SMS with a polished UI
 */
import { useState } from 'react'
import { ArrowLeft, MessageSquare, CheckCircle, Trash2, Plus, UploadCloud, Sparkles, FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { parseBulkSMS } from '../utils/smsParser'

const SAMPLE_SMS = `SBI: Your a/c X1234 debited Rs.500.00 on 05-Mar-26 by UPI/PhonePe. Bal Rs.12,345.00
HDFC: INR 2,000.00 credited to a/c XX5678 on 04/03/26. Avl Bal: INR 45,678.90
ICICI: Rs 150 spent on your card ending 9012 at Swiggy on 03-Mar-26.`

export default function SMSImport() {
  const { addTransaction, setActiveTab, customCategories } = useApp()

  const [smsText, setSmsText] = useState('')
  const [parsed, setParsed] = useState([])
  const [imported, setImported] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleParse = () => {
    const results = parseBulkSMS(smsText)
    setParsed(results.map(r => ({ ...r, selected: true })))
  }

  const updateParsed = (index, field, value) => {
    setParsed(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const removeParsed = (index) => {
    setParsed(prev => prev.filter((_, i) => i !== index))
  }

  const importAll = async () => {
    const toImport = parsed.filter(p => p.selected)
    let count = 0
    for (const tx of toImport) {
      await addTransaction({
        type: tx.type, amount: tx.amount, description: tx.description,
        date: tx.date, category: tx.category, account: tx.account,
      })
      count++
    }
    setImported(count)
    setShowSuccess(true)
    setParsed([])
    setSmsText('')
    setTimeout(() => setShowSuccess(false), 4000)
  }

  const importSingle = async (tx, index) => {
    await addTransaction({
      type: tx.type, amount: tx.amount, description: tx.description,
      date: tx.date, category: tx.category, account: tx.account,
    })
    removeParsed(index)
    setImported(prev => prev + 1)
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <button onClick={() => setActiveTab('settings')}
          className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">SMS Import</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Auto-parse bank SMS into transactions</p>
        </div>
      </div>

      {/* Success card */}
      {showSuccess && (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white text-center p-6 shadow-xl shadow-emerald-500/20 animate-bounce-in relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10" />
          <CheckCircle size={36} className="mx-auto mb-3" />
          <p className="font-display font-bold text-xl">🎉 {imported} Imported!</p>
          <p className="text-white/60 text-sm mt-1">Check your Transactions tab</p>
        </div>
      )}

      {/* Input area */}
      {parsed.length === 0 && !showSuccess && (
        <div className="rounded-3xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-5 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">
              Paste Bank SMS
            </label>
            <textarea
              value={smsText}
              onChange={e => setSmsText(e.target.value)}
              placeholder="Paste one or more bank SMS messages here..."
              rows={5}
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-gray-900 dark:text-white text-xs font-mono resize-none outline-none focus:ring-2 focus:ring-brand-500/40 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 leading-relaxed"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={handleParse} disabled={!smsText.trim()}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2">
              <Sparkles size={15} /> Parse Messages
            </button>
            <button onClick={() => setSmsText(SAMPLE_SMS)}
              className="px-4 py-3.5 rounded-2xl text-sm font-bold bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-600/50 active:scale-95 transition-transform">
              <FileText size={15} />
            </button>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100/50 dark:border-brand-800/20 p-4">
            <p className="text-xs text-brand-700 dark:text-brand-300 font-bold mb-2">💡 How it works</p>
            <div className="space-y-1.5">
              {[
                'Copy bank SMS from your phone messages',
                'Paste them here — one or multiple',
                'Supports SBI, HDFC, ICICI, Axis, PhonePe, GPay',
                'Review & edit before importing',
              ].map((text, i) => (
                <p key={i} className="text-[11px] text-brand-600/70 dark:text-brand-400/70 flex items-start gap-2">
                  <span className="text-brand-400 mt-0.5">•</span> {text}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Parsed results */}
      {parsed.length > 0 && (
        <>
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {parsed.length} Transaction{parsed.length > 1 ? 's' : ''} Found
            </p>
            <button onClick={() => setParsed([])} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
              Clear
            </button>
          </div>

          <div className="space-y-3">
            {parsed.map((tx, i) => (
              <div key={i} className="rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-4 space-y-3">
                {/* Type badge + meta */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider ${tx.type === 'credit'
                    ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-900/15 text-rose-600 dark:text-rose-400'}`}>
                    {tx.type}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{tx.account} • {tx.date}</span>
                  <div className="flex-1" />
                  <button onClick={() => removeParsed(i)} className="text-gray-300 dark:text-gray-600 hover:text-rose-500 transition-colors active:scale-90">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-2 gap-2">
                  <input value={tx.description} onChange={e => updateParsed(i, 'description', e.target.value)}
                    className="col-span-2 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500/40 transition-all" />
                  <input type="number" value={tx.amount} onChange={e => updateParsed(i, 'amount', Number(e.target.value))}
                    className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-sm font-mono font-bold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500/40 transition-all" />
                  <select value={tx.category} onChange={e => updateParsed(i, 'category', e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-brand-500/40 transition-all">
                    {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Raw preview */}
                <p className="text-[10px] text-gray-300 dark:text-gray-600 font-mono leading-relaxed line-clamp-1">{tx.raw}</p>

                {/* Import single */}
                <button onClick={() => importSingle(tx, i)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800/20 active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5">
                  <Plus size={13} /> Add This
                </button>
              </div>
            ))}
          </div>

          {/* Import all */}
          <button onClick={importAll}
            className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <CheckCircle size={16} /> Import All ({parsed.filter(p => p.selected).length})
          </button>
        </>
      )}
    </div>
  )
}
