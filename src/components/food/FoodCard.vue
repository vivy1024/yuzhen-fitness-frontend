<template>
  <div class="food-card" @click="handleCardClick">
    <!-- 图片区域 -->
    <div class="card-image">
      <!-- 使用LazyImage组件 -->
      <LazyImage
        v-if="imageUrl"
        :src="imageUrl"
        :alt="food.name"
        :placeholder="placeholderImage"
        class="w-full h-full"
        object-fit="cover"
        :show-loading="true"
      />
      
      <!-- 无图片时的占位符 -->
      <div v-else class="placeholder-wrapper">
        <div class="placeholder-gradient"></div>
        <div class="placeholder-icon">
          <component :is="categoryIcon" class="w-6 h-6 text-white" />
        </div>
        <div class="placeholder-text">{{ food.name }}</div>
      </div>

      <!-- GI值标签 - 右上角 -->
      <Badge 
        v-if="food.gi_value"
        :class="giBadgeClass"
        class="absolute top-1 right-1 text-[10px] px-1 py-0 font-medium z-10"
      >
        GI:{{ food.gi_value }}
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

    <!-- 食物信息 -->
    <div class="card-content p-1.5">
      <!-- 食物名称 -->
      <h3 class="font-medium text-[11px] text-gray-900 mb-0.5 line-clamp-1">
        {{ food.name }}
      </h3>

      <!-- 热量和蛋白质 -->
      <div class="flex items-center gap-0.5">
        <Flame class="w-2.5 h-2.5 text-red-500 flex-shrink-0" />
        <span class="text-[10px] text-gray-600">
          {{ food.energy_kcal || 0 }}kcal · {{ food.protein || 0 }}g蛋白
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Star, Flame, Wheat, Carrot, Apple, Drumstick, 
  Milk, Droplets, UtensilsCrossed, Fish, Egg, Cookie
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import LazyImage from '@/components/ui/lazy-image/LazyImage.vue'
import type { FoodBasic } from '@/api/food'

interface Props {
  food: FoodBasic
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
  // 食物库目前可能没有图片，预留字段
  return (props.food as any).image_url || (props.food as any).thumbnail_url || ''
})

// 占位图
const placeholderImage = computed(() => {
  return ''
})

// 分类图标映射
const categoryIcon = computed(() => {
  const category = props.food.category || ''
  if (category.includes('谷') || category.includes('薯')) return Wheat
  if (category.includes('蔬菜')) return Carrot
  if (category.includes('水果')) return Apple
  if (category.includes('畜') || category.includes('禽')) return Drumstick
  if (category.includes('鱼') || category.includes('虾') || category.includes('蟹') || category.includes('贝')) return Fish
  if (category.includes('蛋')) return Egg
  if (category.includes('乳') || category.includes('奶')) return Milk
  if (category.includes('豆')) return Cookie
  if (category.includes('油') || category.includes('调')) return Droplets
  return UtensilsCrossed
})

// GI值标签样式
const giBadgeClass = computed(() => {
  const gi = props.food.gi_value
  if (!gi) return 'bg-gray-500 hover:bg-gray-500 text-white'
  if (gi <= 55) return 'bg-green-500 hover:bg-green-500 text-white'
  if (gi <= 70) return 'bg-yellow-500 hover:bg-yellow-500 text-white'
  return 'bg-red-500 hover:bg-red-500 text-white'
})

function handleCardClick() {
  emit('card-click', props.food.id)
}

function handleFavoriteClick() {
  emit('favorite', props.food.id)
}
</script>

<style scoped>
.food-card {
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
  @apply absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 opacity-80;
}

.placeholder-icon {
  @apply relative z-10 mb-0.5;
}

.placeholder-text {
  @apply relative z-10 text-white text-[10px] font-medium text-center px-1 line-clamp-2;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}
</style>
