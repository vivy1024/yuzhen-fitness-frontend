/**
 * 组件懒加载工具
 * 用于实现组件级别的代码分割和懒加载
 */
import { defineAsyncComponent, h, type Component, type AsyncComponentLoader } from 'vue'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * 创建懒加载组件的配置选项
 */
interface LazyLoadOptions {
  /** 加载延迟（毫秒），避免闪烁 */
  delay?: number
  /** 超时时间（毫秒） */
  timeout?: number
  /** 是否显示加载状态 */
  showLoading?: boolean
  /** 自定义加载组件 */
  loadingComponent?: Component
  /** 自定义错误组件 */
  errorComponent?: Component
}

/**
 * 默认加载组件 - 骨架屏
 */
const DefaultLoadingComponent = {
  name: 'DefaultLoading',
  render() {
    return h('div', { class: 'p-4 space-y-3' }, [
      h(Skeleton, { class: 'h-4 w-3/4' }),
      h(Skeleton, { class: 'h-4 w-1/2' }),
      h(Skeleton, { class: 'h-20 w-full' }),
    ])
  },
}

/**
 * 默认错误组件
 */
const DefaultErrorComponent = {
  name: 'DefaultError',
  props: ['error'],
  render() {
    return h(
      'div',
      { class: 'p-4 text-center text-red-500' },
      [
        h('p', { class: 'text-sm' }, '组件加载失败'),
        h('button', {
          class: 'mt-2 px-3 py-1 text-xs bg-red-100 rounded hover:bg-red-200',
          onClick: () => window.location.reload(),
        }, '刷新页面'),
      ]
    )
  },
}

/**
 * 创建懒加载组件
 * @param loader 组件加载器
 * @param options 配置选项
 * @returns 异步组件
 */
export function lazyLoad(
  loader: AsyncComponentLoader,
  options: LazyLoadOptions = {}
): ReturnType<typeof defineAsyncComponent> {
  const {
    delay = 200,
    timeout = 30000,
    showLoading = true,
    loadingComponent = DefaultLoadingComponent,
    errorComponent = DefaultErrorComponent,
  } = options

  return defineAsyncComponent({
    loader,
    loadingComponent: showLoading ? loadingComponent : undefined,
    errorComponent,
    delay,
    timeout,
    onError(error, retry, fail, attempts) {
      // 自动重试一次
      if (attempts <= 1) {
        console.warn(`[LazyLoad] 组件加载失败，正在重试... (${attempts}/1)`)
        retry()
      } else {
        console.error('[LazyLoad] 组件加载失败:', error)
        fail()
      }
    },
  })
}

/**
 * 创建带预加载的懒加载组件
 * 支持在空闲时预加载组件
 * @param loader 组件加载器
 * @param options 配置选项
 */
export function lazyLoadWithPreload(
  loader: AsyncComponentLoader,
  options: LazyLoadOptions = {}
) {
  const component = lazyLoad(loader, options)
  
  // 预加载方法
  const preload = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loader()
      })
    } else {
      setTimeout(() => {
        loader()
      }, 100)
    }
  }

  return {
    component,
    preload,
  }
}

/**
 * 预定义的懒加载组件
 * 用于大型组件的按需加载
 */
export const LazyComponents = {
  // 图表组件（ECharts较大）
  TimeSeriesChart: lazyLoad(
    () => import('@/components/charts/TimeSeriesChart.vue'),
    { delay: 100 }
  ),
  
  // 用户档案相关
  FFMIChart: lazyLoad(
    () => import('@/components/user/FFMIChart.vue'),
    { delay: 100 }
  ),
  
  // 训练相关
  TrainingPlanCard: lazyLoad(
    () => import('@/components/training/TrainingPlanCard.vue'),
    { delay: 100 }
  ),
  TrainingTemplate: lazyLoad(
    () => import('@/components/training/TrainingTemplate.vue'),
    { delay: 100 }
  ),
  
  // 聊天相关
  ToolCallDialog: lazyLoad(
    () => import('@/components/chat/ToolCallDialog.vue'),
    { delay: 100 }
  ),
  RatingDialog: lazyLoad(
    () => import('@/components/chat/RatingDialog.vue'),
    { delay: 100 }
  ),
  TopicSidebar: lazyLoad(
    () => import('@/components/chat/TopicSidebar.vue'),
    { delay: 100 }
  ),
  
  // 会员相关
  PaymentFlow: lazyLoad(
    () => import('@/components/membership/PaymentFlow.vue'),
    { delay: 100 }
  ),
  BillingHistory: lazyLoad(
    () => import('@/components/membership/BillingHistory.vue'),
    { delay: 100 }
  ),
  
  // 进度追踪
  TrainingCalendar: lazyLoad(
    () => import('@/components/progress/TrainingCalendar.vue'),
    { delay: 100 }
  ),
  GoalProgress: lazyLoad(
    () => import('@/components/progress/GoalProgress.vue'),
    { delay: 100 }
  ),
}

export default lazyLoad
