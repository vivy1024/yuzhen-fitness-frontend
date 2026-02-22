import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTheme } from '@/composables/useTheme'

describe('useTheme', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    // Mock matchMedia
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

  it('默认 mode 为 system', () => {
    const { mode } = useTheme()
    expect(mode.value).toBe('system')
  })

  it('setTheme 切换到 dark', () => {
    const { setDark, isDark, mode } = useTheme()
    setDark()
    expect(mode.value).toBe('dark')
    expect(isDark.value).toBe(true)
  })

  it('setTheme 切换到 light', () => {
    const { setLight, isDark, mode } = useTheme()
    setLight()
    expect(mode.value).toBe('light')
    expect(isDark.value).toBe(false)
  })

  it('toggleTheme 在 light 和 dark 之间切换', () => {
    const { setLight, toggleTheme, mode } = useTheme()
    setLight()
    expect(mode.value).toBe('light')

    toggleTheme()
    expect(mode.value).toBe('dark')

    toggleTheme()
    expect(mode.value).toBe('light')
  })

  it('setSystem 设置跟随系统', () => {
    const { setSystem, mode, modeLabel } = useTheme()
    setSystem()
    expect(mode.value).toBe('system')
    expect(modeLabel.value).toBe('跟随系统')
  })

  it('modeLabel 返回正确的中文标签', () => {
    const { setLight, setDark, setSystem, modeLabel } = useTheme()

    setLight()
    expect(modeLabel.value).toBe('浅色模式')

    setDark()
    expect(modeLabel.value).toBe('深色模式')

    setSystem()
    expect(modeLabel.value).toBe('跟随系统')
  })

  it('resolvedTheme 在 system 模式下根据系统偏好解析', () => {
    // 模拟系统偏好暗色
    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))

    setActivePinia(createPinia())
    const { initTheme, resolvedTheme, mode } = useTheme()
    initTheme()

    expect(mode.value).toBe('system')
    expect(resolvedTheme.value).toBe('dark')
  })

  it('initTheme 从 localStorage 恢复主题', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => key === 'yuzhen_theme_mode' ? 'dark' : null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })

    setActivePinia(createPinia())
    const { initTheme, mode, isDark } = useTheme()
    initTheme()

    expect(mode.value).toBe('dark')
    expect(isDark.value).toBe(true)
  })

  it('setTheme 持久化到 localStorage', () => {
    const mockSetItem = vi.fn()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: mockSetItem,
      removeItem: vi.fn(),
    })

    const { setDark } = useTheme()
    setDark()

    expect(mockSetItem).toHaveBeenCalledWith('yuzhen_theme_mode', 'dark')
  })
})
