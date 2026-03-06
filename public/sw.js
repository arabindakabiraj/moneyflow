/**
 * Service Worker for MoneyFlow PWA
 * Offline support + cache strategy + push notifications
 */
const CACHE_NAME = 'moneyflow-v2'
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

    // Skip API calls — always go to network
    if (
        event.request.url.includes('googleapis.com') ||
        event.request.url.includes('script.google.com') ||
        event.request.url.includes('generativelanguage.googleapis.com') ||
        event.request.url.includes('openrouter.ai') ||
        event.request.url.includes('firestore.googleapis.com')
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

// ═══════ Push Notifications ═══════
self.addEventListener('push', (event) => {
    let data = { title: 'MoneyFlow', body: 'You have a new notification', icon: '/icons/icon-192.png' }

    if (event.data) {
        try {
            data = { ...data, ...event.data.json() }
        } catch {
            data.body = event.data.text()
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now(),
        },
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' },
        ],
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    )
})

// ═══════ Notification Click Handler ═══════
self.addEventListener('notificationclick', (event) => {
    event.notification.close()

    if (event.action === 'dismiss') return

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus()
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data?.url || '/')
            }
        })
    )
})
