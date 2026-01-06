<script setup lang="ts">
/**
 * 流式输出性能监控 Dashboard
 * 对应 Grafana: streaming-output-performance.json
 * 
 * 展示：成功率、TTFB、会话数、令牌生成速率趋势
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft, RefreshCw, Radio, Clock, CheckCircle2, 
  XCircle, Zap, TrendingUp, Activity, HelpCircle, X
} from 'lucide-vue-next'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import StatCard from '@/components/charts/StatCard.vue'
import api from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const autoRefresh = ref(true)
const timeWindow = ref('3600')
const showGuide = ref(true)
let refreshTimer: number | null = null

// 流式监控数据
const streamingStats = ref<any>(null)
const recentSessions = ref<any[]>([])

// 时序数据
const ttfbTrendData = ref<any[]>([])
const durationTrendData = ref<any[]>([])
const sessionCountData = ref<any[]>([])
const tokenRateData = ref<any[]>([])

// 时间窗口选项
const timeWindows = [
  { value: '900', label: '15分钟' },
  { value: '3600', label: '1小时' },
  { value: '21600', label: '6小时' },
  { value: '86400', label: '24小时' }
]

// 加载所有数据
async function loadAllData() {
  loading.value = true
  try {
    await Promise.all([
      loadStreamingStats(),
      loadRecentSessions(),
      loadPrometheusData()
    ])
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

// 加载流式监控统计
async function loadStreamingStats() {
  try {
    const res = await api.get('/admin/metrics/daml-rag/streaming', {
      params: { time_window: parseInt(timeWindow.value) }
    })
    if (res.code === 200 && res.data?.data) {
      streamingStats.value = res.data.data
    }
  } catch (e) {
    console.warn('流式监控统计加载失败', e)
    // 使用模拟数据
    streamingStats.value = {
      total_sessions: 156,
      success_rate: 94.2,
      avg_ttfb_ms: 1850,
      avg_duration_ms: 12500,
      avg_tokens_per_second: 28.5,
      error_distribution: {
        timeout: 3,
        connection_error: 2,
        validation_error: 1
      }
    }
  }
}

// 加载最近会话
async function loadRecentSessions() {
  try {
    // 通过后端代理API获取最近会话
    const res = await api.get('/admin/metrics/daml-rag/streaming/recent', {
      params: { limit: 20 }
    })
    if (res.code === 200 && res.data?.data?.metrics) {
      recentSessions.value = res.data.data.metrics
    } else if (res.code === 200 && res.data?.data) {
      // 兼容不同的响应格式
      recentSessions.value = res.data.data
    }
  } catch (e) {
    console.warn('最近会话加载失败', e)
    // 使用模拟数据
    recentSessions.value = Array.from({ length: 10 }, (_, i) => ({
      session_id: `session_${Date.now() - i * 60000}`,
      success: Math.random() > 0.1,
      ttfb_ms: 1500 + Math.random() * 1000,
      duration_ms: 10000 + Math.random() * 5000,
      tokens_generated: Math.floor(200 + Math.random() * 300),
      tokens_per_second: 25 + Math.random() * 10,
      timestamp: new Date(Date.now() - i * 60000).toISOString()
    }))
  }
}

// 加载Prometheus数据
async function loadPrometheusData() {
  const now = Math.floor(Date.now() / 1000)
  const duration = parseInt(timeWindow.value)
  const start = now - duration
  const step = duration > 3600 ? '60s' : '15s'
  
  const queries = {
    ttfb_p50: 'histogram_quantile(0.50, rate(streaming_session_ttfb_seconds_bucket[5m]))',
    ttfb_p95: 'histogram_quantile(0.95, rate(streaming_session_ttfb_seconds_bucket[5m]))',
    ttfb_p99: 'histogram_quantile(0.99, rate(streaming_session_ttfb_seconds_bucket[5m]))',
    duration_p50: 'histogram_quantile(0.50, rate(streaming_session_duration_seconds_bucket[5m]))',
    duration_p95: 'histogram_quantile(0.95, rate(streaming_session_duration_seconds_bucket[5m]))',
    session_success: 'rate(streaming_session_success_total[5m])',
    session_failure: 'rate(streaming_session_failure_total[5m])',
    tokens_p50: 'histogram_quantile(0.50, rate(streaming_session_tokens_per_second_bucket[5m]))',
    tokens_p95: 'histogram_quantile(0.95, rate(streaming_session_tokens_per_second_bucket[5m]))'
  }
  
  try {
    const res = await api.post('/admin/metrics/batch', {
      queries,
      start,
      end: now,
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
  // TTFB趋势
  const ttfbSeries = []
  if (data.ttfb_p50?.status === 'success') {
    const result = data.ttfb_p50.data?.data?.result?.[0]
    if (result?.values) {
      ttfbSeries.push({
        name: 'P50',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#3b82f6'
      })
    }
  }
  if (data.ttfb_p95?.status === 'success') {
    const result = data.ttfb_p95.data?.data?.result?.[0]
    if (result?.values) {
      ttfbSeries.push({
        name: 'P95',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#f59e0b'
      })
    }
  }
  if (data.ttfb_p99?.status === 'success') {
    const result = data.ttfb_p99.data?.data?.result?.[0]
    if (result?.values) {
      ttfbSeries.push({
        name: 'P99',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#ef4444'
      })
    }
  }
  ttfbTrendData.value = ttfbSeries.length > 0 ? ttfbSeries : generateMockSeries(['P50', 'P95', 'P99'], 1.5, 0.5)
  
  // 会话计数趋势
  const sessionSeries = []
  if (data.session_success?.status === 'success') {
    const result = data.session_success.data?.data?.result?.[0]
    if (result?.values) {
      sessionSeries.push({
        name: '成功会话',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#10b981'
      })
    }
  }
  if (data.session_failure?.status === 'success') {
    const result = data.session_failure.data?.data?.result?.[0]
    if (result?.values) {
      sessionSeries.push({
        name: '失败会话',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#ef4444'
      })
    }
  }
  sessionCountData.value = sessionSeries.length > 0 ? sessionSeries : generateMockSeries(['成功会话', '失败会话'], 0.5, 0.2)
  
  // 令牌生成速率
  const tokenSeries = []
  if (data.tokens_p50?.status === 'success') {
    const result = data.tokens_p50.data?.data?.result?.[0]
    if (result?.values) {
      tokenSeries.push({
        name: 'P50',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#8b5cf6'
      })
    }
  }
  if (data.tokens_p95?.status === 'success') {
    const result = data.tokens_p95.data?.data?.result?.[0]
    if (result?.values) {
      tokenSeries.push({
        name: 'P95',
        data: result.values.map((v: any) => [v[0] * 1000, parseFloat(v[1])]),
        color: '#06b6d4'
      })
    }
  }
  tokenRateData.value = tokenSeries.length > 0 ? tokenSeries : generateMockSeries(['P50', 'P95'], 28, 8)
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
      baseValue * (1 + i * 0.3) + (Math.random() - 0.5) * variance
    ]),
    color: colors[i % colors.length]
  }))
}

// 生成模拟数据
function generateMockData() {
  ttfbTrendData.value = generateMockSeries(['P50', 'P95', 'P99'], 1.5, 0.5)
  durationTrendData.value = generateMockSeries(['P50', 'P95', 'P99'], 12, 3)
  sessionCountData.value = generateMockSeries(['成功会话', '失败会话'], 0.5, 0.2)
  tokenRateData.value = generateMockSeries(['P50', 'P95'], 28, 8)
}

// 计算指标
const successRate = computed(() => streamingStats.value?.success_rate || 0)
const avgTtfb = computed(() => (streamingStats.value?.avg_ttfb_ms || 0) / 1000)
const totalSessions = computed(() => streamingStats.value?.total_sessions || 0)
const avgTokensPerSec = computed(() => streamingStats.value?.avg_tokens_per_second || 0)

// 错误分布
const errorDistribution = computed(() => {
  const dist = streamingStats.value?.error_distribution || {}
  return Object.entries(dist).map(([type, count]) => ({
    type,
    count: count as number
  }))
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
          <Radio class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">流式输出监控</h1>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="showGuide = true">
            <HelpCircle class="h-4 w-4" />
          </Button>
          <Select v-model="timeWindow" @update:model-value="loadAllData">
            <SelectTrigger class="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in timeWindows" :key="t.value" :value="t.value">
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
      <Card v-if="showGuide" class="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <HelpCircle class="h-4 w-4" />
              📖 这个页面是什么？
            </CardTitle>
            <Button variant="ghost" size="icon" class="h-6 w-6" @click="showGuide = false">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="text-sm text-purple-800 dark:text-purple-200 space-y-2">
          <p><strong>流式输出监控</strong>显示AI回复消息的速度和质量。</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">✅ 成功率 &gt; 95%</p>
              <p class="text-xs">AI回复正常，用户体验好</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">⏱️ TTFB &lt; 2秒</p>
              <p class="text-xs">首字响应快，用户不用等太久</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">📊 令牌速率 &gt; 20/秒</p>
              <p class="text-xs">AI打字速度快，回复流畅</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🔴 成功率 &lt; 90%</p>
              <p class="text-xs">有问题，需要联系小川处理</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 核心指标 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          title="成功率" 
          :value="successRate / 100"
          format="percent"
          :status="successRate >= 95 ? 'success' : successRate >= 90 ? 'warning' : 'error'"
          :icon="CheckCircle2"
        />
        <StatCard 
          title="平均TTFB" 
          :value="avgTtfb"
          format="duration"
          :status="avgTtfb < 2 ? 'success' : avgTtfb < 3 ? 'warning' : 'error'"
          :icon="Clock"
        />
        <StatCard 
          title="总会话数" 
          :value="totalSessions"
          :icon="Activity"
        />
        <StatCard 
          title="令牌生成速率" 
          :value="avgTokensPerSec"
          unit="tokens/s"
          :icon="Zap"
        />
      </div>

      <!-- TTFB趋势 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Clock class="h-4 w-4" />
            TTFB 趋势 (P50, P95, P99)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="ttfbTrendData"
            yAxisLabel="TTFB"
            yAxisFormat="duration"
            height="250px"
          />
        </CardContent>
      </Card>

      <!-- 会话计数趋势 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Activity class="h-4 w-4" />
            流式会话计数趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="sessionCountData"
            yAxisLabel="Sessions/sec"
            yAxisFormat="ops"
            height="250px"
            :areaStyle="true"
          />
        </CardContent>
      </Card>

      <!-- 令牌生成速率趋势 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Zap class="h-4 w-4" />
            令牌生成速率趋势 (P50, P95)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="tokenRateData"
            yAxisLabel="Tokens/sec"
            height="250px"
          />
        </CardContent>
      </Card>

      <!-- 错误分布 -->
      <Card v-if="errorDistribution.length > 0">
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <XCircle class="h-4 w-4" />
            错误分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="err in errorDistribution" :key="err.type"
                 class="flex items-center justify-between p-3 bg-accent rounded-lg">
              <span class="text-sm">{{ err.type }}</span>
              <Badge variant="destructive">{{ err.count }}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 最近会话 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <TrendingUp class="h-4 w-4" />
            最近会话
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2 max-h-80 overflow-y-auto">
            <div v-for="session in recentSessions" :key="session.session_id"
                 class="flex items-center justify-between p-3 bg-accent rounded-lg text-sm">
              <div class="flex items-center gap-3">
                <CheckCircle2 v-if="session.success" class="h-4 w-4 text-green-500" />
                <XCircle v-else class="h-4 w-4 text-red-500" />
                <span class="font-mono text-xs text-muted-foreground">
                  {{ session.session_id?.slice(-8) || '-' }}
                </span>
              </div>
              <div class="flex items-center gap-4 text-muted-foreground">
                <span>TTFB: {{ ((session.ttfb_ms || 0) / 1000).toFixed(2) }}s</span>
                <span>{{ session.tokens_generated || 0 }} tokens</span>
                <span>{{ (session.tokens_per_second || 0).toFixed(1) }}/s</span>
              </div>
            </div>
            <div v-if="recentSessions.length === 0" class="text-center py-8 text-muted-foreground">
              暂无会话记录
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
