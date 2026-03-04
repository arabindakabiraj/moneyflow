/**
 * csvExport.js — Export transactions as CSV
 */
export function exportToCSV(transactions, filename = 'moneyflow_transactions.csv') {
    const headers = ['Date', 'Type', 'Description', 'Category', 'Amount', 'Account']
    const rows = transactions.map(tx => [
        tx.date,
        tx.type === 'credit' ? 'Income' : 'Expense',
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.category || '',
        Number(tx.amount).toFixed(2),
        tx.account || 'Cash',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
