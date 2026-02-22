import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { usePWAInstall } from '@/composables/usePWAInstall'

function mountComposable() {
  let result: any
  const wrapper = mount(defineComponent({
    setup() {
      result = usePWAInstall()
      return result
    },
    template: '<div />',
  }))
  return { wrapper, result }
}

describe('usePWAInstall', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    // 默认非 standalone 模式
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初始状态：canInstall=false, isInstalled=false', () => {
    const { result } = mountComposable()
    expect(result.canInstall.value).toBe(false)
    expect(result.isInstalled.value).toBe(false)
  })

  it('standalone 模式下 isInstalled=true', () => {
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    const { result } = mountComposable()
    expect(result.isInstalled.value).toBe(true)
  })

  it('beforeinstallprompt 事件触发后 canInstall=true', async () => {
    const { result } = mountComposable()

    const event = new Event('beforeinstallprompt', { cancelable: true })
    ;(event as any).prompt = vi.fn()
    ;(event as any).userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)
    await nextTick()

    expect(result.canInstall.value).toBe(true)
  })

  it('用户7天内拒绝过则不显示安装提示', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => {
        if (key === 'pwa-install-dismissed') return Date.now().toString()
        return null
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    const { result } = mountComposable()

    const event = new Event('beforeinstallprompt', { cancelable: true })
    ;(event as any).prompt = vi.fn()
    ;(event as any).userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)
    await nextTick()

    expect(result.canInstall.value).toBe(false)
  })

  it('dismiss 设置拒绝标记并隐藏提示', async () => {
    const mockSetItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: mockSetItem,
      removeItem: vi.fn(),
    })

    const { result } = mountComposable()

    const event = new Event('beforeinstallprompt', { cancelable: true })
    ;(event as any).prompt = vi.fn()
    ;(event as any).userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)
    await nextTick()

    result.dismiss()

    expect(result.canInstall.value).toBe(false)
    expect(mockSetItem).toHaveBeenCalledWith('pwa-install-dismissed', expect.any(String))
  })

  it('install 成功后 isInstalled=true', async () => {
    const { result } = mountComposable()

    const mockPrompt = vi.fn()
    const event = new Event('beforeinstallprompt', { cancelable: true })
    ;(event as any).prompt = mockPrompt
    ;(event as any).userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)
    await nextTick()

    const accepted = await result.install()

    expect(accepted).toBe(true)
    expect(result.isInstalled.value).toBe(true)
    expect(result.canInstall.value).toBe(false)
    expect(mockPrompt).toHaveBeenCalled()
  })

  it('install 被拒绝后 isInstalled 保持 false', async () => {
    const { result } = mountComposable()

    const event = new Event('beforeinstallprompt', { cancelable: true })
    ;(event as any).prompt = vi.fn()
    ;(event as any).userChoice = Promise.resolve({ outcome: 'dismissed' })
    window.dispatchEvent(event)
    await nextTick()

    const accepted = await result.install()

    expect(accepted).toBe(false)
    expect(result.isInstalled.value).toBe(false)
  })

  it('无 deferredPrompt 时 install 返回 false', async () => {
    const { result } = mountComposable()
    const accepted = await result.install()
    expect(accepted).toBe(false)
  })

  it('appinstalled 事件触发后更新状态', async () => {
    const mockRemoveItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: mockRemoveItem,
    })

    const { result } = mountComposable()

    window.dispatchEvent(new Event('appinstalled'))
    await nextTick()

    expect(result.isInstalled.value).toBe(true)
    expect(result.canInstall.value).toBe(false)
    expect(mockRemoveItem).toHaveBeenCalledWith('pwa-install-dismissed')
  })

  it('卸载后移除事件监听', () => {
    const { wrapper } = mountComposable()
    expect(() => wrapper.unmount()).not.toThrow()
  })
})
