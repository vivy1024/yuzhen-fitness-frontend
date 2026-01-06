/**
 * 可访问性 Composable
 * 提供键盘导航、焦点管理、ARIA 标签等功能
 */
import { ref, onMounted, onUnmounted, Ref } from 'vue'
import { keyboardNav, focusManagement, announceToScreenReader } from '@/utils/accessibility'

/**
 * 键盘导航 Hook
 */
export function useKeyboardNav() {
  const handleActivation = (callback: () => void) => {
    return (event: KeyboardEvent) => {
      keyboardNav.handleActivation(event, callback)
    }
  }
  
  const handleEscape = (callback: () => void) => {
    return (event: KeyboardEvent) => {
      keyboardNav.handleEscape(event, callback)
    }
  }
  
  return {
    handleActivation,
    handleEscape,
  }
}

/**
 * 焦点捕获 Hook
 * 用于模态框、侧边栏等需要捕获焦点的组件
 */
export function useFocusTrap(elementRef: Ref<HTMLElement | null>) {
  let cleanup: (() => void) | null = null
  let previousActiveElement: HTMLElement | null = null
  
  onMounted(() => {
    if (elementRef.value) {
      // 保存当前焦点元素
      previousActiveElement = document.activeElement as HTMLElement
      
      // 设置焦点捕获
      cleanup = focusManagement.trapFocus(elementRef.value)
      
      // 聚焦到第一个可聚焦元素
      const firstFocusable = elementRef.value.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      firstFocusable?.focus()
    }
  })
  
  onUnmounted(() => {
    // 清理焦点捕获
    cleanup?.()
    
    // 恢复之前的焦点
    focusManagement.restoreFocus(previousActiveElement)
  })
}

/**
 * 屏幕阅读器公告 Hook
 */
export function useScreenReaderAnnouncement() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announceToScreenReader(message, priority)
  }
  
  return {
    announce,
  }
}

/**
 * 列表键盘导航 Hook
 * 用于动作库、食物库等列表组件
 */
export function useListKeyboardNav(
  items: Ref<any[]>,
  onSelect: (index: number) => void
) {
  const currentIndex = ref(0)
  
  const handleKeyDown = (event: KeyboardEvent) => {
    keyboardNav.handleArrowNav(
      event,
      currentIndex.value,
      items.value.length,
      (newIndex) => {
        currentIndex.value = newIndex
        onSelect(newIndex)
      }
    )
  }
  
  onMounted(() => {
    document.addEventListener('keydown', handleKeyDown)
  })
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
  
  return {
    currentIndex,
  }
}

/**
 * 跳过导航链接 Hook
 * 用于快速跳转到主内容区域
 */
export function useSkipNav() {
  const skipToMain = () => {
    const mainContent = document.querySelector<HTMLElement>('main, [role="main"]')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }
  
  return {
    skipToMain,
  }
}
