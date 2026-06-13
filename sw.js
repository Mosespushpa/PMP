/**
 * Service Worker for Personal Music Player
 * Provides offline functionality and caching strategies
 */

const CACHE_NAME = 'music-player-v1.0.0';
const STATIC_CACHE_NAME = 'music-player-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'music-player-dynamic-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/js/utils.js',
    '/js/storage.js',
    '/js/library.js',
    '/js/playlist.js',
    '/js/player.js',
    '/js/queue.js',
    '/js/ui.js',
    '/js/app.js',
    '/manifest.json'
];

// Assets to cache with stale-while-revalidate strategy
const DYNAMIC_ASSETS = [
    // Poster images and media files will be cached dynamically
];

// Network-only resources (media files are too large to cache effectively)
const NETWORK_ONLY_PATTERNS = [
    /\.mp3$/i,
    /\.m4a$/i,
    /\.wav$/i,
    /\.ogg$/i,
    /\.mp4$/i,
    /\.webm$/i,
    /\.ogv$/i
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('Service Worker: Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static assets:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('music-player-')) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('Service Worker: Activation failed:', error);
            })
    );
});

/**
 * Fetch event - handle requests with appropriate caching strategies
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Check if this is a media file (network-only strategy)
    const isMediaFile = NETWORK_ONLY_PATTERNS.some(pattern => 
        pattern.test(url.pathname)
    );
    
    if (isMediaFile) {
        // Media files: Network only (too large to cache effectively)
        event.respondWith(fetch(request));
        return;
    }
    
    // For all other requests, use cache-first strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    // For static assets, return cached version immediately
                    if (STATIC_ASSETS.includes(url.pathname) || url.pathname === '/') {
                        return cachedResponse;
                    }
                    
                    // For dynamic assets, return cached version but also update in background
                    fetchAndCache(request);
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network and cache if successful
                return fetchAndCache(request);
            })
            .catch(() => {
                // Network failed and not in cache
                if (url.pathname === '/' || url.pathname.endsWith('.html')) {
                    // Return offline page for HTML requests
                    return caches.match('/index.html');
                }
                
                // For other resources, return a basic error response
                return new Response('Offline', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});

/**
 * Fetch from network and cache the response
 * @param {Request} request - The request to fetch
 * @returns {Promise<Response>} The response
 */
async function fetchAndCache(request) {
    try {
        const response = await fetch(request);
        
        // Only cache successful responses
        if (response.status === 200) {
            const responseClone = response.clone();
            
            // Determine cache name based on asset type
            const cacheName = STATIC_ASSETS.includes(new URL(request.url).pathname) 
                ? STATIC_CACHE_NAME 
                : DYNAMIC_CACHE_NAME;
            
            // Cache the response
            caches.open(cacheName)
                .then((cache) => cache.put(request, responseClone))
                .catch((error) => {
                    console.error('Service Worker: Failed to cache response:', error);
                });
        }
        
        return response;
    } catch (error) {
        console.error('Service Worker: Fetch failed:', error);
        throw error;
    }
}

/**
 * Handle background sync for offline actions
 */
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync-upload') {
        event.waitUntil(handleBackgroundUpload());
    }
    
    if (event.tag === 'background-sync-metadata') {
        event.waitUntil(handleBackgroundMetadata());
    }
});

/**
 * Handle background upload sync
 */
async function handleBackgroundUpload() {
    try {
        // This would handle any pending uploads that failed while offline
        console.log('Service Worker: Handling background upload sync');
        
        // Implementation would depend on how offline uploads are queued
        // For now, just log the event
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Background upload sync failed:', error);
        throw error;
    }
}

/**
 * Handle background metadata extraction sync
 */
async function handleBackgroundMetadata() {
    try {
        console.log('Service Worker: Handling background metadata sync');
        
        // This would handle any pending metadata extraction
        // Implementation would depend on offline queue system
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Background metadata sync failed:', error);
        throw error;
    }
}

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
    const { action, data } = event.data;
    
    switch (action) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({
                version: CACHE_NAME
            });
            break;
            
        case 'CACHE_MEDIA_ITEM':
            // Cache a specific media item poster
            if (data.url) {
                caches.open(DYNAMIC_CACHE_NAME)
                    .then((cache) => cache.add(data.url))
                    .catch((error) => {
                        console.error('Service Worker: Failed to cache media item:', error);
                    });
            }
            break;
            
        case 'CLEAR_CACHE':
            // Clear dynamic cache on request
            caches.delete(DYNAMIC_CACHE_NAME)
                .then(() => {
                    console.log('Service Worker: Dynamic cache cleared');
                    event.ports[0].postMessage({ success: true });
                })
                .catch((error) => {
                    console.error('Service Worker: Failed to clear cache:', error);
                    event.ports[0].postMessage({ success: false, error: error.message });
                });
            break;
            
        default:
            console.log('Service Worker: Unknown message action:', action);
    }
});

/**
 * Handle push notifications (future enhancement)
 */
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received:', event);
    
    // This could be used for features like:
    // - New music recommendations
    // - Sync completion notifications
    // - App updates
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from Music Player',
        icon: '/assets/icon-192.png',
        badge: '/assets/badge-72.png',
        tag: 'music-player-notification',
        renotify: true,
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Music Player', options)
    );
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        // Open or focus the app
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // If app is already open, focus it
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Otherwise, open a new window
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Log service worker registration errors
self.addEventListener('error', (error) => {
    console.error('Service Worker: Global error:', error);
});

self.addEventListener('unhandledrejection', (error) => {
    console.error('Service Worker: Unhandled promise rejection:', error);
});