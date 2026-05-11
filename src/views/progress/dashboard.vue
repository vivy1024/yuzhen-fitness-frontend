<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- 头部 -->
    <header class="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
      <div class="flex items-center justify-between px-4 h-14">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="text-lg font-semibold">进度追踪</h1>
        <Button variant="ghost" size="icon" @click="handleRefresh">
          <RefreshCw :class="['w-5 h-5', refreshing && 'animate-spin']" />
        </Button>
      </div>
    </header>

    <!-- 页面头部渐变 -->
    <div class="bg-gradient-to-br from-primary to-primary/80 px-4 py-6 text-white">
      <h2 class="text-xl font-bold mb-1">训练进度</h2>
      <p class="text-sm text-white/80">追踪您的训练成果和进步</p>
    </div>

    <!-- 主内容区 -->
    <main class="px-4 -mt-4 relative z-10">
      <!-- 加载状态 -->
      <div v-if="progressStore.loading" class="space-y-4">
        <Skeleton class="h-24 w-full rounded-xl" />
        <div class="grid grid-cols-2 gap-3">
          <Skeleton class="h-20 rounded-xl" />
          <Skeleton class="h-20 rounded-xl" />
        </div>
        <Skeleton class="h-64 w-full rounded-xl" />
        <Skeleton class="h-48 w-full rounded-xl" />
      </div>

      <!-- 进度仪表盘内容 -->
      <div v-else class="space-y-4">
        <!-- 关键指标卡片 -->
        <div class="grid grid-cols-2 gap-3">
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center gap-2 mb-2">
                <Dumbbell class="w-4 h-4 text-primary" />
                <span class="text-xs text-muted-foreground">总训练容量</span>
              </div>
              <div class="text-2xl font-bold text-primary">
                {{ formatNumber(progressStore.stats.totalVolume) }}
                <span class="text-sm font-normal text-muted-foreground">kg</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="p-4">
              <div class="flex items-center gap-2 mb-2">
                <Calendar class="w-4 h-4 text-green-500" />
                <span class="text-xs text-muted-foreground">本月训练</span>
              </div>
              <div class="text-2xl font-bold text-green-500">
                {{ progressStore.stats.trainingDaysThisMonth }}
                <span class="text-sm font-normal text-muted-foreground">天</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="p-4">
              <div class="flex items-center gap-2 mb-2">
                <Scale class="w-4 h-4 text-blue-500" />
                <span class="text-xs text-muted-foreground">当前体重</span>
              </div>
              <div class="text-2xl font-bold text-blue-500">
                {{ currentWeight || '--' }}
                <span class="text-sm font-normal text-muted-foreground">kg</span>
              </div>
              <div v-if="progressStore.stats.weightChange" class="text-xs mt-1" :class="progressStore.stats.weightChange > 0 ? 'text-red-500' : 'text-green-500'">
                {{ progressStore.stats.weightChange > 0 ? '+' : '' }}{{ progressStore.stats.weightChange.toFixed(1) }}kg
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent class="p-4">
              <div class="flex items-center gap-2 mb-2">
                <TrendingUp class="w-4 h-4 text-orange-500" />
                <span class="text-xs text-muted-foreground">FFMI</span>
              </div>
              <div class="text-2xl font-bold text-orange-500">
                {{ currentFFMI?.toFixed(1) || '--' }}
              </div>
              <div v-if="progressStore.stats.ffmiChange" class="text-xs mt-1" :class="progressStore.stats.ffmiChange > 0 ? 'text-green-500' : 'text-red-500'">
                {{ progressStore.stats.ffmiChange > 0 ? '+' : '' }}{{ progressStore.stats.ffmiChange.toFixed(2) }}
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- 训练日历 -->
        <TrainingCalendar
          :calendar-data="progressStore.calendarData"
          :loading="calendarLoading"
          @month-change="handleMonthChange"
          @day-click="handleDayClick"
          @view-detail="handleViewDetail"
        />

        <!-- 目标进度 -->
        <GoalProgress
          :goals="progressStore.activeGoals"
          :loading="goalsLoading"
          @add-goal="handleAddGoal"
          @goal-click="handleGoalClick"
        />

        <!-- 体重趋势图 -->
        <Card v-if="progressStore.weightTrend.length > 0">
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <Scale class="w-4 h-4 text-blue-500" />
              体重趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="w-full">
              <div class="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{{ formatDateShort(progressStore.weightTrend[0]?.date) }}</span>
                <span>{{ formatDateShort(progressStore.weightTrend[progressStore.weightTrend.length - 1]?.date) }}</span>
              </div>
              <div class="flex items-end gap-1 h-32">
                <div
                  v-for="(item, index) in progressStore.weightTrend.slice(-14)"
                  :key="index"
                  class="flex-1 bg-blue-500/20 rounded-t transition-all hover:bg-blue-500/40 cursor-pointer"
                  :style="{ height: `${getWeightBarHeight(item.weight)}%` }"
                  :title="`${item.date}: ${item.weight.toFixed(1)}kg`"
                />
              </div>
              <div class="flex justify-between text-xs text-muted-foreground mt-2">
                <span>最低: {{ minWeight.toFixed(1) }}kg</span>
                <span>最高: {{ maxWeight.toFixed(1) }}kg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 训练量趋势图 -->
        <Card v-if="progressStore.volumeTrend.length > 0">
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <Dumbbell class="w-4 h-4 text-green-500" />
              训练量趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="w-full">
              <div class="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{{ formatDateShort(progressStore.volumeTrend[0]?.date) }}</span>
                <span>{{ formatDateShort(progressStore.volumeTrend[progressStore.volumeTrend.length - 1]?.date) }}</span>
              </div>
              <div class="flex items-end gap-1 h-32">
                <div
                  v-for="(item, index) in progressStore.volumeTrend.slice(-14)"
                  :key="index"
                  class="flex-1 bg-green-500/20 rounded-t transition-all hover:bg-green-500/40 cursor-pointer"
                  :style="{ height: `${getVolumeBarHeight(item.volume)}%` }"
                  :title="`${item.date}: ${formatNumber(item.volume)}kg`"
                />
              </div>
              <div class="flex justify-between text-xs text-muted-foreground mt-2">
                <span>最低: {{ formatNumber(minVolume) }}kg</span>
                <span>最高: {{ formatNumber(maxVolume) }}kg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- FFMI趋势图 -->
        <Card v-if="progressStore.ffmiTrend.length > 0">
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <TrendingUp class="w-4 h-4 text-orange-500" />
              FFMI趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="w-full">
              <div class="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{{ formatDateShort(progressStore.ffmiTrend[0]?.date) }}</span>
                <span>{{ formatDateShort(progressStore.ffmiTrend[progressStore.ffmiTrend.length - 1]?.date) }}</span>
              </div>
              <div class="flex items-end gap-1 h-32">
                <div
                  v-for="(item, index) in progressStore.ffmiTrend.slice(-14)"
                  :key="index"
                  class="flex-1 bg-orange-500/20 rounded-t transition-all hover:bg-orange-500/40 cursor-pointer"
                  :style="{ height: `${getFFMIBarHeight(item.ffmi)}%` }"
                  :title="`${item.date}: FFMI ${item.ffmi.toFixed(2)}`"
                />
              </div>
              <div class="flex justify-between text-xs text-muted-foreground mt-2">
                <span>最低: {{ minFFMI.toFixed(2) }}</span>
                <span>最高: {{ maxFFMI.toFixed(2) }}</span>
              </div>
              <!-- FFMI等级说明 -->
              <div class="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                <div class="flex justify-between">
                  <span>18-20: 普通</span>
                  <span>20-22: 良好</span>
                  <span>22-25: 优秀</span>
                  <span>&gt;25: 精英</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 最近记录 -->
        <Card v-if="progressStore.recentRecords.length > 0">
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <History class="w-4 h-4" />
              最近记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="record in progressStore.recentRecords.slice(0, 5)"
                :key="record.id"
                class="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p class="text-sm font-medium">{{ record.date }}</p>
                  <p class="text-xs text-muted-foreground">
                    体重: {{ record.weight }}kg
                    <span v-if="record.bodyFat"> · 体脂: {{ record.bodyFat }}%</span>
                  </p>
                </div>
                <Button variant="ghost" size="sm" @click="handleRecordClick(record)">
                  查看
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 空状态 -->
        <div v-if="!progressStore.loading && !progressStore.hasData" class="text-center py-12">
          <Target class="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p class="text-muted-foreground mb-4">还没有进度记录</p>
          <Button @click="handleAddRecord">
            <Plus class="w-4 h-4 mr-2" />
            添加第一条记录
          </Button>
        </div>
      </div>
    </main>

    <!-- 添加记录对话框 -->
    <Dialog v-model:open="showAddRecordDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加进度记录</DialogTitle>
          <DialogDescription>
            记录您的体重和身体数据，数据将同步到您的个人档案
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>日期</Label>
            <Input v-model="newRecord.date" type="date" />
          </div>
          <div class="space-y-2">
            <Label>体重 (kg) <span class="text-red-500">*</span></Label>
            <Input 
              v-model.number="newRecord.weight" 
              type="number" 
              step="0.1" 
              :placeholder="currentWeight ? `当前: ${currentWeight}kg` : '70.0'"
            />
          </div>
          <div class="space-y-2">
            <Label>体脂率 (%) - 可选</Label>
            <Input 
              v-model.number="newRecord.bodyFat" 
              type="number" 
              step="0.1" 
              :placeholder="currentBodyFat ? `当前: ${currentBodyFat}%` : '15.0'"
            />
          </div>
          <div class="space-y-2">
            <Label>备注 - 可选</Label>
            <Input v-model="newRecord.notes" placeholder="今天感觉不错" />
          </div>
          
          <!-- 提示信息 -->
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
            <p>💡 保存后将自动：</p>
            <ul class="list-disc list-inside mt-1 space-y-1">
              <li>更新您的个人档案体重数据</li>
              <li>重新计算FFMI指数</li>
              <li>同步到AI智能顾问</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddRecordDialog = false">取消</Button>
          <Button @click="handleSaveRecord" :disabled="saving">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 浮动添加按钮 -->
    <Button
      class="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg"
      @click="handleAddRecord"
    >
      <Plus class="w-6 h-6" />
    </Button>

    <!-- 目标编辑对话框 -->
    <Dialog v-model:open="showEditGoalDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑目标</DialogTitle>
          <DialogDescription>
            {{ editingGoal?.name }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>当前值 ({{ editingGoal?.unit }})</Label>
            <Input 
              v-model.number="editGoalForm.currentValue" 
              type="number" 
              step="0.1" 
              :placeholder="`当前: ${editingGoal?.currentValue}`"
            />
          </div>
          <div class="space-y-2">
            <Label>目标值 ({{ editingGoal?.unit }})</Label>
            <Input 
              v-model.number="editGoalForm.targetValue" 
              type="number" 
              step="0.1" 
              :placeholder="`目标: ${editingGoal?.targetValue}`"
            />
          </div>
          
          <!-- 体重目标同步提示 -->
          <div v-if="editingGoal?.type === 'weight'" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
            <p>💡 体重目标将自动同步到您的个人档案</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showEditGoalDialog = false">取消</Button>
          <Button @click="handleSaveGoal" :disabled="saving">
            <Loader2 v-if="saving" class="w-4 h-4 mr-2 animate-spin" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, RefreshCw, Dumbbell, Calendar, Scale, TrendingUp,
  History, Target, Plus, Loader2
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import TrainingCalendar from '@/components/progress/TrainingCalendar.vue'
import GoalProgress from '@/components/progress/GoalProgress.vue'
import { useProgressStore } from '@/stores/progress'
import { useUserStore } from '@/stores/user'
import type { ProgressRecord, FitnessGoal } from '@/api/progress'

const router = useRouter()
const { toast } = useToast()
const progressStore = useProgressStore()
const userStore = useUserStore()

// ============ 状态 ============

const refreshing = ref(false)
const calendarLoading = ref(false)
const goalsLoading = ref(false)
const showAddRecordDialog = ref(false)
const saving = ref(false)

const newRecord = ref({
  date: new Date().toISOString().split('T')[0],
  weight: undefined as number | undefined,
  bodyFat: undefined as number | undefined,
  notes: '',
})

// 目标编辑状态
const showEditGoalDialog = ref(false)
const editingGoal = ref<FitnessGoal | null>(null)
const editGoalForm = ref({
  currentValue: undefined as number | undefined,
  targetValue: undefined as number | undefined,
})

// ============ 计算属性 ============

/** 当前体重（优先从用户档案获取） */
const currentWeight = computed(() => {
  return userStore.userProfile?.basic_info.weight || progressStore.stats.currentWeight || null
})

/** 当前体脂（优先从用户档案获取） */
const currentBodyFat = computed(() => {
  return userStore.userProfile?.basic_info.body_fat_percentage || progressStore.stats.currentBodyFat || null
})

/** 当前FFMI（优先从用户档案获取） */
const currentFFMI = computed(() => {
  return userStore.ffmiData?.ffmi || progressStore.stats.currentFFMI || null
})

/** 体重趋势最小值 */
const minWeight = computed(() => {
  if (progressStore.weightTrend.length === 0) return 0
  return Math.min(...progressStore.weightTrend.map(w => w.weight))
})

/** 体重趋势最大值 */
const maxWeight = computed(() => {
  if (progressStore.weightTrend.length === 0) return 0
  return Math.max(...progressStore.weightTrend.map(w => w.weight))
})

/** 训练量最小值 */
const minVolume = computed(() => {
  if (progressStore.volumeTrend.length === 0) return 0
  return Math.min(...progressStore.volumeTrend.map(v => v.volume))
})

/** 训练量最大值 */
const maxVolume = computed(() => {
  if (progressStore.volumeTrend.length === 0) return 0
  return Math.max(...progressStore.volumeTrend.map(v => v.volume))
})

/** FFMI最小值 */
const minFFMI = computed(() => {
  if (progressStore.ffmiTrend.length === 0) return 0
  return Math.min(...progressStore.ffmiTrend.map(f => f.ffmi))
})

/** FFMI最大值 */
const maxFFMI = computed(() => {
  if (progressStore.ffmiTrend.length === 0) return 0
  return Math.max(...progressStore.ffmiTrend.map(f => f.ffmi))
})

// ============ 生命周期 ============

onMounted(async () => {
  // 初始化用户档案（如果还没有）
  if (!userStore.userProfile) {
    await userStore.init()
  }
  
  // 初始化进度数据
  await progressStore.init()
})

// ============ 方法 ============

async function handleRefresh() {
  refreshing.value = true
  try {
    await progressStore.refresh()
    toast({ description: '刷新成功' })
  } catch (err) {
    toast({ description: '刷新失败，请稍后重试', variant: 'destructive' })
  } finally {
    refreshing.value = false
  }
}

async function handleMonthChange(year: number, month: number) {
  calendarLoading.value = true
  try {
    await progressStore.loadCalendar(year, month)
  } finally {
    calendarLoading.value = false
  }
}

function handleDayClick(_date: string) {
  // 预留：点击日期后展示当日训练详情
}

function handleViewDetail(date: string) {
  router.push(`/training/history?date=${date}`)
}

function handleAddGoal() {
  toast({ description: '目标设置功能即将上线' })
}

function handleGoalClick(goal: FitnessGoal) {
  // 打开目标编辑对话框
  editingGoal.value = goal
  editGoalForm.value = {
    currentValue: goal.currentValue,
    targetValue: goal.targetValue,
  }
  showEditGoalDialog.value = true
}

async function handleSaveGoal() {
  if (!editingGoal.value) return
  
  saving.value = true
  
  try {
    const result = await progressStore.updateGoalWithSync(editingGoal.value.id, {
      current_value: editGoalForm.value.currentValue,
      target_value: editGoalForm.value.targetValue,
    })
    
    if (result.success) {
      toast({ description: result.message })
      showEditGoalDialog.value = false
      editingGoal.value = null
    } else {
      toast({ description: result.message, variant: 'destructive' })
    }
  } catch (err: any) {
    toast({ description: err.message || '更新失败', variant: 'destructive' })
  } finally {
    saving.value = false
  }
}

function handleRecordClick(record: ProgressRecord) {
  toast({ description: `${record.date}: ${record.weight}kg` })
}

function handleAddRecord() {
  // 预填充当前体重
  newRecord.value = {
    date: new Date().toISOString().split('T')[0],
    weight: currentWeight.value || undefined,
    bodyFat: currentBodyFat.value || undefined,
    notes: '',
  }
  showAddRecordDialog.value = true
}

async function handleSaveRecord() {
  if (!newRecord.value.weight) {
    toast({ description: '请输入体重', variant: 'destructive' })
    return
  }
  
  saving.value = true
  
  try {
    const result = await progressStore.addRecord({
      date: newRecord.value.date,
      weight: newRecord.value.weight,
      body_fat: newRecord.value.bodyFat,
      notes: newRecord.value.notes || undefined,
    })
    
    if (result.success) {
      toast({ description: result.message })
      showAddRecordDialog.value = false
    } else {
      toast({ description: result.message, variant: 'destructive' })
    }
  } catch (err: any) {
    toast({ description: err.message || '保存失败', variant: 'destructive' })
  } finally {
    saving.value = false
  }
}

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function formatDateShort(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getWeightBarHeight(weight: number): number {
  if (maxWeight.value === minWeight.value) return 50
  const range = maxWeight.value - minWeight.value
  return ((weight - minWeight.value) / range) * 80 + 20
}

function getVolumeBarHeight(volume: number): number {
  if (maxVolume.value === minVolume.value) return 50
  const range = maxVolume.value - minVolume.value
  return ((volume - minVolume.value) / range) * 80 + 20
}

function getFFMIBarHeight(ffmi: number): number {
  if (maxFFMI.value === minFFMI.value) return 50
  const range = maxFFMI.value - minFFMI.value
  return ((ffmi - minFFMI.value) / range) * 80 + 20
}
</script>
