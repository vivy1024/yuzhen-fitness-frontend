# useLazyImage

> 自动生成 | 对应源文件: composposables/useLazyImage.ts

## 概述

图片懒加载 Composable，基于 Intersection Observer API 实现图片的延迟加载。当图片进入可视区域时才加载实际图片，可以显著提升页面首屏加载性能和用户体验。

提供两个函数：
- `useLazyImage` - 用于 `<img>` 元素的懒加载
- `useLazyBackgroundImage` - 用于背景图片的懒加载

## 参数

### useLazyImage

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `imageRef` | `Ref<HTMLImageElement | null>` | 是 | 图片元素的 DOM 引用 |
| `src` | `string` | 是 | 实际要加载的图片 URL |
| `options` | `LazyImageOptions` | 否 | 配置选项 |

### LazyImageOptions

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `placeholder` | `string` | 灰色占位 SVG | 加载前显示的占位图片 |
| `rootMargin` | `string` | `'50px'` | 触发加载的边距（Intersection Observer 选项） |
| `threshold` | `number` | `0.01` | 可见度阈值（0-1） |

### useLazyBackgroundImage

参数与 `useLazyImage` 相同，但第一个参数为 `Ref<HTMLElement | null>`（任意元素引用）。

## 返回值

### useLazyImage

| 属性 | 类型 | 说明 |
|------|------|------|
| `currentSrc` | `Ref<string>` | 当前显示的图片源（占位符或实际图片） |
| `isLoaded` | `Ref<boolean>` | 图片是否加载完成 |
| `isLoading` | `Ref<boolean>` | 图片是否正在加载 |
| `error` | `Ref<boolean>` | 加载是否出错 |

### useLazyBackgroundImage

| 属性 | 类型 | 说明 |
|------|------|------|
| `isLoaded` | `Ref<boolean>` | 背景图片是否加载完成 |
| `isLoading` | `Ref<boolean>` | 背景图片是否正在加载 |
| `error` | `Ref<boolean>` | 加载是否出错 |

## 使用示例

### 基础使用：图片懒加载

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useLazyImage } from '@/composables/useLazyImage'

const imgRef = ref<HTMLImageElement | null>(null)
const { currentSrc, isLoaded, isLoading, error } = useLazyImage(
  imgRef,
  'https://example.com/image.jpg'
)
</script>

<template>
  <img
    ref="imgRef"
    :src="currentSrc"
    :class="{ loaded: isLoaded, loading: isLoading, error: error }"
    alt="懒加载图片"
  />
</template>

<style scoped>
.loading {
  opacity: 0.5;
}
.loaded {
  opacity: 1;
  transition: opacity 0.3s;
}
.error {
  filter: grayscale(100%);
}
</style>
```

### 自定义占位符和加载阈值

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useLazyImage } from '@/composables/useLazyImage'

const imgRef = ref<HTMLImageElement | null>(null)

const { currentSrc, isLoaded } = useLazyImage(imgRef, '/images/exercise.jpg', {
  placeholder: '/images/placeholder.png',
  rootMargin: '100px',
  threshold: 0.1,
})
</script>

<template>
  <div class="image-container">
    <img ref="imgRef" :src="currentSrc" />
    <div v-if="!isLoaded" class="skeleton"></div>
  </div>
</template>
```

### 背景图片懒加载

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useLazyBackgroundImage } from '@/composables/useLazyImage'

const cardRef = ref<HTMLElement | null>(null)
const { isLoaded, isLoading, error } = useLazyBackgroundImage(
  cardRef,
  'https://example.com/bg.jpg'
)
</script>

<template>
  <div
    ref="cardRef"
    class="feature-card"
    :class="{ loaded: isLoaded, loading: isLoading }"
  >
    <slot>内容区域</slot>
  </div>
</template>

<style scoped>
.feature-card {
  background-size: cover;
  background-position: center;
}
.feature-card.loading {
  background-color: #f0f0f0;
}
</style>
```