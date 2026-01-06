<template>
  <div class="lazy-image-wrapper" :class="wrapperClass">
    <!-- 加载中占位符 -->
    <div
      v-if="isLoading"
      class="lazy-image-placeholder"
      :class="placeholderClass"
    >
      <div class="lazy-image-spinner">
        <svg
          class="animate-spin h-8 w-8 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    </div>

    <!-- 错误占位符 -->
    <div
      v-else-if="error"
      class="lazy-image-error"
      :class="placeholderClass"
    >
      <svg
        class="h-12 w-12 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <p class="text-sm text-muted-foreground mt-2">图片加载失败</p>
    </div>

    <!-- 实际图片 -->
    <img
      ref="imageRef"
      :src="currentSrc"
      :alt="alt"
      :class="[
        'lazy-image',
        imageClass,
        {
          'lazy-image-loaded': isLoaded,
          'lazy-image-loading': isLoading,
        },
      ]"
      @load="handleLoad"
      @error="handleError"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * LazyImage 组件
 * 
 * 支持图片懒加载、占位符、加载动画
 * 
 * @version 1.0.0
 * @date 2026-01-07
 */
import { ref } from 'vue'
import { useLazyImage } from '@/composables/useLazyImage'

interface Props {
  /**
   * 图片地址
   */
  src: string
  /**
   * 图片描述
   */
  alt?: string
  /**
   * 占位符图片
   */
  placeholder?: string
  /**
   * 根元素边距
   */
  rootMargin?: string
  /**
   * 可见度阈值
   */
  threshold?: number
  /**
   * 包装器类名
   */
  wrapperClass?: string
  /**
   * 图片类名
   */
  imageClass?: string
  /**
   * 占位符类名
   */
  placeholderClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  placeholder: undefined,
  rootMargin: '50px',
  threshold: 0.01,
  wrapperClass: '',
  imageClass: '',
  placeholderClass: '',
})

const emit = defineEmits<{
  load: []
  error: []
}>()

const imageRef = ref<HTMLImageElement | null>(null)

const { currentSrc, isLoaded, isLoading, error } = useLazyImage(
  imageRef,
  props.src,
  {
    placeholder: props.placeholder,
    rootMargin: props.rootMargin,
    threshold: props.threshold,
  }
)

function handleLoad() {
  emit('load')
}

function handleError() {
  emit('error')
}
</script>

<style scoped>
.lazy-image-wrapper {
  position: relative;
  overflow: hidden;
  background-color: hsl(var(--muted));
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease-in-out;
}

.lazy-image-loading {
  opacity: 0;
}

.lazy-image-loaded {
  opacity: 1;
}

.lazy-image-placeholder,
.lazy-image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: hsl(var(--muted));
}

.lazy-image-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
