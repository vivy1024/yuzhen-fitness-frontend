<script setup lang="ts">
/**
 * 动作推荐结果卡片
 * 展示搜索到的动作列表（带肌群标签和难度）
 */
import { computed } from 'vue'
import { Dumbbell, Target, AlertTriangle } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'

interface Exercise {
  name?: string
  nameZh?: string
  name_zh?: string
  primary_muscles?: string[]
  primaryMuscles?: string[]
  equipment?: string[]
  difficulty?: string
  score?: number
  contraindicated?: boolean
  contraindication_reason?: string
}

interface Props {
  result: {
    exercises?: Exercise[]
    results?: Exercise[]
    query?: string
    total?: number
  }
}

const props = defineProps<Props>()

const exercises = computed(() => {
  return props.result.exercises || props.result.results || []
})

const difficultyColor = (d?: string) => {
  switch (d) {
    case 'beginner': return 'bg-green-100 text-green-700'
    case 'intermediate': return 'bg-amber-100 text-amber-700'
    case 'advanced': return 'bg-red-100 text-red-700'
    default: return 'bg-muted text-muted-foreground'
  }
}

const difficultyLabel = (d?: string) => {
  switch (d) {
    case 'beginner': return '初级'
    case 'intermediate': return '中级'
    case 'advanced': return '高级'
    case 'expert': return '专家'
    default: return d || ''
  }
}
</script>

<template>
  <div class="rounded-lg border border-border bg-card p-3 space-y-2">
    <!-- 标题 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Dumbbell class="h-4 w-4 text-green-500" />
        <span class="text-sm font-medium">动作推荐</span>
      </div>
      <span class="text-[10px] text-muted-foreground">{{ exercises.length }} 个结果</span>
    </div>

    <!-- 搜索词 -->
    <div v-if="result.query" class="text-xs text-muted-foreground">
      搜索: "{{ result.query }}"
    </div>

    <!-- 动作列表 -->
    <div class="space-y-1.5 max-h-48 overflow-y-auto">
      <div
        v-for="(ex, idx) in exercises.slice(0, 8)"
        :key="idx"
        class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
        :class="{ 'opacity-50 line-through': ex.contraindicated }"
      >
        <!-- 序号 -->
        <span class="text-[10px] text-muted-foreground w-4 shrink-0">{{ idx + 1 }}</span>

        <!-- 动作名 -->
        <div class="flex-1 min-w-0">
          <div class="text-xs font-medium truncate">
            {{ ex.nameZh || ex.name_zh || ex.name }}
          </div>
          <div v-if="ex.primary_muscles || ex.primaryMuscles" class="flex gap-1 mt-0.5 flex-wrap">
            <Badge
              v-for="muscle in (ex.primary_muscles || ex.primaryMuscles || []).slice(0, 3)"
              :key="muscle"
              variant="outline"
              class="h-4 px-1 text-[9px]"
            >
              <Target class="h-2.5 w-2.5 mr-0.5" />
              {{ muscle }}
            </Badge>
          </div>
        </div>

        <!-- 禁忌标记 -->
        <AlertTriangle
          v-if="ex.contraindicated"
          class="h-3.5 w-3.5 text-red-500 shrink-0"
          :title="ex.contraindication_reason || '禁忌'"
        />

        <!-- 难度 -->
        <span
          v-if="ex.difficulty"
          class="text-[9px] px-1.5 py-0.5 rounded shrink-0"
          :class="difficultyColor(ex.difficulty)"
        >
          {{ difficultyLabel(ex.difficulty) }}
        </span>

        <!-- 相关度分数 -->
        <span v-if="ex.score" class="text-[9px] text-muted-foreground shrink-0">
          {{ (ex.score * 100).toFixed(0) }}%
        </span>
      </div>
    </div>

    <!-- 更多提示 -->
    <div v-if="exercises.length > 8" class="text-[10px] text-muted-foreground text-center pt-1 border-t border-border/50">
      还有 {{ exercises.length - 8 }} 个结果未显示
    </div>
  </div>
</template>
