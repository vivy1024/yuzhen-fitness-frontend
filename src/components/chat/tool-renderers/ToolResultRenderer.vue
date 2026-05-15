<script setup lang="ts">
/**
 * 工具结果渲染器 — 注册表模式
 * 根据工具名称自动选择专用卡片渲染，无匹配时 fallback 到 JSON
 * 支持 MCP 工具名格式：mcp__<server>__<toolName>
 */
import { computed } from 'vue'
import TDEEResultCard from './TDEEResultCard.vue'
import ExerciseResultCard from './ExerciseResultCard.vue'
import VolumeResultCard from './VolumeResultCard.vue'

interface Props {
  toolName: string
  result: any
}

const props = defineProps<Props>()

// 从 MCP 工具名中提取实际工具名
function extractToolName(fullName: string): string {
  if (fullName.startsWith('mcp__')) {
    const lastSep = fullName.lastIndexOf('__')
    if (lastSep > 4) return fullName.slice(lastSep + 2)
  }
  return fullName
}

// 工具名 → 渲染器映射
const RENDERER_MAP: Record<string, string> = {
  // TDEE 类
  calculate_tdee: 'tdee',
  tdee_calculator: 'tdee',
  // 动作搜索类
  search_exercises: 'exercise',
  intelligent_exercise_selector: 'exercise',
  find_alternatives: 'exercise',
  exercise_alternative_finder: 'exercise',
  get_muscle_exercise_map: 'exercise',
  // 容量类
  calculate_volume: 'volume',
  calculate_training_volume: 'volume',
  muscle_group_volume_calculator: 'volume',
  get_training_volume: 'volume',
}

const rendererType = computed(() => {
  const name = extractToolName(props.toolName)
  return RENDERER_MAP[name] || null
})

const hasSpecialRenderer = computed(() => {
  return rendererType.value !== null && props.result && !props.result.error
})
</script>

<template>
  <div v-if="hasSpecialRenderer">
    <TDEEResultCard v-if="rendererType === 'tdee'" :result="result" />
    <ExerciseResultCard v-if="rendererType === 'exercise'" :result="result" />
    <VolumeResultCard v-if="rendererType === 'volume'" :result="result" />
  </div>
</template>
