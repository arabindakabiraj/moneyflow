/**
 * firebase.js — Firestore with Offline Persistent Cache
 * IndexedDB-based local cache → works offline, auto-syncs when back online
 * Also exports Auth for Google OAuth integration
 */
import { initializeApp } from 'firebase/app'
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from 'firebase/firestore'
import { initializeAuth, browserLocalPersistence } from 'firebase/auth'

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

// 🔵 Firebase Auth for Google OAuth
export const auth = initializeAuth(app, {
    persistence: browserLocalPersistence
})

