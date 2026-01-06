<template>
  <div id="app">
    <SkipNav />
    <RouterView />
    <Toaster position="top-center" :duration="3000" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme'
import SkipNav from '@/components/accessibility/SkipNav.vue'

// 初始化主题
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
