<template>
  <div class="rounded-xl border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between">
      <div>
        <h3 class="font-medium text-sm">{{ template.name }}</h3>
        <p class="text-xs text-muted-foreground mt-0.5 line-clamp-2">{{ template.description }}</p>
      </div>
      <Badge :variant="levelVariant">{{ levelLabel }}</Badge>
    </div>

    <div class="flex items-center gap-3 text-xs text-muted-foreground">
      <span class="flex items-center gap-1">
        <Target class="w-3 h-3" />
        {{ goalLabel }}
      </span>
      <span class="flex items-center gap-1">
        <Calendar class="w-3 h-3" />
        {{ template.duration_weeks }}周
      </span>
      <span class="flex items-center gap-1">
        <Dumbbell class="w-3 h-3" />
        {{ template.workouts_per_week }}次/周
      </span>
    </div>

    <Button class="w-full" size="sm" :disabled="loading" @click="handleUse">
      <Loader2 v-if="loading" class="w-3.5 h-3.5 mr-1 animate-spin" />
      使用此模板
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Target, Calendar, Dumbbell, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PlanTemplate } from '@/api/training-plan'

const props = defineProps<{ template: PlanTemplate }>()
const emit = defineEmits<{ use: [id: number] }>()
const loading = ref(false)

const goalLabel = computed(() => {
  const map: Record<string, string> = {
    gain_muscle: '增肌', lose_weight: '减脂',
    strength: '力量', body_shaping: '塑形',
    improve_fitness: '体能', maintain: '维持',
  }
  return map[props.template.goal] || props.template.goal
})

const levelLabel = computed(() => {
  const map: Record<string, string> = {
    beginner: '初级', intermediate: '中级', advanced: '高级',
  }
  return map[props.template.level] || props.template.level
})

const levelVariant = computed(() => {
  const map: Record<string, 'default' | 'secondary' | 'destructive'> = {
    beginner: 'secondary', intermediate: 'default', advanced: 'destructive',
  }
  return map[props.template.level] || 'secondary'
})

async function handleUse() {
  loading.value = true
  emit('use', props.template.id)
}
</script>
