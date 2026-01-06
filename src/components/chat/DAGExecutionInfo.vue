<script setup lang="ts">
/**
 * DAG执行信息展示组件
 * 显示AI回复使用的DAG模板和工具调用信息
 */
import { computed } from 'vue'
import { Badge } from '@/components/ui/badge'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, Wrench, Clock, Cpu } from 'lucide-vue-next'
import { DAG_TEMPLATES } from '@/config/dag-templates'

interface Props {
  templateId?: string
  toolsUsed?: string[]
  executionTime?: number
  modelUsed?: string
}

const props = defineProps<Props>()

// 获取模板信息
const template = computed(() => {
  if (!props.templateId) return null
  return DAG_TEMPLATES[props.templateId]
})

// 工具名称映射
const toolNameMap: Record<string, string> = {
  'get_user_profile': '获取用户档案',
  'intelligent_exercise_selector': '智能动作选择',
  'contraindications_checker': '禁忌症检查',
  'injury_risk_assessor': '损伤风险评估',
  'muscle_group_volume_calculator': '肌群训练量计算',
  'tdee_calculator': 'TDEE计算',
  'professional_program_designer': '专业训练计划设计',
  'exercise_alternative_finder': '动作替代查找',
  'movement_pattern_balancer': '动作模式平衡',
  'intelligent_weight_calculator': '智能负重计算',
  'safe_exercise_modifier': '安全动作修改',
  'nutrition_intake_analyzer': '营养摄入分析',
  'meal_plan_designer': '膳食计划设计',
  'exercise_nutrition_optimization': '运动营养优化',
  'record_training_feedback': '记录训练反馈',
  'postural_assessor': '体态评估',
  'periodized_program_designer': '周期化训练设计',
  'training_split_designer': '训练分化设计',
  'find_similar_training_cases': '查找相似案例'
}

// 获取工具显示名称
function getToolDisplayName(toolName: string): string {
  return toolNameMap[toolName] || toolName
}

// 格式化执行时间
const formattedTime = computed(() => {
  if (!props.executionTime) return null
  if (props.executionTime < 1000) {
    return `${props.executionTime}ms`
  }
  return `${(props.executionTime / 1000).toFixed(1)}s`
})
</script>

<template>
  <Collapsible v-if="template || (toolsUsed && toolsUsed.length > 0)" class="mt-2">
    <CollapsibleTrigger class="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
      <ChevronDown class="h-3 w-3" />
      <span>查看AI分析过程</span>
      <Badge v-if="template" variant="outline" class="text-xs py-0">
        {{ template.icon }} {{ template.name }}
      </Badge>
    </CollapsibleTrigger>
    
    <CollapsibleContent class="mt-2 p-3 bg-muted/50 rounded-lg space-y-2">
      <!-- 使用的模板 -->
      <div v-if="template" class="flex items-center gap-2">
        <span class="text-lg">{{ template.icon }}</span>
        <div>
          <p class="text-sm font-medium">{{ template.name }}</p>
          <p class="text-xs text-muted-foreground">{{ template.description }}</p>
        </div>
      </div>

      <!-- 调用的工具 -->
      <div v-if="toolsUsed && toolsUsed.length > 0" class="space-y-1">
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <Wrench class="h-3 w-3" />
          <span>调用了 {{ toolsUsed.length }} 个专业工具</span>
        </div>
        <div class="flex flex-wrap gap-1">
          <Badge 
            v-for="tool in toolsUsed" 
            :key="tool" 
            variant="secondary"
            class="text-xs"
          >
            {{ getToolDisplayName(tool) }}
          </Badge>
        </div>
      </div>

      <!-- 执行信息 -->
      <div class="flex items-center gap-4 text-xs text-muted-foreground">
        <div v-if="formattedTime" class="flex items-center gap-1">
          <Clock class="h-3 w-3" />
          <span>{{ formattedTime }}</span>
        </div>
        <div v-if="modelUsed" class="flex items-center gap-1">
          <Cpu class="h-3 w-3" />
          <span>{{ modelUsed }}</span>
        </div>
      </div>
    </CollapsibleContent>
  </Collapsible>
</template>
