<script setup lang="ts">
/**
 * 训练计划列表页面
 * 
 * 显示所有训练计划（AI生成、手动创建、导入）
 * 支持筛选、排序和管理操作
 * 
 * @author BUILD_BODY Team
 * @version 1.0.0
 * @created 2025-01-03
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTrainingStore } from '@/stores/training'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  Plus, 
  Dumbbell, 
  Calendar, 
  Target, 
  Trash2, 
  Star, 
  Clock,
  Filter,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-vue-next'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// ============ 状态 ============

const router = useRouter()
const trainingStore = useTrainingStore()
const { toast } = useToast()

const refreshing = ref(false)
const showDeleteDialog = ref(false)
const planToDelete = ref<number | null>(null)

// ============ 计算属性 ============

const loading = computed(() => trainingStore.loading)
const plans = computed(() => trainingStore.filteredPlans)
const activePlans = computed(() => trainingStore.activePlans)
const archivedPlans = computed(() => trainingStore.archivedPlans)
const filters = computed(() => trainingStore.filters)

// ============ 生命周期 ============

onMounted(async () => {
  await loadPlans()
})

// ============ 方法 ============

async function loadPlans() {
  try {
    await trainingStore.fetchPlans()
  } catch (error: any) {
    toast({
      title: '加载失败',
      description: error.message || '无法加载训练计划',
      variant: 'destructive',
    })
  }
}

async function handleRefresh() {
  refreshing.value = true
  try {
    await trainingStore.fetchPlans()
    toast({
      title: '刷新成功',
      description: '训练计划已更新',
    })
  } catch (error: any) {
    toast({
      title: '刷新失败',
      description: error.message || '无法刷新训练计划',
      variant: 'destructive',
    })
  } finally {
    refreshing.value = false
  }
}

function handlePlanClick(planId: number) {
  router.push(`/training/plans/${planId}`)
}

function handleCreatePlan() {
  // 跳转到AI聊天页面生成训练计划
  router.push({
    path: '/ai/chat',
    query: { action: 'generate-plan' }
  })
}

function handleDeleteClick(planId: number, event: Event) {
  event.stopPropagation()
  planToDelete.value = planId
  showDeleteDialog.value = true
}

async function confirmDelete() {
  if (!planToDelete.value) return
  
  try {
    await trainingStore.deletePlan(planToDelete.value)
    toast({
      title: '删除成功',
      description: '训练计划已删除',
    })
  } catch (error: any) {
    toast({
      title: '删除失败',
      description: error.message || '无法删除训练计划',
      variant: 'destructive',
    })
  } finally {
    planToDelete.value = null
    showDeleteDialog.value = false
  }
}

function handleFilterChange(key: string, value: string) {
  trainingStore.setFilters({ [key]: value })
}

function formatDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: zhCN,
    })
  } catch {
    return dateStr
  }
}

function getDifficultyLabel(difficulty?: string): string {
  const map: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
  }
  return map[difficulty || ''] || '中级'
}

function getDifficultyColor(difficulty?: string): string {
  const map: Record<string, string> = {
    beginner: 'bg-green-500',
    intermediate: 'bg-yellow-500',
    advanced: 'bg-red-500',
  }
  return map[difficulty || ''] || 'bg-yellow-500'
}

function getTypeLabel(type: string): string {
  const map: Record<string, string> = {
    ai_generated: '智能生成',
    manual: '手动创建',
    imported: '导入',
  }
  return map[type] || type
}

function goBack() {
  router.push('/training')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 页面头部 -->
    <div class="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <!-- 导航栏 -->
      <div class="flex items-center justify-between px-4 py-3">
        <Button variant="ghost" size="icon" class="text-primary-foreground hover:bg-primary-foreground/10" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="text-lg font-semibold">我的训练计划</h1>
        <Button variant="ghost" size="icon" class="text-primary-foreground hover:bg-primary-foreground/10" :disabled="refreshing" @click="handleRefresh">
          <RefreshCw :class="['h-5 w-5', refreshing && 'animate-spin']" />
        </Button>
      </div>
      
      <!-- 标题区域 -->
      <div class="px-4 pb-6">
        <p class="text-sm text-primary-foreground/80">管理您的训练计划，开始科学训练</p>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="sticky top-0 z-10 bg-background border-b px-4 py-3">
      <div class="flex items-center gap-3">
        <Filter class="h-4 w-4 text-muted-foreground" />
        
        <Select :model-value="filters.status" @update:model-value="(v) => handleFilterChange('status', v)">
          <SelectTrigger class="w-24 h-8 text-xs">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">进行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="filters.difficulty" @update:model-value="(v) => handleFilterChange('difficulty', v)">
          <SelectTrigger class="w-24 h-8 text-xs">
            <SelectValue placeholder="难度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="beginner">初级</SelectItem>
            <SelectItem value="intermediate">中级</SelectItem>
            <SelectItem value="advanced">高级</SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="filters.sortBy" @update:model-value="(v) => handleFilterChange('sortBy', v)">
          <SelectTrigger class="w-24 h-8 text-xs">
            <SelectValue placeholder="排序" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">创建时间</SelectItem>
            <SelectItem value="name">名称</SelectItem>
            <SelectItem value="frequency">频率</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="p-4 pb-24 space-y-6">
      <!-- 加载骨架屏 -->
      <div v-if="loading && plans.length === 0" class="space-y-4">
        <div v-for="i in 3" :key="i" class="space-y-3">
          <Skeleton class="h-6 w-32" />
          <Card>
            <CardContent class="p-4">
              <Skeleton class="h-5 w-3/4 mb-2" />
              <Skeleton class="h-4 w-1/2 mb-3" />
              <div class="flex gap-2">
                <Skeleton class="h-6 w-16" />
                <Skeleton class="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- 计划列表 -->
      <template v-else-if="plans.length > 0">
        <!-- 当前计划 -->
        <div v-if="activePlans.length > 0" class="space-y-3">
          <div class="flex items-center gap-2 text-sm font-medium">
            <Star class="h-4 w-4 text-primary" />
            <span>当前计划</span>
          </div>
          
          <Card 
            v-for="plan in activePlans" 
            :key="plan.id"
            class="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
            @click="handlePlanClick(plan.id)"
          >
            <CardContent class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-medium truncate">{{ plan.name }}</h3>
                    <Badge variant="default" class="text-xs">当前</Badge>
                    <Badge v-if="plan.type === 'ai_generated'" variant="outline" class="text-xs">
                      <Sparkles class="h-3 w-3 mr-1" />
                      {{ getTypeLabel(plan.type) }}
                    </Badge>
                  </div>
                  
                  <p v-if="plan.description" class="text-sm text-muted-foreground line-clamp-1 mb-2">
                    {{ plan.description }}
                  </p>
                  
                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />
                      {{ plan.weeks }}周
                    </span>
                    <span class="flex items-center gap-1">
                      <Dumbbell class="h-3 w-3" />
                      {{ plan.frequency }}天/周
                    </span>
                    <span class="flex items-center gap-1">
                      <Target class="h-3 w-3" />
                      {{ plan.exerciseCount }}个动作
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock class="h-3 w-3" />
                    <span>创建于{{ formatDate(plan.createdAt) }}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2 ml-2">
                  <Badge :class="getDifficultyColor(plan.difficulty)" class="text-white text-xs">
                    {{ getDifficultyLabel(plan.difficulty) }}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    @click="handleDeleteClick(plan.id, $event)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                  <ChevronRight class="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- 归档计划 -->
        <div v-if="archivedPlans.length > 0" class="space-y-3">
          <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Dumbbell class="h-4 w-4" />
            <span>其他计划</span>
          </div>
          
          <Card 
            v-for="plan in archivedPlans" 
            :key="plan.id"
            class="cursor-pointer hover:shadow-md transition-shadow"
            @click="handlePlanClick(plan.id)"
          >
            <CardContent class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-medium truncate">{{ plan.name }}</h3>
                    <Badge v-if="plan.type === 'ai_generated'" variant="outline" class="text-xs">
                      <Sparkles class="h-3 w-3 mr-1" />
                      {{ getTypeLabel(plan.type) }}
                    </Badge>
                  </div>
                  
                  <div class="flex items-center gap-4 text-xs text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />
                      {{ plan.weeks }}周
                    </span>
                    <span class="flex items-center gap-1">
                      <Dumbbell class="h-3 w-3" />
                      {{ plan.frequency }}天/周
                    </span>
                    <span class="flex items-center gap-1">
                      <Target class="h-3 w-3" />
                      {{ plan.exerciseCount }}个动作
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock class="h-3 w-3" />
                    <span>创建于{{ formatDate(plan.createdAt) }}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-2 ml-2">
                  <Badge :class="getDifficultyColor(plan.difficulty)" class="text-white text-xs">
                    {{ getDifficultyLabel(plan.difficulty) }}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-destructive hover:text-destructive"
                    @click="handleDeleteClick(plan.id, $event)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                  <ChevronRight class="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Dumbbell class="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-medium mb-2">还没有训练计划</h3>
        <p class="text-sm text-muted-foreground mb-6">让智能健身顾问为您定制专属训练计划</p>
        <Button @click="handleCreatePlan">
          <Sparkles class="h-4 w-4 mr-2" />
          生成训练计划
        </Button>
      </div>
    </div>

    <!-- 浮动按钮 -->
    <div v-if="plans.length > 0" class="fixed bottom-6 right-6">
      <Button size="lg" class="rounded-full shadow-lg h-14 w-14" @click="handleCreatePlan">
        <Plus class="h-6 w-6" />
      </Button>
    </div>

    <!-- 删除确认对话框 -->
    <AlertDialog :open="showDeleteDialog" @update:open="showDeleteDialog = $event">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除训练计划</AlertDialogTitle>
          <AlertDialogDescription>
            确定要删除这个训练计划吗？此操作无法撤销。
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
