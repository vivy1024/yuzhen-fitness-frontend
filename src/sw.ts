/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// ─── 立即接管：新 SW 安装后跳过等待，直接激活 ───
self.skipWaiting()
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// 清理旧版本预缓存
cleanupOutdatedCaches()

// 预缓存 App Shell（构建时由 vite-plugin-pwa 注入 manifest）
// index.html 已从 globPatterns 排除，由 NavigationRoute 单独处理
precacheAndRoute(self.__WB_MANIFEST)

// 导航请求：使用预缓存的 index.html 作为 SPA fallback
// precacheAndRoute 已缓存 index.html（通过 navigateFallback），
// createHandlerBoundToURL 从预缓存提供它，保证版本一致性
const navigationHandler = createHandlerBoundToURL('/index.html')
registerRoute(new NavigationRoute(navigationHandler))

// /assets/* 静态资源（带 content hash，天然不可变）：CacheFirst
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/'),
  new CacheFirst({
    cacheName: 'assets',
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 })],
  })
)

// /icons/* 图标：CacheFirst
registerRoute(
  ({ url }) => url.pathname.startsWith('/icons/'),
  new CacheFirst({
    cacheName: 'icons',
    plugins: [new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 })],
  })
)

// /screenshots/* 截图：StaleWhileRevalidate
registerRoute(
  ({ url }) => url.pathname.startsWith('/screenshots/'),
  new StaleWhileRevalidate({
    cacheName: 'screenshots',
    plugins: [new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 24 * 60 * 60 })],
  })
)

// /api/* API 请求：NetworkOnly（不缓存）
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
)

// ─── Push Notification ───────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload: { title: string; body: string; icon?: string; url?: string }
  try {
    payload = event.data.json()
  } catch {
    payload = { title: '玉珍健身', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: payload.url || '/' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
