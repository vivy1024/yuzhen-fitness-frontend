<script setup lang="ts">
/**
 * ToolCallCardNew — 适配 useYuzhenChat.ToolCallInfo 的工具调用卡片
 * 
 * 折叠/展开设计：
 * - 折叠态：图标 + 工具名 + 摘要 + 耗时 + 状态
 * - 展开态：完整结果详情
 */
import { ref, computed } from 'vue'
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
  FileText,
} from 'lucide-vue-next'
import type { ToolCallInfo } from '@/composables/useYuzhenChat'

interface Props {
  toolCall: ToolCallInfo
  defaultExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultExpanded: false,
})

const expanded = ref(props.defaultExpanded)

function toggle() {
  expanded.value = !expanded.value
}

// 工具分类图标映射
const TOOL_ICONS: Record<string, typeof Search> = {
  // 搜索类
  intelligent_exercise_selector: Search,
  exercise_alternative_finder: Search,
  find_similar_training_cases: Search,
  // 安全类
  contraindications_checker: Shield,
  injury_risk_assessor: Shield,
  safe_exercise_modifier: Shield,
  // 计算类
  tdee_calculator: Calculator,
  muscle_group_volume_calculator: Calculator,
  intelligent_weight_calculator: Calculator,
  // 训练类
  professional_program_designer: Dumbbell,
  training_split_designer: Dumbbell,
  periodized_program_designer: Dumbbell,
  movement_pattern_balancer: Dumbbell,
}

const TOOL_ICON_COLORS: Record<string, string> = {
  Search: 'text-blue-500',
  Shield: 'text-amber-500',
  Calculator: 'text-purple-500',
  Dumbbell: 'text-green-500',
  FileText: 'text-gray-500',
}

const icon = computed(() => {
  return TOOL_ICONS[props.toolCall.toolName] || FileText
})

const iconColor = computed(() => {
  const iconComp = icon.value
  const name = iconComp === Search ? 'Search'
    : iconComp === Shield ? 'Shield'
    : iconComp === Calculator ? 'Calculator'
    : iconComp === Dumbbell ? 'Dumbbell'
    : 'FileText'
  return TOOL_ICON_COLORS[name] || 'text-gray-500'
})

// 工具显示名称
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  intelligent_exercise_selector: '智能动作选择',
  exercise_alternative_finder: '替代动作查找',
  contraindications_checker: '禁忌症检查',
  injury_risk_assessor: '损伤风险评估',
  safe_exercise_modifier: '安全动作调整',
  tdee_calculator: 'TDEE 计算',
  muscle_group_volume_calculator: '肌群容量计算',
  intelligent_weight_calculator: '智能重量计算',
  professional_program_designer: '专业方案设计',
  training_split_designer: '训练分化设计',
  periodized_program_designer: '周期化方案',
  movement_pattern_balancer: '动作模式平衡',
  nutrition_intake_analyzer: '营养摄入分析',
  meal_plan_designer: '饮食计划设计',
  exercise_nutrition_optimization: '运动营养优化',
  find_similar_training_cases: '相似案例查找',
  get_user_profile: '获取用户档案',
  record_training_feedback: '记录训练反馈',
}

const displayName = computed(() => {
  return TOOL_DISPLAY_NAMES[props.toolCall.toolName] || props.toolCall.toolName
})

// 状态图标
const statusIcon = computed(() => {
  switch (props.toolCall.status) {
    case 'success': return CheckCircle2
    case 'error': return XCircle
    case 'running': return Loader2
    case 'pending': return Loader2
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

// 耗时格式化
const duration = computed(() => {
  if (!props.toolCall.duration) return null
  return props.toolCall.duration < 1000
    ? `${props.toolCall.duration}ms`
    : `${(props.toolCall.duration / 1000).toFixed(1)}s`
})

// 摘要文本
const summaryText = computed(() => {
  if (props.toolCall.summary) return props.toolCall.summary
  if (props.toolCall.error) return props.toolCall.error
  if (props.toolCall.output) return props.toolCall.output.slice(0, 80)
  return null
})

// 展开时的详情内容
const detailContent = computed(() => {
  if (props.toolCall.error) return props.toolCall.error
  if (props.toolCall.output) return props.toolCall.output
  if (props.toolCall.result) {
    try {
      return JSON.stringify(props.toolCall.result, null, 2)
    } catch {
      return String(props.toolCall.result)
    }
  }
  return null
})
</script>

<template>
  <div class="rounded-lg border border-border/60 bg-muted/30 overflow-hidden transition-all">
    <!-- 折叠态：一行摘要 -->
    <button
      class="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
      @click="toggle"
    >
      <!-- 工具类型图标 -->
      <component :is="icon" class="h-3.5 w-3.5 shrink-0" :class="iconColor" />

      <!-- 工具名称 -->
      <span class="text-xs font-medium text-foreground truncate">{{ displayName }}</span>

      <!-- 摘要 -->
      <span v-if="summaryText && !expanded" class="text-xs text-muted-foreground truncate flex-1">
        · {{ summaryText }}
      </span>
      <span v-else class="flex-1" />

      <!-- 耗时 -->
      <span v-if="duration" class="text-[10px] text-muted-foreground shrink-0">{{ duration }}</span>

      <!-- 状态图标 -->
      <component :is="statusIcon" class="h-3.5 w-3.5 shrink-0" :class="statusColor" />

      <!-- 展开/折叠箭头 -->
      <component :is="expanded ? ChevronDown : ChevronRight" class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>

    <!-- 展开态：详情 -->
    <div v-if="expanded" class="border-t border-border/40 px-3 py-2 space-y-2">
      <!-- 输入参数 -->
      <div v-if="toolCall.input">
        <div class="text-[10px] font-medium text-muted-foreground mb-1">输入参数</div>
        <pre class="text-[11px] bg-muted/50 rounded p-2 overflow-x-auto max-h-32 text-foreground/80">{{ typeof toolCall.input === 'string' ? toolCall.input : JSON.stringify(toolCall.input, null, 2) }}</pre>
      </div>

      <!-- 结果/错误 -->
      <div v-if="detailContent">
        <div class="text-[10px] font-medium text-muted-foreground mb-1">
          {{ toolCall.status === 'error' ? '错误信息' : '执行结果' }}
        </div>
        <pre
          class="text-[11px] bg-muted/50 rounded p-2 overflow-x-auto max-h-48 text-foreground/80 whitespace-pre-wrap"
          :class="{ 'text-red-500': toolCall.status === 'error' }"
        >{{ detailContent }}</pre>
      </div>

      <!-- 确认信息 -->
      <div v-if="toolCall.confirmation" class="flex items-center gap-1.5 text-xs text-amber-600">
        <Shield class="h-3.5 w-3.5" />
        <span>需要确认: {{ toolCall.confirmation.reason }}</span>
      </div>
    </div>
  </div>
</template>
