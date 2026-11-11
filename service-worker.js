// PixelSprite Service Worker - Offline PWA Support
const CACHE_NAME = 'pixelsprite-pwa-v1.1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './addon-i18n.js',
    './addon-export-system.js',
    './addon-payment.js',
    './addon-login-system.js',
    './addon-advanced-edit.js',
    './addon-paypal.js',
    './addon-community-remix.js',
    './pixel_engine.js',
    './gif-decoder.js',
    './gif_encoder.js',
    './jszip.min.js',
    './logo.png',
    './manifest.json'
];

// Install: Cache Static Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[PWA SW] Pre-caching offline assets...');
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[PWA SW] Cache addAll partial warn:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate: Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[PWA SW] Removing old cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: Network First for APIs, Stale-While-Revalidate for Static Files
self.addEventListener('fetch', (event) => {
    const req = event.request;
    const url = new URL(req.url);

    // Bypass non-GET requests and external APIs (Google auth, payment, render backend, supabase)
    if (req.method !== 'GET') return;
    if (url.origin !== self.location.origin) {
        return; // Let browser handle external network requests
    }

    event.respondWith(
        caches.match(req).then((cachedResponse) => {
            const fetchPromise = fetch(req).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(req, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // If offline and request is HTML navigation, fallback to index.html
                if (req.headers.get('accept') && req.headers.get('accept').includes('text/html')) {
                    return caches.match('./index.html');
                }
            });

            return cachedResponse || fetchPromise;
        })
    );
});

