/**
 * authUtils.js — Custom auth helpers
 * Phone + Password using SHA-256 + Firestore
 * Firebase Auth SDK লাগবে না!
 */
import { db } from './firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

// SHA-256 hash using browser Web Crypto API
export async function hashPassword(password) {
    const encoded = new TextEncoder().encode(password)
    const hashBuf = await crypto.subtle.digest('SHA-256', encoded)
    return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

// Normalize phone → remove spaces/dashes, add +91 if needed
export function normalizePhone(phone) {
    let p = phone.replace(/[\s\-()]/g, '')
    if (!p.startsWith('+')) p = '+91' + p
    return p
}

// Register new user
export async function registerUser(phone, password) {
    const uid = normalizePhone(phone)
    const userRef = doc(db, 'users', uid, 'profile', 'info')
    const existing = await getDoc(userRef)
    if (existing.exists()) {
        throw new Error('এই number এ আগেই account আছে। Login করো।')
    }
    const hashed = await hashPassword(password)
    await setDoc(userRef, {
        phone: uid,
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
        throw new Error('Account পাওয়া যায়নি। আগে Register করো।')
    }
    const hashed = await hashPassword(password)
    if (snap.data().passwordHash !== hashed) {
        throw new Error('ভুল password! আবার চেষ্টা করো।')
    }
    return uid
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
