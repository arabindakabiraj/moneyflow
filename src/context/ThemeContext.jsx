/**
 * ThemeContext.jsx — CSS-variable-based theming with 6 presets
 * Each theme defines brand colors, credit/debit, and card backgrounds.
 * Persists theme choice to localStorage (+ optional Firestore sync).
 */
import { createContext, useContext, useState, useEffect } from 'react'

// ═══════ Theme Presets ═══════
export const THEMES = {
  green: {
    name: 'Default Green',
    emoji: '🌿',
    preview: '#22c55e',
    vars: {
      '--brand-50': '240 253 244', '--brand-100': '220 252 231', '--brand-200': '187 247 208',
      '--brand-300': '134 239 172', '--brand-400': '74 222 128', '--brand-500': '34 197 94',
      '--brand-600': '22 163 74', '--brand-700': '21 128 61',
      '--brand-800': '22 101 52', '--brand-900': '20 83 45',
      '--color-credit': '#22c55e', '--color-debit': '#f43f5e',
      '--splash-from': '#064e3b', '--splash-to': '#059669',
      '--diamond-shadow': 'rgba(34,197,94,0.4)',
    },
  },
  blue: {
    name: 'Midnight Blue',
    emoji: '🌙',
    preview: '#3b82f6',
    vars: {
      '--brand-50': '239 246 255', '--brand-100': '219 234 254', '--brand-200': '191 219 254',
      '--brand-300': '147 197 253', '--brand-400': '96 165 250', '--brand-500': '59 130 246',
      '--brand-600': '37 99 235', '--brand-700': '29 78 216',
      '--brand-800': '30 64 175', '--brand-900': '30 58 138',
      '--color-credit': '#3b82f6', '--color-debit': '#f43f5e',
      '--splash-from': '#1e1b4b', '--splash-to': '#3b82f6',
      '--diamond-shadow': 'rgba(59,130,246,0.4)',
    },
  },
  rose: {
    name: 'Rose Gold',
    emoji: '🌹',
    preview: '#f43f5e',
    vars: {
      '--brand-50': '255 241 242', '--brand-100': '255 228 230', '--brand-200': '254 205 211',
      '--brand-300': '253 164 175', '--brand-400': '251 113 133', '--brand-500': '244 63 94',
      '--brand-600': '225 29 72', '--brand-700': '190 18 60',
      '--brand-800': '159 18 57', '--brand-900': '136 19 55',
      '--color-credit': '#10b981', '--color-debit': '#f43f5e',
      '--splash-from': '#4c0519', '--splash-to': '#f43f5e',
      '--diamond-shadow': 'rgba(244,63,94,0.4)',
    },
  },
  teal: {
    name: 'Ocean Teal',
    emoji: '🌊',
    preview: '#14b8a6',
    vars: {
      '--brand-50': '240 253 250', '--brand-100': '204 251 241', '--brand-200': '153 246 228',
      '--brand-300': '94 234 212', '--brand-400': '45 212 191', '--brand-500': '20 184 166',
      '--brand-600': '13 148 136', '--brand-700': '15 118 110',
      '--brand-800': '17 94 89', '--brand-900': '19 78 74',
      '--color-credit': '#14b8a6', '--color-debit': '#f43f5e',
      '--splash-from': '#042f2e', '--splash-to': '#14b8a6',
      '--diamond-shadow': 'rgba(20,184,166,0.4)',
    },
  },
  purple: {
    name: 'Purple Night',
    emoji: '💜',
    preview: '#a855f7',
    vars: {
      '--brand-50': '250 245 255', '--brand-100': '243 232 255', '--brand-200': '233 213 255',
      '--brand-300': '216 180 254', '--brand-400': '192 132 252', '--brand-500': '168 85 247',
      '--brand-600': '147 51 234', '--brand-700': '126 34 206',
      '--brand-800': '107 33 168', '--brand-900': '88 28 135',
      '--color-credit': '#a855f7', '--color-debit': '#f43f5e',
      '--splash-from': '#2e1065', '--splash-to': '#a855f7',
      '--diamond-shadow': 'rgba(168,85,247,0.4)',
    },
  },
  amoled: {
    name: 'AMOLED Black',
    emoji: '🖤',
    preview: '#10b981',
    vars: {
      '--brand-50': '240 253 244', '--brand-100': '220 252 231', '--brand-200': '187 247 208',
      '--brand-300': '134 239 172', '--brand-400': '74 222 128', '--brand-500': '16 185 129',
      '--brand-600': '5 150 105', '--brand-700': '4 120 87',
      '--brand-800': '6 95 70', '--brand-900': '6 78 59',
      '--color-credit': '#10b981', '--color-debit': '#f43f5e',
      '--splash-from': '#000000', '--splash-to': '#10b981',
      '--diamond-shadow': 'rgba(16,185,129,0.4)',
      // AMOLED-specific overrides
      '--amoled-bg': '#000000',
      '--amoled-card': '#0a0a0a',
      '--amoled-border': '#1a1a1a',
    },
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('mf_theme') || 'green')

  const setTheme = (t) => {
    if (!THEMES[t]) return
    setThemeState(t)
    localStorage.setItem('mf_theme', t)
  }

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    const preset = THEMES[theme]
    if (!preset) return
    const root = document.documentElement

    // Apply all CSS variables from the theme
    Object.entries(preset.vars).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    // Handle AMOLED class toggle
    if (theme === 'amoled') {
      root.classList.add('amoled')
    } else {
      root.classList.remove('amoled')
      // Remove AMOLED-specific vars
      root.style.removeProperty('--amoled-bg')
      root.style.removeProperty('--amoled-card')
      root.style.removeProperty('--amoled-border')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
