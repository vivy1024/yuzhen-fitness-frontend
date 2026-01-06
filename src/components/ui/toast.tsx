/**
 * Toast 提示组件
 * 使用shadcn-vue的Toast组件
 */

import { h } from 'vue'
import { toast as sonnerToast } from 'vue-sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

/**
 * 显示Toast提示
 */
export function toast(type: ToastType, message: string, options?: ToastOptions) {
  const { title, description, duration = 3000 } = options || {}
  
  switch (type) {
    case 'success':
      sonnerToast.success(title || message, {
        description: description || (title ? message : undefined),
        duration,
      })
      break
    case 'error':
      sonnerToast.error(title || message, {
        description: description || (title ? message : undefined),
        duration,
      })
      break
    case 'warning':
      sonnerToast.warning(title || message, {
        description: description || (title ? message : undefined),
        duration,
      })
      break
    case 'info':
      sonnerToast.info(title || message, {
        description: description || (title ? message : undefined),
        duration,
      })
      break
  }
}

/**
 * 成功提示
 */
export function showSuccess(message: string, options?: ToastOptions) {
  toast('success', message, options)
}

/**
 * 错误提示
 */
export function showError(message: string, options?: ToastOptions) {
  toast('error', message, options)
}

/**
 * 警告提示
 */
export function showWarning(message: string, options?: ToastOptions) {
  toast('warning', message, options)
}

/**
 * 信息提示
 */
export function showInfo(message: string, options?: ToastOptions) {
  toast('info', message, options)
}

/**
 * useToast hook - 兼容shadcn-vue风格
 */
export function useToast() {
  return {
    toast: (options: { description?: string; title?: string; variant?: 'default' | 'destructive'; duration?: number }) => {
      const { description, title, variant, duration = 3000 } = options
      if (variant === 'destructive') {
        sonnerToast.error(title || description || '', { description: title ? description : undefined, duration })
      } else {
        sonnerToast.success(title || description || '', { description: title ? description : undefined, duration })
      }
    }
  }
}
