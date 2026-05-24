/**
 * pdfExport.js
 * Premium financial statement PDF export using jsPDF + autoTable.
 * Corporate-grade layouts, structured typography, and precise grids.
 */
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const exportToPDF = (transactions, summary, periodLabel) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Current date & time for statement metadata
  const generatedOn = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // 1. BRAND HEADER (Minimalist, Slate Theme)
  // Left: Brand title & tagline
  doc.setTextColor(15, 23, 42) // slate-900
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('MONEYFLOW', 15, 16)
  
  doc.setTextColor(100, 116, 139) // slate-500
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('PERSONAL FINANCIAL COCKPIT', 15, 21)

  // Right: Document type & metadata
  doc.setTextColor(15, 23, 42) // slate-900
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('FINANCIAL STATEMENT', 195, 14, { align: 'right' })

  doc.setTextColor(100, 116, 139) // slate-500
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Period: ${periodLabel || 'All Time'}`, 195, 19, { align: 'right' })
  doc.text(`Generated: ${generatedOn}`, 195, 23, { align: 'right' })

  // Elegant divider line
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.setLineWidth(0.4)
  doc.line(15, 27, 195, 27)

  // 2. PREMIUM SUMMARY CARDS (Row of 3, Y = 33)
  const cardY = 33
  const cardHeight = 20
  const cardWidth = 56
  
  // Card 1: TOTAL INFLOW (Credit)
  doc.setFillColor(240, 253, 244) // emerald-50
  doc.setDrawColor(187, 247, 208) // emerald-200
  doc.roundedRect(15, cardY, cardWidth, cardHeight, 2, 2, 'FD')
  // Card Label
  doc.setTextColor(21, 128, 61) // emerald-700
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL INFLOW (CREDIT)', 20, cardY + 6.5)
  // Card Value
  doc.setFontSize(13)
  doc.text(`INR ${Number(summary.totalCredit || 0).toLocaleString('en-IN')}`, 20, cardY + 14)

  // Card 2: TOTAL OUTFLOW (Debit)
  doc.setFillColor(254, 242, 242) // rose-50
  doc.setDrawColor(254, 202, 202) // rose-200
  doc.roundedRect(77, cardY, cardWidth, cardHeight, 2, 2, 'FD')
  // Card Label
  doc.setTextColor(185, 28, 28) // rose-700
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL OUTFLOW (DEBIT)', 82, cardY + 6.5)
  // Card Value
  doc.setFontSize(13)
  doc.text(`INR ${Number(summary.totalDebit || 0).toLocaleString('en-IN')}`, 82, cardY + 14)

  // Card 3: CLOSING NET BALANCE (Clamped to non-negative!)
  const displayBalance = Math.max(0, summary.balance || 0)
  doc.setFillColor(248, 250, 252) // slate-50
  doc.setDrawColor(226, 232, 240) // slate-200
  doc.roundedRect(139, cardY, cardWidth, cardHeight, 2, 2, 'FD')
  // Card Label
  doc.setTextColor(71, 85, 105) // slate-600
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('CLOSING NET BALANCE', 144, cardY + 6.5)
  // Card Value
  doc.setTextColor(15, 23, 42) // slate-900
  doc.setFontSize(13)
  doc.text(`INR ${Number(displayBalance).toLocaleString('en-IN')}`, 144, cardY + 14)

  // 3. TRANSACTION RECORD TABLE
  const tableHeaders = [['Date', 'Description', 'Category', 'Wallet', 'Type', 'Tag', 'Amount']]
  const tableBody = transactions.map(t => [
    t.date || '—',
    t.description || '—',
    t.category || '—',
    t.account ? t.account.toUpperCase() : 'CASH',
    t.type === 'credit' ? 'CREDIT' : 'DEBIT',
    t.type === 'debit' ? (t.isWant ? 'Want' : 'Need') : '—',
    `${t.type === 'credit' ? '+' : '-'} INR ${Number(t.amount || 0).toLocaleString('en-IN')}`
  ])

  autoTable(doc, {
    startY: 60,
    head: tableHeaders,
    body: tableBody,
    theme: 'plain',
    margin: { left: 15, right: 15 },
    headStyles: {
      fillColor: [15, 23, 42], // deep slate-900
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: 3.5,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85], // slate-700
      cellPadding: 3.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Date
      1: { cellWidth: 50 }, // Description
      2: { cellWidth: 28 }, // Category
      3: { cellWidth: 20 }, // Wallet
      4: { cellWidth: 20 }, // Type
      5: { cellWidth: 18 }, // Tag
      6: { cellWidth: 27, halign: 'right', fontStyle: 'bold' }, // Amount (right aligned)
    },
    didDrawCell: (data) => {
      // Color-code the amount values (emerald-600 for positive, rose-600 for negative)
      if (data.column.index === 6 && data.section === 'body') {
        const rowType = data.row.cells[4]?.text
        if (rowType === 'CREDIT') {
          doc.setTextColor(16, 185, 129) // emerald-500
        } else {
          doc.setTextColor(239, 68, 68) // rose-500
        }
      }
    },
    styles: {
      font: 'helvetica',
      lineColor: [241, 245, 249], // very light slate-100 dividers
      lineWidth: 0.1,
    }
  })

  // 4. FOOTER WITH PAGE NUMBERS
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Bottom border line above footer
    doc.setDrawColor(241, 245, 249)
    doc.setLineWidth(0.3)
    doc.line(15, 282, 195, 282)

    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184) // slate-400
    doc.setFont('helvetica', 'normal')
    
    // Left side notice
    doc.text('MoneyFlow Secure Local Statement', 15, 287)
    
    // Right side page counts
    doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: 'right' })
  }

  // Save pdf
  doc.save(`MoneyFlow_Statement_${periodLabel ? periodLabel.replace(/\s+/g, '_') : 'all'}.pdf`)
}
