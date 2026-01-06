<template>
  <div class="exercise-card" @click="handleCardClick">
    <!-- 图片区域 -->
    <div class="card-image">
      <!-- 使用LazyImage组件 -->
      <LazyImage
        v-if="imageUrl"
        :src="imageUrl"
        :alt="exercise.name_zh"
        :placeholder="placeholderImage"
        class="w-full h-full"
        object-fit="cover"
        :show-loading="true"
      />
      
      <!-- 无图片时的占位符 -->
      <div v-else class="placeholder-wrapper">
        <div class="placeholder-gradient"></div>
        <div class="placeholder-icon">
          <Flame class="w-6 h-6 text-white" />
        </div>
        <div class="placeholder-text">{{ exercise.name_zh }}</div>
      </div>

      <!-- 难度标签 - 右上角 -->
      <Badge 
        :class="difficultyBadgeClass"
        class="absolute top-1 right-1 text-[10px] px-1 py-0 font-medium z-10"
      >
        {{ difficultyLabel }}
      </Badge>

      <!-- 收藏按钮 - 左上角 -->
      <Button
        variant="ghost"
        size="icon"
        class="absolute top-1 left-1 h-6 w-6 rounded-full bg-white/90 hover:bg-white shadow-sm z-10"
        @click.stop="handleFavoriteClick"
      >
        <Star 
          :class="[
            'w-3 h-3 transition-colors',
            isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'
          ]"
        />
      </Button>
    </div>

    <!-- 动作信息 -->
    <div class="card-content p-1.5">
      <!-- 动作名称 -->
      <h3 class="font-medium text-[11px] text-gray-900 mb-0.5 line-clamp-1">
        {{ exercise.name_zh }}
      </h3>

      <!-- 肌群标签 -->
      <div class="flex items-center gap-0.5">
        <Flame class="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
        <span class="text-[10px] text-gray-600 line-clamp-1">
          {{ targetMuscles }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Star, Dumbbell } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LazyImage from '@/components/ui/lazy-image/LazyImage.vue'
import type { ExerciseBasic } from '@/types/exercise'

interface Props {
  exercise: ExerciseBasic
  isFavorited?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isFavorited: false,
})

const emit = defineEmits<{
  (e: 'card-click', id: number): void
  (e: 'favorite', id: number): void
}>()

// 获取图片URL（优先级：thumbnail > image_url > body_map）
const imageUrl = computed(() => {
  // 1. 优先使用缩略图
  if (props.exercise.thumbnail_urls?.primary) {
    return props.exercise.thumbnail_urls.primary
  }
  
  // 2. 使用主图片URL
  if (props.exercise.image_url) {
    return props.exercise.image_url
  }
  
  // 3. 使用image_urls中的图片
  if (props.exercise.image_urls?.male?.angle_1) {
    return props.exercise.image_urls.male.angle_1
  }
  if (props.exercise.image_urls?.female?.angle_1) {
    return props.exercise.image_urls.female.angle_1
  }
  
  return ''
})

// 占位图（可以是一个低分辨率的模糊图或纯色）
const placeholderImage = computed(() => {
  // 可以返回一个data URI的模糊图或渐变色
  return ''
})

// 获取难度文本（优先使用difficulty_zh）
const difficultyLabel = computed(() => {
  // 优先使用后端返回的difficulty_zh
  if (props.exercise.difficulty_zh) {
    return props.exercise.difficulty_zh
  }
  
  const d = props.exercise.difficulty
  if (!d) return '中级'
  
  // 处理对象格式: { name_zh: "中级", name: "Intermediate" }
  if (typeof d === 'object' && d !== null) {
    return (d as any).name_zh || (d as any).name || '中级'
  }
  
  // 英文转中文映射
  const difficultyMap: Record<string, string> = {
    'Beginner': '初学者',
    'Novice': '零基础',
    'Intermediate': '中级',
    'Advanced': '高级',
  }
  
  return difficultyMap[String(d)] || String(d)
})

// 难度标签样式
const difficultyBadgeClass = computed(() => {
  const difficulty = difficultyLabel.value
  switch (difficulty) {
    case '零基础':
    case '新手':
    case '初学者':
    case '初级':
    case 'Beginner':
    case 'Novice':
      return 'bg-green-500 hover:bg-green-500 text-white'
    case '中级':
    case 'Intermediate':
      return 'bg-blue-500 hover:bg-blue-500 text-white'
    case '高级':
    case 'Advanced':
      return 'bg-red-500 hover:bg-red-500 text-white'
    default:
      return 'bg-gray-500 hover:bg-gray-500 text-white'
  }
})

// 目标肌群
const targetMuscles = computed(() => {
  return props.exercise.primary_muscle_zh || props.exercise.primary_muscle || '未知肌群'
})

function handleCardClick() {
  emit('card-click', Number(props.exercise.id))
}

function handleFavoriteClick() {
  emit('favorite', Number(props.exercise.id))
}
</script>

<style scoped>
.exercise-card {
  @apply bg-white rounded-lg overflow-hidden shadow-sm cursor-pointer transition-all duration-300;
  @apply hover:shadow-md active:scale-[0.98];
}

.card-image {
  @apply relative w-full pb-[65%] bg-gray-100 overflow-hidden;
}

.placeholder-wrapper {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.placeholder-gradient {
  @apply absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80;
}

.placeholder-icon {
  @apply relative z-10 mb-0.5;
}

.placeholder-text {
  @apply relative z-10 text-white text-[10px] font-medium text-center px-1 line-clamp-2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
