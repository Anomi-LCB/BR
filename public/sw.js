const CACHE_NAME = 'bible-365-v2';
const ASSETS = [
  '/',
  '/manifest.json',
  '/logo-final.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  // 새 서비스 워커가 설치되는 즉시 대기상태를 스킵하고 활성화
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  // 활성화 즉시 클라이언트 제어권 가져옴
  event.waitUntil(self.clients.claim());
  
  // 구버전 캐시 강제 삭제
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[Service Worker] 구버전 캐시 삭제:', name);
            return caches.delete(name);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Vercel 배포 시, 클라이언트가 영원히 옛날 파일만 보는 문제(Cache-First)를 해결하기 위해
  // "Network First, fallback to cache" 전략으로 전면 수정합니다.
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 네트워크가 성공(200)했다면, 캐시에다가 최신 버전을 덮어씌움
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 오프라인 상태이거나 네트워크 연결에 실패한 경우에만 과거 캐시 사용
        return caches.match(event.request);
      })
  );
});

// PWA Push Notification Logic
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '오늘의 성경 말씀을 확인해보세요.',
      icon: '/logo-final.png',
      badge: '/logo-final.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '성경 365', options)
    );
  } catch (err) {
    console.error('Push handling error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
