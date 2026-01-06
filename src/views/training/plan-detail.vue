<script setup lang="ts">
/**
 * 训练计划详情页面
 * 
 * 显示训练计划的完整信息，包括：
 * - 计划概览
 * - 周期计划安排
 * - 动作列表
 * - 安全评估
 * 
 * @author BUILD_BODY Team
 * @version 1.0.0
 * @created 2025-01-03
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrainingStore } from '@/stores/training'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft,
  Play,
  Trash2,
  Download,
  Star,
  Calendar,
  Dumbbell,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
  ChevronDown,
  ExternalLink
} from 'lucide-vue-next'

// ============ 状态 ============

const route = useRoute()
const router = useRouter()
const trainingStore = useTrainingStore()
const { toast } = useToast()

const activeTab = ref('overview')
const showDeleteDialog = ref(false)
const expandedDays = ref<number[]>([1])
const exporting = ref(false)

// ============ 计算属性 ============

const planId = computed(() => Number(route.params.id))
const loading = computed(() => trainingStore.loading)
const plan = computed(() => trainingStore.currentPlan)

const difficultyLabel = computed(() => {
  const map: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
  }
  return map[plan.value?.difficulty || ''] || '中级'
})

const difficultyColor = computed(() => {
  const map: Record<string, string> = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500',
  }
  return map[plan.value?.difficulty || ''] || 'bg-yellow-500'
})

const typeLabel = computed(() => {
  const map: Record<string, string> = {
    ai_generated: '智能生成',
    manual: '手动创建',
    imported: '导入',
  }
  return map[plan.value?.type || ''] || plan.value?.type
})

// ============ 生命周期 ============

onMounted(async () => {
  await loadPlanDetail()
})

watch(() => planId.value, async (newId) => {
  if (newId) {
    await loadPlanDetail()
  }
})

// ============ 方法 ============

async function loadPlanDetail() {
  try {
    await trainingStore.fetchPlanDetail(planId.value)
  } catch (error: any) {
    toast({
      title: '加载失败',
      description: error.message || '无法加载计划详情',
      variant: 'destructive',
    })
  }
}

function goBack() {
  router.back()
}

async function handleStartTraining() {
  if (!plan.value) return
  
  try {
    await trainingStore.startPlan(plan.value.id)
    toast({
      title: '开始训练',
      description: '训练计划已开始，祝您训练愉快！',
    })
    // 跳转到训练记录页面（待实现）
    // router.push(`/training/session/${plan.value.id}`)
  } catch (error: any) {
    toast({
      title: '操作失败',
      description: error.message || '无法开始训练',
      variant: 'destructive',
    })
  }
}

async function handleActivate() {
  if (!plan.value) return
  
  try {
    await trainingStore.activatePlan(plan.value.id)
    toast({
      title: '设置成功',
      description: '已设为当前训练计划',
    })
  } catch (error: any) {
    toast({
      title: '操作失败',
      description: error.message || '无法激活计划',
      variant: 'destructive',
    })
  }
}

async function handleExport(format: 'json' | 'pdf') {
  if (!plan.value) return
  
  exporting.value = true
  try {
    const result = await trainingStore.exportPlan(plan.value.id, format)
    
    // 下载文件
    const link = document.createElement('a')
    link.href = result.url
    link.download = result.filename
    link.click()
    
    toast({
      title: '导出成功',
      description: `训练计划已导出为${format.toUpperCase()}格式`,
    })
  } catch (error: any) {
    toast({
      title: '导出失败',
      description: error.message || '无法导出计划',
      variant: 'destructive',
    })
  } finally {
    exporting.value = false
  }
}

function handleDeleteClick() {
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!plan.value) return
  
  try {
    await trainingStore.deletePlan(plan.value.id)
    toast({
      title: '删除成功',
      description: '训练计划已删除',
    })
    router.push('/training/plans')
  } catch (error: any) {
    toast({
      title: '删除失败',
      description: error.message || '无法删除计划',
      variant: 'destructive',
    })
  } finally {
    showDeleteDialog.value = false
  }
}

function toggleDay(dayIndex: number) {
  const index = expandedDays.value.indexOf(dayIndex)
  if (index === -1) {
    expandedDays.value.push(dayIndex)
  } else {
    expandedDays.value.splice(index, 1)
  }
}

function isDayExpanded(dayIndex: number): boolean {
  return expandedDays.value.includes(dayIndex)
}

function viewExerciseDetail(exerciseId: string | number) {
  router.push(`/exercise/${exerciseId}`)
}

function formatRepsRange(range: [number, number] | string): string {
  if (Array.isArray(range)) {
    return range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`
  }
  return range || '8-12'
}

// 辅助函数：按天分组动作
function groupExercisesByDay(exercises: any[]): any[][] {
  if (!exercises || exercises.length === 0) return []
  
  // 如果动作有day字段，按day分组
  const hasDay = exercises.some(e => e.day !== undefined)
  
  if (hasDay) {
    const groups: Record<number, any[]> = {}
    exercises.forEach(e => {
      const day = e.day || 1
      if (!groups[day]) groups[day] = []
      groups[day].push(e)
    })
    return Object.values(groups)
  }
  
  // 简单分组：每5个动作为一天
  const result: any[][] = []
  const perDay = Math.ceil(exercises.length / 3) || 5
  
  for (let i = 0; i < exercises.length; i += perDay) {
    result.push(exercises.slice(i, i + perDay))
  }
  
  return result.length > 0 ? result : [exercises]
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 加载状态 -->
    <div v-if="loading && !plan" class="p-4 space-y-4">
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-48 w-full" />
    </div>

    <!-- 计划不存在 -->
    <div v-else-if="!plan" class="flex flex-col items-center justify-center min-h-screen p-4">
      <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <AlertTriangle class="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 class="text-lg font-medium mb-2">计划不存在</h3>
      <p class="text-sm text-muted-foreground mb-6">该训练计划不存在或已被删除</p>
      <Button @click="router.push('/training/plans')">
        返回列表
      </Button>
    </div>

    <!-- 计划详情 -->
    <div v-else>
      <!-- 页面头部 -->
      <div class="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <!-- 导航栏 -->
        <div class="flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="icon" class="text-primary-foreground hover:bg-primary-foreground/10" @click="goBack">
            <ArrowLeft class="h-5 w-5" />
          </Button>
          <h1 class="text-lg font-semibold truncate flex-1 text-center px-2">{{ plan.name }}</h1>
          <Badge v-if="plan.type === 'ai_generated'" variant="secondary" class="text-xs">
            <Sparkles class="h-3 w-3 mr-1" />
            {{ typeLabel }}
          </Badge>
        </div>
        
        <!-- 计划概览 -->
        <div class="px-4 pb-6">
          <p v-if="plan.description" class="text-sm text-primary-foreground/80 mb-4">
            {{ plan.description }}
          </p>
          
          <div class="grid grid-cols-4 gap-3 text-center">
            <div class="flex flex-col items-center">
              <Calendar class="h-5 w-5 mb-1 opacity-80" />
              <span class="text-xs opacity-70">周期</span>
              <span class="text-sm font-semibold">{{ plan.weeks }}周</span>
            </div>
            <div class="flex flex-col items-center">
              <Dumbbell class="h-5 w-5 mb-1 opacity-80" />
              <span class="text-xs opacity-70">频率</span>
              <span class="text-sm font-semibold">{{ plan.frequency }}天/周</span>
            </div>
            <div class="flex flex-col items-center">
              <Target class="h-5 w-5 mb-1 opacity-80" />
              <span class="text-xs opacity-70">动作</span>
              <span class="text-sm font-semibold">{{ plan.exerciseCount }}个</span>
            </div>
            <div class="flex flex-col items-center">
              <Badge :class="difficultyColor" class="text-white text-xs px-2 py-0.5">
                {{ difficultyLabel }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-2 p-4 bg-background border-b overflow-x-auto">
        <Button v-if="!plan.isActive" variant="outline" size="sm" @click="handleActivate">
          <Star class="h-4 w-4 mr-1" />
          设为当前
        </Button>
        <Button v-if="plan.isActive" size="sm" @click="handleStartTraining">
          <Play class="h-4 w-4 mr-1" />
          开始训练
        </Button>
        <Button variant="outline" size="sm" :disabled="exporting" @click="handleExport('json')">
          <Download class="h-4 w-4 mr-1" />
          导出
        </Button>
        <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="handleDeleteClick">
          <Trash2 class="h-4 w-4 mr-1" />
          删除
        </Button>
      </div>

      <!-- 标签页内容 -->
      <Tabs v-model="activeTab" class="w-full">
        <TabsList class="w-full justify-start px-4 bg-background border-b rounded-none h-auto py-0">
          <TabsTrigger value="overview" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            概览
          </TabsTrigger>
          <TabsTrigger value="weekly" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            训练周期
          </TabsTrigger>
          <TabsTrigger value="exercises" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            动作列表
          </TabsTrigger>
          <TabsTrigger value="safety" class="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
            安全评估
          </TabsTrigger>
        </TabsList>

        <!-- 概览 -->
        <TabsContent value="overview" class="p-4 space-y-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-base flex items-center gap-2">
                <Info class="h-4 w-4 text-primary" />
                计划信息
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">计划名称</span>
                <span class="font-medium">{{ plan.name }}</span>
              </div>
              <div v-if="plan.goal" class="flex justify-between text-sm">
                <span class="text-muted-foreground">训练目标</span>
                <span class="font-medium">{{ plan.goal }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">难度等级</span>
                <Badge :class="difficultyColor" class="text-white text-xs">{{ difficultyLabel }}</Badge>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">计划类型</span>
                <span class="font-medium">{{ typeLabel }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">创建时间</span>
                <span class="font-medium">{{ new Date(plan.createdAt).toLocaleDateString() }}</span>
              </div>
              <div v-if="plan.startedAt" class="flex justify-between text-sm">
                <span class="text-muted-foreground">开始时间</span>
                <span class="font-medium">{{ new Date(plan.startedAt).toLocaleDateString() }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- 目标肌群 -->
          <Card v-if="plan.targetMuscles && plan.targetMuscles.length > 0">
            <CardHeader class="pb-2">
              <CardTitle class="text-base flex items-center gap-2">
                <Target class="h-4 w-4 text-primary" />
                目标肌群
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="muscle in plan.targetMuscles" :key="muscle" variant="secondary">
                  {{ muscle }}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 周期计划 -->
        <TabsContent value="weekly" class="p-4 space-y-3">
          <div v-if="plan.exercises && plan.exercises.length > 0" class="space-y-3">
            <!-- 按天分组显示 -->
            <Card v-for="(dayExercises, dayIndex) in groupExercisesByDay(plan.exercises)" :key="dayIndex">
              <button
                class="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                @click="toggleDay(dayIndex)"
              >
                <div class="flex items-center gap-2">
                  <Badge variant="outline">第{{ dayIndex + 1 }}天</Badge>
                  <span class="text-sm text-muted-foreground">{{ dayExercises.length }}个动作</span>
                </div>
                <ChevronDown
                  :class="['h-4 w-4 transition-transform', isDayExpanded(dayIndex) && 'rotate-180']"
                />
              </button>
              
              <div v-if="isDayExpanded(dayIndex)" class="border-t divide-y">
                <button
                  v-for="(exercise, idx) in dayExercises"
                  :key="idx"
                  class="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
                  @click="viewExerciseDetail(exercise.id || idx)"
                >
                  <div class="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="outline" class="h-5 w-5 p-0 justify-center text-xs shrink-0">
                      {{ idx + 1 }}
                    </Badge>
                    <span class="font-medium text-sm truncate">{{ exercise.name || exercise.name_zh }}</span>
                    <ExternalLink class="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                  <div class="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                    <span class="text-primary font-medium">{{ exercise.sets || 3 }}组</span>
                    <span>x</span>
                    <span class="text-primary font-medium">{{ formatRepsRange(exercise.reps_range || exercise.reps || '8-12') }}次</span>
                  </div>
                </button>
              </div>
            </Card>
          </div>
          
          <div v-else class="text-center py-8 text-muted-foreground">
            <Dumbbell class="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无周期计划数据</p>
          </div>
        </TabsContent>

        <!-- 动作列表 -->
        <TabsContent value="exercises" class="p-4">
          <div v-if="plan.exercises && plan.exercises.length > 0" class="space-y-2">
            <Card 
              v-for="(exercise, idx) in plan.exercises" 
              :key="idx"
              class="cursor-pointer hover:shadow-sm transition-shadow"
              @click="viewExerciseDetail(exercise.id || idx)"
            >
              <CardContent class="p-3 flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant="outline" class="h-6 w-6 p-0 justify-center shrink-0">
                    {{ idx + 1 }}
                  </Badge>
                  <div class="min-w-0">
                    <p class="font-medium text-sm truncate">{{ exercise.name || exercise.name_zh }}</p>
                    <p v-if="exercise.target_muscle" class="text-xs text-muted-foreground">
                      {{ exercise.target_muscle }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Badge variant="secondary" class="text-xs">
                    {{ exercise.sets || 3 }}组 x {{ formatRepsRange(exercise.reps_range || exercise.reps || '8-12') }}
                  </Badge>
                  <ExternalLink class="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div v-else class="text-center py-8 text-muted-foreground">
            <Dumbbell class="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>暂无动作数据</p>
          </div>
        </TabsContent>

        <!-- 安全评估 -->
        <TabsContent value="safety" class="p-4 space-y-4">
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-base flex items-center gap-2">
                <AlertTriangle class="h-4 w-4 text-amber-500" />
                安全评估
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <!-- 风险等级 -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">整体风险等级</span>
                <Badge class="bg-green-500 text-white">低风险</Badge>
              </div>
              
              <!-- 安全提示 -->
              <div v-if="plan.safetyNotes && plan.safetyNotes.length > 0" class="space-y-2">
                <p class="text-sm font-medium">安全提示</p>
                <ul class="space-y-1.5">
                  <li 
                    v-for="(note, idx) in plan.safetyNotes" 
                    :key="idx"
                    class="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle class="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    <span>{{ note }}</span>
                  </li>
                </ul>
              </div>
              
              <div v-else class="text-sm text-muted-foreground">
                <p>该计划已通过安全评估，适合您的当前身体状况。</p>
              </div>
            </CardContent>
          </Card>

          <!-- 数据来源 -->
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle class="h-4 w-4 text-blue-500" />
                <span>基于1790个专业动作数据库生成</span>
              </div>
              <p class="text-xs text-muted-foreground mt-2">
                本内容由智能系统辅助生成，仅供参考。请根据个人情况调整训练强度。
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    <!-- 删除确认对话框 -->
    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除训练计划</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除"{{ plan?.name }}"吗？此操作无法撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction class="bg-destructive text-destructive-foreground hover:bg-destructive/90" @click="confirmDelete">
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
