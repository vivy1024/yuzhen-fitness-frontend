import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { Toaster } from 'vue-sonner'
import { useAuthStore } from './stores/auth'
import { registerServiceWorker } from './utils/registerSW'
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

app.mount('#app')
