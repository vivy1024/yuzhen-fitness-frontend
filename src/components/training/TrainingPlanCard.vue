<script setup lang="ts">
/**
 * 训练计划卡片组件 v2.0.0
 * 
 * 设计原则：
 * - 动作卡片可点击，跳转到动作详情页（节省LLM token）
 * - 只显示核心训练参数：组数、次数、休息时间、重量
 * - 显示个性化调整说明（personalized_notes）
 * - 详细信息通过详情页查看，不在卡片中显示
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, Download, Dumbbell, Clock, Calendar, Target, AlertTriangle, CheckCircle, ExternalLink, Info } from 'lucide-vue-next'
import { useToast } from '@/components/ui/toast'
import { ariaLabels } from '@/utils/accessibility'

// ============ 类型定义 ============

export interface TrainingPlan {
  program_overview?: {
    training_goal?: string
    training_split?: string
    training_days_per_week?: number
    difficulty_level?: string
    total_exercises?: number
    estimated_weekly_duration_minutes?: number
  }
  weekly_program?: {
    training_days?: TrainingDay[]
  }
  program_balance?: { balance_score?: number }
  safety_assessment?: {
    overall_risk_level?: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    safety_recommendations?: string[]
    personalized_notes?: string[]
  }
}

export interface TrainingDay {
  day_number: number
  day_name: string
  focus_muscle_groups: string[]
  exercises: TrainingDayExercise[]
  total_sets: number
  estimated_duration_minutes?: number
}

export interface TrainingDayExercise {
  exercise_id?: string | null
  name_zh: string
  sets: number
  reps_range: [number, number]
  rest_seconds: number
  weight?: string
}

// ============ Props & Emits ============

const props = withDefaults(defineProps<{ 
  plan: TrainingPlan
  showImportButton?: boolean 
}>(), { 
  showImportButton: true 
})

const emit = defineEmits<{ 
  import: [plan: TrainingPlan] 
}>()

// ============ 状态 ============

const router = useRouter()
const { toast } = useToast()
const expandedDays = ref<number[]>([1])
const isImporting = ref(false)

// ============ 计算属性 ============

const planTitle = computed(() => {
  const split = props.plan.program_overview?.training_split || '训练计划'
  const map: Record<string, string> = { 
    full_body: '全身训练', 
    upper_lower: '上下肢分化', 
    push_pull_legs: '推拉腿分化', 
    bro_split: '部位分化' 
  }
  return `AI定制${map[split] || split}`
})

const planDescription = computed(() => 
  `目标: ${props.plan.program_overview?.training_goal || '综合健身'}`
)

const difficultyLabel = computed(() => 
  ({ beginner: '初级', intermediate: '中级', advanced: '高级' }[props.plan.program_overview?.difficulty_level || 'intermediate'] || '中级')
)

const difficultyColor = computed(() => 
  ({ beginner: 'bg-green-500', intermediate: 'bg-yellow-500', advanced: 'bg-red-500' }[props.plan.program_overview?.difficulty_level || 'intermediate'] || 'bg-yellow-500')
)

const trainingDaysPerWeek = computed(() => props.plan.program_overview?.training_days_per_week || 3)
const totalExercises = computed(() => props.plan.program_overview?.total_exercises || 0)
const estimatedDuration = computed(() => props.plan.program_overview?.estimated_weekly_duration_minutes || 0)
const trainingDays = computed(() => props.plan.weekly_program?.training_days || [])
const balanceScore = computed(() => props.plan.program_balance?.balance_score || 80)
const riskLevel = computed(() => props.plan.safety_assessment?.overall_risk_level || 'LOW')

const riskLabel = computed(() => 
  ({ LOW: '低风险', MODERATE: '中等风险', HIGH: '高风险', CRITICAL: '严重风险' }[riskLevel.value] || '低风险')
)

const riskColor = computed(() => 
  ({ LOW: 'bg-green-500', MODERATE: 'bg-yellow-500', HIGH: 'bg-orange-500', CRITICAL: 'bg-red-500' }[riskLevel.value] || 'bg-green-500')
)

const safetyRecommendations = computed(() => props.plan.safety_assessment?.safety_recommendations || [])
const personalizedNotes = computed(() => props.plan.safety_assessment?.personalized_notes || [])

// ============ 方法 ============

function formatRepsRange(range: [number, number]): string {
  if (!range || range.length !== 2) return '8-12'
  return range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`
}

async function handleImport() {
  isImporting.value = true
  try {
    emit('import', props.plan)
    toast({ title: '导入成功', description: '训练计划已添加到您的计划列表' })
  } catch {
    toast({ title: '导入失败', description: '请稍后重试', variant: 'destructive' })
  } finally {
    isImporting.value = false
  }
}

function toggleDay(dayNumber: number) {
  const index = expandedDays.value.indexOf(dayNumber)
  if (index === -1) {
    expandedDays.value.push(dayNumber)
  } else {
    expandedDays.value.splice(index, 1)
  }
}

function isDayExpanded(dayNumber: number): boolean {
  return expandedDays.value.includes(dayNumber)
}

function viewExerciseDetail(exercise: TrainingDayExercise) {
  if (exercise.exercise_id) {
    router.push(`/exercise/${exercise.exercise_id}`)
  } else {
    router.push({ path: '/exercise', query: { search: exercise.name_zh } })
  }
}
</script>

<template>
  <Card class="w-full">
    <!-- 卡片头部 -->
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <CardTitle class="flex items-center gap-2 text-base">
            <Dumbbell class="h-4 w-4 text-primary" />
            {{ planTitle }}
            <Badge variant="outline" class="text-xs">智能生成</Badge>
          </CardTitle>
          <CardDescription class="mt-1 text-sm">{{ planDescription }}</CardDescription>
        </div>
        <Badge :class="difficultyColor" class="text-white text-xs">{{ difficultyLabel }}</Badge>
      </div>
    </CardHeader>

    <CardContent class="space-y-3 pt-0">
      <!-- 计划概览 -->
      <div class="grid grid-cols-4 gap-2 text-center">
        <div class="flex flex-col items-center">
          <Calendar class="h-4 w-4 text-muted-foreground mb-1" />
          <span class="text-xs text-muted-foreground">频率</span>
          <span class="text-sm font-semibold">{{ trainingDaysPerWeek }}天/周</span>
        </div>
        <div class="flex flex-col items-center">
          <Target class="h-4 w-4 text-muted-foreground mb-1" />
          <span class="text-xs text-muted-foreground">动作</span>
          <span class="text-sm font-semibold">{{ totalExercises }}个</span>
        </div>
        <div class="flex flex-col items-center">
          <Clock class="h-4 w-4 text-muted-foreground mb-1" />
          <span class="text-xs text-muted-foreground">时长</span>
          <span class="text-sm font-semibold">{{ estimatedDuration }}分</span>
        </div>
        <div class="flex flex-col items-center">
          <CheckCircle class="h-4 w-4 text-muted-foreground mb-1" />
          <span class="text-xs text-muted-foreground">平衡</span>
          <span class="text-sm font-semibold">{{ balanceScore }}分</span>
        </div>
      </div>

      <!-- 个性化调整说明 -->
      <div v-if="personalizedNotes.length > 0" class="space-y-1.5 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2.5">
        <div class="flex items-center gap-1.5">
          <Info class="h-3.5 w-3.5 text-blue-500" />
          <span class="text-xs font-medium text-blue-700 dark:text-blue-300">个性化调整</span>
        </div>
        <ul class="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
          <li v-for="(note, idx) in personalizedNotes.slice(0, 3)" :key="idx" class="flex items-start gap-1.5">
            <span>•</span><span>{{ note }}</span>
          </li>
        </ul>
      </div>

      <!-- 训练日列表 -->
      <div v-if="trainingDays.length > 0" class="space-y-2">
        <div v-for="day in trainingDays" :key="day.day_number" class="rounded-lg border">
          <!-- 训练日标题 -->
          <button
            class="w-full flex items-center justify-between p-2.5 text-left hover:bg-muted/50 transition-colors"
            :aria-expanded="isDayExpanded(day.day_number)"
            :aria-label="`${day.day_name}，目标肌群：${day.focus_muscle_groups.join('、')}，共${day.total_sets}组`"
            @click="toggleDay(day.day_number)"
          >
            <div class="flex items-center gap-2">
              <Badge variant="outline" class="text-xs">{{ day.day_name }}</Badge>
              <span class="text-xs text-muted-foreground">{{ day.focus_muscle_groups.join(' · ') }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Badge variant="secondary" class="text-xs">{{ day.total_sets }}组</Badge>
              <ChevronDown
                :class="['h-4 w-4 transition-transform', isDayExpanded(day.day_number) && 'rotate-180']"
                aria-hidden="true"
              />
            </div>
          </button>

          <!-- 动作列表 - 可点击跳转详情页 -->
          <div v-if="isDayExpanded(day.day_number)" class="border-t divide-y" role="list">
            <button
              v-for="(ex, idx) in day.exercises"
              :key="idx"
              class="w-full flex items-center justify-between p-2.5 text-left hover:bg-muted/30 transition-colors"
              role="listitem"
              :aria-label="ariaLabels.training.exercise(ex.name_zh, ex.sets, formatRepsRange(ex.reps_range))"
              @click="viewExerciseDetail(ex)"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <Badge variant="outline" class="h-5 w-5 p-0 justify-center text-xs shrink-0" aria-hidden="true">{{ idx + 1 }}</Badge>
                <span class="font-medium text-sm truncate">{{ ex.name_zh }}</span>
                <ExternalLink class="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
              </div>
              <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <span class="text-primary font-medium">{{ ex.sets }}组</span>
                <span>x</span>
                <span class="text-primary font-medium">{{ formatRepsRange(ex.reps_range) }}次</span>
                <span class="text-muted-foreground/60">|</span>
                <span>{{ ex.rest_seconds }}s</span>
                <template v-if="ex.weight">
                  <span class="text-muted-foreground/60">|</span>
                  <span class="text-orange-500">{{ ex.weight }}</span>
                </template>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- 平衡性分析 -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between text-xs">
          <span class="text-muted-foreground">计划平衡性</span>
          <span class="font-medium">{{ balanceScore }}/100</span>
        </div>
        <Progress :model-value="balanceScore" class="h-1.5" />
      </div>

      <!-- 安全提示 -->
      <div v-if="safetyRecommendations.length > 0" class="space-y-1.5">
        <div class="flex items-center gap-1.5">
          <AlertTriangle class="h-3.5 w-3.5 text-amber-500" />
          <span class="text-xs font-medium">安全提示</span>
          <Badge :class="riskColor" class="text-white text-xs">{{ riskLabel }}</Badge>
        </div>
        <ul class="text-xs text-muted-foreground space-y-0.5">
          <li v-for="(note, idx) in safetyRecommendations.slice(0, 3)" :key="idx" class="flex items-start gap-1.5">
            <span class="text-amber-500">•</span>
            <span>{{ note }}</span>
          </li>
        </ul>
      </div>

      <!-- 数据来源 -->
      <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle class="h-3 w-3 text-blue-500" />
        <span>基于1790个专业动作数据库 · 点击动作查看详情</span>
      </div>
    </CardContent>

    <!-- 导入按钮 -->
    <CardFooter v-if="showImportButton" class="pt-0">
      <Button 
        class="w-full" 
        size="sm" 
        :disabled="isImporting"
        :aria-label="ariaLabels.training.import(planTitle)"
        @click="handleImport"
      >
        <Download class="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        {{ isImporting ? '导入中...' : '导入到我的计划' }}
      </Button>
    </CardFooter>
  </Card>
</template>
