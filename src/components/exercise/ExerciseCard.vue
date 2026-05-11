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
        class="absolute top-1 left-1 h-6 w-6 rounded-full bg-background/90 hover:bg-background shadow-sm z-10"
        @click.stop="handleFavoriteClick"
      >
        <Star 
          :class="[
            'w-3 h-3 transition-colors',
            isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          ]"
        />
      </Button>
    </div>

    <!-- 动作信息 -->
    <div class="card-content p-1.5">
      <!-- 动作名称 -->
      <h3 class="font-medium text-[11px] text-foreground mb-0.5 line-clamp-1">
        {{ exercise.name_zh }}
      </h3>

      <!-- 肌群标签 -->
      <div class="flex items-center gap-0.5">
        <Flame class="w-2.5 h-2.5 text-primary flex-shrink-0" />
        <span class="text-[10px] text-muted-foreground line-clamp-1">
          {{ targetMuscles }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Flame, Star } from 'lucide-vue-next'
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

// 获取图片URL
const imageUrl = computed(() => {
  if (props.exercise.thumbnail_urls?.primary) {
    return props.exercise.thumbnail_urls.primary
  }
  if (props.exercise.image_url) {
    return props.exercise.image_url
  }
  if (props.exercise.image_urls?.male?.angle_1) {
    return props.exercise.image_urls.male.angle_1
  }
  if (props.exercise.image_urls?.female?.angle_1) {
    return props.exercise.image_urls.female.angle_1
  }
  return ''
})

const placeholderImage = computed(() => '')

// 获取难度文本
const difficultyLabel = computed(() => {
  if (props.exercise.difficulty_zh) {
    return props.exercise.difficulty_zh
  }
  const d = props.exercise.difficulty
  if (!d) return '中级'
  if (typeof d === 'object' && d !== null) {
    return (d as any).name_zh || (d as any).name || '中级'
  }
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
      return 'bg-muted text-muted-foreground'
  }
})

// 目标肌群
const targetMuscles = computed(() => {
  if (props.exercise.muscles_primary && props.exercise.muscles_primary.length > 0) {
    return props.exercise.muscles_primary.join('、')
  }
  return '未知肌群'
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
  @apply bg-card rounded-lg overflow-hidden border border-border cursor-pointer transition-all duration-200;
  @apply hover:border-primary/30 hover:shadow-md active:scale-[0.98];
}

.card-image {
  @apply relative w-full pb-[65%] bg-muted overflow-hidden;
}

.placeholder-wrapper {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.placeholder-gradient {
  @apply absolute inset-0 opacity-90;
  background: linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(160 67% 52%) 100%);
}

.dark .placeholder-gradient {
  background: linear-gradient(135deg, hsl(160 84% 67% / 0.8) 0%, hsl(160 72% 56% / 0.6) 100%);
}

.placeholder-icon {
  @apply relative z-10 mb-0.5;
}

.placeholder-text {
  @apply relative z-10 text-white text-[10px] font-medium text-center px-1 line-clamp-2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
</style>
