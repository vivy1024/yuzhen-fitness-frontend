<script setup lang="ts">
/**
 * ToolCallCard — 内联折叠式工具调用卡片
 * 
 * 借鉴 Studio 的 ToolCallCard 设计：
 * - 折叠态：一行（图标 + 工具名 + 摘要 + 耗时 + 展开箭头）
 * - 展开态：参数 + 结果（按工具类型定制渲染）
 */
import { ref, computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Search,
  Shield,
  Calculator,
  Dumbbell,
  Apple,
  BookOpen,
  AlertTriangle,
} from 'lucide-vue-next'
import type { ToolCall } from './ToolCallTimeline.vue'

interface Props {
  toolCall: ToolCall
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false,
})

const expanded = ref(props.defaultExpanded)

const toggle = () => {
  expanded.value = !expanded.value
}

// === 工具分类与图标 ===

type ToolCategory = 'search' | 'safety' | 'calculate' | 'training' | 'nutrition' | 'knowledge'

const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  // 搜索类
  search_exercises: 'search',
  find_alternatives: 'search',
  search_foods: 'search',
  search_knowledge: 'knowledge',
  intelligent_exercise_selector: 'search',
  exercise_alternative_finder: 'search',
  // 安全类
  check_contraindications: 'safety',
  assess_injury_risk: 'safety',
  check_postural_issues: 'safety',
  contraindications_checker: 'safety',
  injury_risk_assessor: 'safety',
  postural_assessor: 'safety',
  safe_exercise_modifier: 'safety',
  // 计算类
  calculate_tdee: 'calculate',
  calculate_volume: 'calculate',
  calculate_weight: 'calculate',
  tdee_calculator: 'calculate',
  muscle_group_volume_calculator: 'calculate',
  intelligent_weight_calculator: 'calculate',
  // 训练类
  design_split: 'training',
  design_periodization: 'training',
  get_training_volume: 'training',
  query_muscle_relations: 'training',
  get_strength_standards: 'training',
  training_split_designer: 'training',
  periodized_program_designer: 'training',
  professional_program_designer: 'training',
  movement_pattern_balancer: 'training',
  // 营养类
  nutrition_intake_analyzer: 'nutrition',
  meal_plan_designer: 'nutrition',
  exercise_nutrition_optimization: 'nutrition',
}

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  search_exercises: '动作搜索',
  find_alternatives: '替代动作',
  search_foods: '食物搜索',
  search_knowledge: '知识检索',
  check_contraindications: '禁忌症检查',
  assess_injury_risk: '损伤风险评估',
  check_postural_issues: '体态检查',
  calculate_tdee: 'TDEE 计算',
  calculate_volume: '训练容量计算',
  calculate_weight: '推荐重量计算',
  design_split: '训练分化设计',
  design_periodization: '周期化设计',
  get_training_volume: '容量参数查询',
  query_muscle_relations: '肌群关系查询',
  get_strength_standards: '力量标准查询',
  intelligent_exercise_selector: '智能动作选择',
  exercise_alternative_finder: '替代动作查找',
  contraindications_checker: '禁忌症检查',
  injury_risk_assessor: '损伤风险评估',
  postural_assessor: '体态评估',
  tdee_calculator: 'TDEE 计算',
  muscle_group_volume_calculator: '肌群容量计算',
  intelligent_weight_calculator: '智能重量计算',
  training_split_designer: '训练分化设计',
  periodized_program_designer: '周期化方案',
  professional_program_designer: '专业方案设计',
  movement_pattern_balancer: '动作模式平衡',
  nutrition_intake_analyzer: '营养摄入分析',
  meal_plan_designer: '饮食计划设计',
  exercise_nutrition_optimization: '运动营养优化',
  safe_exercise_modifier: '安全动作调整',
}

const CATEGORY_ICONS = {
  search: Search,
  safety: Shield,
  calculate: Calculator,
  training: Dumbbell,
  nutrition: Apple,
  knowledge: BookOpen,
}

const CATEGORY_COLORS = {
  search: 'text-blue-500',
  safety: 'text-amber-500',
  calculate: 'text-purple-500',
  training: 'text-green-500',
  nutrition: 'text-orange-500',
  knowledge: 'text-cyan-500',
}

// === 计算属性 ===

const category = computed<ToolCategory>(() => {
  return TOOL_CATEGORIES[props.toolCall.name] || 'search'
})

const icon = computed(() => CATEGORY_ICONS[category.value])
const iconColor = computed(() => CATEGORY_COLORS[category.value])

const displayName = computed(() => {
  return props.toolCall.displayName || TOOL_DISPLAY_NAMES[props.toolCall.name] || props.toolCall.name
})

const statusIcon = computed(() => {
  switch (props.toolCall.status) {
    case 'success': return CheckCircle2
    case 'error': return XCircle
    case 'running': return Loader2
    default: return Loader2
  }
})

const statusColor = computed(() => {
  switch (props.toolCall.status) {
    case 'success': return 'text-green-500'
    case 'error': return 'text-red-500'
    default: return 'text-muted-foreground animate-spin'
  }
})

const duration = computed(() => {
  if (props.toolCall.duration) {
    return props.toolCall.duration < 1000
      ? `${props.toolCall.duration}ms`
      : `${(props.toolCall.duration / 1000).toFixed(1)}s`
  }
  if (props.toolCall.startTime && props.toolCall.endTime) {
    const d = props.toolCall.endTime - props.toolCall.startTime
    return d < 1000 ? `${d}ms` : `${(d / 1000).toFixed(1)}s`
  }
  return null
})

const resultSummary = computed(() => {
  if (props.toolCall.error) return props.toolCall.error
  if (!props.toolCall.result) return null
  
  const result = props.toolCall.result
  // 尝试提取有意义的摘要
  if (typeof result === 'string') return result.slice(0, 100)
  if (result.error) return `错误: ${result.error}`
  if (result.exercises) return `找到 ${result.exercises.length} 个动作`
  if (result.results) return `${result.results.length} 条结果`
  if (result.recommendedWeight) return `推荐 ${result.recommendedWeight}kg`
  if (result.tdee) return `TDEE: ${result.tdee}kcal`
  if (result.mev !== undefined) return `MEV ${result.mev} / MAV ${result.mav} / MRV ${result.mrv}`
  if (result.splitName) return result.splitName
  if (result.model) return result.model
  if (result.passed !== undefined) return result.passed ? '安全' : '存在风险'
  if (result.issues) return `${result.issues.length} 个问题`
  return null
})

const formattedResult = computed(() => {
  if (!props.toolCall.result) return null
  try {
    return JSON.stringify(props.toolCall.result, null, 2)
  } catch {
    return String(props.toolCall.result)
  }
})

const formattedParams = computed(() => {
  if (!props.toolCall.parameters) return null
  try {
    return JSON.stringify(props.toolCall.parameters, null, 2)
  } catch {
    return String(props.toolCall.parameters)
  }
})
</script>

<template>
  <div class="tool-call-card rounded-lg border border-border/60 bg-muted/30 overflow-hidden transition-all">
    <!-- 折叠态：一行摘要 -->
    <button
      class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      @click="toggle"
    >
      <!-- 工具类型图标 -->
      <component :is="icon" class="h-3.5 w-3.5 shrink-0" :class="iconColor" />
      
      <!-- 工具名称 -->
      <span class="text-xs font-medium text-foreground truncate">{{ displayName }}</span>
      
      <!-- 结果摘要 -->
      <span v-if="resultSummary && !expanded" class="text-xs text-muted-foreground truncate flex-1">
        · {{ resultSummary }}
      </span>
      <span v-else class="flex-1" />
      
      <!-- 数据来源 -->
      <Badge v-if="toolCall.dataSource" variant="outline" class="h-4 px-1.5 text-[10px] shrink-0">
        {{ toolCall.dataSource }}
      </Badge>
      
      <!-- 耗时 -->
      <span v-if="duration" class="text-[10px] text-muted-foreground shrink-0">{{ duration }}</span>
      
      <!-- 状态图标 -->
      <component :is="statusIcon" class="h-3.5 w-3.5 shrink-0" :class="statusColor" />
      
      <!-- 展开/折叠箭头 -->
      <component :is="expanded ? ChevronDown : ChevronRight" class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
    
    <!-- 展开态：参数 + 结果 -->
    <div v-if="expanded" class="border-t border-border/40 px-3 py-2 space-y-2">
      <!-- 参数 -->
      <div v-if="formattedParams">
        <div class="text-[10px] font-medium text-muted-foreground mb-1">输入参数</div>
        <pre class="text-[11px] bg-muted/50 rounded p-2 overflow-x-auto max-h-32 text-foreground/80">{{ formattedParams }}</pre>
      </div>
      
      <!-- 结果 -->
      <div v-if="formattedResult">
        <div class="text-[10px] font-medium text-muted-foreground mb-1">
          {{ toolCall.status === 'error' ? '错误信息' : '执行结果' }}
        </div>
        <pre class="text-[11px] bg-muted/50 rounded p-2 overflow-x-auto max-h-48 text-foreground/80" :class="{ 'text-red-500': toolCall.status === 'error' }">{{ formattedResult }}</pre>
      </div>
      
      <!-- 错误提示 -->
      <div v-if="toolCall.error && !formattedResult" class="flex items-center gap-1.5 text-xs text-red-500">
        <AlertTriangle class="h-3.5 w-3.5" />
        <span>{{ toolCall.error }}</span>
      </div>
    </div>
  </div>
</template>
