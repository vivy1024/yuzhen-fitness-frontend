import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('Theme Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
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

  describe('初始状态', () => {
    it('默认 mode 为 system', () => {
      const store = useThemeStore()
      expect(store.mode).toBe('system')
      expect(store.systemPrefersDark).toBe(false)
    })

    it('resolvedTheme 在 system+light 下为 light', () => {
      const store = useThemeStore()
      expect(store.resolvedTheme).toBe('light')
      expect(store.isDark).toBe(false)
    })

    it('modeLabel 默认为跟随系统', () => {
      const store = useThemeStore()
      expect(store.modeLabel).toBe('跟随系统')
    })
  })

  describe('setMode', () => {
    it('切换到 dark', () => {
      const store = useThemeStore()
      store.setMode('dark')

      expect(store.mode).toBe('dark')
      expect(store.resolvedTheme).toBe('dark')
      expect(store.isDark).toBe(true)
      expect(store.modeLabel).toBe('深色模式')
    })

    it('切换到 light', () => {
      const store = useThemeStore()
      store.setMode('light')

      expect(store.mode).toBe('light')
      expect(store.resolvedTheme).toBe('light')
      expect(store.isDark).toBe(false)
      expect(store.modeLabel).toBe('浅色模式')
    })

    it('持久化到 localStorage', () => {
      const mockSetItem = vi.fn()
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => null),
        setItem: mockSetItem,
        removeItem: vi.fn(),
      })

      const store = useThemeStore()
      store.setMode('dark')

      expect(mockSetItem).toHaveBeenCalledWith('yuzhen_theme_mode', 'dark')
    })

    it('应用 dark class 到 documentElement', () => {
      const store = useThemeStore()
      store.setMode('dark')
      expect(document.documentElement.classList.contains('dark')).toBe(true)

      store.setMode('light')
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('toggle', () => {
    it('从 light 切换到 dark', () => {
      const store = useThemeStore()
      store.setMode('light')
      store.toggle()
      expect(store.mode).toBe('dark')
    })

    it('从 dark 切换到 light', () => {
      const store = useThemeStore()
      store.setMode('dark')
      store.toggle()
      expect(store.mode).toBe('light')
    })
  })

  describe('init', () => {
    it('从 localStorage 恢复保存的主题', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => key === 'yuzhen_theme_mode' ? 'dark' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      const store = useThemeStore()
      store.init()

      expect(store.mode).toBe('dark')
    })

    it('无效的 localStorage 值不影响默认值', () => {
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => key === 'yuzhen_theme_mode' ? 'invalid' : null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      const store = useThemeStore()
      store.init()

      expect(store.mode).toBe('system')
    })

    it('检测系统暗色偏好', () => {
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

      const store = useThemeStore()
      store.init()

      expect(store.systemPrefersDark).toBe(true)
      expect(store.resolvedTheme).toBe('dark') // system mode + dark preference
    })
  })

  describe('resolvedTheme 响应系统偏好变化', () => {
    it('system 模式下跟随 systemPrefersDark', () => {
      const store = useThemeStore()
      expect(store.resolvedTheme).toBe('light')

      store.systemPrefersDark = true
      expect(store.resolvedTheme).toBe('dark')

      store.systemPrefersDark = false
      expect(store.resolvedTheme).toBe('light')
    })

    it('非 system 模式下不受 systemPrefersDark 影响', () => {
      const store = useThemeStore()
      store.setMode('light')
      store.systemPrefersDark = true

      expect(store.resolvedTheme).toBe('light')
    })
  })
})
