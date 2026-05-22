/**
 * firebase.js — Firestore with Offline Persistent Cache + Firebase Auth
 * IndexedDB-based local cache → works offline, auto-syncs when back online
 * Auth uses getAuth() (required for signInWithPopup/signInWithRedirect)
 */
import { initializeApp } from 'firebase/app'
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from 'firebase/firestore'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

// 🟢 Firestore with persistent offline cache (IndexedDB)
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
})

// 🔵 Firebase Auth — MUST use getAuth() for signInWithPopup/signInWithRedirect to work
// initializeAuth() creates a separate instance incompatible with signInWithPopup
export const auth = getAuth(app)

// Set persistence to browserLocal so users stay logged in across sessions
setPersistence(auth, browserLocalPersistence).catch(console.error)
