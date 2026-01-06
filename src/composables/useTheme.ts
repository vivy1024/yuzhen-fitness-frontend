/**
 * 主题组合式函数
 * 提供主题切换、持久化、系统主题检测等功能
 * 
 * @author 玉珍健身 v3.0
 * @created 2026-01-06
 */

import { computed } from 'vue'
import { useThemeStore, type ThemeMode } from '@/stores/theme'

export function useTheme() {
  const themeStore = useThemeStore()

  /**
   * 当前主题模式
   */
  const mode = computed(() => themeStore.mode)

  /**
   * 解析后的主题（light/dark）
   */
  const resolvedTheme = computed(() => themeStore.resolvedTheme)

  /**
   * 是否是暗色模式
   */
  const isDark = computed(() => themeStore.isDark)

  /**
   * 主题模式显示名称
   */
  const modeLabel = computed(() => themeStore.modeLabel)

  /**
   * 设置主题模式
   */
  function setTheme(newMode: ThemeMode) {
    themeStore.setMode(newMode)
  }

  /**
   * 切换主题（light <-> dark）
   */
  function toggleTheme() {
    themeStore.toggle()
  }

  /**
   * 设置为浅色模式
   */
  function setLight() {
    themeStore.setMode('light')
  }

  /**
   * 设置为深色模式
   */
  function setDark() {
    themeStore.setMode('dark')
  }

  /**
   * 设置为跟随系统
   */
  function setSystem() {
    themeStore.setMode('system')
  }

  /**
   * 初始化主题（在App.vue中调用）
   */
  function initTheme() {
    themeStore.init()
  }

  return {
    // State
    mode,
    resolvedTheme,
    isDark,
    modeLabel,
    
    // Actions
    setTheme,
    toggleTheme,
    setLight,
    setDark,
    setSystem,
    initTheme,
  }
}

export type { ThemeMode }
