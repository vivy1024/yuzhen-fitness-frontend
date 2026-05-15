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
import ToolResultRenderer from './tool-renderers/ToolResultRenderer.vue'

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

// 从 MCP 工具名中提取实际工具名
function extractToolName(fullName: string): string {
  if (fullName.startsWith('mcp__')) {
    const lastSep = fullName.lastIndexOf('__')
    if (lastSep > 4) return fullName.slice(lastSep + 2)
  }
  return fullName
}

const actualToolName = computed(() => extractToolName(props.toolCall.toolName))

// 工具分类图标映射
const TOOL_ICONS: Record<string, typeof Search> = {
  // 搜索类
  search_exercises: Search,
  find_alternatives: Search,
  search_knowledge: Search,
  search_foods: Search,
  get_exercise_detail: Search,
  get_muscle_exercise_map: Search,
  intelligent_exercise_selector: Search,
  exercise_alternative_finder: Search,
  find_similar_training_cases: Search,
  // 安全类
  check_exercise_safety: Shield,
  get_contraindications: Shield,
  get_rehabilitation_protocol: Shield,
  contraindications_checker: Shield,
  injury_risk_assessor: Shield,
  safe_exercise_modifier: Shield,
  // 计算类
  calculate_tdee: Calculator,
  calculate_training_volume: Calculator,
  calculate_1rm: Calculator,
  assess_strength_level: Calculator,
  calculate_progressive_overload: Calculator,
  tdee_calculator: Calculator,
  muscle_group_volume_calculator: Calculator,
  intelligent_weight_calculator: Calculator,
  // 训练类
  design_training_split: Dumbbell,
  generate_training_cycle: Dumbbell,
  analyze_training_balance: Dumbbell,
  get_posture_corrections: Dumbbell,
  professional_program_designer: Dumbbell,
  training_split_designer: Dumbbell,
  // 用户数据类
  get_user_profile: FileText,
  get_training_history: FileText,
  get_progress_data: FileText,
  save_training_plan: FileText,
}

const TOOL_ICON_COLORS: Record<string, string> = {
  Search: 'text-blue-500',
  Shield: 'text-amber-500',
  Calculator: 'text-purple-500',
  Dumbbell: 'text-green-500',
  FileText: 'text-gray-500',
}

const icon = computed(() => {
  return TOOL_ICONS[actualToolName.value] || FileText
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
  search_exercises: '搜索动作',
  get_exercise_detail: '动作详情',
  find_alternatives: '替代动作',
  search_knowledge: '知识检索',
  search_foods: '食物搜索',
  get_food_detail: '食物详情',
  get_muscle_exercise_map: '肌群动作映射',
  get_strength_standards: '力量标准',
  check_exercise_safety: '安全检查',
  get_contraindications: '禁忌症查询',
  get_posture_corrections: '体态矫正',
  get_rehabilitation_protocol: '康复方案',
  calculate_tdee: 'TDEE 计算',
  calculate_training_volume: '训练容量',
  calculate_1rm: '1RM 估算',
  assess_strength_level: '力量评估',
  design_training_split: '训练分化设计',
  generate_training_cycle: '训练周期生成',
  analyze_training_balance: '训练平衡分析',
  calculate_progressive_overload: '渐进超负荷',
  get_user_profile: '用户档案',
  get_training_history: '训练记录',
  get_progress_data: '进度数据',
  save_training_plan: '保存计划',
  // 旧工具名兼容
  intelligent_exercise_selector: '智能动作选择',
  exercise_alternative_finder: '替代动作查找',
  contraindications_checker: '禁忌症检查',
  tdee_calculator: 'TDEE 计算',
  muscle_group_volume_calculator: '肌群容量计算',
  professional_program_designer: '专业方案设计',
}

const displayName = computed(() => {
  return TOOL_DISPLAY_NAMES[actualToolName.value] || actualToolName.value
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
      <!-- 结构化结果渲染（动作卡片/TDEE/容量等） -->
      <ToolResultRenderer
        v-if="toolCall.result"
        :tool-name="toolCall.toolName"
        :result="typeof toolCall.result === 'string' ? JSON.parse(toolCall.result) : toolCall.result"
      />

      <!-- 输入参数 -->
      <div v-if="toolCall.input">
        <div class="text-[10px] font-medium text-muted-foreground mb-1">输入参数</div>
        <pre class="text-[11px] bg-muted/50 rounded p-2 overflow-x-auto max-h-32 text-foreground/80">{{ typeof toolCall.input === 'string' ? toolCall.input : JSON.stringify(toolCall.input, null, 2) }}</pre>
      </div>

      <!-- 结果/错误（fallback 到 JSON） -->
      <div v-if="detailContent && !toolCall.result">
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
