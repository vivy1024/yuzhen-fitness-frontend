/**
 * PWA 安装提示 Composable
 * 监听 beforeinstallprompt 事件，提供安装提示功能
 */

import { ref, onMounted, onUnmounted } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const canInstall = ref(false)
  const isInstalled = ref(false)

  // 检查是否已安装（standalone 模式）
  const checkIfInstalled = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true
      return true
    }
    // iOS Safari
    if ((navigator as any).standalone === true) {
      isInstalled.value = true
      return true
    }
    return false
  }

  // 检查用户是否已拒绝安装
  const hasUserDismissed = () => {
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // 7天后重新提示
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return true
      }
    }
    return false
  }

  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    deferredPrompt.value = e as BeforeInstallPromptEvent
    
    // 只有未安装且用户未拒绝时才显示提示
    if (!checkIfInstalled() && !hasUserDismissed()) {
      canInstall.value = true
    }
  }

  const handleAppInstalled = () => {
    isInstalled.value = true
    canInstall.value = false
    deferredPrompt.value = null
    localStorage.removeItem('pwa-install-dismissed')
  }

  const install = async () => {
    if (!deferredPrompt.value) return false

    try {
      await deferredPrompt.value.prompt()
      const { outcome } = await deferredPrompt.value.userChoice
      
      if (outcome === 'accepted') {
        isInstalled.value = true
        canInstall.value = false
      }
      
      deferredPrompt.value = null
      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA安装失败:', error)
      return false
    }
  }

  const dismiss = () => {
    canInstall.value = false
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  onMounted(() => {
    checkIfInstalled()
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  })

  return {
    canInstall,
    isInstalled,
    install,
    dismiss
  }
}
