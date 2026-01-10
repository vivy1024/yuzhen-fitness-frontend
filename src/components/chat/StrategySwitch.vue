<script setup lang="ts">
/**
 * AI策略切换组件
 * 允许能量会员在DAG和Agent模式之间切换
 * 
 * @author 薛小川
 * @created 2026-01-11
 */
import { ref, computed, watch } from 'vue'
import { useMembershipStore } from '@/stores/membership'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Zap, Cpu, Sparkles, Lock } from 'lucide-vue-next'

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

const membershipStore = useMembershipStore()

// 当前策略
const currentStrategy = ref<'dag' | 'agent'>(props.modelValue)

// 是否是能量会员（可以使用Agent模式）
// 开发测试阶段：会员系统禁用时，所有用户都可以使用Agent模式
const isEnergyMember = computed(() => {
  const membership = membershipStore.membership
  
  // 开发测试阶段：如果会员系统禁用（system_enabled=false），所有用户都视为能量会员
  if (membership?.system_enabled === false) {
    return true
  }
  
  if (!membership) return false
  // 检查会员类型是否为energy
  return membership.membership?.slug === 'energy' || 
         membership.membership_type === 'energy'
})

// 是否显示切换开关（仅能量会员可见）
const showSwitch = computed(() => {
  // 开发测试阶段：所有用户都可以看到（但非能量会员显示锁定状态）
  return true
})

// 是否可以切换
const canSwitch = computed(() => {
  return isEnergyMember.value && !props.disabled
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
      description: '智能代理自主决策，更灵活但消耗更多Token',
      icon: Sparkles,
      color: 'text-purple-500'
    }
  }
  return {
    name: 'DAG模式',
    description: '预定义工作流，快速稳定，Token消耗低',
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
  <div v-if="showSwitch" class="flex items-center gap-3">
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
            
            <!-- 锁定图标（非能量会员） -->
            <Lock 
              v-if="!isEnergyMember" 
              class="h-3 w-3 text-muted-foreground"
            />
            
            <!-- 能量会员标识 -->
            <Badge 
              v-if="isEnergyMember && isAgentMode" 
              variant="secondary"
              class="text-[10px] px-1 py-0 h-4"
            >
              <Zap class="h-2.5 w-2.5 mr-0.5" />
              能量
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" class="max-w-[200px]">
          <p class="text-xs">{{ strategyInfo.description }}</p>
          <p v-if="!isEnergyMember" class="text-xs text-amber-500 mt-1">
            升级能量会员解锁Agent模式
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
</template>
