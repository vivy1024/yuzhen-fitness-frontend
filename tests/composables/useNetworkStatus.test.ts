import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'

// Mock toast - 必须在 import composable 之前
vi.mock('@/components/ui/toast', () => ({
  showWarning: vi.fn(),
  showSuccess: vi.fn(),
}))

import { showWarning, showSuccess } from '@/components/ui/toast'
import { useNetworkStatus } from '@/composables/useNetworkStatus'

/**
 * 包装 composable 到组件中测试（需要 onMounted/onUnmounted 生命周期）
 */
function mountComposable() {
  let result: any
  const wrapper = mount(defineComponent({
    setup() {
      result = useNetworkStatus()
      return result
    },
    template: '<div />',
  }))
  return { wrapper, result }
}

describe('useNetworkStatus', () => {
  let originalOnLine: boolean
  let currentWrapper: any = null

  beforeEach(() => {
    vi.clearAllMocks()
    originalOnLine = navigator.onLine
  })

  afterEach(() => {
    // 确保每个测试后卸载组件，清理事件监听
    if (currentWrapper) {
      currentWrapper.unmount()
      currentWrapper = null
    }
    Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true })
  })

  it('初始状态反映 navigator.onLine', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { wrapper, result } = mountComposable()
    currentWrapper = wrapper
    expect(result.isOnline.value).toBe(true)
  })

  it('离线时 isOnline 为 false', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    const { wrapper, result } = mountComposable()
    currentWrapper = wrapper
    expect(result.isOnline.value).toBe(false)
  })

  it('监听 offline 事件并显示警告', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { wrapper, result } = mountComposable()
    currentWrapper = wrapper

    window.dispatchEvent(new Event('offline'))
    await nextTick()

    expect(result.isOnline.value).toBe(false)
    expect(showWarning).toHaveBeenCalledWith('网络已断开，部分功能可能不可用')
  })

  it('恢复在线时显示成功提示', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { wrapper, result } = mountComposable()
    currentWrapper = wrapper

    // 先离线
    window.dispatchEvent(new Event('offline'))
    await nextTick()
    // 再上线
    window.dispatchEvent(new Event('online'))
    await nextTick()

    expect(result.isOnline.value).toBe(true)
    expect(showSuccess).toHaveBeenCalledWith('网络已恢复')
  })

  it('未曾离线时上线不显示恢复提示', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { wrapper } = mountComposable()
    currentWrapper = wrapper

    window.dispatchEvent(new Event('online'))
    await nextTick()

    expect(showSuccess).not.toHaveBeenCalled()
  })

  it('卸载后移除事件监听', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { wrapper } = mountComposable()

    wrapper.unmount()
    currentWrapper = null // 已手动卸载

    // 卸载后清除之前的 mock 调用记录
    vi.clearAllMocks()

    // 卸载后触发事件不应调用 toast
    window.dispatchEvent(new Event('offline'))
    await nextTick()

    expect(showWarning).not.toHaveBeenCalled()
  })
})
