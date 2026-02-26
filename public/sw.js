/**
 * Service Worker for MoneyFlow PWA
 * Offline support + cache strategy
 */
const CACHE_NAME = 'moneyflow-v1'
const OFFLINE_URL = '/'

// Files to cache immediately on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
]

// Install — precache essential files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS)
        })
    )
    self.skipWaiting()
})

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            )
        })
    )
    self.clients.claim()
})

// Fetch — Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return

    // Skip API calls (Google Sheets, Gemini) — always go to network
    if (
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('script.google.com') ||
        event.request.url.includes('generativelanguage.googleapis.com')
    ) {
        return
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Clone and cache the response
                const responseClone = response.clone()
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseClone)
                })
                return response
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse
                    // If navigate request, return the offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL)
                    }
                    return new Response('Offline', { status: 503 })
                })
            })
    )
})
