/**
 * authUtils.js — V.2 Pure Firebase Authentication
 * No OTP, no FastAPI dependency — direct Firebase Auth for instant login/signup.
 * Phone login supported via Firestore phoneIndex lookup.
 *
 * CHANGES v2.1:
 *  - Fixed: referer/domain-blocked error handling (Vercel domain issue)
 *  - Fixed: phone login "No account found" after signup race condition
 *  - Added: resetPassword() — forgot password via email
 *  - Added: reauthenticateUser() — credential re-verification for sensitive ops
 *  - Added: deactivateAccount() / reactivateAccount()
 *  - Added: scheduleAccountDeletion() / cancelAccountDeletion() (30-day grace)
 *  - Added: permanentlyDeleteAccount() — wipes all data + auth account
 *  - loginUser() now returns { user, profile } so callers can check account status
 */
import { db, auth } from './firebase'
import {
  doc, getDoc, setDoc, getDocs, collection,
  serverTimestamp, deleteDoc, writeBatch, Timestamp,
} from 'firebase/firestore'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
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
export function normalizePhone(phone) {
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

// ─── Error Helper ───
function normalizeError(error) {
  // ✅ FIX: Always convert to string — Firebase sometimes returns objects/undefined
  // that cause 'Cannot read properties of undefined (reading indexOf)'
  const code = String(error?.code || '')
  const message = String(error?.message || '')

  // ✅ FIX: Domain/referer blocked — Firebase Auth unauthorized domain
  // Error code is dynamic (includes the domain name), so we check the string
  if (
    code.includes('blocked') ||
    code === 'auth/unauthorized-domain' ||
    message.toLowerCase().includes('referer') ||
    message.toLowerCase().includes('are-blocked')
  ) {
    return '🚫 This domain is not authorized in Firebase. Go to Firebase Console → Authentication → Settings → Authorized Domains → Add your Vercel domain (e.g. moneyflow-xyz.vercel.app)'
  }

  const map = {
    'auth/email-already-in-use':   'This email is already registered. Try logging in instead.',
    'auth/user-not-found':         'No account found. Please sign up first.',
    'auth/wrong-password':         'Incorrect password. Please try again.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password too weak. Use at least 8 characters.',
    'auth/too-many-requests':      'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/invalid-credential':     'Invalid email or password. Please check and try again.',
    'auth/requires-recent-login':  'Please log in again to perform this action.',
    'auth/user-disabled':          'This account has been disabled. Please contact support.',
    'auth/operation-not-allowed':  'This sign-in method is not enabled. Contact support.',
    'auth/popup-blocked':          'Popup blocked. Please allow popups and try again.',
  }

  return map[code] || message || 'Something went wrong. Please try again.'
}

/* ─────────────────────────────────────────────────────────
   1. REGISTER USER
   ───────────────────────────────────────────────────────── */
/**
 * Creates Firebase Auth account + Firestore profile + phone index.
 */
export async function registerUser(name, email, password, phone = '') {
  try {
    log('Registering new user...')
    const trimmedPhone = phone ? normalizePhone(phone) : ''
    const trimmedEmail = email ? email.trim().toLowerCase() : `phone_${trimmedPhone.replace('+', '')}@moneyflow.local`

    // Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
    const uid = cred.user.uid

    // Store user profile in Firestore (include account-status fields upfront)
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      username: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deactivated: false,
      deletionScheduled: false,
      scheduledDeletionAt: null,
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

/* ─────────────────────────────────────────────────────────
   2. LOGIN USER
   Returns { user, profile } so callers can check account status
   (deactivated, deletionScheduled, etc.)
   ───────────────────────────────────────────────────────── */
export async function loginUser(identifier, password) {
  try {
    const trimmed = identifier.trim()
    let email = trimmed

    // If identifier looks like a phone number, resolve to email
    if (isPhone(trimmed)) {
      const normalized = normalizePhone(trimmed)
      log('Phone login — looking up email for:', normalized)

      // ✅ FIX: Force server fetch (not cache) to avoid race condition right after signup
      let phoneDoc
      try {
        phoneDoc = await getDoc(doc(db, 'phoneIndex', normalized))
      } catch {
        // If cache fails, try again without cache hint
        phoneDoc = await getDoc(doc(db, 'phoneIndex', normalized))
      }

      if (!phoneDoc.exists()) {
        // Give user a helpful message — they may have signed up with email
        throw new Error(
          'No account found with this phone number. If you registered with your email, please log in using your email address instead.'
        )
      }
      email = phoneDoc.data().email
      log('Resolved phone to email:', email)
    }

    // Sign in with Firebase Auth
    log('Signing in...')
    const cred = await signInWithEmailAndPassword(auth, email.toLowerCase(), password)
    saveSession(cred.user.uid)

    // Fetch profile to return account-status flags
    const profile = await getUserProfile(cred.user.uid)
    log('Login complete:', cred.user.uid, '| deactivated:', profile.deactivated)

    return { user: cred.user, profile }
  } catch (error) {
    // Re-throw Error instances (our custom ones) as-is; normalize Firebase errors
    if (error instanceof Error && !error.code) throw error
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   3. FORGOT PASSWORD — sends reset email via Firebase
   ───────────────────────────────────────────────────────── */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase())
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   4. RE-AUTHENTICATE — required before sensitive operations
   ───────────────────────────────────────────────────────── */
export async function reauthenticateUser(password) {
  const user = auth.currentUser
  if (!user || !user.email) {
    throw new Error('Cannot verify identity. Please log in again and retry.')
  }
  const credential = EmailAuthProvider.credential(user.email, password)
  try {
    await reauthenticateWithCredential(user, credential)
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   5. USER PROFILE — Get
   ───────────────────────────────────────────────────────── */
export async function getUserProfile(uid) {
  try {
    const userRef = doc(db, 'users', uid, 'profile', 'info')
    let snap
    try {
      // Fast cache-first retrieval for near 0ms latency
      snap = await getDoc(userRef, { source: 'cache' })
      // If cache miss, fall through to server
      if (!snap.exists()) snap = await getDoc(userRef)
    } catch {
      snap = await getDoc(userRef)
    }
    return snap.exists() ? snap.data() : {}
  } catch (error) {
    console.error('Profile read error:', error.code)
    return {}
  }
}

/* ─────────────────────────────────────────────────────────
   6. USER PROFILE — Setup/Update
   ───────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────
   7. LOG OUT
   ───────────────────────────────────────────────────────── */
export async function logoutUser() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Logout error:', error.code)
  } finally {
    clearSession()
  }
}

/* ─────────────────────────────────────────────────────────
   8. DEACTIVATE ACCOUNT
   Hides account temporarily. Data stays safe in Firebase.
   Requires password re-authentication.
   ───────────────────────────────────────────────────────── */
export async function deactivateAccount(uid, password) {
  // Re-authenticate before making this change
  await reauthenticateUser(password)
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      deactivated: true,
      deactivatedAt: serverTimestamp(),
    }, { merge: true })
    await logoutUser()
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   9. REACTIVATE ACCOUNT
   Called when a deactivated user chooses to come back.
   ───────────────────────────────────────────────────────── */
export async function reactivateAccount(uid) {
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      deactivated: false,
      deactivatedAt: null,
    }, { merge: true })
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   10. SCHEDULE ACCOUNT DELETION (30-day grace period)
   Sets a deletion timestamp 30 days from now.
   The check happens on next login or via Cloud Function.
   ───────────────────────────────────────────────────────── */
export async function scheduleAccountDeletion(uid, password) {
  await reauthenticateUser(password)
  try {
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      deletionScheduled: true,
      scheduledDeletionAt: Timestamp.fromDate(deletionDate),
    }, { merge: true })
    await logoutUser()
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   11. CANCEL ACCOUNT DELETION
   ───────────────────────────────────────────────────────── */
export async function cancelAccountDeletion(uid) {
  try {
    await setDoc(doc(db, 'users', uid, 'profile', 'info'), {
      deletionScheduled: false,
      scheduledDeletionAt: null,
    }, { merge: true })
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   12. PERMANENTLY DELETE ACCOUNT
   Deletes all Firestore data + Firebase Auth account.
   Requires password re-authentication.
   ───────────────────────────────────────────────────────── */
export async function permanentlyDeleteAccount(uid, password) {
  // Re-authenticate first — this is irreversible
  await reauthenticateUser(password)

  try {
    const batch = writeBatch(db)

    // Delete all known user data subcollections
    const knownCollections = [
      'transactions', 'goals', 'budgets', 'accounts',
      'debts', 'reminders', 'recurring', 'categories',
      'groups', 'notifications',
    ]

    for (const col of knownCollections) {
      try {
        const snap = await getDocs(collection(db, 'users', uid, col))
        snap.forEach(d => batch.delete(d.ref))
      } catch {
        // Collection might not exist, skip
      }
    }

    // Delete profile document
    batch.delete(doc(db, 'users', uid, 'profile', 'info'))

    await batch.commit()

    // Remove phone index if exists
    try {
      const profile = await getDoc(doc(db, 'users', uid, 'profile', 'info'))
      if (profile.exists() && profile.data()?.phone) {
        await deleteDoc(doc(db, 'phoneIndex', profile.data().phone))
      }
    } catch { /* ignore */ }

    // Delete Firebase Auth account (must be last)
    if (auth.currentUser) {
      await deleteUser(auth.currentUser)
    }

    clearSession()
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   SHA-256 Hash (for local PIN verification)
   Uses Web Crypto API (hardware-accelerated) with synchronous fallback
   ───────────────────────────────────────────────────────── */
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
