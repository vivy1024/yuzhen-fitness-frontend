<template>
  <div id="app">
    <SkipNav />
    <RouterView v-slot="{ Component, route }">
      <Transition :name="(route.meta.transition as string) || 'fade'" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <Toaster position="top-center" :duration="3000" :toastOptions="{ style: { pointerEvents: 'auto', marginTop: 'env(safe-area-inset-top, 0px)' } }" richColors />
    <InstallPrompt />
    <PWAUpdatePrompt />
    <!-- 全局底部导航栏 -->
    <BottomNav v-if="showBottomNav" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import SkipNav from '@/components/accessibility/SkipNav.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import PWAUpdatePrompt from '@/components/pwa/PWAUpdatePrompt.vue'
import BottomNav from '@/components/layout/BottomNav.vue'

// 初始化主题
const { initTheme } = useTheme()

// 初始化网络状态检测
useNetworkStatus()

const route = useRoute()

// 不显示底部导航的页面
const hideNavRoutes = ['login', 'register', 'forgot-password', 'forgot-password-phone', 'legal-terms', 'legal-privacy', 'training-session', 'training-summary']

const showBottomNav = computed(() => {
  const name = route.name as string
  if (!name) return false
  // 隐藏：登录/注册/法律/训练中
  if (hideNavRoutes.includes(name)) return false
  return true
})

onMounted(() => {
  initTheme()
})
</script>

<style>
#app {
  min-height: 100vh;
}

/* 淡入淡出过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 向左滑动过渡 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-left-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.slide-left-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* 向右滑动过渡 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-right-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}
.slide-right-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
