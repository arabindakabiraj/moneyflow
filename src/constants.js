/**
 * constants.js — Shared constants to eliminate magic strings
 */

// ── Tab IDs ──
export const TABS = {
  DASHBOARD:    'dashboard',
  TRANSACTIONS: 'transactions',
  ADD:          'add',
  CHARTS:       'charts',
  ACCOUNTS:     'accounts',
  NOTIFICATIONS:'notifications',
  DEBTS:        'debts',
  SPLIT:        'split',
  AI:           'ai',
  SMART_ADD:    'smartadd',
  GOALS:        'goals',
  EMI:          'emi',
  BILLS:        'bills',
  RECURRING:    'recurring',
  GROUPS:       'groups',
  SMS_IMPORT:   'smsimport',
  FAMILY:       'family',
  LEDGER:       'ledger',
  CASHFLOW:     'cashflow',
  SETTINGS:     'settings',
}

// ── Category emojis (shared across Dashboard, Transactions, etc.) ──
export const CATEGORY_EMOJI = {
  Tiffin:        '🍱',
  Books:         '📚',
  Travel:        '🚌',
  Tuition:       '🎓',
  Others:        '💼',
  Entertainment: '🎮',
  Health:        '💊',
  Rent:          '🏠',
  Mobile:        '📱',
  Electricity:   '⚡',
  Groceries:     '🛒',
  Food:          '🍽️',
  Clothing:      '👕',
  Investment:    '📈',
  Insurance:     '🛡️',
}

// ── Default categories ──
export const DEFAULT_CATEGORIES = [
  'Tiffin', 'Books', 'Travel', 'Tuition',
  'Entertainment', 'Health', 'Rent', 'Others',
]

// ── Cash flow category groups ──
export const OPERATING_CATS = [
  'Tiffin', 'Books', 'Travel', 'Entertainment', 'Health', 'Rent',
  'Others', 'Mobile', 'Electricity', 'Groceries', 'Food', 'Clothing',
]
export const INVESTING_CATS = [
  'Investment', 'Savings', 'Gold', 'Stocks', 'MF', 'FD', 'Insurance',
]
export const FINANCING_CATS = [
  'Loan', 'Debt', 'Repayment', 'Credit Card', 'EMI', 'Tuition',
]
