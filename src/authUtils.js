/**
 * authUtils.js — V.2 Pure Firebase Authentication
 * No OTP, no FastAPI dependency — direct Firebase Auth for instant login/signup.
 * Phone login supported via Firestore phoneIndex lookup.
 */
import { db, auth } from './firebase'
import { doc, getDoc, setDoc, getDocs, query, where, collection, serverTimestamp } from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'

// ─── Logging (dev-only) ───
const isDev = import.meta.env.DEV
const log = (...args) => { if (isDev) console.log('[Auth]', ...args) }

// ─── Input detection ───
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/

export function isEmail(input) {
  return EMAIL_REGEX.test(input?.trim())
}

export function isPhone(input) {
  return PHONE_REGEX.test(input?.trim())
}

/**
 * Normalize phone number — ensure it has country code
 */
function normalizePhone(phone) {
  const cleaned = phone.trim().replace(/[\s\-()]/g, '')
  // If no country code, assume India (+91)
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`
  return cleaned
}

// ─── Session helpers (synchronous, for fast startup) ───
export function saveSession(uid) {
  localStorage.setItem('mf_uid', uid)
}

export function getSession() {
  return localStorage.getItem('mf_uid') || null
}

export function clearSession() {
  localStorage.removeItem('mf_uid')
}

// ─── Firestore Error Helper ───
function normalizeError(error) {
  const code = error?.code || ''
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Try logging in.',
    'auth/user-not-found': 'No account found. Please sign up first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
  }
  return map[code] || error?.message || 'Something went wrong. Please try again.'
}

/**
 * 1. Register User
 * Creates Firebase Auth account + Firestore profile + phone index
 */
export async function registerUser(name, email, password, phone = '') {
  try {
    log('Registering new user...')
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedPhone = phone ? normalizePhone(phone) : ''

    // Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
    const uid = cred.user.uid

    // Store user profile in Firestore
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      username: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Store phone→uid index for phone login (if phone provided)
    if (trimmedPhone) {
      await setDoc(doc(db, 'phoneIndex', trimmedPhone), {
        uid,
        email: trimmedEmail,
        createdAt: serverTimestamp(),
      })
    }

    saveSession(uid)
    log('Registration complete:', uid)
    return cred.user
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/**
 * 2. Login User
 * Accepts email OR phone number + password
 * Phone login: looks up email from phoneIndex, then signs in with email+password
 */
export async function loginUser(identifier, password) {
  try {
    const trimmed = identifier.trim()
    let email = trimmed

    // If identifier looks like a phone number, resolve to email
    if (isPhone(trimmed)) {
      const normalized = normalizePhone(trimmed)
      log('Phone login — looking up email for:', normalized)

      const phoneDoc = await getDoc(doc(db, 'phoneIndex', normalized))
      if (!phoneDoc.exists()) {
        throw { code: 'auth/user-not-found' }
      }
      email = phoneDoc.data().email
      log('Resolved phone to email:', email)
    }

    // Sign in with Firebase Auth
    log('Signing in...')
    const cred = await signInWithEmailAndPassword(auth, email.toLowerCase(), password)
    saveSession(cred.user.uid)
    log('Login complete:', cred.user.uid)
    return cred.user
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/**
 * 3. User Profile — Get
 */
export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, 'users', uid, 'profile', 'info')
    let snap
    try {
      // Fast cache-first retrieval for near 0ms latency
      snap = await getDoc(userRef, { source: 'cache' })
    } catch {
      snap = await getDoc(userRef)
    }
    return snap.exists() ? snap.data() : {}
  } catch (error) {
    console.error('Profile read error:', error.code)
    return {}
  }
}

/**
 * 4. User Profile — Setup/Update
 */
export async function setupUserProfile(uid, username, email = null, phone = null) {
  const userRef = doc(db, 'users', uid, 'profile', 'info')
  try {
    const docSnap = await getDoc(userRef)
    await setDoc(userRef, {
      username: username || 'MoneyFlow User',
      email: email || docSnap.data()?.email || '',
      phone: phone || docSnap.data()?.phone || '',
      updatedAt: serverTimestamp(),
      ...(docSnap.exists() ? {} : { createdAt: serverTimestamp() }),
    }, { merge: true })
  } catch (error) {
    console.error('Profile write error:', error.code)
    throw error
  }
}

/**
 * 5. Log Out
 */
export async function logoutUser() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout error:', error.code)
  } finally {
    clearSession()
  }
}

/**
 * 6. SHA-256 Hash (for local PIN verification)
 * Uses Web Crypto API (hardware-accelerated) with synchronous fallback
 */
export async function sha256Async(message) {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // Fallback to sync implementation
    return sha256ForPin(message)
  }
}

/**
 * Synchronous SHA-256 (pure JS fallback for environments without SubtleCrypto)
 */
export function sha256ForPin(ascii) {
  function rotateRight(n, x) {
    return (x >>> n) | (x << (32 - n))
  }
  const mathPow = Math.pow
  const maxWord = mathPow(2, 32)
  let result = ''
  const words = []
  const asciiLength = ascii.length * 8

  let i, j
  const hash = []
  const k = []
  let primeCounter = 0

  const isPrime = (n) => {
    for (let factor = 2; factor * factor <= n; factor++) {
      if (n % factor === 0) return false
    }
    return true
  }

  let candidate = 2
  while (primeCounter < 64) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0
      primeCounter++
    }
    candidate++
  }

  ascii += '\x80'
  while (ascii.length % 64 - 56) {
    ascii += '\x00'
  }
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i)
    if (j >> 8) return
    words[i >> 2] |= j << (24 - (i % 4) * 8)
  }
  words[words.length] = ((asciiLength / maxWord) | 0)
  words[words.length] = (asciiLength | 0)

  for (j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16)
    const oldHash = [].concat(hash)
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2]
      const s0 = rotateRight(7, w15) ^ rotateRight(18, w15) ^ (w15 >>> 3)
      const s1 = rotateRight(17, w2) ^ rotateRight(19, w2) ^ (w2 >>> 10)
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6])
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2])
      const temp1 = hash[7] + (rotateRight(6, hash[4]) ^ rotateRight(11, hash[4]) ^ rotateRight(25, hash[4])) + ch + k[i] + (w[i] = (i < 16 ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0))
      const temp2 = (rotateRight(2, hash[0]) ^ rotateRight(13, hash[0]) ^ rotateRight(22, hash[0])) + maj
      hash[7] = hash[6]
      hash[6] = hash[5]
      hash[5] = hash[4]
      hash[4] = (hash[3] + temp1) | 0
      hash[3] = hash[2]
      hash[2] = hash[1]
      hash[1] = hash[0]
      hash[0] = (temp1 + temp2) | 0
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255
      result += (b < 16 ? '0' : '') + b.toString(16)
    }
  }
  return result
}
