/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// 清理旧版本缓存（从自毁版 SW 迁移时的残留）
cleanupOutdatedCaches()

// 预缓存 App Shell（构建时由 vite-plugin-pwa 注入 manifest）
precacheAndRoute(self.__WB_MANIFEST)

// 导航请求：NetworkFirst，3秒超时回退缓存的 index.html
const navigationHandler = new NetworkFirst({
  cacheName: 'navigations',
  networkTimeoutSeconds: 3,
})
registerRoute(new NavigationRoute(navigationHandler))

// /assets/* 静态资源（带 hash）：CacheFirst
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
