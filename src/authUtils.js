import { supabase } from './supabase'

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

export function normalizePhone(phone) {
  const cleaned = phone.trim().replace(/[\s\-()]/g, '')
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
  console.error('[Auth Error Detail]', error)
  const message = String(error?.message || error || '')
  
  if (message.includes('Email already registered') || message.includes('already exists')) {
    return 'This email is already registered. Try logging in instead.'
  }
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
    return 'Invalid email or password. Please check and try again.'
  }
  if (message.includes('User not found') || message.includes('user-not-found')) {
    return 'No account found. Please sign up first.'
  }
  if (message.includes('valid email')) {
    return 'Please enter a valid email address.'
  }
  if (message.includes('Password should be')) {
    return 'Password too weak. Use at least 6 characters.'
  }
  if (message.includes('too many requests') || message.includes('429')) {
    return 'Too many attempts. Please wait a moment and try again.'
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection and try again.'
  }
  return message || 'Something went wrong.'
}

export function mapProfileFromDb(p) {
  if (!p) return {}
  return {
    username: p.username,
    email: p.email,
    phone: p.phone,
    photoURL: p.photo_url,
    deactivated: p.deactivated,
    deactivatedAt: p.deactivated_at,
    deletionScheduled: p.deletion_scheduled,
    scheduledDeletionAt: p.scheduled_deletion_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }
}

/* ─────────────────────────────────────────────────────────
   1. REGISTER USER
   ───────────────────────────────────────────────────────── */
export async function registerUser(name, email, password, phone = '') {
  try {
    log('Registering new user...')
    if (!email) throw new Error('Email address is strictly required.')
    const trimmedPhone = phone ? normalizePhone(phone) : ''
    const trimmedEmail = email.trim().toLowerCase()

    // Create Supabase Auth user
    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          username: name.trim(),
          phone: trimmedPhone
        }
      }
    })

    if (error) throw error
    const user = data.user
    if (!user) {
      // Supabase returns an empty success response if the email already exists to prevent email enumeration
      throw new Error('This email is already registered. Please try logging in instead.')
    }

    if (data.session) {
      saveSession(user.id)
    }
    log('Registration complete:', user.id)
    return { user, session: data.session }
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   OTP VERIFICATION HELPERS
   ───────────────────────────────────────────────────────── */
export async function verifySignupOtp(email, token) {
  try {
    log('Verifying signup OTP for:', email)
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'signup'
    })
    if (error) throw error
    
    const user = data.user
    const session = data.session
    if (!user) throw new Error('Failed to verify OTP.')
    
    saveSession(user.id)
    log('OTP verification successful, user logged in:', user.id)
    return { user, session }
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

export async function resendSignupOtp(email) {
  try {
    log('Resending signup OTP for:', email)
    const { error } = await supabase.auth.resend({
      email: email.trim().toLowerCase(),
      type: 'signup'
    })
    if (error) throw error
    log('Signup OTP resent successfully')
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

export async function sendLoginOtp(email) {
  try {
    log('Requesting login OTP for:', email)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: false
      }
    })
    if (error) throw error
    log('Login OTP sent successfully')
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

export async function verifyLoginOtp(email, token) {
  try {
    log('Verifying login OTP for:', email)
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email'
    })
    if (error) throw error
    
    const user = data.user
    const session = data.session
    if (!user) throw new Error('Failed to verify login OTP.')
    
    saveSession(user.id)
    log('Login OTP verification successful, user logged in:', user.id)
    return { user, session }
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   2. LOGIN USER
   ───────────────────────────────────────────────────────── */
export async function loginUser(identifier, password) {
  try {
    const trimmed = identifier.trim()
    let email = trimmed

    if (isPhone(trimmed)) {
      const normalized = normalizePhone(trimmed)
      log('Phone login — looking up email for:', normalized)

      const { data: phoneRow, error: phoneErr } = await supabase
        .from('phone_index')
        .select('email')
        .eq('phone', normalized)
        .maybeSingle()

      if (phoneErr) throw phoneErr
      if (!phoneRow) {
        throw new Error(
          'No account found with this phone number. If you registered with your email, please log in using your email address instead.'
        )
      }
      email = phoneRow.email
      log('Resolved phone to email:', email)
    }

    log('Signing in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password
    })

    if (error) throw error
    const user = data.user
    if (!user) throw new Error('No user returned from login.')

    saveSession(user.id)

    // Fetch profile
    const profile = await getUserProfile(user.id)
    log('Login complete:', user.id, '| deactivated:', profile.deactivated)

    return { user, profile }
  } catch (error) {
    if (error instanceof Error && !error.status) throw error
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   3. FORGOT PASSWORD
   ───────────────────────────────────────────────────────── */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase())
    if (error) throw error
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   4. RE-AUTHENTICATE
   ───────────────────────────────────────────────────────── */
export async function reauthenticateUser(password) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    throw new Error('Cannot verify identity. Please log in again and retry.')
  }
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password
    })
    if (error) throw error
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   5. USER PROFILE — Get
   ───────────────────────────────────────────────────────── */
export async function getUserProfile(uid) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()

    if (error) throw error
    return data ? mapProfileFromDb(data) : {}
  } catch (error) {
    console.error('Profile read error:', error.message)
    return {}
  }
}

/* ─────────────────────────────────────────────────────────
   6. USER PROFILE — Setup/Update
   ───────────────────────────────────────────────────────── */
export async function setupUserProfile(uid, username, email = null, phone = null) {
  try {
    const { data: current } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle()

    const updates = {
      username: username || 'MoneyFlow User',
      email: email || current?.email || '',
      phone: phone || current?.phone || '',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', uid)

    if (error) throw error
  } catch (error) {
    console.error('Profile write error:', error.message)
    throw error
  }
}

/* ─────────────────────────────────────────────────────────
   7. LOG OUT
   ───────────────────────────────────────────────────────── */
export async function logoutUser() {
  try {
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error.message)
  } finally {
    clearSession()
  }
}

/* ─────────────────────────────────────────────────────────
   8. DEACTIVATE ACCOUNT
   ───────────────────────────────────────────────────────── */
export async function deactivateAccount(uid, password) {
  await reauthenticateUser(password)
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        deactivated: true,
        deactivated_at: new Date().toISOString()
      })
      .eq('id', uid)

    if (error) throw error
    await logoutUser()
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   9. REACTIVATE ACCOUNT
   ───────────────────────────────────────────────────────── */
export async function reactivateAccount(uid) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        deactivated: false,
        deactivated_at: null
      })
      .eq('id', uid)

    if (error) throw error
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   10. SCHEDULE ACCOUNT DELETION (30-day grace period)
   ───────────────────────────────────────────────────────── */
export async function scheduleAccountDeletion(uid, password) {
  await reauthenticateUser(password)
  try {
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)

    const { error } = await supabase
      .from('profiles')
      .update({
        deletion_scheduled: true,
        scheduled_deletion_at: deletionDate.toISOString()
      })
      .eq('id', uid)

    if (error) throw error
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
    const { error } = await supabase
      .from('profiles')
      .update({
        deletion_scheduled: false,
        scheduled_deletion_at: null
      })
      .eq('id', uid)

    if (error) throw error
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   12. PERMANENTLY DELETE ACCOUNT
   ───────────────────────────────────────────────────────── */
export async function permanentlyDeleteAccount(uid, password) {
  await reauthenticateUser(password)
  try {
    // Call the security definer RPC function that deletes user from auth.users (cascades database tables)
    const { error } = await supabase.rpc('delete_user')
    if (error) throw error
    clearSession()
  } catch (error) {
    throw new Error(normalizeError(error))
  }
}

/* ─────────────────────────────────────────────────────────
   SHA-256 Hash (for local PIN verification)
   ───────────────────────────────────────────────────────── */
export async function sha256Async(message) {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  } catch {
    return sha256ForPin(message)
  }
}

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
