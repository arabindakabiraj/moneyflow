/**
 * GroupExpenses.jsx — Premium group expense tracker with settlement
 */
import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Users, Receipt, ArrowRightLeft, Share2, X, ChevronRight, CheckCircle, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext'

// ═══════ Settlement calculator — minimize transfers ═══════
function calculateSettlements(members, expenses) {
  const balances = {}
  members.forEach(m => { balances[m] = 0 })

  expenses.forEach(exp => {
    const paidBy = exp.paidBy
    const splitAmong = exp.splitAmong || members
    const share = exp.amount / splitAmong.length
    balances[paidBy] = (balances[paidBy] || 0) + exp.amount
    splitAmong.forEach(m => {
      balances[m] = (balances[m] || 0) - share
    })
  })

  const creditors = []
  const debtors = []
  Object.entries(balances).forEach(([name, bal]) => {
    if (bal > 0.5) creditors.push({ name, amount: bal })
    else if (bal < -0.5) debtors.push({ name, amount: -bal })
  })

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const settlements = []
  let i = 0, j = 0
  while (i < creditors.length && j < debtors.length) {
    const transfer = Math.min(creditors[i].amount, debtors[j].amount)
    if (transfer > 0.5) {
      settlements.push({ from: debtors[j].name, to: creditors[i].name, amount: Math.round(transfer) })
    }
    creditors[i].amount -= transfer
    debtors[j].amount -= transfer
    if (creditors[i].amount < 0.5) i++
    if (debtors[j].amount < 0.5) j++
  }
  return settlements
}

const GROUP_EMOJIS = ['🍕', '🏠', '✈️', '🎉', '🍻', '🛒', '⛽', '🎬', '💼', '🎓', '🏖️', '🚗']

export default function GroupExpenses() {
  const { groups, addGroup, deleteGroup, addGroupExpense, deleteGroupExpense, setActiveTab } = useApp()

  const [view, setView] = useState('list')
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [showSettlements, setShowSettlements] = useState(false)

  const [groupName, setGroupName] = useState('')
  const [groupEmoji, setGroupEmoji] = useState('🍕')
  const [memberInput, setMemberInput] = useState('')
  const [memberList, setMemberList] = useState([])

  const [expDesc, setExpDesc] = useState('')
  const [expAmt, setExpAmt] = useState('')
  const [expPaidBy, setExpPaidBy] = useState('')
  const [expSplitType, setExpSplitType] = useState('equal')
  const [expSplitAmong, setExpSplitAmong] = useState([])

  const addMember = () => {
    const name = memberInput.trim()
    if (name && !memberList.includes(name)) {
      setMemberList(prev => [...prev, name])
      setMemberInput('')
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || memberList.length < 2) return
    await addGroup({ name: groupName.trim(), emoji: groupEmoji, members: memberList, expenses: [] })
    setGroupName(''); setGroupEmoji('🍕'); setMemberList([]); setView('list')
  }

  const handleAddExpense = async () => {
    if (!expDesc.trim() || !expAmt || !expPaidBy || !selectedGroup) return
    const expense = {
      description: expDesc.trim(), amount: Number(expAmt), paidBy: expPaidBy,
      splitAmong: expSplitType === 'equal' ? selectedGroup.members : expSplitAmong,
      date: new Date().toISOString().split('T')[0], id: Date.now().toString(),
    }
    await addGroupExpense(selectedGroup.id, expense)
    setSelectedGroup(prev => ({ ...prev, expenses: [...(prev.expenses || []), expense] }))
    setExpDesc(''); setExpAmt(''); setExpPaidBy(''); setExpSplitAmong([]); setView('detail')
  }

  const openGroup = (g) => { setSelectedGroup(g); setView('detail'); setShowSettlements(false) }

  const shareGroup = (group) => {
    const settlements = calculateSettlements(group.members, group.expenses || [])
    const total = (group.expenses || []).reduce((s, e) => s + e.amount, 0)
    let text = `${group.emoji} *${group.name}*\n👥 ${group.members.join(', ')}\n💰 Total: ₹${total.toLocaleString('en-IN')}\n`
    if (settlements.length > 0) {
      text += `\n📋 Settlements:\n`
      settlements.forEach(s => { text += `  ${s.from} → ${s.to}: ₹${s.amount.toLocaleString('en-IN')}\n` })
    } else { text += `\n✅ All settled!` }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  // ─── Shared Back Button ───
  const BackButton = ({ onClick, title, subtitle, right }) => (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={onClick}
        className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform hover:bg-gray-200 dark:hover:bg-gray-700">
        <ArrowLeft size={18} />
      </button>
      <div className="flex-1 min-w-0">
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  )

  // ═══════ LIST VIEW ═══════
  if (view === 'list') {
    return (
      <div className="space-y-5 animate-fade-in">
        <BackButton
          onClick={() => setActiveTab('settings')}
          title="Group Expenses"
          subtitle="Split bills with friends & family"
          right={
            <button onClick={() => setView('create')}
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/25 active:scale-90 transition-transform">
              <Plus size={18} />
            </button>
          }
        />

        {(!groups || groups.length === 0) ? (
          <div className="rounded-3xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 text-center py-16 px-6">
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/30 dark:to-brand-900/10 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Users size={32} className="text-brand-500" />
            </div>
            <p className="font-display font-bold text-base text-gray-800 dark:text-gray-200 mb-1">No groups yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[240px] mx-auto leading-relaxed">
              Create a group to start tracking shared expenses
            </p>
            <button onClick={() => setView('create')}
              className="mt-5 px-6 py-2.5 rounded-2xl bg-brand-500 text-white text-sm font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-transform">
              Create First Group
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(g => {
              const total = (g.expenses || []).reduce((s, e) => s + e.amount, 0)
              const settlements = calculateSettlements(g.members, g.expenses || [])
              return (
                <button key={g.id} onClick={() => openGroup(g)}
                  className="w-full rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-4 flex items-center gap-4 active:scale-[0.98] transition-all hover:shadow-md group">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {g.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">{g.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{g.members?.length} members • {(g.expenses || []).length} expenses</p>
                    {settlements.length > 0 && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                        {settlements.length} settlement{settlements.length > 1 ? 's' : ''} pending
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">₹{total.toLocaleString('en-IN')}</p>
                    <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 ml-auto mt-1" />
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
      <div className="space-y-5 animate-fade-in">
        <BackButton onClick={() => setView('list')} title="New Group" subtitle="Add at least 2 members" />

        <div className="rounded-3xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-5 space-y-5">
          {/* Emoji picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {GROUP_EMOJIS.map(e => (
                <button key={e} onClick={() => setGroupEmoji(e)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all duration-200 ${groupEmoji === e
                    ? 'bg-brand-50 dark:bg-brand-900/20 ring-2 ring-brand-500 scale-110 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">Group Name</label>
            <input value={groupName} onChange={e => setGroupName(e.target.value)}
              placeholder="e.g. Trip to Goa"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm font-body outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/40 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600" />
          </div>

          {/* Members */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">
              Members ({memberList.length})
            </label>
            {memberList.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {memberList.map(m => (
                  <span key={m} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-brand-50 dark:bg-brand-900/15 text-brand-700 dark:text-brand-300 text-xs font-bold border border-brand-100 dark:border-brand-800/30">
                    {m}
                    <button onClick={() => setMemberList(prev => prev.filter(x => x !== m))} className="hover:text-rose-500 transition-colors">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={memberInput} onChange={e => setMemberInput(e.target.value)}
                placeholder="Add member name…"
                onKeyDown={e => { if (e.key === 'Enter') addMember() }}
                className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600" />
              <button onClick={addMember}
                className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shrink-0 active:scale-90 transition-transform shadow-md shadow-brand-500/25">
                <UserPlus size={16} />
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleCreateGroup} disabled={!groupName.trim() || memberList.length < 2}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed">
          Create Group ✨
        </button>
      </div>
    )
  }

  // ═══════ GROUP DETAIL ═══════
  if (view === 'detail' && selectedGroup) {
    const group = groups?.find(g => g.id === selectedGroup.id) || selectedGroup
    const expenses = group.expenses || []
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const settlements = calculateSettlements(group.members, expenses)

    return (
      <div className="space-y-4 animate-fade-in">
        <BackButton
          onClick={() => { setView('list'); setSelectedGroup(null) }}
          title={`${group.emoji} ${group.name}`}
          subtitle={group.members.join(' • ')}
          right={
            <button onClick={() => shareGroup(group)}
              className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 active:scale-90 transition-transform">
              <Share2 size={16} />
            </button>
          }
        />

        {/* Total card */}
        <div className="rounded-3xl bg-gradient-to-br from-brand-500 via-brand-500 to-brand-600 text-white text-center p-6 shadow-xl shadow-brand-500/20 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-white/5" />
          <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
          <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">Total Expenses</p>
          <p className="font-display font-bold text-4xl mt-2 tracking-tight">₹{total.toLocaleString('en-IN')}</p>
          <p className="text-white/50 text-xs mt-2">{expenses.length} expenses • {group.members.length} members</p>
        </div>

        {/* Settlements */}
        <button onClick={() => setShowSettlements(v => !v)}
          className="w-full rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-4 flex items-center gap-3 active:scale-[0.98] transition-all">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-900/15 flex items-center justify-center shrink-0">
            <ArrowRightLeft size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {settlements.length === 0 ? '✅ All Settled!' : `${settlements.length} Settlement${settlements.length > 1 ? 's' : ''} Needed`}
            </p>
          </div>
          <ChevronRight size={14} className={`text-gray-300 dark:text-gray-600 transition-transform duration-200 ${showSettlements ? 'rotate-90' : ''}`} />
        </button>

        {showSettlements && settlements.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            {settlements.map((s, i) => (
              <div key={i} className="rounded-2xl bg-amber-50/80 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/20 p-4 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 text-sm">
                  <span className="font-bold text-amber-800 dark:text-amber-300">{s.from}</span>
                  <span className="text-amber-400 text-xs">→</span>
                  <span className="font-bold text-amber-800 dark:text-amber-300">{s.to}</span>
                </div>
                <span className="font-mono font-bold text-sm text-amber-700 dark:text-amber-400">₹{s.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expenses list */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Expenses</p>
            <button onClick={() => {
              setExpPaidBy(group.members[0] || ''); setExpSplitAmong([...group.members]); setView('addExpense')
            }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 active:scale-95 transition-transform">
              <Plus size={13} /> Add
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 text-center py-10">
              <Receipt size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No expenses yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((exp, i) => (
                <div key={exp.id || i} className="rounded-2xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{exp.description}</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Paid by <span className="font-semibold text-gray-500 dark:text-gray-400">{exp.paidBy}</span> • {exp.date}</p>
                  </div>
                  <p className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400 shrink-0">₹{exp.amount.toLocaleString('en-IN')}</p>
                  <button onClick={async () => {
                    await deleteGroupExpense(group.id, exp.id)
                    setSelectedGroup(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== exp.id) }))
                  }}
                    className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/15 flex items-center justify-center text-rose-400 active:scale-90 shrink-0 transition-transform">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={async () => { await deleteGroup(group.id); setView('list'); setSelectedGroup(null) }}
          className="w-full py-3 rounded-2xl text-sm font-semibold bg-rose-50 dark:bg-rose-900/10 text-rose-500 dark:text-rose-400 border border-rose-100 dark:border-rose-800/30 active:scale-[0.98] transition-transform">
          Delete Group
        </button>
      </div>
    )
  }

  // ═══════ ADD EXPENSE ═══════
  if (view === 'addExpense' && selectedGroup) {
    return (
      <div className="space-y-5 animate-fade-in">
        <BackButton onClick={() => setView('detail')} title="Add Expense" subtitle={`to ${selectedGroup.name}`} />

        <div className="rounded-3xl bg-white dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50 p-5 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">Description</label>
            <input value={expDesc} onChange={e => setExpDesc(e.target.value)}
              placeholder="e.g. Dinner at restaurant"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-brand-500/40 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">Amount</label>
            <input type="number" value={expAmt} onChange={e => setExpAmt(e.target.value)}
              placeholder="₹0"
              className="w-full px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200/80 dark:border-gray-600/50 text-gray-900 dark:text-white text-lg font-mono font-bold outline-none focus:ring-2 focus:ring-brand-500/40 transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">Paid By</label>
            <div className="flex flex-wrap gap-2">
              {selectedGroup.members.map(m => (
                <button key={m} onClick={() => setExpPaidBy(m)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 ${expPaidBy === m
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25 scale-105'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-600/50'}`}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 block">Split Type</label>
            <div className="flex gap-2 mb-3">
              {[['equal', 'Equal Split'], ['custom', 'Custom']].map(([key, label]) => (
                <button key={key} onClick={() => { if (key === 'equal') setExpSplitAmong([...selectedGroup.members]); setExpSplitType(key) }}
                  className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${expSplitType === key
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/25'
                    : 'bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-gray-600/50'}`}>
                  {label}
                </button>
              ))}
            </div>
            {expSplitType === 'custom' && (
              <div className="flex flex-wrap gap-2">
                {selectedGroup.members.map(m => (
                  <button key={m} onClick={() => {
                    setExpSplitAmong(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
                  }}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${expSplitAmong.includes(m)
                      ? 'bg-brand-50 dark:bg-brand-900/15 text-brand-700 dark:text-brand-300 ring-1.5 ring-brand-500'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'}`}>
                    {expSplitAmong.includes(m) && <CheckCircle size={12} />}
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button onClick={handleAddExpense} disabled={!expDesc.trim() || !expAmt || !expPaidBy}
          className="w-full py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-30">
          Add Expense
        </button>
      </div>
    )
  }

  return null
}
