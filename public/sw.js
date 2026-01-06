/**
 * Service Worker
 * 
 * 实现PWA离线缓存和API响应缓存策略
 * 
 * @version 1.0.0
 * @date 2026-01-07
 */

const CACHE_VERSION = 'v1.0.0'
const STATIC_CACHE = `yuzhen-fitness-static-${CACHE_VERSION}`
const API_CACHE = `yuzhen-fitness-api-${CACHE_VERSION}`
const IMAGE_CACHE = `yuzhen-fitness-images-${CACHE_VERSION}`

// 需要预缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// API缓存策略配置
const API_CACHE_CONFIG = {
  // 筛选选项API - 24小时缓存
  filterOptions: {
    urls: [
      '/api/exercises/filter-options',
      '/api/foods/categories',
      '/api/foods/filter-options',
    ],
    maxAge: 24 * 60 * 60 * 1000, // 24小时
  },
  // 动作和食物列表 - 1小时缓存
  lists: {
    urls: [
      '/api/exercises',
      '/api/foods',
    ],
    maxAge: 60 * 60 * 1000, // 1小时
  },
  // 详情页 - 1小时缓存
  details: {
    urls: [
      '/api/exercises/',
      '/api/foods/',
    ],
    maxAge: 60 * 60 * 1000, // 1小时
  },
}

/**
 * 安装事件 - 预缓存静态资源
 */
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] 预缓存静态资源')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      console.log('[SW] 安装完成')
      return self.skipWaiting()
    })
  )
})

/**
 * 激活事件 - 清理旧缓存
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== API_CACHE &&
            cacheName !== IMAGE_CACHE
          ) {
            console.log('[SW] 删除旧缓存:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] 激活完成')
      return self.clients.claim()
    })
  )
})

/**
 * Fetch事件 - 处理网络请求
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }
  
  // 静态资源 - Cache First策略
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  
  // 图片资源 - Cache First策略
  if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }
  
  // API请求 - Stale While Revalidate策略
  if (isAPIRequest(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, API_CACHE, url.pathname))
    return
  }
  
  // 其他请求 - Network First策略
  event.respondWith(networkFirst(request, STATIC_CACHE))
})

/**
 * Cache First策略
 * 优先使用缓存，缓存不存在时从网络获取
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  if (cached) {
    console.log('[SW] 缓存命中:', request.url)
    return cached
  }
  
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] 网络请求失败:', error)
    throw error
  }
}

/**
 * Stale While Revalidate策略
 * 返回缓存的同时，后台更新缓存
 */
async function staleWhileRevalidate(request, cacheName, pathname) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  
  // 获取缓存配置
  const config = getAPICacheConfig(pathname)
  
  // 检查缓存是否过期
  if (cached) {
    const cachedTime = await getCachedTime(request, cacheName)
    const now = Date.now()
    
    if (cachedTime && (now - cachedTime < config.maxAge)) {
      console.log('[SW] 使用有效缓存:', request.url)
      
      // 后台更新缓存
      fetch(request).then((response) => {
        if (response.ok) {
          cache.put(request, response.clone())
          setCachedTime(request, cacheName, Date.now())
        }
      }).catch(() => {
        // 后台更新失败不影响返回缓存
      })
      
      return cached
    }
  }
  
  // 缓存不存在或已过期，从网络获取
  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
      setCachedTime(request, cacheName, Date.now())
      console.log('[SW] 更新缓存:', request.url)
    }
    return response
  } catch (error) {
    // 网络失败，返回过期缓存
    if (cached) {
      console.warn('[SW] 网络失败，使用过期缓存:', request.url)
      return cached
    }
    throw error
  }
}

/**
 * Network First策略
 * 优先从网络获取，失败时使用缓存
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    if (cached) {
      console.warn('[SW] 网络失败，使用缓存:', request.url)
      return cached
    }
    throw error
  }
}

/**
 * 判断是否为静态资源
 */
function isStaticAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.ttf')
  )
}

/**
 * 判断是否为图片请求
 */
function isImageRequest(request) {
  return request.destination === 'image'
}

/**
 * 判断是否为API请求
 */
function isAPIRequest(pathname) {
  return pathname.startsWith('/api/')
}

/**
 * 获取API缓存配置
 */
function getAPICacheConfig(pathname) {
  // 筛选选项API
  for (const url of API_CACHE_CONFIG.filterOptions.urls) {
    if (pathname.includes(url)) {
      return API_CACHE_CONFIG.filterOptions
    }
  }
  
  // 列表API
  for (const url of API_CACHE_CONFIG.lists.urls) {
    if (pathname.includes(url)) {
      return API_CACHE_CONFIG.lists
    }
  }
  
  // 详情API
  for (const url of API_CACHE_CONFIG.details.urls) {
    if (pathname.includes(url)) {
      return API_CACHE_CONFIG.details
    }
  }
  
  // 默认配置
  return { maxAge: 5 * 60 * 1000 } // 5分钟
}

/**
 * 获取缓存时间
 */
async function getCachedTime(request, cacheName) {
  const timeKey = `${cacheName}:time:${request.url}`
  const cache = await caches.open(cacheName)
  const timeResponse = await cache.match(timeKey)
  
  if (timeResponse) {
    const text = await timeResponse.text()
    return parseInt(text, 10)
  }
  
  return null
}

/**
 * 设置缓存时间
 */
async function setCachedTime(request, cacheName, time) {
  const timeKey = `${cacheName}:time:${request.url}`
  const cache = await caches.open(cacheName)
  const timeResponse = new Response(time.toString())
  await cache.put(timeKey, timeResponse)
}
