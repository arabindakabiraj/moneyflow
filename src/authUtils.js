/**
 * authUtils.js — Custom auth helpers + Google OAuth
 * Phone + Password using pure-JS SHA-256 + Firestore
 * Google OAuth via Firebase Auth
 * Works on HTTP, HTTPS, local network.
 */
import { db, auth } from './firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signOut } from 'firebase/auth'

// Pure JS SHA-256 — works on HTTP, HTTPS, and local network IPs
function sha256(ascii) {
    const K = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ]
    let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]
    const msg = unescape(encodeURIComponent(ascii))
    const bytes = Array.from(msg).map(c => c.charCodeAt(0))
    bytes.push(0x80)
    while (bytes.length % 64 !== 56) bytes.push(0)
    const bitLen = (ascii.length * 8)
    for (let i = 7; i >= 0; i--) bytes.push((bitLen / Math.pow(2, i * 8)) & 0xff)
    const rotr = (x, n) => (x >>> n) | (x << (32 - n))
    for (let i = 0; i < bytes.length; i += 64) {
        const w = Array(64).fill(0)
        for (let j = 0; j < 16; j++)
            w[j] = (bytes[i + j * 4] << 24) | (bytes[i + j * 4 + 1] << 16) | (bytes[i + j * 4 + 2] << 8) | bytes[i + j * 4 + 3]
        for (let j = 16; j < 64; j++) {
            const s0 = rotr(w[j - 15], 7) ^ rotr(w[j - 15], 18) ^ (w[j - 15] >>> 3)
            const s1 = rotr(w[j - 2], 17) ^ rotr(w[j - 2], 19) ^ (w[j - 2] >>> 10)
            w[j] = (w[j - 16] + s0 + w[j - 7] + s1) >>> 0
        }
        let [a, b, c, d, e, f, g, hh] = h
        for (let j = 0; j < 64; j++) {
            const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)
            const ch = (e & f) ^ (~e & g)
            const temp1 = (hh + S1 + ch + K[j] + w[j]) >>> 0
            const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)
            const maj = (a & b) ^ (a & c) ^ (b & c)
            const temp2 = (S0 + maj) >>> 0
            hh = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0
        }
        h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(x => x >>> 0)
    }
    return h.map(x => x.toString(16).padStart(8, '0')).join('')
}

export async function hashPassword(password) {
    return sha256('MoneyFlow2025:' + password)
}

// Sync hash for PIN (used by AppLock — localStorage only, no async needed)
export function sha256ForPin(pin) {
    return sha256('MF_PIN_2025:' + pin)
}

// Normalize phone → remove spaces/dashes, add +91 if needed
export function normalizePhone(phone) {
    let p = phone.replace(/[\s\-()]/g, '')
    if (!p.startsWith('+')) p = '+91' + p
    return p
}

// Register new user (with username)
export async function registerUser(phone, password, username) {
    const uid = normalizePhone(phone)
    const userRef = doc(db, 'users', uid, 'profile', 'info')
    const existing = await getDoc(userRef)
    if (existing.exists()) {
        throw new Error('🚫 An account already exists with this number! Please login.')
    }
    const hashed = await hashPassword(password)
    await setDoc(userRef, {
        phone: uid,
        username: username || 'MoneyFlow User',
        passwordHash: hashed,
        createdAt: serverTimestamp(),
    })
    return uid
}

// Login existing user
export async function loginUser(phone, password) {
    const uid = normalizePhone(phone)
    const userRef = doc(db, 'users', uid, 'profile', 'info')
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
        throw new Error('Account not found. Please register first.')
    }
    const hashed = await hashPassword(password)
    if (snap.data().passwordHash !== hashed) {
        throw new Error('Wrong password! Please try again.')
    }
    return uid
}

// Forgot/Reset password — set new password with phone number
export async function resetPassword(phone, newPassword) {
    const uid = normalizePhone(phone)
    const userRef = doc(db, 'users', uid, 'profile', 'info')
    const snap = await getDoc(userRef)
    if (!snap.exists()) {
        throw new Error('No account found with this number.')
    }
    const hashed = await hashPassword(newPassword)
    await setDoc(userRef, { passwordHash: hashed }, { merge: true })
}

// Get user profile (username etc.)
export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid, 'profile', 'info'))
    return snap.exists() ? snap.data() : {}
}

// Persist session in localStorage
export function saveSession(uid) {
    localStorage.setItem('mf_uid', uid)
}
export function getSession() {
    return localStorage.getItem('mf_uid') || null
}
export function clearSession() {
    localStorage.removeItem('mf_uid')
}

// ═══════ Firebase Configuration Validator ═══════
export function validateFirebaseConfig() {
    console.log('🔍 Firebase Config Validation:')
    console.log('  Auth object:', auth ? '✓ Initialized' : '✗ NOT initialized')
    console.log('  DB object:', db ? '✓ Initialized' : '✗ NOT initialized')
    console.log('  Current user:', auth?.currentUser ? `✓ ${auth.currentUser.email}` : '✗ None')
    
    if (!auth) {
        throw new Error('Firebase Auth is not initialized. Check firebase.js configuration.')
    }
    return true
}

// ═══════ Google OAuth Login ═══════
export async function loginWithGoogle() {
    try {
        console.log('📱 Starting Google Login...')
        
        // Step 1: Validate Firebase is properly initialized
        console.log('Step 1: Validating Firebase configuration...')
        validateFirebaseConfig()
        console.log('  ✓ Firebase validated')
        
        // Step 2: Create Google Provider
        console.log('Step 2: Creating GoogleAuthProvider...')
        console.log('  Auth type:', typeof auth)
        console.log('  Auth value:', auth)
        
        const provider = new GoogleAuthProvider()
        console.log('  ✓ GoogleAuthProvider created:', provider)
        console.log('  ✓ Provider type:', provider.constructor.name)
        
        // Step 3: Set custom parameters
        console.log('Step 3: Setting custom parameters...')
        provider.setCustomParameters({ prompt: 'select_account' })
        console.log('  ✓ Custom parameters set')
        
        // Step 4: Call signInWithPopup
        console.log('Step 4: Calling signInWithPopup...')
        console.log('  Passing auth:', typeof auth === 'object' ? '✓ Object' : '✗ Not an object')
        console.log('  Passing provider:', typeof provider === 'object' ? '✓ Object' : '✗ Not an object')
        
        const result = await signInWithPopup(auth, provider)
        const user = result.user
        console.log('  ✓ Google sign-in successful')
        console.log('  User:', { email: user.email, displayName: user.displayName })
        
        // Step 5: Normalize uid
        console.log('Step 5: Creating user profile...')
        const uid = user.phoneNumber || user.email.split('@')[0]
        console.log('  Generated UID:', uid)
        
        // Step 6: Check if user profile exists in Firestore
        const userRef = doc(db, 'users', uid, 'profile', 'info')
        let userProfile = await getDoc(userRef)
        
        if (!userProfile.exists()) {
            // First time Google login — create profile
            console.log('  Creating new user profile...')
            await setDoc(userRef, {
                phone: uid,
                username: user.displayName || 'Google User',
                email: user.email,
                photoURL: user.photoURL,
                authProvider: 'google',
                createdAt: serverTimestamp(),
            })
            console.log('  ✓ User profile created')
        } else {
            // Update profile with latest Google data
            console.log('  Updating existing user profile...')
            await setDoc(userRef, {
                photoURL: user.photoURL,
                email: user.email,
                authProvider: 'google',
                lastLogin: serverTimestamp()
            }, { merge: true })
            console.log('  ✓ User profile updated')
        }
        
        console.log('✅ Google login completed successfully')
        return uid
    } catch (error) {
        console.error('❌ Google login error:', error)
        console.error('  Error code:', error.code)
        console.error('  Error message:', error.message)
        console.error('  Full error:', error)
        
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Google login cancelled.')
        } else if (error.code === 'auth/popup-blocked') {
            throw new Error('Pop-up blocked. Please allow pop-ups for this site.')
        } else if (error.code === 'auth/argument-error') {
            throw new Error('Firebase configuration error. Please check: 1) Google Sign-In is enabled in Firebase Console, 2) OAuth Consent Screen is configured, 3) The app domain is authorized.')
        } else {
            throw new Error(`Google login failed: ${error.message}`)
        }
    }
}

// ═══════ Logout ═══════
export async function logoutUser() {
    try {
        await signOut(auth)
        clearSession()
    } catch (error) {
        console.error('Logout error:', error)
        // Still clear session even if logout fails
        clearSession()
    }
}
