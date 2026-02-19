import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { Toaster } from 'vue-sonner'
import { useAuthStore } from './stores/auth'
import { showError } from './components/ui/toast'
import './assets/styles/globals.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// 注册Toast组件
app.component('Toaster', Toaster)

// 初始化认证状态
const authStore = useAuthStore()
authStore.init()

// ============ 全局错误边界（带防抖） ============

// 错误Toast防抖：3秒内同一消息不重复显示
const recentErrors = new Map<string, number>()
const ERROR_DEBOUNCE_MS = 3000

function showErrorDebounced(message: string) {
  const now = Date.now()
  const lastShown = recentErrors.get(message)
  if (lastShown && now - lastShown < ERROR_DEBOUNCE_MS) return
  recentErrors.set(message, now)
  // 清理过期记录
  if (recentErrors.size > 20) {
    for (const [key, time] of recentErrors) {
      if (now - time > ERROR_DEBOUNCE_MS) recentErrors.delete(key)
    }
  }
  showError(message)
}

/**
 * 捕获未处理的Promise拒绝
 * 当Promise被reject但没有.catch()处理时触发
 */
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', {
    reason: event.reason,
    promise: event.promise,
  })
  
  // 阻止默认的错误提示
  event.preventDefault()
  
  // 显示友好的错误提示
  const errorMessage = event.reason?.message || event.reason || '发生未知错误'
  showErrorDebounced(`操作失败: ${errorMessage}`)
})

/**
 * 捕获全局错误
 * 当JavaScript运行时错误发生时触发
 */
window.addEventListener('error', (event) => {
  console.error('[Global Error]', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  })
  
  // 阻止默认的错误提示
  event.preventDefault()
  
  // 显示友好的错误提示
  showErrorDebounced('页面发生错误，请刷新页面重试')
})

/**
 * Vue应用错误处理
 * 捕获Vue组件中的错误
 */
app.config.errorHandler = (err, instance, info) => {
  console.error('[Vue Error]', {
    error: err,
    component: instance?.$options?.name || 'Unknown',
    info,
  })
  
  // 显示友好的错误提示
  showErrorDebounced('组件加载失败，请刷新页面重试')
}

/**
 * Vue警告处理（仅开发环境）
 */
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('[Vue Warning]', {
      message: msg,
      component: instance?.$options?.name || 'Unknown',
      trace,
    })
  }
}

app.mount('#app')
