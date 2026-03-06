/**
 * smsParser.js — Parse Indian bank SMS messages into transaction objects
 * Supports SBI, HDFC, ICICI, Axis, Kotak, PhonePe, GPay, Paytm + generic formats
 */

// Amount patterns: "Rs.200", "Rs 200", "INR 200.00", "₹500", "Rs200"
const AMOUNT_RE = /(?:Rs\.?\s*|INR\s*|₹\s*)([\d,]+(?:\.\d{1,2})?)/i

// Debit keywords
const DEBIT_KEYWORDS = /debited|debit|spent|withdrawn|paid|purchase|sent|transferred to|payment of|charged/i

// Credit keywords
const CREDIT_KEYWORDS = /credited|credit|received|deposited|refund|cashback|added|transferred from/i

// Date patterns: "20-Mar-26", "20/03/26", "2026-03-20", "20-03-2026"
const DATE_PATTERNS = [
  /(\d{2})-([A-Za-z]{3})-(\d{2,4})/,           // 20-Mar-26
  /(\d{2})\/(\d{2})\/(\d{2,4})/,                  // 20/03/26
  /(\d{4})-(\d{2})-(\d{2})/,                       // 2026-03-20
  /(\d{2})-(\d{2})-(\d{4})/,                       // 20-03-2026
]

const MONTHS = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' }

// Account type detection
const UPI_KEYWORDS = /upi|phonepe|google pay|gpay|paytm|bhim|razorpay/i
const BANK_KEYWORDS = /a\/c|acct|account|neft|rtgs|imps|ifsc|bank/i

/**
 * Parse a date string from SMS into YYYY-MM-DD
 */
function parseDate(text) {
  // Pattern 1: 20-Mar-26
  let m = text.match(/(\d{2})-([A-Za-z]{3})-(\d{2,4})/)
  if (m) {
    const day = m[1]
    const mon = MONTHS[m[2].toLowerCase()] || '01'
    let year = m[3]
    if (year.length === 2) year = '20' + year
    return `${year}-${mon}-${day}`
  }

  // Pattern 2: 20/03/26 or 20/03/2026
  m = text.match(/(\d{2})\/(\d{2})\/(\d{2,4})/)
  if (m) {
    const day = m[1]
    const mon = m[2]
    let year = m[3]
    if (year.length === 2) year = '20' + year
    return `${year}-${mon}-${day}`
  }

  // Pattern 3: 2026-03-20
  m = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`

  // Pattern 4: 20-03-2026
  m = text.match(/(\d{2})-(\d{2})-(\d{4})/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`

  return new Date().toISOString().split('T')[0]
}

/**
 * Extract a description/merchant from SMS text
 */
function extractDescription(text) {
  // Try common patterns: "at MERCHANT", "to MERCHANT", "from MERCHANT", "Info: TEXT"
  const patterns = [
    /(?:at|@)\s+([A-Za-z0-9\s&'.,-]+?)(?:\s+on|\s+ref|\.|$)/i,
    /(?:to|towards)\s+([A-Za-z0-9\s&'.,-]+?)(?:\s+on|\s+ref|\.|$)/i,
    /(?:from)\s+([A-Za-z0-9\s&'.,-]+?)(?:\s+on|\s+ref|\.|$)/i,
    /(?:Info|Ref|Details?):\s*(.+?)(?:\.|$)/i,
    /(?:VPA|UPI)\s+([a-zA-Z0-9@._-]+)/i,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m && m[1].trim().length > 1 && m[1].trim().length < 60) {
      return m[1].trim()
    }
  }

  return 'Bank Transaction'
}

/**
 * Parse a single SMS message string into a transaction object
 * @param {string} sms - Raw SMS text
 * @returns {object|null} - Parsed transaction or null
 */
export function parseSMS(sms) {
  if (!sms || sms.trim().length < 10) return null

  // Extract amount
  const amountMatch = sms.match(AMOUNT_RE)
  if (!amountMatch) return null

  const amount = parseFloat(amountMatch[1].replace(/,/g, ''))
  if (!amount || amount <= 0 || amount > 10000000) return null

  // Determine type
  let type = 'debit'
  if (CREDIT_KEYWORDS.test(sms)) type = 'credit'
  if (DEBIT_KEYWORDS.test(sms)) type = 'debit'
  // If both match, check which appears first
  const creditIdx = sms.search(CREDIT_KEYWORDS)
  const debitIdx = sms.search(DEBIT_KEYWORDS)
  if (creditIdx >= 0 && debitIdx >= 0) {
    type = creditIdx < debitIdx ? 'credit' : 'debit'
  } else if (creditIdx >= 0) {
    type = 'credit'
  }

  // Determine account type
  let account = 'Bank'
  if (UPI_KEYWORDS.test(sms)) account = 'UPI'

  // Parse date
  const date = parseDate(sms)

  // Extract description
  const description = extractDescription(sms)

  return {
    type,
    amount,
    description,
    date,
    account,
    category: 'Others',
    raw: sms.trim(),
  }
}

/**
 * Parse multiple SMS messages (newline-separated)
 * @param {string} bulk - Multiple SMS messages separated by newlines
 * @returns {Array} - Array of parsed transactions
 */
export function parseBulkSMS(bulk) {
  if (!bulk) return []

  // Split by double newline or by common SMS separators
  const messages = bulk
    .split(/\n{2,}|\n(?=[A-Z]{2,}-|Your\s|Dear\s|Amt\s|Rs\.?\s)/i)
    .map(s => s.trim())
    .filter(s => s.length > 10)

  // If we only got 1 result, try splitting by single newline for multi-paste
  const msgs = messages.length <= 1
    ? bulk.split('\n').map(s => s.trim()).filter(s => s.length > 15)
    : messages

  return msgs
    .map(parseSMS)
    .filter(Boolean)
}