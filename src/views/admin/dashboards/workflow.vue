<script setup lang="ts">
/**
 * 工作流性能优化监控 Dashboard
 * 对应 Grafana: workflow-performance-optimization.json
 * 
 * 展示：工作流总耗时、步骤级别性能、缓存命中率L1/L2/L3、连接池、LLM调用、并发限流
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, RefreshCw, GitBranch, Clock, Database, 
  Layers, Cpu, AlertTriangle, CheckCircle2, Zap, Server, HelpCircle, X
} from 'lucide-vue-next'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import StatCard from '@/components/charts/StatCard.vue'
import api from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const autoRefresh = ref(true)
const timeRange = ref('1h')
const showGuide = ref(true)
let refreshTimer: number | null = null

// 指标数据
const workflowStats = ref<any>(null)

// 时序数据
const workflowDurationData = ref<any[]>([])
const stepPerformanceData = ref<any[]>([])
const cacheHitRateData = ref<any[]>([])
const cacheOpsData = ref<any[]>([])
const connectionPoolData = ref<any[]>([])
const llmSuccessRateData = ref<any[]>([])
const llmDurationData = ref<any[]>([])
const concurrencyData = ref<any[]>([])

// 时间范围选项
const timeRanges = [
  { value: '15m', label: '15分钟' },
  { value: '1h', label: '1小时' },
  { value: '6h', label: '6小时' },
  { value: '24h', label: '24小时' }
]

// 工作流步骤定义
const workflowSteps = [
  { key: 'step1', name: '步骤1-用户档案加载', target: 0.5 },
  { key: 'step3', name: '步骤3-会员权限检查', target: 0.1 },
  { key: 'step4', name: '步骤4-BGE复杂度分类', target: 1.0 },
  { key: 'step6_5', name: '步骤6.5-LLM选择DAG', target: 3.0 },
  { key: 'step7', name: '步骤7-DAG编排执行', target: 5.0 },
  { key: 'step8', name: '步骤8-三层检索', target: 2.0 },
  { key: 'step10', name: '步骤10-LLM深度分析', target: 10.0 }
]

// 计算时间范围
function getTimeRange() {
  const now = Math.floor(Date.now() / 1000)
  const ranges: Record<string, number> = {
    '15m': 15 * 60,
    '1h': 60 * 60,
    '6h': 6 * 60 * 60,
    '24h': 24 * 60 * 60
  }
  const duration = ranges[timeRange.value] || 3600
  return {
    start: now - duration,
    end: now,
    step: duration > 3600 ? '60s' : '15s'
  }
}

// 加载所有数据
async function loadAllData() {
  loading.value = true
  try {
    await Promise.all([
      loadWorkflowStats(),
      loadPrometheusData()
    ])
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

// 加载工作流统计
async function loadWorkflowStats() {
  try {
    const res = await api.get('/admin/metrics/daml-rag/metrics')
    if (res.code === 200 && res.data?.data) {
      workflowStats.value = res.data.data
    }
  } catch (e) {
    console.warn('工作流统计加载失败', e)
    // 使用模拟数据
    workflowStats.value = {
      workflow: {
        success_rate: 0.96,
        concurrent_requests: 12,
        bottleneck_total: 3,
        avg_duration: 15.2
      },
      cache: {
        l1_hit_rate: 0.85,
        l2_hit_rate: 0.65,
        l3_hit_rate: 0.45
      },
      llm: {
        deepseek_success_rate: 0.98,
        ollama_success_rate: 0.95,
        fallback_count: 5
      }
    }
  }
}

// 加载Prometheus数据
async function loadPrometheusData() {
  const { start, end, step } = getTimeRange()
  
  const queries = {
    // 工作流总耗时
    workflow_p50: 'histogram_quantile(0.50, rate(workflow_total_duration_seconds_bucket[5m]))',
    workflow_p95: 'histogram_quantile(0.95, rate(workflow_total_duration_seconds_bucket[5m]))',
    workflow_p99: 'histogram_quantile(0.99, rate(workflow_total_duration_seconds_bucket[5m]))',
    // 缓存命中率
    cache_l1: 'rate(cache_hits_total{level="L1"}[5m]) / (rate(cache_hits_total{level="L1"}[5m]) + rate(cache_misses_total{level="L1"}[5m]))',
    cache_l2: 'rate(cache_hits_total{level="L2"}[5m]) / (rate(cache_hits_total{level="L2"}[5m]) + rate(cache_misses_total{level="L2"}[5m]))',
    cache_l3: 'rate(cache_hits_total{level="L3"}[5m]) / (rate(cache_hits_total{level="L3"}[5m]) + rate(cache_misses_total{level="L3"}[5m]))',
    // LLM成功率
    llm_deepseek: 'rate(llm_call_success_total{backend="deepseek"}[5m]) / (rate(llm_call_success_total{backend="deepseek"}[5m]) + rate(llm_call_failure_total{backend="deepseek"}[5m]))',
    llm_ollama: 'rate(llm_call_success_total{backend="ollama"}[5m]) / (rate(llm_call_success_total{backend="ollama"}[5m]) + rate(llm_call_failure_total{backend="ollama"}[5m]))',
    // 并发
    concurrent_active: 'concurrency_limiter_active_requests',
    concurrent_queued: 'concurrency_limiter_queued_requests'
  }
  
  try {
    const res = await api.post('/admin/metrics/batch', {
      queries,
      start,
      end,
      step
    })
    
    if (res.code === 200 && res.data) {
      processPrometheusData(res.data)
    }
  } catch (e) {
    console.warn('Prometheus数据加载失败，使用模拟数据', e)
    generateMockData()
  }
}

// 处理Prometheus数据
function processPrometheusData(data: any) {
  // 工作流总耗时
  const workflowSeries = []
  const percentiles = [
    { key: 'workflow_p50', name: 'P50', color: '#3b82f6' },
    { key: 'workflow_p95', name: 'P95', color: '#f59e0b' },
    { key: 'workflow_p99', name: 'P99', color: '#ef4444' }
  ]
  
  for (const p of percentiles) {
    if (data[p.key]?.status === 'success') {
      const result = data[p.key].data?.data?.result?.[0]
      if (result?.values) {
        workflowSeries.push({
          name: p.name,
          data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
          color: p.color
        })
      }
    }
  }
  workflowDurationData.value = workflowSeries.length > 0 ? workflowSeries : generateMockSeries(['P50', 'P95', 'P99'], 15, 5)
  
  // 缓存命中率
  const cacheSeries = []
  const cacheLevels = [
    { key: 'cache_l1', name: 'L1 内存缓存', color: '#10b981' },
    { key: 'cache_l2', name: 'L2 Redis缓存', color: '#3b82f6' },
    { key: 'cache_l3', name: 'L3 数据库', color: '#8b5cf6' }
  ]
  
  for (const c of cacheLevels) {
    if (data[c.key]?.status === 'success') {
      const result = data[c.key].data?.data?.result?.[0]
      if (result?.values) {
        cacheSeries.push({
          name: c.name,
          data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
          color: c.color
        })
      }
    }
  }
  cacheHitRateData.value = cacheSeries.length > 0 ? cacheSeries : generateMockSeries(['L1 内存缓存', 'L2 Redis缓存', 'L3 数据库'], 0.7, 0.2)
  
  // LLM成功率
  const llmSeries = []
  const llmBackends = [
    { key: 'llm_deepseek', name: 'DeepSeek', color: '#3b82f6' },
    { key: 'llm_ollama', name: 'Ollama', color: '#10b981' }
  ]
  
  for (const l of llmBackends) {
    if (data[l.key]?.status === 'success') {
      const result = data[l.key].data?.data?.result?.[0]
      if (result?.values) {
        llmSeries.push({
          name: l.name,
          data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
          color: l.color
        })
      }
    }
  }
  llmSuccessRateData.value = llmSeries.length > 0 ? llmSeries : generateMockSeries(['DeepSeek', 'Ollama'], 0.97, 0.03)
  
  // 并发数据
  const concurrencySeries = []
  if (data.concurrent_active?.status === 'success') {
    const result = data.concurrent_active.data?.data?.result?.[0]
    if (result?.values) {
      concurrencySeries.push({
        name: '活跃请求',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#3b82f6'
      })
    }
  }
  if (data.concurrent_queued?.status === 'success') {
    const result = data.concurrent_queued.data?.data?.result?.[0]
    if (result?.values) {
      concurrencySeries.push({
        name: '队列中请求',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#f59e0b'
      })
    }
  }
  concurrencyData.value = concurrencySeries.length > 0 ? concurrencySeries : generateMockSeries(['活跃请求', '队列中请求'], 10, 5)
}

// 生成模拟时序数据
function generateMockSeries(names: string[], baseValue: number, variance: number) {
  const now = Date.now()
  const points = 60
  const interval = 60000
  const colors = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6']
  
  return names.map((name, i) => ({
    name,
    data: Array.from({ length: points }, (_, j) => [
      now - (points - j) * interval,
      Math.max(0, baseValue * (1 - i * 0.15) + (Math.random() - 0.5) * variance)
    ]),
    color: colors[i % colors.length]
  }))
}

// 生成模拟数据
function generateMockData() {
  workflowDurationData.value = generateMockSeries(['P50', 'P95', 'P99'], 15, 5)
  stepPerformanceData.value = generateMockSeries(
    workflowSteps.map(s => s.name.split('-')[1]),
    3, 1
  )
  cacheHitRateData.value = generateMockSeries(['L1 内存缓存', 'L2 Redis缓存', 'L3 数据库'], 0.7, 0.2)
  cacheOpsData.value = generateMockSeries(['缓存命中', '缓存未命中', '缓存淘汰'], 50, 20)
  connectionPoolData.value = generateMockSeries(['MySQL活跃', 'Neo4j活跃', 'HTTP活跃'], 5, 3)
  llmSuccessRateData.value = generateMockSeries(['DeepSeek', 'Ollama'], 0.97, 0.03)
  llmDurationData.value = generateMockSeries(['DeepSeek P95', 'Ollama P95'], 8, 3)
  concurrencyData.value = generateMockSeries(['活跃请求', '队列中请求'], 10, 5)
}

// 计算指标
const workflowSuccessRate = computed(() => workflowStats.value?.workflow?.success_rate || 0.96)
const concurrentRequests = computed(() => workflowStats.value?.workflow?.concurrent_requests || 0)
const bottleneckTotal = computed(() => workflowStats.value?.workflow?.bottleneck_total || 0)
const avgDuration = computed(() => workflowStats.value?.workflow?.avg_duration || 0)

// 缓存命中率
const cacheRates = computed(() => ({
  l1: workflowStats.value?.cache?.l1_hit_rate || 0.85,
  l2: workflowStats.value?.cache?.l2_hit_rate || 0.65,
  l3: workflowStats.value?.cache?.l3_hit_rate || 0.45
}))

function goBack() {
  router.push('/admin/ai-monitor')
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value
  if (autoRefresh.value) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = window.setInterval(loadAllData, 30000)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  loadAllData()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div class="flex-1 flex items-center justify-center gap-2">
          <GitBranch class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">工作流性能</h1>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="showGuide = true">
            <HelpCircle class="h-4 w-4" />
          </Button>
          <Select v-model="timeRange" @update:model-value="loadAllData">
            <SelectTrigger class="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in timeRanges" :key="t.value" :value="t.value">
                {{ t.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" @click="toggleAutoRefresh">
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading, 'text-green-500': autoRefresh }" />
          </Button>
        </div>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 简单指南卡片 -->
      <Card v-if="showGuide" class="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base flex items-center gap-2 text-green-700 dark:text-green-300">
              <HelpCircle class="h-4 w-4" />
              📖 这个页面是什么？
            </CardTitle>
            <Button variant="ghost" size="icon" class="h-6 w-6" @click="showGuide = false">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="text-sm text-green-800 dark:text-green-200 space-y-2">
          <p><strong>工作流性能</strong>显示AI处理请求的内部流程效率。</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">✅ 成功率 &gt; 95%</p>
              <p class="text-xs">AI工作流程正常运行</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">⏱️ 平均耗时 &lt; 20秒</p>
              <p class="text-xs">处理速度正常</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">💾 缓存命中率高</p>
              <p class="text-xs">L1&gt;80%, L2&gt;60% 表示效率好</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🔴 性能瓶颈 &gt; 10</p>
              <p class="text-xs">有问题，需要联系小川处理</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 核心指标 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="工作流成功率" 
          :value="workflowSuccessRate"
          format="percent"
          :status="workflowSuccessRate >= 0.95 ? 'success' : workflowSuccessRate >= 0.9 ? 'warning' : 'error'"
          :icon="CheckCircle2"
        />
        <StatCard 
          title="并发请求数" 
          :value="concurrentRequests"
          :status="concurrentRequests > 80 ? 'error' : concurrentRequests > 50 ? 'warning' : 'success'"
          :icon="Zap"
        />
        <StatCard 
          title="性能瓶颈" 
          :value="bottleneckTotal"
          :status="bottleneckTotal > 10 ? 'error' : bottleneckTotal > 5 ? 'warning' : 'success'"
          :icon="AlertTriangle"
        />
        <StatCard 
          title="平均耗时" 
          :value="avgDuration"
          format="duration"
          :status="avgDuration < 20 ? 'success' : avgDuration < 30 ? 'warning' : 'error'"
          :icon="Clock"
        />
      </div>

      <!-- 工作流总耗时 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Clock class="h-4 w-4" />
            工作流总耗时 (P50, P95, P99)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="workflowDurationData"
            yAxisLabel="Duration"
            yAxisFormat="duration"
            height="250px"
          />
        </CardContent>
      </Card>

      <!-- 缓存命中率概览 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Database class="h-4 w-4" />
            缓存命中率概览
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>L1 内存缓存</span>
              <span class="font-medium">{{ (cacheRates.l1 * 100).toFixed(1) }}%</span>
            </div>
            <Progress :model-value="cacheRates.l1 * 100" class="h-2" />
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>L2 Redis缓存</span>
              <span class="font-medium">{{ (cacheRates.l2 * 100).toFixed(1) }}%</span>
            </div>
            <Progress :model-value="cacheRates.l2 * 100" class="h-2" />
          </div>
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>L3 数据库</span>
              <span class="font-medium">{{ (cacheRates.l3 * 100).toFixed(1) }}%</span>
            </div>
            <Progress :model-value="cacheRates.l3 * 100" class="h-2" />
          </div>
        </CardContent>
      </Card>

      <!-- 缓存命中率趋势 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Layers class="h-4 w-4" />
            缓存命中率趋势 (L1/L2/L3)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="cacheHitRateData"
            yAxisLabel="Hit Rate"
            yAxisFormat="percent"
            height="250px"
          />
        </CardContent>
      </Card>

      <!-- LLM调用成功率 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Cpu class="h-4 w-4" />
            LLM调用成功率
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="llmSuccessRateData"
            yAxisLabel="Success Rate"
            yAxisFormat="percent"
            height="250px"
          />
        </CardContent>
      </Card>

      <!-- 并发限流统计 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Server class="h-4 w-4" />
            并发限流统计
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="concurrencyData"
            yAxisLabel="Requests"
            height="250px"
            :areaStyle="true"
          />
        </CardContent>
      </Card>

      <!-- 工作流步骤说明 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <GitBranch class="h-4 w-4" />
            DAML-RAG 11步工作流
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="step in workflowSteps" :key="step.key"
                 class="flex items-center justify-between p-3 bg-accent rounded-lg">
              <span class="text-sm">{{ step.name }}</span>
              <Badge variant="outline">目标 &lt; {{ step.target }}s</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
