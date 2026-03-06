<template>
  <div class="min-h-screen bg-background p-4 pb-20">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center space-y-3">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p class="text-sm text-muted-foreground">加载训练数据...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex items-center justify-center min-h-[60vh]">
      <div class="text-center space-y-3">
        <div class="text-4xl">😕</div>
        <p class="text-sm text-muted-foreground">{{ error }}</p>
        <Button variant="outline" @click="router.push('/training/history')">
          返回历史记录
        </Button>
      </div>
    </div>

    <!-- 汇总内容 -->
    <div v-else-if="session">
      <!-- 头部庆祝 -->
      <div class="text-center mb-8 pt-4">
        <div class="text-5xl mb-3 animate-bounce">🎉</div>
        <h1 class="text-2xl font-bold">训练完成！</h1>
        <p class="text-sm text-muted-foreground mt-1">
          {{ formatDate(session.date) }}
        </p>
      </div>

      <!-- 核心数据卡片 -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <Card class="text-center">
          <CardContent class="pt-4 pb-3">
            <div class="text-2xl font-bold text-primary">{{ durationMinutes }}</div>
            <div class="text-xs text-muted-foreground mt-1">分钟</div>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-4 pb-3">
            <div class="text-2xl font-bold text-primary">
              {{ completedSets }}<span class="text-sm text-muted-foreground font-normal">/{{ totalPlannedSets }}</span>
            </div>
            <div class="text-xs text-muted-foreground mt-1">组数</div>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-4 pb-3">
            <div class="text-2xl font-bold text-primary">{{ totalVolume.toFixed(0) }}</div>
            <div class="text-xs text-muted-foreground mt-1">kg</div>
          </CardContent>
        </Card>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-6">
        <Card class="text-center">
          <CardContent class="pt-4 pb-3">
            <div class="text-2xl font-bold text-primary">{{ averageRPE.toFixed(1) }}</div>
            <div class="text-xs text-muted-foreground mt-1">平均RPE</div>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-4 pb-3">
            <div class="text-2xl font-bold" :class="completionRateColor">{{ completionRate }}%</div>
            <div class="text-xs text-muted-foreground mt-1">完成率</div>
          </CardContent>
        </Card>
      </div>

      <!-- 动作列表 -->
      <Card class="mb-6">
        <CardHeader class="pb-3">
          <CardTitle class="text-base">训练动作</CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="(exercise, index) in exercises"
            :key="index"
            class="flex items-center justify-between py-2"
            :class="{ 'border-t': index > 0 }"
          >
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                {{ index + 1 }}
              </div>
              <span class="font-medium text-sm">{{ exercise.name }}</span>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ exercise.completedSets }}×{{ exercise.avgReps }}
              <span class="ml-1 font-medium text-foreground">{{ exercise.weight }}kg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 训练感受 -->
      <div v-if="session.feeling" class="text-center mb-6">
        <span class="text-sm text-muted-foreground">训练感受: </span>
        <span class="text-sm font-medium">{{ getFeelingLabel(session.feeling) }}</span>
      </div>

      <!-- 底部操作 -->
      <div class="flex gap-3">
        <Button
          variant="outline"
          class="flex-1"
          @click="router.push('/training/history')"
        >
          <ClipboardList class="w-4 h-4 mr-1" />
          查看历史
        </Button>
        <Button
          class="flex-1"
          @click="router.push('/training')"
        >
          <Home class="w-4 h-4 mr-1" />
          返回首页
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ClipboardList, Home } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getTrainingSessionDetail, type TrainingSession } from '@/api/training-session'

const router = useRouter()
const route = useRoute()

const session = ref<TrainingSession | null>(null)
const loading = ref(true)
const error = ref('')

interface ExerciseSummary {
  name: string
  completedSets: number
  totalSets: number
  avgReps: number
  weight: number
  volume: number
}

const exercises = computed<ExerciseSummary[]>(() => {
  if (!session.value) return []
  return session.value.exercises.map(ex => {
    const completed = ex.sets.filter(s => s.completed)
    const avgReps = completed.length > 0
      ? Math.round(completed.reduce((sum, s) => sum + s.reps, 0) / completed.length)
      : 0
    const maxWeight = completed.length > 0
      ? Math.max(...completed.map(s => s.weight))
      : 0
    const volume = completed.reduce((sum, s) => sum + s.weight * s.reps, 0)
    return {
      name: ex.name,
      completedSets: completed.length,
      totalSets: ex.sets.length,
      avgReps,
      weight: maxWeight,
      volume,
    }
  })
})

const totalVolume = computed(() => {
  if (!session.value) return 0
  return session.value.exercises.reduce((total, ex) =>
    total + ex.sets.reduce((sum, s) => sum + (s.completed ? s.weight * s.reps : 0), 0)
  , 0)
})

const completedSets = computed(() => {
  if (!session.value) return 0
  return session.value.exercises.reduce((total, ex) =>
    total + ex.sets.filter(s => s.completed).length
  , 0)
})

const totalPlannedSets = computed(() => {
  if (!session.value) return 0
  return session.value.exercises.reduce((total, ex) => total + ex.sets.length, 0)
})

const averageRPE = computed(() => {
  if (!session.value) return 0
  const completed = session.value.exercises.flatMap(ex => ex.sets.filter(s => s.completed))
  if (completed.length === 0) return 0
  return completed.reduce((sum, s) => sum + s.rpe, 0) / completed.length
})

const completionRate = computed(() => {
  if (totalPlannedSets.value === 0) return 0
  return Math.round((completedSets.value / totalPlannedSets.value) * 100)
})

const completionRateColor = computed(() => {
  const rate = completionRate.value
  if (rate >= 80) return 'text-green-600'
  if (rate >= 50) return 'text-yellow-600'
  return 'text-red-600'
})

const durationMinutes = computed(() => {
  if (!session.value) return 0
  if (session.value.duration) return session.value.duration
  const start = new Date(session.value.createdAt)
  const end = session.value.endTime ? new Date(session.value.endTime) : new Date(session.value.updatedAt)
  return Math.round((end.getTime() - start.getTime()) / 60000)
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

function getFeelingLabel(feeling: string): string {
  const labels: Record<string, string> = {
    excellent: '😄 很好',
    good: '🙂 良好',
    fair: '😐 一般',
    poor: '😞 较差',
  }
  return labels[feeling] || feeling
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) {
    error.value = '无效的训练记录ID'
    loading.value = false
    return
  }

  try {
    const response = await getTrainingSessionDetail(id)
    if (response.code === 200 && response.data) {
      session.value = response.data
    } else {
      error.value = '训练记录不存在'
    }
  } catch (e: any) {
    error.value = e.message || '加载训练数据失败'
  } finally {
    loading.value = false
  }
})
</script>
