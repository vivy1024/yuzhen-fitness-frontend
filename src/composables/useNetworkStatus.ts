/**
 * 网络状态检测 Composable
 * 监听网络连接状态变化，提供响应式状态和用户提示
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { showWarning, showSuccess } from '@/components/ui/toast'

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine)
  const wasOffline = ref(false)

  function handleOnline() {
    isOnline.value = true
    if (wasOffline.value) {
      showSuccess('网络已恢复')
      wasOffline.value = false
    }
  }

  function handleOffline() {
    isOnline.value = false
    wasOffline.value = true
    showWarning('网络已断开，部分功能可能不可用')
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return { isOnline }
}
