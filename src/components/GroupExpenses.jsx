/**
 * GroupExpenses.jsx — Premium group expense tracker with advanced splits, settlements, and PDF export
 */
import { useState, useMemo } from 'react'
import { ArrowLeft, Plus, Trash2, Users, Receipt, ArrowRightLeft, Share2, X, ChevronRight, CheckCircle, UserPlus, Settings, PieChart, Info, Edit3, DollarSign, FileText, Phone } from 'lucide-react'
import { useApp } from '../context/AppContext'

// ═══════ Settlement calculator — minimize transfers ═══════
function calculateSettlements(members, expenses) {
  const balances = {}
  // Normalize members: support both strings and {name, phone} objects
  const memberNames = (members || []).map(m => typeof m === 'string' ? m : m.name)
  memberNames.forEach(m => { balances[m] = 0 })

  expenses.forEach(exp => {
    // Person who paid gets credited
    if (exp.paidBy && balances[exp.paidBy] !== undefined) {
      balances[exp.paidBy] += Number(exp.amount)
    }
    
    // Each person owes their split
    if (exp.splits) {
      Object.entries(exp.splits).forEach(([person, amt]) => {
        if (balances[person] !== undefined) {
          balances[person] -= Number(amt)
        }
      })
    }
  })

  // Exclude settlement entries where a person is deleted from group? Just skip unknown members.
  
  const creditors = []
  const debtors = []
  Object.entries(balances).forEach(([name, bal]) => {
    if (bal > 0.05) creditors.push({ name, amount: bal })
    else if (bal < -0.05) debtors.push({ name, amount: -bal })
  })

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements = []
  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const transfer = Math.min(creditors[i].amount, debtors[j].amount)
    if (transfer > 0.05) {
      settlements.push({ from: debtors[j].name, to: creditors[i].name, amount: transfer })
    }
    creditors[i].amount -= transfer
    debtors[j].amount -= transfer
    if (creditors[i].amount < 0.05) i++
    if (debtors[j].amount < 0.05) j++
  }
  return { settlements, balances }
}

const GROUP_EMOJIS = ['🍕', '🏠', '✈️', '🎉', '🍻', '🛒', '⛽', '🎬', '💼', '🎓', '🏖️', '🚗', '🏕️', '💡', '🎸']

// ═══════ PDF Export ═══════
function exportGroupPDF(group, expenses, settlements, balances) {
  const realExpenses = expenses.filter(e => e.type !== 'settlement')
  const totalSpend = realExpenses.reduce((s, e) => s + e.amount, 0)
  const today = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

  const rows = [...expenses].reverse().map(exp => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:10px 12px;color:#374151;font-size:13px">${exp.date}</td>
      <td style="padding:10px 12px;font-weight:600;color:#111827;font-size:13px">${exp.description}</td>
      <td style="padding:10px 12px;color:#6b7280;font-size:13px">${exp.paidBy}</td>
      <td style="padding:10px 12px;text-align:right;font-weight:700;font-size:13px;color:${exp.type === 'settlement' ? '#10b981' : '#111827'}">
        ${exp.type === 'settlement' ? '⟳ ' : ''}₹${Number(exp.amount).toLocaleString('en-IN')}
      </td>
      <td style="padding:10px 12px;color:#9ca3af;font-size:12px;text-align:center;text-transform:capitalize">${exp.splitType || 'equal'}</td>
    </tr>
  `).join('')

  const settleRows = settlements.map(s => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#fffbeb;border-radius:10px;margin-bottom:6px;border:1px solid #fde68a">
      <span style="font-size:13px;font-weight:600;color:#92400e">${s.from} <span style="color:#d97706;font-weight:400">owes</span> ${s.to}</span>
      <span style="font-size:13px;font-weight:700;color:#d97706">₹${s.amount.toLocaleString('en-IN', {maximumFractionDigits:2})}</span>
    </div>
  `).join('')

  const memberFooter = group.members.map(m => {
    const name = typeof m === 'string' ? m : m.name
    const phone = typeof m === 'object' ? m.phone : ''
    return `<span style="display:inline-flex;align-items:center;gap:6px;margin:3px;padding:6px 12px;background:#f0fdf4;border-radius:20px;border:1px solid #bbf7d0;font-size:12px;font-weight:600;color:#166534">${name}${phone ? '<span style="color:#9ca3af;font-weight:400"> · ' + phone + '</span>' : ''}</span>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>${group.emoji} ${group.name} — MoneyFlow Report</title>
    <style>
      @page { size: A4; margin: 20mm; }
      * { box-sizing: border-box; font-family: -apple-system, 'Segoe UI', sans-serif; }
      body { margin: 0; padding: 0; color: #111827; }
    </style>
  </head><body>
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#15803d 0%,#0f766e 100%);padding:28px 32px;border-radius:16px;margin-bottom:28px;color:white">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:28px">${group.emoji}</div>
          <div>
            <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px">${group.name}</h1>
            <p style="margin:4px 0 0;opacity:0.75;font-size:13px">${group.members.length} members · Generated ${today}</p>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;opacity:0.6;text-transform:uppercase;letter-spacing:1px">Total Group Spending</div>
          <div style="font-size:28px;font-weight:900;margin-top:2px">₹${totalSpend.toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;gap:8px">
        <span style="font-size:12px;font-weight:700;opacity:0.7">MONEYFLOW</span>
        <span style="font-size:11px;opacity:0.5">·</span>
        <span style="font-size:12px;opacity:0.6">Smart Money Tracker — Group Expense Report</span>
      </div>
    </div>

    <!-- EXPENSE TABLE -->
    <h2 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 12px;letter-spacing:0.3px">📋 All Expenses (${expenses.length})</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:28px">
      <thead>
        <tr style="background:#f8fafc">
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:700">Date</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:700">Description</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:700">Paid By</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:700">Amount</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#9ca3af;font-weight:700">Split</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr style="background:#f0fdf4">
          <td colspan="3" style="padding:12px;font-weight:700;color:#15803d">Total</td>
          <td style="padding:12px;text-align:right;font-size:16px;font-weight:900;color:#15803d">₹${totalSpend.toLocaleString('en-IN')}</td>
          <td></td>
        </tr>
      </tfoot>
    </table>

    <!-- SETTLEMENTS -->
    ${settlements.length > 0 ? `<h2 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 12px">💰 Pending Settlements</h2><div style="margin-bottom:28px">${settleRows}</div>` : '<div style="padding:14px;background:#f0fdf4;border-radius:12px;margin-bottom:28px;text-align:center;font-weight:600;color:#15803d;font-size:14px">✅ All balances are fully settled!</div>'}

    <!-- FOOTER -->
    <div style="border-top:2px solid #f1f5f9;padding-top:20px;margin-top:8px">
      <p style="font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.8px;margin:0 0 10px">Group Members</p>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px">${memberFooter}</div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#f8fafc;border-radius:10px">
        <span style="font-size:12px;color:#9ca3af">Generated by <strong style="color:#15803d">MoneyFlow</strong> · Smart Money Tracker</span>
        <span style="font-size:12px;color:#d1d5db">${today}</span>
      </div>
    </div>
  </body></html>`

  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
  document.body.appendChild(iframe)
  iframe.contentDocument.open()
  iframe.contentDocument.write(html)
  iframe.contentDocument.close()
  setTimeout(() => {
    iframe.contentWindow.print()
    setTimeout(() => document.body.removeChild(iframe), 2000)
  }, 800)
}

export default function GroupExpenses() {
  const { groups, addGroup, updateGroup, deleteGroup, addGroupExpense, deleteGroupExpense, setActiveTab } = useApp()

  const [view, setView] = useState('list') // list, create, detail, addExpense, settleUp, expenseDetail
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [detailTab, setDetailTab] = useState('expenses') // expenses, balances, settings
  const [selectedExpense, setSelectedExpense] = useState(null)

  // Create Group State
  const [groupName, setGroupName] = useState('')
  const [groupEmoji, setGroupEmoji] = useState('🍕')
  const [memberInput, setMemberInput] = useState('')
  const [memberPhoneInput, setMemberPhoneInput] = useState('')
  const [memberList, setMemberList] = useState([]) // [{name, phone}, ...] or strings

  // Add Expense State
  const [expDesc, setExpDesc] = useState('')
  const [expAmt, setExpAmt] = useState('')
  const [expPaidBy, setExpPaidBy] = useState('')
  const [expSplitType, setExpSplitType] = useState('equal') // equal, exact, percentages, shares
  const [customSplits, setCustomSplits] = useState({}) // { memberName: value } string/number
  const [expCategory, setExpCategory] = useState('Others')

  // Settle Up State
  const [settlePayer, setSettlePayer] = useState('')
  const [settleReceiver, setSettleReceiver] = useState('')
  const [settleAmount, setSettleAmount] = useState('')

  // Settings State
  const [editGroupName, setEditGroupName] = useState('')
  const [editGroupEmoji, setEditGroupEmoji] = useState('')

  const openGroup = (g) => { 
    setSelectedGroup(g)
    setView('detail')
    setDetailTab('expenses')
    setEditGroupName(g.name || '')
    setEditGroupEmoji(g.emoji || '🍕')
  }

  // --- Add/Create ---
  const addMemberToCreate = () => {
    const name = memberInput.trim()
    const phone = memberPhoneInput.trim()
    if (name && !memberList.some(m => (m.name || m) === name)) {
      setMemberList(prev => [...prev, { name, phone }])
      setMemberInput('')
      setMemberPhoneInput('')
    }
  }

  // Helper to get member name whether stored as string or object
  const getMemberName = (m) => typeof m === 'string' ? m : m.name
  const getMemberPhone = (m) => typeof m === 'object' ? m.phone : ''
  const getMemberNames = (members) => (members || []).map(getMemberName)

  const handleCreateGroup = async () => {
    if (!groupName.trim() || memberList.length < 2) return
    await addGroup({ name: groupName.trim(), emoji: groupEmoji, members: memberList, expenses: [] })
    setGroupName(''); setGroupEmoji('🍕'); setMemberList([]); setView('list')
  }

  // --- Settings ---
  const handleUpdateGroupSettings = async () => {
    if (!selectedGroup || !editGroupName.trim()) return
    await updateGroup(selectedGroup.id, { name: editGroupName.trim(), emoji: editGroupEmoji })
    setSelectedGroup(prev => ({ ...prev, name: editGroupName.trim(), emoji: editGroupEmoji }))
  }

  const addMemberToExisting = async () => {
    const name = memberInput.trim()
    const phone = memberPhoneInput.trim()
    if (name && selectedGroup && !getMemberNames(selectedGroup.members).includes(name)) {
      const newMembers = [...selectedGroup.members, { name, phone }]
      await updateGroup(selectedGroup.id, { members: newMembers })
      setSelectedGroup(prev => ({ ...prev, members: newMembers }))
      setMemberInput('')
      setMemberPhoneInput('')
    }
  }

  // --- Add Expense calculations ---
  const handleSplitValueChange = (member, val) => {
    setCustomSplits(prev => ({ ...prev, [member]: val }))
  }

  const calculateFinalSplits = (total, type, splitsConfig, members) => {
    const finalSplits = {}
    if (type === 'equal') {
      const activeMembers = members.filter(m => splitsConfig[m] !== false) // by default if not strictly false, they are included
      if (activeMembers.length === 0) return {}
      const perPerson = total / activeMembers.length
      activeMembers.forEach(m => finalSplits[m] = perPerson)
    } else if (type === 'exact') {
      members.forEach(m => finalSplits[m] = Number(splitsConfig[m]) || 0)
    } else if (type === 'percentages') {
      members.forEach(m => {
        const pct = Number(splitsConfig[m]) || 0
        finalSplits[m] = (total * pct) / 100
      })
    } else if (type === 'shares') {
      let totalShares = 0
      members.forEach(m => { totalShares += Number(splitsConfig[m]) || 0 })
      if (totalShares > 0) {
        members.forEach(m => {
          finalSplits[m] = (total * (Number(splitsConfig[m]) || 0)) / totalShares
        })
      } else {
        members.forEach(m => finalSplits[m] = 0)
      }
    }
    return finalSplits
  }

  const handleAddExpense = async () => {
    if (!expDesc.trim() || !expAmt || !expPaidBy || !selectedGroup) return
    const total = Number(expAmt)
    
    const finalSplits = calculateFinalSplits(total, expSplitType, customSplits, selectedGroup.members)
    
    // Quick validation
    const sum = Object.values(finalSplits).reduce((a,b)=>a+b, 0)
    if (Math.abs(sum - total) > 0.1) {
      alert(`Split amounts (₹${sum.toFixed(2)}) must equal total cost (₹${total})`)
      return
    }

    const expense = {
      description: expDesc.trim(), 
      amount: total, 
      paidBy: expPaidBy,
      splits: finalSplits,
      splitType: expSplitType,
      category: expCategory,
      type: 'expense',
      date: new Date().toISOString().split('T')[0], 
      id: Date.now().toString(),
    }
    await addGroupExpense(selectedGroup.id, expense)
    setSelectedGroup(prev => ({ ...prev, expenses: [...(prev.expenses || []), expense] }))
    setExpDesc(''); setExpAmt(''); setExpSplitType('equal'); setCustomSplits({}); setView('detail')
  }

  // --- Settle Up ---
  const handleSettleUp = async () => {
    if (!settlePayer || !settleReceiver || !settleAmount || !selectedGroup) return
    const amount = Number(settleAmount)
    if (amount <= 0 || settlePayer === settleReceiver) return

    const settlement = {
      description: `Payment from ${settlePayer} to ${settleReceiver}`,
      amount: amount,
      paidBy: settlePayer,
      splits: { [settleReceiver]: amount }, // The receiver effectively "owes" this amount for the settlement, reducing their credit
      splitType: 'settlement',
      category: 'Transfer',
      type: 'settlement',
      date: new Date().toISOString().split('T')[0],
      id: Date.now().toString()
    }

    await addGroupExpense(selectedGroup.id, settlement)
    setSelectedGroup(prev => ({ ...prev, expenses: [...(prev.expenses || []), settlement] }))
    setSettleAmount(''); setView('detail'); setDetailTab('balances')
  }

  // --- Helpers ---
  const shareGroup = (group) => {
    const { settlements } = calculateSettlements(group.members, group.expenses || [])
    const total = (group.expenses || []).filter(e => e.type !== 'settlement').reduce((s, e) => s + e.amount, 0)
    let text = `${group.emoji} *${group.name}*\n👥 ${group.members.join(', ')}\n💰 Total Group Expenses: ₹${total.toLocaleString('en-IN')}\n`
    if (settlements.length > 0) {
      text += `\n📋 Pending Settlements:\n`
      settlements.forEach(s => { text += `  ${s.from} owes ${s.to}: ₹${s.amount.toLocaleString('en-IN', {maximumFractionDigits:2})}\n` })
    } else { text += `\n✅ All settled up!` }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // ─── Shared UI Components ───
  const BackButton = ({ onClick, title, subtitle, right }) => (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onClick}
        className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#222226] flex items-center justify-center text-gray-400 dark:text-white/35 active:scale-95 transition-transform">
        <ArrowLeft size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white/95 leading-tight truncate">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right}
    </div>
  )

  const group = selectedGroup ? (groups?.find(g => g.id === selectedGroup.id) || selectedGroup) : null
  const expenses = group?.expenses || []
  // Real expenses exclude transfers/settlements for the "Total Spent" metric
  const realExpenses = expenses.filter(e => e.type !== 'settlement')
  const totalGroupExpense = realExpenses.reduce((s, e) => s + e.amount, 0)
  const { settlements, balances } = group ? calculateSettlements(group.members, expenses) : { settlements:[], balances:{} }

  // ═══════ LIST VIEW ═══════
  if (view === 'list') {
    return (
      <div className="space-y-4 animate-fade-in pb-20">
        <BackButton
          onClick={() => setActiveTab('dashboard')}
          title="Group Expenses"
          subtitle="Split bills with friends & family"
          right={
            <button onClick={() => setView('create')}
              className="w-10 h-10 rounded-2xl bg-[#4F8EF7] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform">
              <Plus size={18} />
            </button>
          }
        />

        {(!groups || groups.length === 0) ? (
          <div className="rounded-3xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] text-center py-16 px-6">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-900/10 flex items-center justify-center mx-auto mb-5">
              <Users size={32} className="text-[#4F8EF7]" />
            </div>
            <p className="font-display font-bold text-lg text-gray-900 dark:text-white/95 mb-2">No groups yet</p>
            <p className="text-sm text-gray-400 dark:text-white/35 max-w-[240px] mx-auto mb-6">
              Create a group to log shared expenses on trips or at home.
            </p>
            <button onClick={() => setView('create')}
              className="px-6 py-3 rounded-2xl bg-[#4F8EF7] text-white text-sm font-semibold shadow-md active:scale-95 transition-transform">
              Create First Group
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(g => {
              const gExpenses = g.expenses || []
              const total = gExpenses.filter(e=>e.type!=='settlement').reduce((s, e) => s + e.amount, 0)
              const { settlements: gSettlements } = calculateSettlements(g.members, gExpenses)
              return (
                <button key={g.id} onClick={() => openGroup(g)}
                  className="w-full rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] p-4 flex items-center gap-4 active:scale-95 transition-all text-left">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#222226] flex items-center justify-center text-2xl shrink-0">
                    {g.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[15px] text-gray-900 dark:text-white/95 truncate">{g.name}</p>
                    <p className="text-xs text-gray-400 dark:text-white/35 mt-0.5">{g.members?.length} members</p>
                    {gSettlements.length > 0 ? (
                      <p className="text-[10px] text-[#FBBF24] font-semibold mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" /> Unsettled balances
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#34D399] font-semibold mt-1.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" /> All settled up
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-sm text-gray-900 dark:text-white/95">₹{total.toLocaleString('en-IN')}</p>
                    <ChevronRight size={14} className="text-gray-400 dark:text-white/30 ml-auto mt-1" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ═══════ CREATE GROUP ═══════
  if (view === 'create') {
    return (
      <div className="space-y-5 animate-fade-in pb-20">
        <BackButton onClick={() => setView('list')} title="New Group" subtitle="Add at least 2 members" />

        <div className="rounded-3xl bg-white dark:bg-[#1A1A1D] p-5 space-y-5 border border-black/[0.08] dark:border-white/[0.08]">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-3 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {GROUP_EMOJIS.map(e => (
                <button key={e} onClick={() => setGroupEmoji(e)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all ${groupEmoji === e
                    ? 'bg-[#4F8EF7]/15 ring-2 ring-[#4F8EF7] shadow-sm'
                    : 'bg-gray-100 dark:bg-[#222226] hover:bg-gray-100 dark:bg-[#222226] text-gray-400 dark:text-white/30'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2 block">Group Name</label>
            <input value={groupName} onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Trip to Goa"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-100 dark:bg-[#222226] border-none text-gray-900 dark:text-white/95 text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2 block">
              Members ({memberList.length})
            </label>
            {memberList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {memberList.map(m => {
                  const name = typeof m === 'string' ? m : m.name
                  const phone = typeof m === 'object' ? m.phone : ''
                  return (
                    <span key={name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4F8EF7]/15 text-brand-600 dark:text-brand-400 text-xs font-bold">
                      {name}{phone && <span className="text-brand-400/60 font-normal"> {phone}</span>}
                      <button onClick={() => setMemberList(prev => prev.filter(x => (x.name || x) !== name))} className="hover:text-[#FF6B6B]">
                        <X size={12} />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex gap-2">
                <input value={memberInput} onChange={e => setMemberInput(e.target.value)}
                  placeholder="Name (e.g. Alice)"
                  onKeyDown={e => { if (e.key === 'Enter') addMemberToCreate() }}
                  className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#222226] border-none text-gray-900 dark:text-white/95 text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50" />
              </div>
              <div className="flex gap-2">
                <div className="flex items-center flex-1 gap-2 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#222226]">
                  <Phone size={14} className="text-gray-400 dark:text-white/30 shrink-0" />
                  <input value={memberPhoneInput} onChange={e => setMemberPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Phone (optional)"
                    type="tel" inputMode="numeric"
                    onKeyDown={e => { if (e.key === 'Enter') addMemberToCreate() }}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white/95 text-sm outline-none placeholder-gray-400" />
                </div>
                <button onClick={addMemberToCreate}
                  className="w-12 h-12 rounded-2xl bg-[#4F8EF7] text-white flex items-center justify-center shrink-0 active:scale-95 shadow-md shadow-brand-500/25">
                  <UserPlus size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleCreateGroup} disabled={!groupName.trim() || memberList.length < 2}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-[#4F8EF7] text-white shadow-lg shadow-brand-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          Create Group
        </button>
      </div>
    )
  }

  // ═══════ GROUP DETAIL TABS ═══════
  if (view === 'detail' && group) {
    return (
      <div className="space-y-4 animate-fade-in pb-20">
      <BackButton
          onClick={() => { setView('list'); setSelectedGroup(null) }}
          title={`${group.emoji} ${group.name}`}
          subtitle={getMemberNames(group.members).join(' • ')}
          right={
            <div className="flex gap-2">
              <button onClick={() => exportGroupPDF(group, expenses, settlements, balances)}
                className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center active:scale-90 transition-transform shadow-sm shadow-indigo-500/30"
                title="Export PDF">
                <FileText size={16} />
              </button>
              <button onClick={() => shareGroup(group)}
                className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-[#222226] flex items-center justify-center text-gray-400 dark:text-white/35 active:scale-90 transition-transform">
                <Share2 size={16} />
              </button>
            </div>
          }
        />

        {/* Tab navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#222226] rounded-2xl">
          {[{ id: 'expenses', icon: Receipt, label: 'Expenses' },
            { id: 'balances', icon: PieChart, label: 'Balances' },
            { id: 'settings', icon: Settings, label: 'Settings' }].map(tb => (
            <button key={tb.id} onClick={() => setDetailTab(tb.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${detailTab === tb.id
                ? 'bg-white dark:bg-gray-200 dark:bg-[#2A2A2F] text-gray-900 dark:text-white/95 shadow-sm'
                : 'text-gray-400 dark:text-white/35 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              <tb.icon size={14} /> {tb.label}
            </button>
          ))}
        </div>

        {/* ── EXPENSES TAB ── */}
        {detailTab === 'expenses' && (
          <div className="space-y-4 animate-fade-in">
            {/* Total Expenses Card */}
            <div className="rounded-3xl bg-[#4F8EF7] text-white p-6 shadow-xl shadow-brand-500/20 relative overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
              <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-black/10 blur-xl" />
              <p className="text-white/80 text-xs font-semibold uppercase tracking-widest relative z-10">Total Group Spending</p>
              <p className="font-display font-bold text-4xl mt-1 tracking-tight relative z-10">₹{totalGroupExpense.toLocaleString('en-IN')}</p>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 px-1">Timeline</p>
              <div className="flex gap-2">
                <button onClick={() => {
                  setSettlePayer(group.members[0] || '')
                  setSettleReceiver(group.members[1] || '')
                  setSettleAmount(''); setView('settleUp')
                }}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95">
                  <ArrowRightLeft size={13} /> Settle Up
                </button>
                <button onClick={() => {
                  setExpPaidBy(group.members[0] || ''); 
                  setExpSplitType('equal')
                  setCustomSplits(group.members.reduce((acc, m) => ({ ...acc, [m]: true }), {}))
                  setView('addExpense')
                }}
                  className="px-3 py-1.5 bg-[#4F8EF7]/15 text-brand-600 dark:text-brand-400 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95">
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] text-center py-12">
                <Receipt size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400 dark:text-white/35">No expenses yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...expenses].reverse().map((exp, i) => (
                  <button key={exp.id || i} onClick={() => { setSelectedExpense(exp); setView('expenseDetail') }}
                    className="w-full text-left rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] p-4 flex items-center gap-3 active:scale-[0.98] transition-transform">
                    {exp.type === 'settlement' ? (
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                        <ArrowRightLeft size={16} className="text-[#34D399]" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-[#222226] flex items-center justify-center shrink-0">
                        <Receipt size={16} className="text-gray-400 dark:text-white/35" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white/95 truncate">{exp.description}</p>
                      <p className="text-[11px] text-gray-400 dark:text-white/35 mt-0.5 truncate">
                        {exp.type === 'settlement' ? 'Settlement payment' : `${exp.paidBy} paid • ${exp.date}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono font-bold text-sm ${exp.type === 'settlement' ? 'text-[#34D399]' : 'text-gray-900 dark:text-white/95'}`}>
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BALANCES TAB ── */}
        {detailTab === 'balances' && (
          <div className="space-y-4 animate-fade-in">
            {settlements.length === 0 ? (
              <div className="rounded-3xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={24} className="text-[#34D399]" />
                </div>
                <p className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-1">Squred Up!</p>
                <p className="text-sm text-gray-400 dark:text-white/35">Everyone is fully settled in this group.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-5">
                  <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                    <ArrowRightLeft size={16} /> Suggested Settlements
                  </h3>
                  <div className="space-y-2">
                    {settlements.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/60 dark:bg-black/20 rounded-xl">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{s.from}</span>
                          <span className="text-gray-400 dark:text-white/30 text-xs">owes</span>
                          <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{s.to}</span>
                        </div>
                        <span className="font-mono font-bold text-amber-600 dark:text-[#FBBF24]">₹{s.amount.toLocaleString('en-IN', {maximumFractionDigits:2})}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => {
                    if (settlements[0]) {
                      setSettlePayer(settlements[0].from); setSettleReceiver(settlements[0].to)
                      setSettleAmount(settlements[0].amount.toFixed(2)); setView('settleUp')
                    }
                  }}
                    className="w-full mt-4 py-3 bg-[#FBBF24] text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-transform">
                    Record a Payment
                  </button>
                </div>

                <div className="px-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">Member Net Balances</p>
                  <div className="space-y-2">
                    {group.members.map(m => {
                      const bal = balances[m] || 0
                      if (Math.abs(bal) < 0.1) return null
                      const isOwed = bal > 0
                      return (
                        <div key={m} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#222226] dark:bg-gray-200 dark:bg-[#2A2A2F] flex items-center justify-center font-bold text-xs text-gray-600 dark:text-gray-300">
                              {m.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900 dark:text-white/95">{m}</p>
                              <p className={`text-[10px] font-bold ${isOwed ? 'text-[#34D399]' : 'text-[#FF6B6B]'}`}>
                                {isOwed ? 'Gets back' : 'Owes overall'}
                              </p>
                            </div>
                          </div>
                          <p className={`font-mono font-bold text-sm ${isOwed ? 'text-[#34D399]' : 'text-[#FF6B6B]'}`}>
                            {isOwed ? '+' : '-'}₹{Math.abs(bal).toLocaleString('en-IN', {maximumFractionDigits:2})}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {detailTab === 'settings' && (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-3xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] p-5 space-y-5">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white/95 flex items-center gap-2 mb-2">
                <Edit3 size={16} /> Edit Group Info
              </h3>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2 block">Group Name</label>
                <div className="flex gap-2">
                  <button onClick={() => setEditGroupEmoji(GROUP_EMOJIS[(GROUP_EMOJIS.indexOf(editGroupEmoji) + 1) % GROUP_EMOJIS.length])}
                    className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-[#222226] flex items-center justify-center text-xl shrink-0">
                    {editGroupEmoji}
                  </button>
                  <input value={editGroupName} onChange={e => setEditGroupName(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#222226] border-none text-gray-900 dark:text-white/95 text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50" />
                </div>
              </div>
              <button onClick={handleUpdateGroupSettings} disabled={!editGroupName.trim()}
                className="w-full py-3 bg-[#4F8EF7]/15 text-brand-600 dark:text-brand-400 font-bold rounded-2xl border border-brand-100 dark:border-brand-800/30">
                Save Changes
              </button>
            </div>

            <div className="rounded-3xl bg-white dark:bg-[#1A1A1D] border border-black/[0.08] dark:border-white/[0.08] p-5 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white/95 flex items-center gap-2">
                <Users size={16} /> Manage Members
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.members.map(m => {
                  const name = getMemberName(m)
                  const phone = getMemberPhone(m)
                  return (
                    <span key={name} className="flex flex-col px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#222226] dark:bg-gray-200 dark:bg-[#2A2A2F]">
                      <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">{name}</span>
                      {phone && <span className="text-[10px] text-gray-400 dark:text-white/30 font-mono flex items-center gap-1 mt-0.5"><Phone size={9} />{phone}</span>}
                    </span>
                  )
                })}
              </div>
              <div className="space-y-2">
                <input value={memberInput} onChange={e => setMemberInput(e.target.value)}
                  placeholder="New member name..."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#222226] border-none text-gray-900 dark:text-white/95 text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50" />
                <div className="flex gap-2">
                  <div className="flex items-center flex-1 gap-2 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-[#222226]">
                    <Phone size={14} className="text-gray-400 dark:text-white/30 shrink-0" />
                    <input value={memberPhoneInput} onChange={e => setMemberPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Phone (optional)"
                      type="tel" inputMode="numeric"
                      className="flex-1 bg-transparent text-gray-900 dark:text-white/95 text-sm outline-none placeholder-gray-400" />
                  </div>
                  <button onClick={addMemberToExisting}
                    className="w-12 h-12 rounded-2xl bg-gray-900 dark:bg-gray-100 dark:bg-[#222226] text-white dark:text-gray-900 dark:text-white/95 flex items-center justify-center shrink-0 active:scale-95">
                    <UserPlus size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-5 text-center space-y-3">
              <Trash2 size={24} className="text-rose-400 mx-auto" />
              <div>
                <p className="font-bold text-sm text-rose-600 dark:text-rose-400">Danger Zone</p>
                <p className="text-xs text-[#FF6B6B]/70 mt-1">This will permanently delete the group and all its expenses.</p>
              </div>
              <button onClick={async () => { await deleteGroup(group.id); setView('list'); setSelectedGroup(null) }}
                className="w-full py-3 bg-[#FF6B6B] text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 active:scale-95 transition-transform">
                Delete Group
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ═══════ ADD EXPENSE ═══════
  if (view === 'addExpense' && group) {
    return (
      <div className="space-y-4 animate-fade-in pb-20">
        <BackButton onClick={() => setView('detail')} title="Add Expense" subtitle={`in ${group.name}`} />

        <div className="bg-white dark:bg-gray-100 dark:bg-[#222226]/80 rounded-3xl p-5 border border-black/[0.08] dark:border-white/[0.08] space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2 block">Description</label>
            <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="e.g. Dinner at restaurant"
              className="w-full bg-gray-100 dark:bg-[#222226] border-none px-4 py-3 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-[#4F8EF7]/50" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2 block">Amount</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30 font-bold">₹</div>
              <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)} placeholder="0.00"
                className="w-full bg-gray-100 dark:bg-[#222226] border-none pl-8 pr-4 py-3 rounded-2xl text-lg font-mono font-bold outline-none focus:ring-2 focus:ring-[#4F8EF7]/50" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2 block">Paid By</label>
            <select value={expPaidBy} onChange={e => setExpPaidBy(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#222226] border-none px-4 py-3 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-[#4F8EF7]/50">
              {getMemberNames(group.members).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-100 dark:bg-[#222226]/80 rounded-3xl p-5 border border-black/[0.08] dark:border-white/[0.08] space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 block">Split Options</label>
          
          <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/40 p-1.5 rounded-2xl">
            {[{ id: 'equal', lbl: 'Equally' },
              { id: 'exact', lbl: 'Exact Amts' },
              { id: 'percentages', lbl: 'Percentages' },
              { id: 'shares', lbl: 'Shares' }].map(t => (
              <button key={t.id} onClick={() => {
                setExpSplitType(t.id)
                // Initialize customSplits based on type
                if (t.id === 'equal') {
                  setCustomSplits(group.members.reduce((acc, m) => ({ ...acc, [m]: true }), {}))
                } else if (t.id === 'exact') {
                  const per = Number(expAmt) / group.members.length || 0
                  setCustomSplits(group.members.reduce((acc, m) => ({ ...acc, [m]: per.toFixed(2) }), {}))
                } else if (t.id === 'percentages') {
                  const pct = 100 / group.members.length
                  setCustomSplits(group.members.reduce((acc, m) => ({ ...acc, [m]: pct.toFixed(2) }), {}))
                } else if (t.id === 'shares') {
                  setCustomSplits(group.members.reduce((acc, m) => ({ ...acc, [m]: 1 }), {}))
                }
              }}
                className={`py-2 rounded-xl text-[11px] font-bold transition-all ${expSplitType === t.id ? 'bg-white dark:bg-gray-200 dark:bg-[#2A2A2F] text-brand-600 dark:text-brand-400 shadow-sm' : 'text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:bg-[#222226] dark:hover:bg-gray-100 dark:bg-[#222226]'}`}>
                {t.lbl}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            {getMemberNames(group.members).map(m => (
              <div key={m} className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{m}</span>
                
                {expSplitType === 'equal' && (
                  <button onClick={() => handleSplitValueChange(m, customSplits[m] === false ? true : false)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${customSplits[m] !== false ? 'bg-[#4F8EF7]' : 'bg-gray-200 dark:bg-gray-200 dark:bg-[#2A2A2F]'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${customSplits[m] !== false ? 'left-6' : 'left-1'}`} />
                  </button>
                )}

                {expSplitType === 'exact' && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#222226] rounded-xl px-2">
                    <span className="text-gray-400 dark:text-white/30 text-xs">₹</span>
                    <input type="number" value={customSplits[m] || ''} onChange={(e) => handleSplitValueChange(m, e.target.value)}
                      className="w-16 bg-transparent border-none py-1.5 text-right font-mono text-sm outline-none dark:text-white" />
                  </div>
                )}

                {expSplitType === 'percentages' && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#222226] rounded-xl px-2">
                    <input type="number" value={customSplits[m] || ''} onChange={(e) => handleSplitValueChange(m, e.target.value)}
                      className="w-12 bg-transparent border-none py-1.5 text-right font-mono text-sm outline-none dark:text-white" />
                    <span className="text-gray-400 dark:text-white/30 text-xs">%</span>
                  </div>
                )}

                {expSplitType === 'shares' && (
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#222226] rounded-xl px-2">
                    <input type="number" value={customSplits[m] || ''} onChange={(e) => handleSplitValueChange(m, e.target.value)}
                      className="w-12 bg-transparent border-none py-1.5 text-center font-mono text-sm outline-none dark:text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] dark:border-gray-800">
            <p className="text-[10px] text-gray-400 dark:text-white/30 text-center">
              {expSplitType === 'equal' && 'Checked members will equally share the cost.'}
              {expSplitType === 'exact' && `Sum must equal total: ₹${expAmt || 0}`}
              {expSplitType === 'percentages' && 'Must sum to 100%'}
              {expSplitType === 'shares' && 'Total cost is divided proportionally by shares.'}
            </p>
          </div>
        </div>

        <button onClick={handleAddExpense} disabled={!expDesc.trim() || !expAmt || !expPaidBy}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-[#4F8EF7] text-white shadow-lg active:scale-95 disabled:opacity-50">
          Save Expense
        </button>
      </div>
    )
  }

  // ═══════ SETTLE UP ═══════
  if (view === 'settleUp' && group) {
    return (
      <div className="space-y-4 animate-fade-in pb-20">
        <BackButton onClick={() => setView('detail')} title="Record Payment" subtitle={`in ${group.name}`} />
        
        <div className="bg-white dark:bg-gray-100 dark:bg-[#222226]/80 rounded-3xl p-6 border border-black/[0.08] dark:border-white/[0.08] text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <select value={settlePayer} onChange={e => setSettlePayer(e.target.value)}
              className="bg-gray-100 dark:bg-[#222226] px-3 py-2 rounded-xl text-sm font-bold font-body border-none outline-none">
              {getMemberNames(group.members).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <ArrowRightLeft size={14} className="text-[#34D399]" />
            </div>
            <select value={settleReceiver} onChange={e => setSettleReceiver(e.target.value)}
              className="bg-gray-100 dark:bg-[#222226] px-3 py-2 rounded-xl text-sm font-bold font-body border-none outline-none">
              {getMemberNames(group.members).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">Amount Paid</p>
          <div className="flex justify-center items-center">
            <span className="text-gray-400 dark:text-white/30 text-2xl font-bold mr-1">₹</span>
            <input type="number" value={settleAmount} onChange={e => setSettleAmount(e.target.value)} placeholder="0.00"
              className="w-32 bg-transparent text-center font-mono font-bold text-4xl text-gray-900 dark:text-white/95 border-none outline-none" autoFocus />
          </div>
        </div>

        <button onClick={handleSettleUp} disabled={!settleAmount || settlePayer === settleReceiver}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-[#34D399] text-white shadow-lg active:scale-95 disabled:opacity-50">
          Record Payment
        </button>
      </div>
    )
  }

  // ═══════ EXPENSE DETAIL ═══════
  if (view === 'expenseDetail' && selectedExpense) {
    return (
      <div className="space-y-4 animate-fade-in pb-20">
        <BackButton onClick={() => { setView('detail'); setSelectedExpense(null) }} title="Expense Details" />
        
        <div className="bg-white dark:bg-gray-100 dark:bg-[#222226]/80 rounded-3xl p-6 border border-black/[0.08] dark:border-white/[0.08] text-center relative">
           <button onClick={async () => {
              await deleteGroupExpense(group.id, selectedExpense.id)
              setSelectedGroup(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== selectedExpense.id) }))
              setView('detail')
            }}
              className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/10 flex items-center justify-center text-[#FF6B6B] active:scale-90">
              <Trash2 size={16} />
            </button>

          <div className={`w-16 h-16 rounded-3xl ${selectedExpense.type === 'settlement' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-[#34D399]' : 'bg-[#4F8EF7]/15 text-[#4F8EF7]'} flex items-center justify-center mx-auto mb-3`}>
            {selectedExpense.type === 'settlement' ? <ArrowRightLeft size={28} /> : <Receipt size={28} />}
          </div>
          <p className="font-bold text-xl text-gray-900 dark:text-white/95 leading-tight">{selectedExpense.description}</p>
          <p className="font-mono font-bold text-3xl mt-2 tracking-tight text-gray-900 dark:text-white/95">₹{selectedExpense.amount.toLocaleString('en-IN')}</p>
          <p className="text-sm text-gray-400 dark:text-white/35 mt-2">
            Paid by <strong className="text-gray-900 dark:text-white/95 dark:text-gray-200">{selectedExpense.paidBy}</strong> on {selectedExpense.date}
          </p>
        </div>

        <div className="px-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 mb-2">Split Details ({selectedExpense.splitType})</p>
          <div className="bg-white dark:bg-[#1A1A1D] rounded-2xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {Object.entries(selectedExpense.splits || {}).filter(([, amt]) => amt > 0).map(([person, amt]) => (
              <div key={person} className="flex justify-between p-4">
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#222226] dark:bg-gray-200 dark:bg-[#2A2A2F] text-[10px] flex items-center justify-center font-bold">
                    {person.charAt(0)}
                  </div>
                  {person}
                </span>
                <span className="font-mono text-sm font-semibold text-gray-600 dark:text-gray-400 dark:text-white/30">₹{Number(amt).toLocaleString('en-IN', {maximumFractionDigits:2})}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
