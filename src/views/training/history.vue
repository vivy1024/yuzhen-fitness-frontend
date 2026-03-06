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
        <Button
          size="sm"
          @click="router.push('/training/session')"
        >
          <Plus class="w-4 h-4 mr-1" />
          新建训练
        </Button>
      </div>
      <h1 class="text-2xl font-bold">训练历史</h1>
      <p class="text-sm text-muted-foreground mt-1">
        共 {{ totalSessions }} 次训练
      </p>
    </div>

    <!-- 筛选器 -->
    <Card class="mb-6">
      <CardContent class="pt-6">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label class="mb-2 block text-sm">开始日期</Label>
            <Input
              v-model="filters.startDate"
              type="date"
              @change="fetchHistory"
            />
          </div>
          <div>
            <Label class="mb-2 block text-sm">结束日期</Label>
            <Input
              v-model="filters.endDate"
              type="date"
              @change="fetchHistory"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 加载状态 -->
    <div v-if="loading" class="space-y-4">
      <Card v-for="i in 3" :key="i" class="p-4">
        <div class="animate-pulse space-y-3">
          <div class="h-4 bg-muted rounded w-1/3"></div>
          <div class="h-3 bg-muted rounded w-1/2"></div>
          <div class="grid grid-cols-3 gap-2">
            <div class="h-8 bg-muted rounded"></div>
            <div class="h-8 bg-muted rounded"></div>
            <div class="h-8 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    </div>

    <!-- 训练历史列表 -->
    <div v-else-if="sessions.length > 0" class="space-y-4">
      <Card
        v-for="session in sessions"
        :key="session.id"
        class="cursor-pointer hover:shadow-md transition-shadow"
        @click="viewDetail(session.id)"
      >
        <CardContent class="pt-6">
          <!-- 日期和状态 -->
          <div class="flex items-center justify-between mb-3">
            <div>
              <div class="font-semibold">{{ formatDate(session.date) }}</div>
              <div class="text-sm text-muted-foreground">
                {{ formatTime(session.startTime) }}
                <span v-if="session.duration">
                  · {{ session.duration }}分钟
                </span>
              </div>
            </div>
            <Badge :variant="getStatusVariant(session.status)">
              {{ getStatusLabel(session.status) }}
            </Badge>
          </div>

          <!-- 训练数据 -->
          <div class="grid grid-cols-3 gap-4 mb-3">
            <div>
              <div class="text-xs text-muted-foreground">训练量</div>
              <div class="text-lg font-bold">{{ session.totalVolume.toFixed(1) }}</div>
              <div class="text-xs text-muted-foreground">kg</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">总组数</div>
              <div class="text-lg font-bold">{{ session.totalSets }}</div>
              <div class="text-xs text-muted-foreground">组</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground">平均RPE</div>
              <div class="text-lg font-bold">{{ session.averageRPE.toFixed(1) }}</div>
              <div class="text-xs text-muted-foreground">/10</div>
            </div>
          </div>

          <!-- 训练感受 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">感受:</span>
            <span class="text-sm">{{ getFeelingLabel(session.feeling) }}</span>
          </div>

          <!-- 动作列表 -->
          <div class="mt-3 pt-3 border-t">
            <div class="flex items-center justify-between mb-1">
              <div class="text-xs text-muted-foreground">训练动作</div>
              <Button
                v-if="session.status === 'completed'"
                variant="ghost"
                size="sm"
                class="h-6 text-xs px-2"
                @click.stop="router.push({ name: 'training-summary', params: { id: session.id } })"
              >
                <BarChart3 class="w-3 h-3 mr-1" />
                查看汇总
              </Button>
            </div>
            <div class="flex flex-wrap gap-1">
              <Badge
                v-for="(exercise, index) in session.exercises.slice(0, 3)"
                :key="index"
                variant="outline"
                class="text-xs"
              >
                {{ exercise.name }}
              </Badge>
              <Badge
                v-if="session.exercises.length > 3"
                variant="outline"
                class="text-xs"
              >
                +{{ session.exercises.length - 3 }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="flex justify-center gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
        >
          <ChevronLeft class="w-4 h-4" />
        </Button>
        <div class="flex items-center gap-1">
          <Button
            v-for="page in visiblePages"
            :key="page"
            :variant="page === currentPage ? 'default' : 'outline'"
            size="sm"
            @click="changePage(page)"
          >
            {{ page }}
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
        >
          <ChevronRight class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- 空状态 -->
    <Card v-else class="p-8">
      <div class="text-center">
        <div class="text-4xl mb-4">📝</div>
        <h3 class="text-lg font-semibold mb-2">暂无训练记录</h3>
        <p class="text-sm text-muted-foreground mb-4">
          开始记录您的训练，追踪进步
        </p>
        <Button @click="router.push('/training/session')">
          <Plus class="w-4 h-4 mr-1" />
          开始训练
        </Button>
      </div>
    </Card>

    <!-- 详情对话框 -->
    <Dialog v-model:open="showDetail">
      <DialogContent class="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>训练详情</DialogTitle>
          <DialogDescription>
            {{ selectedSession ? formatDate(selectedSession.date) : '' }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="selectedSession" class="space-y-4">
          <!-- 训练总结 -->
          <div class="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <div class="text-sm text-muted-foreground">训练量</div>
              <div class="text-2xl font-bold">{{ selectedSession.totalVolume.toFixed(1) }}</div>
              <div class="text-xs text-muted-foreground">kg</div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground">总组数</div>
              <div class="text-2xl font-bold">{{ selectedSession.totalSets }}</div>
              <div class="text-xs text-muted-foreground">组</div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground">平均RPE</div>
              <div class="text-2xl font-bold">{{ selectedSession.averageRPE.toFixed(1) }}</div>
              <div class="text-xs text-muted-foreground">/10</div>
            </div>
          </div>

          <!-- 训练时间 -->
          <div class="flex items-center gap-4 text-sm">
            <div>
              <span class="text-muted-foreground">开始:</span>
              <span class="ml-1">{{ formatTime(selectedSession.startTime) }}</span>
            </div>
            <div v-if="selectedSession.endTime">
              <span class="text-muted-foreground">结束:</span>
              <span class="ml-1">{{ formatTime(selectedSession.endTime) }}</span>
            </div>
            <div v-if="selectedSession.duration">
              <span class="text-muted-foreground">时长:</span>
              <span class="ml-1">{{ selectedSession.duration }}分钟</span>
            </div>
          </div>

          <!-- 训练感受 -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground">训练感受:</span>
            <span class="text-sm font-medium">{{ getFeelingLabel(selectedSession.feeling) }}</span>
          </div>

          <!-- 动作详情 -->
          <div class="space-y-3">
            <h4 class="font-semibold">训练动作</h4>
            <div
              v-for="(exercise, index) in selectedSession.exercises"
              :key="index"
              class="border rounded-lg p-3"
            >
              <div class="font-medium mb-2">{{ exercise.name }}</div>
              <div class="space-y-1">
                <div class="grid grid-cols-5 gap-2 text-xs text-muted-foreground font-medium">
                  <div>组数</div>
                  <div>重量</div>
                  <div>次数</div>
                  <div>RPE</div>
                  <div>休息</div>
                </div>
                <div
                  v-for="(set, setIndex) in exercise.sets"
                  :key="setIndex"
                  class="grid grid-cols-5 gap-2 text-sm"
                  :class="{ 'text-muted-foreground': !set.completed }"
                >
                  <div>{{ set.setNumber }}</div>
                  <div>{{ set.weight }}kg</div>
                  <div>{{ set.reps }}次</div>
                  <div>{{ set.rpe }}</div>
                  <div>{{ set.rest }}s</div>
                </div>
              </div>
              <div v-if="exercise.notes" class="mt-2 text-sm text-muted-foreground">
                备注: {{ exercise.notes }}
              </div>
            </div>
          </div>

          <!-- 整体备注 -->
          <div v-if="selectedSession.notes" class="p-3 bg-muted rounded-lg">
            <div class="text-sm font-medium mb-1">整体备注</div>
            <div class="text-sm text-muted-foreground">{{ selectedSession.notes }}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDetail = false">关闭</Button>
          <Button
            variant="destructive"
            @click="deleteSession(selectedSession?.id)"
          >
            删除记录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'
import {
  getTrainingSessions,
  getTrainingSessionDetail,
  deleteTrainingSession,
  type TrainingSession,
} from '@/api/training-session'

const router = useRouter()
const { toast } = useToast()

// ============ 状态 ============

const sessions = ref<TrainingSession[]>([])
const selectedSession = ref<TrainingSession | null>(null)
const loading = ref(false)
const showDetail = ref(false)

const filters = ref({
  startDate: '',
  endDate: '',
})

const currentPage = ref(1)
const totalPages = ref(1)
const totalSessions = ref(0)
const perPage = 10

// ============ 计算属性 ============

/** 可见的页码 */
const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    })
  }
}

/** 格式化时间 */
function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** 获取感受标签 */
function getFeelingLabel(feeling: string): string {
  const labels: Record<string, string> = {
    excellent: '😄 很好',
    good: '🙂 良好',
    fair: '😐 一般',
    poor: '😞 较差',
  }
  return labels[feeling] || feeling
}

/** 获取状态标签 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待开始',
    in_progress: '进行中',
    completed: '已完成',
    skipped: '已跳过',
  }
  return labels[status] || status
}

/** 获取状态Badge样式 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    pending: 'outline',
    in_progress: 'secondary',
    completed: 'default',
    skipped: 'destructive',
  }
  return variants[status] || 'secondary'
}

/** 获取训练历史 */
async function fetchHistory(): Promise<void> {
  loading.value = true

  try {
    const params: any = {
      page: currentPage.value,
      per_page: perPage,
    }

    if (filters.value.startDate) {
      params.start_date = filters.value.startDate
    }
    if (filters.value.endDate) {
      params.end_date = filters.value.endDate
    }

    const response = await getTrainingSessions(params)

    if (response.code === 200 && response.data) {
      // 适配后端数据格式 (rows -> data, total_pages -> lastPage, page -> currentPage)
      const backendData = response.data as any
      sessions.value = transformSessions(backendData.rows || backendData.data || [])
      totalSessions.value = backendData.total || 0
      totalPages.value = backendData.total_pages || backendData.lastPage || 1
      currentPage.value = backendData.page || backendData.currentPage || 1
    }
  } catch (error: any) {
    console.error('Fetch history error:', error)
    toast({
      title: '加载失败',
      description: error.message || '获取训练历史失败',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

/** 转换后端训练日志数据到前端格式 */
function transformSessions(rows: any[]): TrainingSession[] {
  return rows.map(row => ({
    id: row.id,
    userId: row.user_id,
    planId: row.training_plan_id,
    date: row.session_date,
    startTime: row.created_at,
    endTime: row.updated_at,
    duration: row.duration || 0,
    exercises: (row.actual_exercises || row.planned_exercises || []).map((ex: any) => ({
      exerciseId: ex.exercise_id,
      name: ex.exercise_name,
      sets: (ex.reps_per_set || []).map((reps: number, idx: number) => ({
        setNumber: idx + 1,
        weight: ex.weight || 0,
        reps: reps,
        rpe: ex.rpe || 0,
        rest: 60,
        completed: true,
      })),
      notes: ex.notes,
    })),
    totalVolume: row.total_volume || 0,
    totalSets: row.total_sets || 0,
    averageRPE: row.avg_rpe || 0,
    feeling: row.feeling || 'good',
    notes: row.notes,
    status: 'completed',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

/** 查看详情 */
async function viewDetail(id: number): Promise<void> {
  try {
    const response = await getTrainingSessionDetail(id)
    if (response.code === 200 && response.data) {
      selectedSession.value = response.data
      showDetail.value = true
    }
  } catch (error: any) {
    console.error('View detail error:', error)
    toast({
      title: '加载失败',
      description: error.message || '获取训练详情失败',
      variant: 'destructive',
    })
  }
}

/** 删除训练记录 */
async function deleteSession(id?: number): Promise<void> {
  if (!id) return

  if (!confirm('确定要删除这条训练记录吗？')) {
    return
  }

  try {
    await deleteTrainingSession(id)
    toast({
      title: '删除成功',
      description: '训练记录已删除',
    })

    showDetail.value = false
    selectedSession.value = null
    fetchHistory()
  } catch (error: any) {
    console.error('Delete session error:', error)
    toast({
      title: '删除失败',
      description: error.message || '删除训练记录失败',
      variant: 'destructive',
    })
  }
}

/** 切换页码 */
function changePage(page: number): void {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  fetchHistory()
}

// ============ 生命周期 ============

onMounted(() => {
  // 设置默认日期范围（最近30天）
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  filters.value.endDate = today.toISOString().split('T')[0]
  filters.value.startDate = thirtyDaysAgo.toISOString().split('T')[0]

  fetchHistory()
})
</script>
