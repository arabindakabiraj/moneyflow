/**
 * DebtTracker.jsx — Track who owes you and whom you owe
 */
import { useState } from 'react'
import { Plus, Users, ArrowUpRight, ArrowDownLeft, Check, Trash2, ChevronDown, ArrowLeft, MessageCircle, Phone, Contact } from 'lucide-react'
import { useApp } from '../context/AppContext'

/* ── Format phone for wa.me ── */
function fmtPhone(mobile) {
  if (!mobile) return null
  let num = mobile.replace(/[^\d]/g, '')
  if (num.length === 10) num = '91' + num
  return num
}

/* ── WhatsApp messages — distinct for each debt type ── */
const WA_MSGS = {
  they_owe: (name, amt, note) =>
    `Hey ${name}! 👋 Just a gentle reminder — you owe me ₹${amt}${note ? ' for "' + note + '"' : ''}. Whenever you're free, please settle up. No rush, just a friendly nudge! 🙏💰`,
  i_owe: (name, amt, note) =>
    `Hi ${name}! 🙌 Just wanted to let you know I remember I owe you ₹${amt}${note ? ' for "' + note + '"' : ''}. I'll pay you back soon, promise! Thanks for your patience 😊🤝`,
}

function waLink(mobile, name, amount, type, note) {
  const num = fmtPhone(mobile)
  if (!num) return null
  const amt = Number(amount).toLocaleString('en-IN')
  const msg = WA_MSGS[type]?.(name, amt, note) || ''
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`
}

/* ── Contact Picker API (PWA / mobile Chrome) ── */
const hasContactPicker = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window

export default function DebtTracker() {
    const { debts, addDebt, markDebtRepaid, deleteDebt, setActiveTab } = useApp()
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', amount: '', type: 'they_owe', note: '', mobile: '', date: new Date().toISOString().split('T')[0] })

    const iOwe = debts.filter(d => d.type === 'i_owe' && !d.repaid)
    const theyOwe = debts.filter(d => d.type === 'they_owe' && !d.repaid)
    const repaid = debts.filter(d => d.repaid)

    const totalIOwe = iOwe.reduce((s, d) => s + Number(d.amount), 0)
    const totalTheyOwe = theyOwe.reduce((s, d) => s + Number(d.amount), 0)

    const handleAdd = () => {
        if (!form.name.trim() || !form.amount) return
        addDebt({ ...form, amount: Number(form.amount) })
        setForm({ name: '', amount: '', type: 'they_owe', note: '', mobile: '', date: new Date().toISOString().split('T')[0] })
        setShowForm(false)
    }

    /* Pick contact from device */
    const pickContact = async () => {
        try {
            const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: false })
            if (contacts?.length) {
                const c = contacts[0]
                const name = c.name?.[0] || ''
                const tel = c.tel?.[0]?.replace(/[\s()-]/g, '') || ''
                setForm(f => ({ ...f, name: name || f.name, mobile: tel || f.mobile }))
            }
        } catch (e) {
            // user cancelled or API not available — silently ignore
        }
    }

    const DebtRow = ({ d, onRepay, onDelete }) => {
        const wa = !d.repaid ? waLink(d.mobile, d.name, d.amount, d.type, d.note) : null
        return (
            <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${d.type === 'i_owe' ? 'bg-rose-100 dark:bg-rose-900/20' : 'bg-green-100 dark:bg-green-900/20'
                    }`}>
                    {d.type === 'i_owe'
                        ? <ArrowUpRight size={16} className="text-rose-500" />
                        : <ArrowDownLeft size={16} className="text-green-500" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{d.name}</p>
                    {d.note && <p className="text-xs text-gray-400 truncate">{d.note}</p>}
                    <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400">{d.date}</p>
                        {d.mobile && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Phone size={8} /> {d.mobile}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`font-mono font-bold text-sm ${d.type === 'i_owe' ? 'text-rose-500' : 'text-green-600 dark:text-green-400'}`}>
                        ₹{Number(d.amount).toLocaleString('en-IN')}
                    </span>
                    {/* WhatsApp reminder */}
                    {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" title="Send WhatsApp reminder"
                            className="w-7 h-7 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all active:scale-90">
                            <MessageCircle size={13} />
                        </a>
                    )}
                    {!d.repaid && (
                        <button onClick={() => onRepay(d.id)}
                            className="w-7 h-7 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all" title="Mark as repaid">
                            <Check size={13} />
                        </button>
                    )}
                    <button onClick={() => onDelete(d.id)}
                        className="w-7 h-7 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => setActiveTab('settings')}
                        className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors active:scale-95">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Debt Tracker 🤝</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Track who owes you and whom you owe</p>
                    </div>
                </div>
                <button onClick={() => setShowForm(s => !s)}
                    className="w-10 h-10 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 active:scale-95 transition-all">
                    <Plus size={20} />
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 text-center">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">🏦 To Receive</p>
                    <p className="font-display font-bold text-xl text-green-700 dark:text-green-400">₹{totalTheyOwe.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-green-500 mt-0.5">{theyOwe.length} pending</p>
                </div>
                <div className="card bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 text-center">
                    <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">💸 To Pay</p>
                    <p className="font-display font-bold text-xl text-rose-600 dark:text-rose-400">₹{totalIOwe.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-rose-400 mt-0.5">{iOwe.length} to pay</p>
                </div>
            </div>

            {/* Add form */}
            {showForm && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 space-y-3">
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">➕ Add New Debt</p>
                    {/* Type toggle */}
                    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        {[{ v: 'they_owe', l: '💰 They Owe Me' }, { v: 'i_owe', l: '💸 I Owe Them' }].map(({ v, l }) => (
                            <button key={v} onClick={() => setForm(f => ({ ...f, type: v }))}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${form.type === v ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow' : 'text-gray-500'}`}>{l}</button>
                        ))}
                    </div>
                    {/* Name + Contact Picker */}
                    <div className="flex gap-2">
                        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Name (e.g. Rahul, Mom)"
                            className="input-field flex-1 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm" />
                        {hasContactPicker && (
                            <button type="button" onClick={pickContact}
                                className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all active:scale-95 shrink-0"
                                title="Pick from contacts">
                                <Contact size={18} />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="tel" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                            placeholder="Mobile (e.g. 9876543210)"
                            className="input-field w-full pl-9 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm" />
                    </div>
                    <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="Amount (₹)"
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm font-mono" />
                    <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                        placeholder="Reason (optional)"
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm" />
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="input-field w-full bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white text-sm" />
                    <div className="flex gap-2">
                        <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Cancel</button>
                        <button onClick={handleAdd} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-brand-500 text-white shadow-md shadow-brand-500/30">Save</button>
                    </div>
                </div>
            )}

            {/* They owe me */}
            {theyOwe.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">💰 They Owe Me ({theyOwe.length})</p>
                    {theyOwe.map(d => <DebtRow key={d.id} d={d} onRepay={markDebtRepaid} onDelete={deleteDebt} />)}
                </div>
            )}

            {/* I owe */}
            {iOwe.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">💸 I Owe ({iOwe.length})</p>
                    {iOwe.map(d => <DebtRow key={d.id} d={d} onRepay={markDebtRepaid} onDelete={deleteDebt} />)}
                </div>
            )}

            {/* Repaid */}
            {repaid.length > 0 && (
                <div className="card bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 opacity-60">
                    <p className="font-semibold text-sm text-gray-500 mb-2">✅ Settled ({repaid.length})</p>
                    {repaid.map(d => <DebtRow key={d.id} d={d} onRepay={() => { }} onDelete={deleteDebt} />)}
                </div>
            )}

            {debts.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-5xl mb-3">🤝</p>
                    <p className="text-gray-500 dark:text-gray-400 font-semibold">No debts!</p>
                    <p className="text-gray-400 text-sm mt-1">Tap + to add a record</p>
                </div>
            )}
        </div>
    )
}
