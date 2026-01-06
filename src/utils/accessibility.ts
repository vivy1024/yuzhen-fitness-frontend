/**
 * 可访问性工具函数
 * 符合 WCAG 2.1 AA 标准
 */

/**
 * 计算颜色对比度
 * @param foreground 前景色 (hex)
 * @param background 背景色 (hex)
 * @returns 对比度比值
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const getLuminance = (hex: string): number => {
    // 移除 # 符号
    hex = hex.replace('#', '')
    
    // 转换为 RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    // 计算相对亮度
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
  }
  
  const l1 = getLuminance(foreground)
  const l2 = getLuminance(background)
  
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * 检查颜色对比度是否符合 WCAG AA 标准
 * @param foreground 前景色
 * @param background 背景色
 * @param level 'AA' | 'AAA'
 * @param isLargeText 是否为大文本 (18pt+ 或 14pt+ 粗体)
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText = false
): boolean {
  const ratio = calculateContrastRatio(foreground, background)
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7
  }
  
  // AA 标准
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * 生成 ARIA 标签
 */
export const ariaLabels = {
  // 导航
  navigation: {
    back: '返回上一页',
    home: '返回首页',
    menu: '打开菜单',
    close: '关闭',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
  },
  
  // 动作库
  exercise: {
    card: (name: string) => `动作: ${name}`,
    favorite: (name: string, isFavorited: boolean) => 
      isFavorited ? `取消收藏 ${name}` : `收藏 ${name}`,
    viewDetail: (name: string) => `查看 ${name} 详情`,
    difficulty: (level: string) => `难度等级: ${level}`,
    equipment: (type: string) => `器械类型: ${type}`,
  },
  
  // 食物库
  food: {
    card: (name: string) => `食物: ${name}`,
    addToMeal: (name: string) => `添加 ${name} 到饮食记录`,
    viewDetail: (name: string) => `查看 ${name} 营养信息`,
    category: (cat: string) => `食物分类: ${cat}`,
  },
  
  // 训练计划
  training: {
    plan: (name: string) => `训练计划: ${name}`,
    import: (name: string) => `导入 ${name} 到我的计划`,
    start: (name: string) => `开始 ${name} 训练`,
    exercise: (name: string, sets: number, reps: string) => 
      `${name}, ${sets}组, ${reps}次`,
  },
  
  // 聊天
  chat: {
    message: (role: string, time: string) => `${role}消息, ${time}`,
    send: '发送消息',
    newTopic: '新建话题',
    toolCalls: (count: number) => `查看 ${count} 个工具调用`,
    rating: '评分此回复',
  },
  
  // 表单
  form: {
    required: (field: string) => `${field} (必填)`,
    optional: (field: string) => `${field} (可选)`,
    error: (field: string, error: string) => `${field} 错误: ${error}`,
    success: (message: string) => `成功: ${message}`,
  },
  
  // 分页
  pagination: {
    page: (current: number, total: number) => `第 ${current} 页，共 ${total} 页`,
    next: '下一页',
    previous: '上一页',
    first: '第一页',
    last: '最后一页',
    jump: '跳转到指定页',
  },
}

/**
 * 键盘导航辅助函数
 */
export const keyboardNav = {
  /**
   * 处理 Enter 和 Space 键触发点击
   */
  handleActivation: (event: KeyboardEvent, callback: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      callback()
    }
  },
  
  /**
   * 处理 Escape 键关闭
   */
  handleEscape: (event: KeyboardEvent, callback: () => void) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      callback()
    }
  },
  
  /**
   * 处理箭头键导航
   */
  handleArrowNav: (
    event: KeyboardEvent,
    currentIndex: number,
    totalItems: number,
    onNavigate: (newIndex: number) => void
  ) => {
    let newIndex = currentIndex
    
    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1
        break
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = totalItems - 1
        break
      default:
        return
    }
    
    onNavigate(newIndex)
  },
}

/**
 * 焦点管理
 */
export const focusManagement = {
  /**
   * 捕获焦点在元素内
   */
  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }
    
    element.addEventListener('keydown', handleTabKey)
    
    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  },
  
  /**
   * 恢复焦点
   */
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus()
    }
  },
}

/**
 * 屏幕阅读器公告
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}
