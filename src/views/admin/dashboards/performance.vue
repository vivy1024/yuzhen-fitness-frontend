<script setup lang="ts">
/**
 * DAML-RAG 性能监控 Dashboard
 * 对应 Grafana: daml-rag-performance.json
 * 
 * 展示：请求耗时P95、请求速率、错误率、缓存命中率、CPU/内存、检索耗时、LLM调用耗时
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, RefreshCw, Activity, Clock, AlertTriangle, 
  Database, Cpu, HardDrive, Zap, Server, HelpCircle, X
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
const healthData = ref<any>(null)
const metricsData = ref<any>(null)
const prometheusData = ref<any[]>([])

// 时序数据
const requestDurationData = ref<any[]>([])
const requestRateData = ref<any[]>([])
const errorRateData = ref<any[]>([])
const cacheHitRateData = ref<any[]>([])
const cpuData = ref<any[]>([])
const memoryData = ref<any[]>([])

// 时间范围选项
const timeRanges = [
  { value: '15m', label: '15分钟' },
  { value: '1h', label: '1小时' },
  { value: '6h', label: '6小时' },
  { value: '24h', label: '24小时' }
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
      loadHealthData(),
      loadMetricsData(),
      loadPrometheusData()
    ])
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

// 加载健康数据
async function loadHealthData() {
  try {
    const res = await api.get('/admin/metrics/daml-rag/health')
    if (res.code === 200 && res.data?.data) {
      healthData.value = res.data.data
    }
  } catch (e) {
    console.warn('健康数据加载失败', e)
  }
}

// 加载系统指标
async function loadMetricsData() {
  try {
    const res = await api.get('/admin/metrics/daml-rag/metrics')
    if (res.code === 200 && res.data?.data) {
      metricsData.value = res.data.data
      updateSystemCharts()
    }
  } catch (e) {
    console.warn('系统指标加载失败', e)
  }
}

// 加载Prometheus数据
async function loadPrometheusData() {
  const { start, end, step } = getTimeRange()
  
  // 定义要查询的指标
  const queries = {
    request_duration_p95: 'histogram_quantile(0.95, rate(request_duration_seconds_bucket[5m]))',
    request_rate: 'rate(requests_total[5m])',
    error_rate: 'rate(errors_total[5m])',
    cache_hit_rate: 'rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))',
    cpu_usage: 'cpu_usage_percent',
    memory_usage: 'memory_usage_bytes'
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
  // 请求耗时P95
  if (data.request_duration_p95?.status === 'success') {
    const result = data.request_duration_p95.data?.data?.result || []
    requestDurationData.value = result.map((r: any) => ({
      name: r.metric?.endpoint || 'P95',
      data: (r.values || []).map((v: any) => [v[0] * 1000, parseFloat(v[1])])
    }))
  }
  
  // 请求速率
  if (data.request_rate?.status === 'success') {
    const result = data.request_rate.data?.data?.result || []
    requestRateData.value = result.map((r: any) => ({
      name: `${r.metric?.endpoint || 'requests'} - ${r.metric?.status || ''}`,
      data: (r.values || []).map((v: any) => [v[0] * 1000, parseFloat(v[1])])
    }))
  }
  
  // 错误率
  if (data.error_rate?.status === 'success') {
    const result = data.error_rate.data?.data?.result || []
    errorRateData.value = result.map((r: any) => ({
      name: r.metric?.error_type || 'errors',
      data: (r.values || []).map((v: any) => [v[0] * 1000, parseFloat(v[1])])
    }))
  }
  
  // 缓存命中率
  if (data.cache_hit_rate?.status === 'success') {
    const result = data.cache_hit_rate.data?.data?.result || []
    cacheHitRateData.value = result.map((r: any) => ({
      name: r.metric?.cache_type || 'cache',
      data: (r.values || []).map((v: any) => [v[0] * 1000, parseFloat(v[1])])
    }))
  }
}

// 更新系统图表
function updateSystemCharts() {
  if (!metricsData.value?.system) return
  
  const now = Date.now()
  const sys = metricsData.value.system
  
  // 添加新数据点
  cpuData.value = [{
    name: 'CPU',
    data: [[now, sys.cpu_percent / 100]]
  }]
  
  memoryData.value = [{
    name: 'Memory',
    data: [[now, sys.memory_percent / 100]]
  }]
}

// 生成模拟数据（当Prometheus不可用时）
function generateMockData() {
  const now = Date.now()
  const points = 60
  const interval = 60000 // 1分钟
  
  // 生成模拟时序数据
  const generateSeries = (name: string, baseValue: number, variance: number) => ({
    name,
    data: Array.from({ length: points }, (_, i) => [
      now - (points - i) * interval,
      baseValue + (Math.random() - 0.5) * variance
    ])
  })
  
  requestDurationData.value = [
    generateSeries('/api/chat P95', 2.5, 1),
    generateSeries('/api/graphrag P95', 3.2, 1.5)
  ]
  
  requestRateData.value = [
    generateSeries('200', 15, 5),
    generateSeries('500', 0.5, 0.3)
  ]
  
  errorRateData.value = [
    generateSeries('timeout', 0.1, 0.05),
    generateSeries('validation', 0.05, 0.02)
  ]
  
  cacheHitRateData.value = [
    generateSeries('L1 Memory', 0.85, 0.1),
    generateSeries('L2 Redis', 0.65, 0.15)
  ]
  
  cpuData.value = [generateSeries('CPU', 0.35, 0.2)]
  memoryData.value = [generateSeries('Memory', 0.55, 0.1)]
}

// 系统状态
const systemStatus = computed(() => {
  if (!healthData.value) return { status: 'offline', color: 'bg-gray-500', text: '离线' }
  const status = healthData.value.status
  if (status === 'healthy') return { status: 'healthy', color: 'bg-green-500', text: '健康' }
  if (status === 'degraded') return { status: 'degraded', color: 'bg-amber-500', text: '降级' }
  return { status: 'unhealthy', color: 'bg-red-500', text: '异常' }
})

// 核心指标
const coreMetrics = computed(() => {
  const sys = metricsData.value?.system || {}
  const perf = metricsData.value?.performance || {}
  
  return {
    cpu: sys.cpu_percent || 0,
    memory: sys.memory_percent || 0,
    disk: sys.disk_percent || 0,
    responseTime: perf.response_time_avg || '0s',
    requestsPerMin: perf.requests_per_minute || 0,
    errorRate: perf.error_rate || '0%'
  }
})

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
  refreshTimer = window.setInterval(loadAllData, 30000) // 30秒刷新
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
          <Activity class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">性能监控</h1>
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
      <Card v-if="showGuide" class="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <HelpCircle class="h-4 w-4" />
              📖 这个页面是什么？
            </CardTitle>
            <Button variant="ghost" size="icon" class="h-6 w-6" @click="showGuide = false">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="text-sm text-blue-800 dark:text-blue-200 space-y-2">
          <p><strong>性能监控</strong>帮助你了解AI服务是否正常运行。</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🟢 系统状态 = 健康</p>
              <p class="text-xs">一切正常，可以放心使用</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🟡 系统状态 = 降级</p>
              <p class="text-xs">部分功能可能变慢，但还能用</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🔴 系统状态 = 异常</p>
              <p class="text-xs">有问题，需要联系小川处理</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">📊 CPU/内存 &lt; 80%</p>
              <p class="text-xs">正常范围，超过80%需要关注</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 系统状态概览 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="系统状态" 
          :value="systemStatus.text"
          :status="systemStatus.status === 'healthy' ? 'success' : systemStatus.status === 'degraded' ? 'warning' : 'error'"
          :icon="Server"
        />
        <StatCard 
          title="CPU使用率" 
          :value="coreMetrics.cpu / 100"
          format="percent"
          :status="coreMetrics.cpu > 80 ? 'error' : coreMetrics.cpu > 60 ? 'warning' : 'success'"
          :icon="Cpu"
        />
        <StatCard 
          title="内存使用率" 
          :value="coreMetrics.memory / 100"
          format="percent"
          :status="coreMetrics.memory > 85 ? 'error' : coreMetrics.memory > 70 ? 'warning' : 'success'"
          :icon="HardDrive"
        />
        <StatCard 
          title="平均响应时间" 
          :value="coreMetrics.responseTime"
          :icon="Clock"
        />
      </div>

      <!-- 请求耗时 P95 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Clock class="h-4 w-4" />
            请求耗时 (P95)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="requestDurationData"
            yAxisLabel="Duration"
            yAxisFormat="duration"
            height="250px"
          />
        </CardContent>
      </Card>

      <!-- 请求速率 & 错误率 -->
      <div class="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <Zap class="h-4 w-4" />
              请求速率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart 
              :series="requestRateData"
              yAxisLabel="req/s"
              yAxisFormat="ops"
              height="200px"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <AlertTriangle class="h-4 w-4" />
              错误率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart 
              :series="errorRateData"
              yAxisLabel="errors/s"
              yAxisFormat="ops"
              height="200px"
            />
          </CardContent>
        </Card>
      </div>

      <!-- 缓存命中率 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Database class="h-4 w-4" />
            缓存命中率
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

      <!-- CPU & 内存 -->
      <div class="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <Cpu class="h-4 w-4" />
              CPU使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart 
              :series="cpuData"
              yAxisLabel="Usage"
              yAxisFormat="percent"
              height="200px"
              :areaStyle="true"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base flex items-center gap-2">
              <HardDrive class="h-4 w-4" />
              内存使用率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeSeriesChart 
              :series="memoryData"
              yAxisLabel="Usage"
              yAxisFormat="percent"
              height="200px"
              :areaStyle="true"
            />
          </CardContent>
        </Card>
      </div>

      <!-- 数据库连接状态 -->
      <Card v-if="healthData?.components?.databases">
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Database class="h-4 w-4" />
            数据库连接
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="(status, name) in healthData.components.databases.connections" 
                 :key="name"
                 class="flex items-center justify-between p-3 bg-accent rounded-lg">
              <span class="font-medium">{{ String(name).toUpperCase() }}</span>
              <Badge :class="status === 'connected' ? 'bg-green-500' : 'bg-red-500'" class="text-white">
                {{ status === 'connected' ? '已连接' : '未连接' }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
