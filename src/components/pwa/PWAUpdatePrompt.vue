<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const swIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_swUrl, registration) {
    // 每小时检查一次 SW 更新
    if (registration) {
      swIntervalId.value = setInterval(() => registration.update(), 60 * 60 * 1000)
    }
  },
})

onBeforeUnmount(() => {
  if (swIntervalId.value) {
    clearInterval(swIntervalId.value)
    swIntervalId.value = null
  }
})

function onUpdate() {
  updateServiceWorker()
}

function onDismiss() {
  needRefresh.value = false
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="needRefresh"
      role="alert"
      aria-live="assertive"
      class="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border border-sky-200 bg-white p-4 shadow-lg dark:border-sky-800 dark:bg-gray-900"
    >
      <p class="text-sm text-gray-700 dark:text-gray-300">
        发现新版本，刷新以获取最新功能
      </p>
      <div class="mt-3 flex gap-2">
        <button
          class="rounded-md bg-sky-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-600"
          @click="onUpdate"
        >
          刷新
        </button>
        <button
          class="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="onDismiss"
        >
          稍后
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
