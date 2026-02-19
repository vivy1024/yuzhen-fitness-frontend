<script setup lang="ts">
/**
 * AI策略切换组件
 * 所有用户均可在DAG和Agent模式之间切换
 * Agent模式积分消耗更高（1.5x），但功能更灵活
 *
 * @author 薛小川
 * @created 2026-01-11
 * @updated 2026-02-19 去除等级锁，所有用户可用
 */
import { ref, computed, watch } from 'vue'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Cpu, Sparkles } from 'lucide-vue-next'

// Props
interface Props {
  modelValue?: 'dag' | 'agent'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 'dag',
  disabled: false
})

// Emits
const emit = defineEmits<{
  (e: 'update:modelValue', value: 'dag' | 'agent'): void
  (e: 'change', value: 'dag' | 'agent'): void
}>()

// 当前策略
const currentStrategy = ref<'dag' | 'agent'>(props.modelValue)

// 是否可以切换（仅受 disabled prop 控制，不再受会员等级限制）
const canSwitch = computed(() => {
  return !props.disabled
})

// Agent模式是否启用
const isAgentMode = computed({
  get: () => currentStrategy.value === 'agent',
  set: (value: boolean) => {
    if (!canSwitch.value) return
    currentStrategy.value = value ? 'agent' : 'dag'
    emit('update:modelValue', currentStrategy.value)
    emit('change', currentStrategy.value)
  }
})

// 策略描述
const strategyInfo = computed(() => {
  if (currentStrategy.value === 'agent') {
    return {
      name: 'Agent模式',
      description: '智能代理动态编排，更灵活但积分消耗更高（1.5x）',
      icon: Sparkles,
      color: 'text-purple-500'
    }
  }
  return {
    name: 'DAG模式',
    description: '预定义工作流，快速稳定，积分消耗低',
    icon: Cpu,
    color: 'text-blue-500'
  }
})

// 监听props变化
watch(() => props.modelValue, (newVal) => {
  currentStrategy.value = newVal
})
</script>

<template>
  <div class="flex items-center gap-3">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div class="flex items-center gap-2">
            <!-- 策略图标 -->
            <component
              :is="strategyInfo.icon"
              class="h-4 w-4"
              :class="strategyInfo.color"
            />

            <!-- 策略名称 -->
            <Label
              class="text-xs cursor-pointer select-none"
              :class="canSwitch ? '' : 'text-muted-foreground'"
            >
              {{ strategyInfo.name }}
            </Label>

            <!-- 切换开关 -->
            <Switch
              v-model:checked="isAgentMode"
              :disabled="!canSwitch"
              class="scale-75"
            />

            <!-- Agent模式激活标识 -->
            <Badge
              v-if="isAgentMode"
              variant="secondary"
              class="text-[10px] px-1 py-0 h-4"
            >
              <Sparkles class="h-2.5 w-2.5 mr-0.5" />
              1.5x
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" class="max-w-[200px]">
          <p class="text-xs">{{ strategyInfo.description }}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
