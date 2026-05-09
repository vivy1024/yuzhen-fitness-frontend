<script setup lang="ts">
/**
 * ApprovalDialog - HITL 安全确认弹窗
 * 当 Agent 检测到高风险操作时弹出，让用户确认是否继续
 * 
 * @author 玉珍健身 v3.0
 */
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ShieldAlert } from 'lucide-vue-next'

interface Props {
  visible: boolean
  reason: string        // 风险原因
  skillName: string     // 被拦截的 Skill
  suggestion?: string   // 保守方案建议
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'approve'): void
  (e: 'deny'): void
  (e: 'update:visible', value: boolean): void
}>()

function handleApprove() {
  emit('approve')
  emit('update:visible', false)
}

function handleDeny() {
  emit('deny')
  emit('update:visible', false)
}
</script>

<template>
  <Dialog :open="visible" @update:open="emit('update:visible', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-amber-600">
          <ShieldAlert class="h-5 w-5" />
          ⚠️ 安全确认
        </DialogTitle>
        <DialogDescription>
          AI 检测到当前操作可能存在风险，请确认是否继续。
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 风险原因 -->
        <div class="flex gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle class="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <p class="text-sm font-medium text-amber-800 dark:text-amber-200">
              风险说明
            </p>
            <p class="text-sm text-amber-700 dark:text-amber-300">
              {{ reason }}
            </p>
          </div>
        </div>

        <!-- 被拦截的技能 -->
        <div class="text-sm text-muted-foreground">
          被拦截的操作：<span class="font-medium text-foreground">{{ skillName }}</span>
        </div>

        <!-- 保守方案建议 -->
        <div v-if="suggestion" class="p-3 bg-muted/50 rounded-lg">
          <p class="text-sm font-medium mb-1">💡 保守方案建议</p>
          <p class="text-sm text-muted-foreground">{{ suggestion }}</p>
        </div>
      </div>

      <DialogFooter class="flex gap-2 sm:gap-2">
        <Button
          variant="outline"
          @click="handleDeny"
        >
          使用保守方案
        </Button>
        <Button
          class="bg-amber-600 hover:bg-amber-700 text-white"
          @click="handleApprove"
        >
          我了解风险，继续执行
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
