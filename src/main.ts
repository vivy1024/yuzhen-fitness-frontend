import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { Toaster } from 'vue-sonner'
import { useAuthStore } from './stores/auth'
import { registerServiceWorker } from './utils/registerSW'
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

// 注册Service Worker（生产环境）
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error)
}

// ============ 全局错误边界 ============

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
  showError(`操作失败: ${errorMessage}`)
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
  showError('页面发生错误，请刷新页面重试')
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
  showError('组件加载失败，请刷新页面重试')
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
