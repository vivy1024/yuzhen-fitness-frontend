/**
 * Service Worker - 自毁版本
 * 
 * 清除所有缓存并注销自身，解决旧SW缓存导致的无限循环问题
 * 
 * @version 2.0.0
 * @date 2026-02-12
 */

// 安装时立即激活
self.addEventListener('install', () => {
  self.skipWaiting()
})

// 激活时清除所有缓存并注销自身
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] 清除缓存:', cacheName)
          return caches.delete(cacheName)
        })
      )
    }).then(() => {
      console.log('[SW] 所有缓存已清除，注销自身')
      return self.registration.unregister()
    }).then(() => {
      return self.clients.matchAll()
    }).then((clients) => {
      clients.forEach((client) => client.navigate(client.url))
    })
  )
})

// 不拦截任何请求，直接走网络
self.addEventListener('fetch', () => {
  // 不做任何处理，让请求正常通过
})
