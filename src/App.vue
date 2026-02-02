<template>
  <div id="app">
    <SkipNav />
    <RouterView v-slot="{ Component, route }">
      <Transition :name="(route.meta.transition as string) || 'fade'" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <Toaster position="top-center" :duration="3000" />
    <InstallPrompt />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme'
import { useNetworkStatus } from '@/composables/useNetworkStatus'
import SkipNav from '@/components/accessibility/SkipNav.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'

// 初始化主题
const { initTheme } = useTheme()

// 初始化网络状态检测
useNetworkStatus()

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
