<script setup lang="ts">
/**
 * SkillProgress - Agent 执行进度组件
 * 显示 Agent 执行各阶段的进度，类似"教练正在思考..."的体验
 * 
 * @author 玉珍健身 v3.0
 */
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Brain, ShieldCheck, Cog, PenTool } from 'lucide-vue-next'

export type SkillPhase = 'thinking' | 'checking' | 'executing' | 'generating' | 'idle'

interface Props {
  currentPhase: SkillPhase
  skillName?: string
  currentTool?: string
  toolsCompleted?: number
  toolsTotal?: number
}

const props = withDefaults(defineProps<Props>(), {
  skillName: '',
  currentTool: '',
  toolsCompleted: 0,
  toolsTotal: 0,
})

// 阶段定义（适配 YuzhenFork 3 步管线：Coach分析 → Safety检查 → Coach编排/生成）
const phases = [
  { key: 'thinking', label: '需求分析', icon: Brain, emoji: '🧠' },
  { key: 'checking', label: '安全评估', icon: ShieldCheck, emoji: '🛡️' },
  { key: 'executing', label: '搜索动作', icon: Cog, emoji: '⚙️' },
  { key: 'generating', label: '编排方案', icon: PenTool, emoji: '✍️' },
] as const

// 当前阶段索引
const currentIndex = computed(() => {
  return phases.findIndex(p => p.key === props.currentPhase)
})

// 进度百分比
const progressValue = computed(() => {
  if (props.currentPhase === 'idle') return 0
  if (props.toolsTotal > 0 && props.currentPhase === 'executing') {
    // 执行阶段按工具完成数计算细粒度进度
    const baseProgress = (currentIndex.value / phases.length) * 100
    const phaseWidth = (1 / phases.length) * 100
    const toolProgress = (props.toolsCompleted / props.toolsTotal) * phaseWidth
    return baseProgress + toolProgress
  }
  // 每个阶段占 25%，当前阶段中间位置
  return ((currentIndex.value + 0.5) / phases.length) * 100
})

// 状态文本
const statusText = computed(() => {
  if (props.currentTool) {
    return `正在${props.currentTool}...`
  }
  switch (props.currentPhase) {
    case 'thinking': return '教练正在分析您的需求...'
    case 'checking': return '正在进行安全检查...'
    case 'executing': return '正在调用专业工具...'
    case 'generating': return '正在生成个性化方案...'
    default: return ''
  }
})
</script>

<template>
  <div v-if="currentPhase !== 'idle'" class="space-y-3 py-3 px-4 bg-muted/30 rounded-lg animate-in fade-in duration-300">
    <!-- 技能名称 -->
    <div v-if="skillName" class="flex items-center gap-2">
      <Badge variant="secondary" class="text-xs">
        {{ skillName }}
      </Badge>
      <span v-if="toolsTotal > 0" class="text-xs text-muted-foreground">
        {{ toolsCompleted }}/{{ toolsTotal }} 工具完成
      </span>
    </div>

    <!-- 进度条 -->
    <Progress :model-value="progressValue" class="h-1.5" />

    <!-- 阶段指示器 -->
    <div class="flex items-center justify-between">
      <div
        v-for="(phase, index) in phases"
        :key="phase.key"
        class="flex flex-col items-center gap-1 flex-1"
      >
        <div
          class="flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300"
          :class="[
            index < currentIndex ? 'bg-primary/20 text-primary' : '',
            index === currentIndex ? 'bg-primary text-primary-foreground scale-110 animate-pulse' : '',
            index > currentIndex ? 'bg-muted text-muted-foreground' : '',
          ]"
        >
          <component :is="phase.icon" class="h-4 w-4" />
        </div>
        <span
          class="text-[10px] text-center leading-tight"
          :class="index === currentIndex ? 'text-primary font-medium' : 'text-muted-foreground'"
        >
          {{ phase.label }}
        </span>
      </div>
    </div>

    <!-- 状态文本 -->
    <p class="text-xs text-muted-foreground text-center animate-pulse">
      {{ statusText }}
    </p>
  </div>
</template>
