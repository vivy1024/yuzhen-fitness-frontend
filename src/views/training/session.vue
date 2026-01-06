<template>
  <div class="min-h-screen bg-background p-4 pb-20">
    <!-- 头部 -->
    <div class="mb-6">
      <div class="flex items-center justify-between mb-2">
        <button
          @click="router.back()"
          class="flex items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft class="w-5 h-5 mr-1" />
          返回
        </button>
        <div class="text-sm text-muted-foreground">
          {{ formatDate(session.date) }}
        </div>
      </div>
      <h1 class="text-2xl font-bold">训练记录</h1>
      <p v-if="session.planId" class="text-sm text-muted-foreground mt-1">
        来自训练计划
      </p>
    </div>

    <!-- 训练动作列表 -->
    <div class="space-y-4 mb-6">
      <div
        v-for="(exercise, exerciseIndex) in session.exercises"
        :key="exerciseIndex"
        class="bg-card rounded-lg border p-4"
      >
        <!-- 动作名称 -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">{{ exercise.name }}</h3>
          <Button
            variant="ghost"
            size="sm"
            @click="addSet(exerciseIndex)"
          >
            <Plus class="w-4 h-4 mr-1" />
            添加组
          </Button>
        </div>

        <!-- 组记录表格 -->
        <div class="space-y-2">
          <div class="grid grid-cols-6 gap-2 text-xs text-muted-foreground font-medium">
            <div>组数</div>
            <div>重量(kg)</div>
            <div>次数</div>
            <div>RPE</div>
            <div>休息(s)</div>
            <div>完成</div>
          </div>

          <div
            v-for="(set, setIndex) in exercise.sets"
            :key="setIndex"
            class="grid grid-cols-6 gap-2 items-center"
          >
            <!-- 组数 -->
            <div class="text-sm font-medium">{{ set.setNumber }}</div>

            <!-- 重量 -->
            <Input
              v-model.number="set.weight"
              type="number"
              step="0.5"
              min="0"
              class="h-9"
              :disabled="set.completed"
            />

            <!-- 次数 -->
            <Input
              v-model.number="set.reps"
              type="number"
              min="1"
              class="h-9"
              :disabled="set.completed"
            />

            <!-- RPE -->
            <Input
              v-model.number="set.rpe"
              type="number"
              min="1"
              max="10"
              class="h-9"
              :disabled="set.completed"
            />

            <!-- 休息时间 -->
            <Input
              v-model.number="set.rest"
              type="number"
              min="0"
              step="10"
              class="h-9"
              :disabled="set.completed"
            />

            <!-- 完成状态 -->
            <div class="flex items-center justify-center">
              <Checkbox
                :checked="set.completed"
                @update:checked="(checked) => toggleSetComplete(exerciseIndex, setIndex, checked)"
              />
            </div>
          </div>
        </div>

        <!-- 动作备注 -->
        <div class="mt-3">
          <Textarea
            v-model="exercise.notes"
            placeholder="动作备注（可选）"
            class="min-h-[60px]"
          />
        </div>
      </div>
    </div>

    <!-- 训练总结 -->
    <Card class="mb-6">
      <CardHeader>
        <CardTitle>训练总结</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <div class="text-sm text-muted-foreground">总训练量</div>
            <div class="text-2xl font-bold">{{ totalVolume.toFixed(1) }}</div>
            <div class="text-xs text-muted-foreground">kg</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">总组数</div>
            <div class="text-2xl font-bold">{{ totalSets }}</div>
            <div class="text-xs text-muted-foreground">组</div>
          </div>
          <div>
            <div class="text-sm text-muted-foreground">平均RPE</div>
            <div class="text-2xl font-bold">{{ averageRPE.toFixed(1) }}</div>
            <div class="text-xs text-muted-foreground">/10</div>
          </div>
        </div>

        <!-- 训练感受 -->
        <div>
          <Label class="mb-2 block">训练感受</Label>
          <div class="grid grid-cols-4 gap-2">
            <Button
              v-for="feeling in feelings"
              :key="feeling.value"
              :variant="session.feeling === feeling.value ? 'default' : 'outline'"
              size="sm"
              @click="session.feeling = feeling.value"
            >
              {{ feeling.label }}
            </Button>
          </div>
        </div>

        <!-- 整体备注 -->
        <div>
          <Label class="mb-2 block">整体备注</Label>
          <Textarea
            v-model="session.notes"
            placeholder="记录今天的训练感受、状态等（可选）"
            class="min-h-[80px]"
          />
        </div>
      </CardContent>
    </Card>

    <!-- 底部操作栏 -->
    <div class="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
      <div class="flex gap-3 max-w-2xl mx-auto">
        <Button
          variant="outline"
          class="flex-1"
          @click="saveDraft"
          :disabled="saving"
        >
          保存草稿
        </Button>
        <Button
          class="flex-1"
          @click="completeSession"
          :disabled="saving || !canComplete"
        >
          <Check class="w-4 h-4 mr-1" />
          完成训练
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Plus, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  createTrainingSession,
  updateTrainingSession,
  completeTrainingSession,
  createSessionFromPlan,
  type ExerciseRecord,
  type SetRecord,
} from '@/api/training-session'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()

// ============ 状态 ============

const session = ref({
  id: null as number | null,
  planId: null as number | null,
  date: new Date().toISOString().split('T')[0],
  startTime: new Date().toISOString(),
  exercises: [] as ExerciseRecord[],
  feeling: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
  notes: '',
  status: 'in_progress' as 'in_progress' | 'completed',
})

const saving = ref(false)

const feelings = [
  { value: 'excellent', label: '😄 很好' },
  { value: 'good', label: '🙂 良好' },
  { value: 'fair', label: '😐 一般' },
  { value: 'poor', label: '😞 较差' },
]

// ============ 计算属性 ============

/** 总训练量 */
const totalVolume = computed(() => {
  return session.value.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((sum, set) => {
      return sum + (set.completed ? set.weight * set.reps : 0)
    }, 0)
  }, 0)
})

/** 总组数 */
const totalSets = computed(() => {
  return session.value.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(set => set.completed).length
  }, 0)
})

/** 平均RPE */
const averageRPE = computed(() => {
  const completedSets = session.value.exercises.flatMap(exercise =>
    exercise.sets.filter(set => set.completed)
  )
  if (completedSets.length === 0) return 0
  const totalRPE = completedSets.reduce((sum, set) => sum + set.rpe, 0)
  return totalRPE / completedSets.length
})

/** 是否可以完成训练 */
const canComplete = computed(() => {
  return session.value.exercises.some(exercise =>
    exercise.sets.some(set => set.completed)
  )
})

// ============ 方法 ============

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return '今天'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }
}

/** 添加组 */
function addSet(exerciseIndex: number): void {
  const exercise = session.value.exercises[exerciseIndex]
  const lastSet = exercise.sets[exercise.sets.length - 1]

  exercise.sets.push({
    setNumber: exercise.sets.length + 1,
    weight: lastSet?.weight || 0,
    reps: lastSet?.reps || 10,
    rpe: lastSet?.rpe || 7,
    rest: lastSet?.rest || 90,
    completed: false,
  })
}

/** 切换组完成状态 */
function toggleSetComplete(
  exerciseIndex: number,
  setIndex: number,
  checked: boolean
): void {
  session.value.exercises[exerciseIndex].sets[setIndex].completed = checked
}

/** 保存草稿 */
async function saveDraft(): Promise<void> {
  saving.value = true

  try {
    const data = {
      plan_id: session.value.planId || undefined,
      date: session.value.date,
      start_time: session.value.startTime,
      exercises: session.value.exercises.map(ex => ({
        exercise_id: ex.exerciseId,
        name: ex.name,
        sets: ex.sets,
        notes: ex.notes,
      })),
      feeling: session.value.feeling,
      notes: session.value.notes,
      status: 'in_progress' as const,
    }

    if (session.value.id) {
      // 更新现有会话
      await updateTrainingSession(session.value.id, data)
      toast({
        title: '保存成功',
        description: '训练记录已保存为草稿',
      })
    } else {
      // 创建新会话
      const response = await createTrainingSession(data)
      if (response.code === 200 && response.data) {
        session.value.id = response.data.id
        toast({
          title: '保存成功',
          description: '训练记录已保存为草稿',
        })
      }
    }
  } catch (error: any) {
    console.error('Save draft error:', error)
    toast({
      title: '保存失败',
      description: error.message || '保存训练记录失败，请重试',
      variant: 'destructive',
    })
  } finally {
    saving.value = false
  }
}

/** 完成训练 */
async function completeSession(): Promise<void> {
  if (!canComplete.value) {
    toast({
      title: '无法完成',
      description: '请至少完成一组训练',
      variant: 'destructive',
    })
    return
  }

  saving.value = true

  try {
    // 先保存当前数据
    if (!session.value.id) {
      const data = {
        plan_id: session.value.planId || undefined,
        date: session.value.date,
        start_time: session.value.startTime,
        exercises: session.value.exercises.map(ex => ({
          exercise_id: ex.exerciseId,
          name: ex.name,
          sets: ex.sets,
          notes: ex.notes,
        })),
        feeling: session.value.feeling,
        notes: session.value.notes,
      }

      const response = await createTrainingSession(data)
      if (response.code === 200 && response.data) {
        session.value.id = response.data.id
      }
    }

    // 标记为完成
    if (session.value.id) {
      await completeTrainingSession(session.value.id)
      toast({
        title: '训练完成',
        description: `总训练量: ${totalVolume.value.toFixed(1)}kg, 总组数: ${totalSets.value}组`,
      })

      // 跳转到历史记录页面
      router.push('/training/history')
    }
  } catch (error: any) {
    console.error('Complete session error:', error)
    toast({
      title: '完成失败',
      description: error.message || '完成训练失败，请重试',
      variant: 'destructive',
    })
  } finally {
    saving.value = false
  }
}

/** 从训练计划加载 */
async function loadFromPlan(planId: number): Promise<void> {
  try {
    const response = await createSessionFromPlan(planId, session.value.date)
    if (response.code === 200 && response.data) {
      session.value.id = response.data.id
      session.value.planId = response.data.planId || null
      session.value.exercises = response.data.exercises
      session.value.startTime = response.data.startTime
    }
  } catch (error: any) {
    console.error('Load from plan error:', error)
    toast({
      title: '加载失败',
      description: error.message || '从训练计划加载失败',
      variant: 'destructive',
    })
  }
}

// ============ 生命周期 ============

onMounted(() => {
  // 从路由参数获取训练计划ID
  const planId = route.query.planId
  if (planId) {
    loadFromPlan(Number(planId))
  } else {
    // 创建空白训练会话
    session.value.exercises = [
      {
        exerciseId: 0,
        name: '动作1',
        sets: [
          {
            setNumber: 1,
            weight: 0,
            reps: 10,
            rpe: 7,
            rest: 90,
            completed: false,
          },
        ],
        notes: '',
      },
    ]
  }
})
</script>
