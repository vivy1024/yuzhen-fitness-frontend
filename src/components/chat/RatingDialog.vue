<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Star, Sparkles } from 'lucide-vue-next'

/**
 * 评分数据接口
 */
export interface Rating {
  messageId: string
  
  // 用户体验评分 (1-5)
  userExperience: {
    clarity: number // 易懂性
    usefulness: number // 实用性
    detail: number // 详细程度
    friendliness: number // 友好度
    overall: number // 整体满意度
  }
  
  // 个性化感知评分 (自动计算, 0-100%)
  personalization?: {
    profileUtilization: number // 档案利用率
    goalAlignment: number // 目标对齐度
    uniqueness: number // 独特性
    dynamicAdjustment: number // 动态调整
  }
  
  // 文本反馈
  feedback?: string
  
  timestamp: number
}

interface Props {
  open: boolean
  messageId: string
  personalizationScore?: number // 从消息中传入的个性化分数
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submit': [rating: Rating]
}>()

// 评分模式: 'quick' 快速评分, 'detailed' 详细评分
const mode = ref<'quick' | 'detailed'>('quick')

// 用户体验评分
const clarity = ref(5)
const usefulness = ref(5)
const detail = ref(5)
const friendliness = ref(5)
const overall = ref(5)

// 文本反馈
const feedback = ref('')

/**
 * 个性化感知评分（自动计算，只读）
 */
const personalizationData = computed(() => {
  if (!props.personalizationScore) return null
  
  // 将0-1的分数转换为百分比
  const score = Math.round(props.personalizationScore * 100)
  
  // 模拟各维度分数（实际应该从后端获取）
  return {
    profileUtilization: score,
    goalAlignment: Math.min(100, score + 5),
    uniqueness: Math.max(0, score - 5),
    dynamicAdjustment: score
  }
})

/**
 * 平均用户体验评分
 */
const averageUserExperience = computed(() => {
  return Math.round(
    (clarity.value + usefulness.value + detail.value + friendliness.value + overall.value) / 5
  )
})

/**
 * 切换评分模式
 */
const toggleMode = () => {
  mode.value = mode.value === 'quick' ? 'detailed' : 'quick'
}

/**
 * 提交评分
 */
const submitRating = () => {
  const rating: Rating = {
    messageId: props.messageId,
    userExperience: {
      clarity: clarity.value,
      usefulness: usefulness.value,
      detail: detail.value,
      friendliness: friendliness.value,
      overall: overall.value
    },
    personalization: personalizationData.value || undefined,
    feedback: feedback.value || undefined,
    timestamp: Date.now()
  }
  
  emit('submit', rating)
  emit('update:open', false)
  
  // 重置表单
  resetForm()
}

/**
 * 取消评分
 */
const cancel = () => {
  emit('update:open', false)
  resetForm()
}

/**
 * 重置表单
 */
const resetForm = () => {
  mode.value = 'quick'
  clarity.value = 5
  usefulness.value = 5
  detail.value = 5
  friendliness.value = 5
  overall.value = 5
  feedback.value = ''
}

/**
 * 渲染星星评分
 */
const renderStars = (rating: number, onChange: (value: number) => void) => {
  return Array.from({ length: 5 }, (_, i) => i + 1)
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>评价AI回复</DialogTitle>
        <DialogDescription>
          您的反馈将帮助我们提升服务质量
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 模式切换 -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">
            {{ mode === 'quick' ? '快速评分' : '详细评分' }}
          </span>
          <Button
            variant="ghost"
            size="sm"
            @click="toggleMode"
          >
            切换到{{ mode === 'quick' ? '详细' : '快速' }}模式
          </Button>
        </div>

        <!-- 快速评分模式 -->
        <div v-if="mode === 'quick'" class="space-y-4">
          <!-- 整体满意度 -->
          <div class="space-y-2">
            <Label>整体满意度</Label>
            <div class="flex items-center gap-2">
              <button
                v-for="star in renderStars(overall, (v) => overall = v)"
                :key="star"
                type="button"
                class="transition-colors hover:scale-110"
                @click="overall = star"
              >
                <Star
                  :class="[
                    'h-8 w-8',
                    star <= overall
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  ]"
                />
              </button>
              <span class="ml-2 text-sm text-muted-foreground">
                {{ overall }} / 5
              </span>
            </div>
          </div>
        </div>

        <!-- 详细评分模式 -->
        <div v-else class="space-y-4">
          <!-- 易懂性 -->
          <div class="space-y-2">
            <Label>易懂性</Label>
            <div class="flex items-center gap-2">
              <button
                v-for="star in renderStars(clarity, (v) => clarity = v)"
                :key="star"
                type="button"
                class="transition-colors hover:scale-110"
                @click="clarity = star"
              >
                <Star
                  :class="[
                    'h-6 w-6',
                    star <= clarity
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  ]"
                />
              </button>
              <span class="ml-2 text-sm text-muted-foreground">
                {{ clarity }} / 5
              </span>
            </div>
          </div>

          <!-- 实用性 -->
          <div class="space-y-2">
            <Label>实用性</Label>
            <div class="flex items-center gap-2">
              <button
                v-for="star in renderStars(usefulness, (v) => usefulness = v)"
                :key="star"
                type="button"
                class="transition-colors hover:scale-110"
                @click="usefulness = star"
              >
                <Star
                  :class="[
                    'h-6 w-6',
                    star <= usefulness
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  ]"
                />
              </button>
              <span class="ml-2 text-sm text-muted-foreground">
                {{ usefulness }} / 5
              </span>
            </div>
          </div>

          <!-- 详细程度 -->
          <div class="space-y-2">
            <Label>详细程度</Label>
            <div class="flex items-center gap-2">
              <button
                v-for="star in renderStars(detail, (v) => detail = v)"
                :key="star"
                type="button"
                class="transition-colors hover:scale-110"
                @click="detail = star"
              >
                <Star
                  :class="[
                    'h-6 w-6',
                    star <= detail
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  ]"
                />
              </button>
              <span class="ml-2 text-sm text-muted-foreground">
                {{ detail }} / 5
              </span>
            </div>
          </div>

          <!-- 友好度 -->
          <div class="space-y-2">
            <Label>友好度</Label>
            <div class="flex items-center gap-2">
              <button
                v-for="star in renderStars(friendliness, (v) => friendliness = v)"
                :key="star"
                type="button"
                class="transition-colors hover:scale-110"
                @click="friendliness = star"
              >
                <Star
                  :class="[
                    'h-6 w-6',
                    star <= friendliness
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  ]"
                />
              </button>
              <span class="ml-2 text-sm text-muted-foreground">
                {{ friendliness }} / 5
              </span>
            </div>
          </div>

          <!-- 整体满意度 -->
          <div class="space-y-2">
            <Label>整体满意度</Label>
            <div class="flex items-center gap-2">
              <button
                v-for="star in renderStars(overall, (v) => overall = v)"
                :key="star"
                type="button"
                class="transition-colors hover:scale-110"
                @click="overall = star"
              >
                <Star
                  :class="[
                    'h-6 w-6',
                    star <= overall
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  ]"
                />
              </button>
              <span class="ml-2 text-sm text-muted-foreground">
                {{ overall }} / 5
              </span>
            </div>
          </div>

          <!-- 平均分 -->
          <div class="rounded-lg bg-muted p-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">平均评分</span>
              <span class="text-lg font-bold">{{ averageUserExperience }} / 5</span>
            </div>
          </div>
        </div>

        <!-- 个性化感知评分（只读） -->
        <div v-if="personalizationData" class="space-y-2">
          <div class="flex items-center gap-2">
            <Sparkles class="h-4 w-4 text-blue-600" />
            <Label>个性化程度（自动评估）</Label>
          </div>
          <div class="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span>档案利用率</span>
              <span class="font-medium">{{ personalizationData.profileUtilization }}%</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>目标对齐度</span>
              <span class="font-medium">{{ personalizationData.goalAlignment }}%</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>独特性</span>
              <span class="font-medium">{{ personalizationData.uniqueness }}%</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span>动态调整</span>
              <span class="font-medium">{{ personalizationData.dynamicAdjustment }}%</span>
            </div>
          </div>
        </div>

        <!-- 文本反馈 -->
        <div class="space-y-2">
          <Label for="feedback">补充说明（可选）</Label>
          <Textarea
            id="feedback"
            v-model="feedback"
            placeholder="请分享您的具体想法和建议..."
            class="min-h-[80px]"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="cancel">
          取消
        </Button>
        <Button @click="submitRating">
          提交评分
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
