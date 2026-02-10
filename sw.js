const CACHE_NAME = 'taxi-app-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

// 설치 이벤트
self.addEventListener('install', event => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch 이벤트
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('[SW] Cache hit:', event.request.url);
          return response;
        }
        
        console.log('[SW] Fetching:', event.request.url);
        return fetch(event.request).then(
          response => {
            // 유효하지 않은 응답은 캐시하지 않음
            if (!response || response.status !== 200) {
              return response;
            }

            // HTML, CSS, JS, 이미지만 캐싱
            const responseToCache = response.clone();
            const url = event.request.url;
            
            if (url.includes('.html') || 
                url.includes('.js') || 
                url.includes('.css') || 
                url.includes('.json') ||
                url.includes('tailwindcss')) {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          }
        ).catch(error => {
          console.log('[SW] Fetch failed:', error);
          // 오프라인일 때 캐시된 index.html 반환
          return caches.match('./index.html');
        });
      })
  );
});
