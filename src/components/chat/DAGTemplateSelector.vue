<script setup lang="ts">
/**
 * DAG模板选择器组件
 * 显示可用的AI场景，支持快捷选择
 */
import { computed } from 'vue'
import { useMembershipStore } from '@/stores/membership'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock } from 'lucide-vue-next'
import { 
  DAG_TEMPLATES, 
  getAvailableTemplates, 
  isTemplateAvailable,
  getMembershipRequiredText,
  type DAGTemplate 
} from '@/config/dag-templates'

const emit = defineEmits<{
  (e: 'select-prompt', prompt: string): void
  (e: 'upgrade-required', template: DAGTemplate): void
}>()

const membershipStore = useMembershipStore()

// 获取用户会员等级
const membershipTier = computed((): 'free' | 'warmheart' | 'energy' => {
  // 从membership对象中获取slug
  const membership = membershipStore.membership
  if (!membership) return 'free'
  
  // 尝试多种方式获取slug
  const slug = membership.membership?.slug || 
               membership.membership?.tier ||
               (membership as any).slug ||
               (membership as any).tier
  
  if (slug === 'energy') return 'energy'
  if (slug === 'warmheart') return 'warmheart'
  
  // 检查是否是VIP（有效会员）
  if (membershipStore.isVip) {
    // 如果是VIP但没有明确的slug，默认为warmheart
    return 'warmheart'
  }
  
  return 'free'
})

// 所有模板列表
const allTemplates = computed(() => Object.values(DAG_TEMPLATES))

// 可用模板数量
const availableCount = computed(() => {
  return getAvailableTemplates(membershipTier.value).length
})

// 检查模板是否可用
function checkAvailable(template: DAGTemplate): boolean {
  return isTemplateAvailable(template.id, membershipTier.value)
}

// 处理模板点击
function handleTemplateClick(template: DAGTemplate) {
  if (checkAvailable(template)) {
    // 使用第一个快捷提示
    if (template.quickPrompts.length > 0) {
      emit('select-prompt', template.quickPrompts[0])
    }
  } else {
    emit('upgrade-required', template)
  }
}

// 复杂度星星
function getComplexityStars(complexity: number): string {
  return '⭐'.repeat(complexity)
}
</script>

<template>
  <div class="space-y-3">
    <!-- 标题和统计 -->
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-muted-foreground">AI场景</h3>
      <Badge variant="secondary" class="text-xs">
        {{ availableCount }}/13 可用
      </Badge>
    </div>

    <!-- 模板网格 -->
    <div class="grid grid-cols-4 gap-2">
      <Button
        v-for="template in allTemplates"
        :key="template.id"
        variant="outline"
        size="sm"
        :class="[
          'h-auto py-2 px-2 flex flex-col items-center gap-1 relative',
          !checkAvailable(template) && 'opacity-50'
        ]"
        :title="`${template.name}: ${template.description}${!checkAvailable(template) ? ' (需要' + getMembershipRequiredText(template.membershipRequired) + ')' : ''}`"
        @click="handleTemplateClick(template)"
      >
        <!-- 锁定图标 -->
        <Lock 
          v-if="!checkAvailable(template)" 
          class="absolute top-1 right-1 h-3 w-3 text-muted-foreground" 
        />
        
        <!-- 图标 -->
        <span class="text-lg">{{ template.icon }}</span>
        
        <!-- 名称 -->
        <span class="text-xs truncate w-full text-center">
          {{ template.name }}
        </span>
      </Button>
    </div>
  </div>
</template>
