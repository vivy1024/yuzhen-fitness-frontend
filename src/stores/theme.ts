/**
 * 主题状态管理
 * 管理应用主题（亮色/暗色/跟随系统）
 * 
 * @author 玉珍健身 v3.0
 * @created 2026-01-06
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'yuzhen_theme_mode'

export const useThemeStore = defineStore('theme', () => {
  // State
  const mode = ref<ThemeMode>('system')
  const systemPrefersDark = ref(false)

  // Getters
  
  /**
   * 实际应用的主题（解析system模式）
   */
  const resolvedTheme = computed<'light' | 'dark'>(() => {
    if (mode.value === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light'
    }
    return mode.value
  })

  /**
   * 是否是暗色模式
   */
  const isDark = computed(() => resolvedTheme.value === 'dark')

  /**
   * 主题模式显示名称
   */
  const modeLabel = computed(() => {
    const labels: Record<ThemeMode, string> = {
      light: '浅色模式',
      dark: '深色模式',
      system: '跟随系统'
    }
    return labels[mode.value]
  })

  // Actions

  /**
   * 初始化主题
   */
  function init() {
    // 检测系统主题偏好
    detectSystemTheme()
    
    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        systemPrefersDark.value = e.matches
      })
    }
    
    // 从localStorage加载保存的主题
    const savedMode = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      mode.value = savedMode
    }
    
    // 应用主题
    applyTheme()
  }

  /**
   * 检测系统主题偏好
   */
  function detectSystemTheme() {
    if (window.matchMedia) {
      systemPrefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
  }

  /**
   * 设置主题模式
   */
  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    localStorage.setItem(THEME_STORAGE_KEY, newMode)
    applyTheme()
  }

  /**
   * 切换主题（在light和dark之间切换）
   */
  function toggle() {
    const newMode = isDark.value ? 'light' : 'dark'
    setMode(newMode)
  }

  /**
   * 应用主题到DOM
   */
  function applyTheme() {
    const root = document.documentElement
    
    if (resolvedTheme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  // 监听resolvedTheme变化，自动应用主题
  watch(resolvedTheme, () => {
    applyTheme()
  })

  return {
    // State
    mode,
    systemPrefersDark,
    
    // Getters
    resolvedTheme,
    isDark,
    modeLabel,
    
    // Actions
    init,
    setMode,
    toggle,
    applyTheme,
  }
})
