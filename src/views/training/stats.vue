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
          variant="outline"
          size="sm"
          @click="refreshStats"
          :disabled="loading"
        >
          <RefreshCw class="w-4 h-4 mr-1" :class="{ 'animate-spin': loading }" />
          刷新
        </Button>
      </div>
      <h1 class="text-2xl font-bold">训练统计</h1>
      <p class="text-sm text-muted-foreground mt-1">
        追踪您的训练进度和成果
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading && !stats" class="space-y-4">
      <Card v-for="i in 3" :key="i" class="p-6">
        <div class="animate-pulse space-y-3">
          <div class="h-4 bg-muted rounded w-1/3"></div>
          <div class="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    </div>

    <!-- 统计数据 -->
    <div v-else-if="stats" class="space-y-6">
      <!-- 总体统计 -->
      <div class="grid grid-cols-2 gap-4">
        <Card>
          <CardContent class="pt-6">
            <div class="text-sm text-muted-foreground mb-1">总训练次数</div>
            <div class="text-3xl font-bold">{{ stats.totalSessions }}</div>
            <div class="text-xs text-muted-foreground mt-1">次</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="text-sm text-muted-foreground mb-1">总训练量</div>
            <div class="text-3xl font-bold">{{ formatNumber(stats.totalVolume) }}</div>
            <div class="text-xs text-muted-foreground mt-1">kg</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="text-sm text-muted-foreground mb-1">总组数</div>
            <div class="text-3xl font-bold">{{ stats.totalSets }}</div>
            <div class="text-xs text-muted-foreground mt-1">组</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="pt-6">
            <div class="text-sm text-muted-foreground mb-1">平均RPE</div>
            <div class="text-3xl font-bold">{{ stats.averageRPE.toFixed(1) }}</div>
            <div class="text-xs text-muted-foreground mt-1">/10</div>
          </CardContent>
        </Card>
      </div>

      <!-- 训练频率 -->
      <Card>
        <CardHeader>
          <CardTitle>训练频率</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <div class="text-sm text-muted-foreground mb-1">每星期训练</div>
              <div class="text-2xl font-bold">{{ stats.trainingFrequency.toFixed(1) }}</div>
              <div class="text-xs text-muted-foreground">次/星期</div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">当前连续</div>
              <div class="text-2xl font-bold">{{ stats.currentStreak }}</div>
              <div class="text-xs text-muted-foreground">天</div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">最长连续</div>
              <div class="text-2xl font-bold">{{ stats.longestStreak }}</div>
              <div class="text-xs text-muted-foreground">天</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 训练量趋势 -->
      <Card>
        <CardHeader>
          <CardTitle>训练量趋势</CardTitle>
          <CardDescription>最近30天的训练量变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref="volumeChartRef" class="h-64"></div>
        </CardContent>
      </Card>

      <!-- 训练频率趋势 -->
      <Card>
        <CardHeader>
          <CardTitle>训练频率趋势</CardTitle>
          <CardDescription>最近8星期的训练频率</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref="frequencyChartRef" class="h-64"></div>
        </CardContent>
      </Card>

      <!-- 动作进步趋势 -->
      <Card v-if="stats.progressTrend.length > 0">
        <CardHeader>
          <CardTitle>动作进步趋势</CardTitle>
          <CardDescription>选择动作查看进步情况</CardDescription>
        </CardHeader>
        <CardContent>
          <!-- 动作选择器 -->
          <div class="mb-4">
            <Label class="mb-2 block">选择动作</Label>
            <select
              v-model="selectedExerciseId"
              class="w-full p-2 border rounded-md"
              @change="updateProgressChart"
            >
              <option
                v-for="exercise in stats.progressTrend"
                :key="exercise.exerciseId"
                :value="exercise.exerciseId"
              >
                {{ exercise.exerciseName }}
              </option>
            </select>
          </div>

          <!-- 进步图表 -->
          <div ref="progressChartRef" class="h-64"></div>
        </CardContent>
      </Card>

      <!-- 空状态 -->
      <Card v-else class="p-8">
        <div class="text-center">
          <div class="text-4xl mb-4">📊</div>
          <h3 class="text-lg font-semibold mb-2">暂无进步数据</h3>
          <p class="text-sm text-muted-foreground">
            继续训练以查看进步趋势
          </p>
        </div>
      </Card>
    </div>

    <!-- 错误状态 -->
    <Card v-else class="p-8">
      <div class="text-center">
        <div class="text-4xl mb-4">⚠️</div>
        <h3 class="text-lg font-semibold mb-2">加载失败</h3>
        <p class="text-sm text-muted-foreground mb-4">
          无法加载训练统计数据
        </p>
        <Button @click="refreshStats">重试</Button>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast/use-toast'
import { getTrainingStats, type TrainingStats } from '@/api/training-session'
// 按需导入ECharts核心模块
import * as echarts from 'echarts/core'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts } from 'echarts/core'

// 注册必要的组件
echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  MarkLineComponent,
  CanvasRenderer,
])

const router = useRouter()
const { toast } = useToast()

// ============ 状态 ============

const stats = ref<TrainingStats | null>(null)
const loading = ref(false)
const selectedExerciseId = ref<number | null>(null)

// 图表引用
const volumeChartRef = ref<HTMLElement | null>(null)
const frequencyChartRef = ref<HTMLElement | null>(null)
const progressChartRef = ref<HTMLElement | null>(null)

// 图表实例
let volumeChart: ECharts | null = null
let frequencyChart: ECharts | null = null
let progressChart: ECharts | null = null

// ============ 方法 ============

/** 格式化数字 */
function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k'
  }
  return num.toFixed(0)
}

/** 获取统计数据 */
async function refreshStats(): Promise<void> {
  loading.value = true

  try {
    // 获取最近30天的数据
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - 30)

    const response = await getTrainingStats({
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    })

    if (response.code === 200 && response.data) {
      // 转换后端数据格式到前端期望的格式
      const backendData = response.data as any
      stats.value = {
        totalSessions: backendData.total_sessions || 0,
        totalVolume: backendData.total_volume || 0,
        totalSets: backendData.total_sets || 0,
        averageRPE: backendData.avg_rpe || 0,
        trainingFrequency: backendData.training_frequency || 0,
        currentStreak: backendData.current_streak || 0,
        longestStreak: backendData.longest_streak || 0,
        volumeTrend: backendData.volume_trend || [],
        frequencyTrend: backendData.frequency_trend || [],
        progressTrend: backendData.progress_trend || [],
      }

      // 设置默认选中的动作
      if (stats.value.progressTrend.length > 0) {
        selectedExerciseId.value = stats.value.progressTrend[0].exerciseId
      }

      // 等待DOM更新后初始化图表
      await nextTick()
      initCharts()
    }
  } catch (error: any) {
    console.error('Fetch stats error:', error)
    toast({
      title: '加载失败',
      description: error.message || '获取训练统计失败',
      variant: 'destructive',
    })
  } finally {
    loading.value = false
  }
}

/** 初始化图表 */
function initCharts(): void {
  if (!stats.value) return

  // 训练量趋势图
  if (volumeChartRef.value) {
    volumeChart = echarts.init(volumeChartRef.value)
    const volumeOption = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>训练量: {c} kg',
      },
      xAxis: {
        type: 'category',
        data: stats.value.volumeTrend.map(item => {
          const date = new Date(item.date)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }),
      },
      yAxis: {
        type: 'value',
        name: '训练量 (kg)',
      },
      series: [
        {
          data: stats.value.volumeTrend.map(item => item.volume),
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.3,
          },
          itemStyle: {
            color: '#3b82f6',
          },
        },
      ],
      grid: {
        left: '10%',
        right: '5%',
        bottom: '10%',
        top: '10%',
      },
    }
    volumeChart.setOption(volumeOption)
  }

  // 训练频率趋势图
  if (frequencyChartRef.value) {
    frequencyChart = echarts.init(frequencyChartRef.value)
    const frequencyOption = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>训练次数: {c} 次',
      },
      xAxis: {
        type: 'category',
        data: stats.value.frequencyTrend.map(item => item.week),
      },
      yAxis: {
        type: 'value',
        name: '训练次数',
      },
      series: [
        {
          data: stats.value.frequencyTrend.map(item => item.sessions),
          type: 'bar',
          itemStyle: {
            color: '#10b981',
          },
        },
      ],
      grid: {
        left: '10%',
        right: '5%',
        bottom: '10%',
        top: '10%',
      },
    }
    frequencyChart.setOption(frequencyOption)
  }

  // 动作进步趋势图
  updateProgressChart()
}

/** 更新进步图表 */
function updateProgressChart(): void {
  if (!stats.value || !progressChartRef.value || !selectedExerciseId.value) return

  const exerciseData = stats.value.progressTrend.find(
    item => item.exerciseId === selectedExerciseId.value
  )

  if (!exerciseData) return

  if (!progressChart) {
    progressChart = echarts.init(progressChartRef.value)
  }

  const progressOption = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.name}<br/>重量: ${data.value} kg`
      },
    },
    xAxis: {
      type: 'category',
      data: exerciseData.data.map(item => {
        const date = new Date(item.date)
        return `${date.getMonth() + 1}/${date.getDate()}`
      }),
    },
    yAxis: {
      type: 'value',
      name: '重量 (kg)',
    },
    series: [
      {
        data: exerciseData.data.map(item => item.weight),
        type: 'line',
        smooth: true,
        itemStyle: {
          color: '#f59e0b',
        },
        markLine: {
          data: [{ type: 'average', name: '平均值' }],
        },
      },
    ],
    grid: {
      left: '10%',
      right: '5%',
      bottom: '10%',
      top: '10%',
    },
  }

  progressChart.setOption(progressOption)
}

/** 清理图表 */
function disposeCharts(): void {
  if (volumeChart) {
    volumeChart.dispose()
    volumeChart = null
  }
  if (frequencyChart) {
    frequencyChart.dispose()
    frequencyChart = null
  }
  if (progressChart) {
    progressChart.dispose()
    progressChart = null
  }
}

// ============ 生命周期 ============

// SEC-9: 使用命名函数引用，确保 onUnmounted 能正确移除
const handleResize = () => {
  volumeChart?.resize()
  frequencyChart?.resize()
  progressChart?.resize()
}

onMounted(() => {
  refreshStats()
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理图表和事件监听
import { onUnmounted } from 'vue'
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  disposeCharts()
})
</script>
