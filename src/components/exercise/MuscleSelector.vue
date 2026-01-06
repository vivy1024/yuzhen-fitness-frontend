<template>
  <div class="muscle-selector">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between px-4 pb-2">
      <div class="flex items-center gap-2">
        <Heart class="w-4 h-4 text-primary" />
        <span class="text-sm font-medium text-gray-900">目标肌群</span>
      </div>
      <Button
        v-if="modelValue"
        variant="ghost"
        size="sm"
        class="h-7 text-xs"
        @click="handleClear"
      >
        <X class="w-3 h-3 mr-1" />
        清除
      </Button>
    </div>

    <!-- 肌群按钮组 -->
    <div class="px-4 overflow-x-auto">
      <div v-if="loading" class="flex items-center justify-center py-4">
        <Loader2 class="w-5 h-5 animate-spin text-primary" />
        <span class="ml-2 text-sm text-gray-500">加载中...</span>
      </div>

      <div v-else-if="muscleGroups.length > 0" class="flex flex-wrap gap-2 pb-2">
        <Button
          v-for="muscle in muscleGroups"
          :key="muscle.id"
          :variant="modelValue === muscle.id ? 'default' : 'outline'"
          size="sm"
          class="h-8 text-xs font-medium transition-all"
          @click="handleSelect(muscle.id)"
        >
          {{ muscle.name_zh }}
          <span v-if="muscle.count" class="ml-1 opacity-70">({{ muscle.count }})</span>
        </Button>
      </div>

      <div v-else class="py-4 text-center text-sm text-gray-500">
        暂无肌群数据
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Heart, X, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { MuscleGroup } from '@/types/exercise'

interface Props {
  modelValue?: string
  muscleGroups: MuscleGroup[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  muscleGroups: () => [],
  loading: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
  (e: 'clear'): void
}>()

function handleSelect(id: string) {
  // 单选模式：点击已选中的肌群，取消选中
  if (props.modelValue === id) {
    emit('update:modelValue', undefined)
  } else {
    emit('update:modelValue', id)
  }
}

function handleClear() {
  emit('update:modelValue', undefined)
  emit('clear')
}
</script>

<style scoped>
.muscle-selector {
  @apply py-3;
}
</style>
