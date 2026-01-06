/**
 * 图片懒加载 Composable
 * 
 * 使用 Intersection Observer 实现图片懒加载
 * 
 * @version 1.0.0
 * @date 2026-01-07
 */

import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface LazyImageOptions {
  /**
   * 占位符图片
   */
  placeholder?: string
  /**
   * 根元素边距（触发加载的距离）
   */
  rootMargin?: string
  /**
   * 可见度阈值
   */
  threshold?: number
}

/**
 * 使用图片懒加载
 */
export function useLazyImage(
  imageRef: Ref<HTMLImageElement | null>,
  src: string,
  options: LazyImageOptions = {}
) {
  const {
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3C/svg%3E',
    rootMargin = '50px',
    threshold = 0.01,
  } = options

  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref(false)
  const currentSrc = ref(placeholder)

  let observer: IntersectionObserver | null = null

  /**
   * 加载图片
   */
  function loadImage() {
    if (isLoaded.value || isLoading.value) return

    isLoading.value = true
    error.value = false

    const img = new Image()
    
    img.onload = () => {
      currentSrc.value = src
      isLoaded.value = true
      isLoading.value = false
      
      // 断开观察
      if (observer && imageRef.value) {
        observer.unobserve(imageRef.value)
      }
    }
    
    img.onerror = () => {
      error.value = true
      isLoading.value = false
      console.error('图片加载失败:', src)
    }
    
    img.src = src
  }

  /**
   * 初始化观察器
   */
  function initObserver() {
    if (!imageRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage()
          }
        })
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(imageRef.value)
  }

  onMounted(() => {
    // 检查浏览器是否支持 Intersection Observer
    if ('IntersectionObserver' in window) {
      initObserver()
    } else {
      // 不支持则直接加载
      loadImage()
    }
  })

  onUnmounted(() => {
    if (observer && imageRef.value) {
      observer.unobserve(imageRef.value)
      observer.disconnect()
    }
  })

  return {
    currentSrc,
    isLoaded,
    isLoading,
    error,
  }
}

/**
 * 使用背景图片懒加载
 */
export function useLazyBackgroundImage(
  elementRef: Ref<HTMLElement | null>,
  src: string,
  options: LazyImageOptions = {}
) {
  const {
    rootMargin = '50px',
    threshold = 0.01,
  } = options

  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref(false)

  let observer: IntersectionObserver | null = null

  /**
   * 加载背景图片
   */
  function loadBackgroundImage() {
    if (isLoaded.value || isLoading.value || !elementRef.value) return

    isLoading.value = true
    error.value = false

    const img = new Image()
    
    img.onload = () => {
      if (elementRef.value) {
        elementRef.value.style.backgroundImage = `url(${src})`
      }
      isLoaded.value = true
      isLoading.value = false
      
      // 断开观察
      if (observer && elementRef.value) {
        observer.unobserve(elementRef.value)
      }
    }
    
    img.onerror = () => {
      error.value = true
      isLoading.value = false
      console.error('背景图片加载失败:', src)
    }
    
    img.src = src
  }

  /**
   * 初始化观察器
   */
  function initObserver() {
    if (!elementRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadBackgroundImage()
          }
        })
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(elementRef.value)
  }

  onMounted(() => {
    if ('IntersectionObserver' in window) {
      initObserver()
    } else {
      loadBackgroundImage()
    }
  })

  onUnmounted(() => {
    if (observer && elementRef.value) {
      observer.unobserve(elementRef.value)
      observer.disconnect()
    }
  })

  return {
    isLoaded,
    isLoading,
    error,
  }
}
