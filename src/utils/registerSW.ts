/**
 * Service Worker 注册工具
 * 
 * @version 1.0.0
 * @date 2026-01-07
 */

/**
 * 注册Service Worker
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      })
      
      console.log('✅ Service Worker 注册成功:', registration.scope)
      
      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Service Worker 有新版本，请刷新页面')
              // 可以在这里显示更新提示
            }
          })
        }
      })
      
      return registration
    } catch (error) {
      console.error('❌ Service Worker 注册失败:', error)
      throw error
    }
  } else {
    console.warn('⚠️ 浏览器不支持 Service Worker')
    return null
  }
}

/**
 * 注销Service Worker
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.unregister()
      console.log('✅ Service Worker 已注销')
    }
  }
}

/**
 * 清除所有缓存
 */
export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('✅ 已清除所有缓存')
  }
}
