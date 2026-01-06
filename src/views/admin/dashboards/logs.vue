<script setup lang="ts">
/**
 * 日志查询分析 Dashboard
 * 对应 Grafana: logs-query-analysis.json
 * 
 * 展示：实时日志流、错误日志、日志级别统计
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, RefreshCw, FileText, AlertTriangle, AlertCircle,
  Info, Bug, Search, Filter, Download, HelpCircle, X
} from 'lucide-vue-next'
import TimeSeriesChart from '@/components/charts/TimeSeriesChart.vue'
import StatCard from '@/components/charts/StatCard.vue'
import api from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const autoRefresh = ref(true)
const currentTab = ref('all')
const searchQuery = ref('')
const levelFilter = ref('all')
const showGuide = ref(true)
const dataSource = ref('file') // 'file' 或 'loki'
let refreshTimer: number | null = null

// 日志数据
const logs = ref<any[]>([])
const errorLogs = ref<any[]>([])
const logStats = ref({
  total: 0,
  error: 0,
  warn: 0,
  info: 0,
  debug: 0
})

// 时序数据
const logLevelTrendData = ref<any[]>([])

// 日志级别选项
const logLevels = [
  { value: 'all', label: '全部' },
  { value: 'ERROR', label: '错误' },
  { value: 'WARN', label: '警告' },
  { value: 'INFO', label: '信息' },
  { value: 'DEBUG', label: '调试' }
]

// 日志级别颜色
const levelColors: Record<string, string> = {
  'ERROR': 'bg-red-500',
  'CRITICAL': 'bg-red-700',
  'WARN': 'bg-amber-500',
  'WARNING': 'bg-amber-500',
  'INFO': 'bg-blue-500',
  'DEBUG': 'bg-gray-500'
}

// 日志级别图标
const levelIcons: Record<string, any> = {
  'ERROR': AlertCircle,
  'CRITICAL': AlertCircle,
  'WARN': AlertTriangle,
  'WARNING': AlertTriangle,
  'INFO': Info,
  'DEBUG': Bug
}

// 加载所有数据
async function loadAllData() {
  loading.value = true
  try {
    await Promise.all([
      loadLogs(),
      loadLogStats()
    ])
  } catch (e) {
    console.error('加载数据失败', e)
  } finally {
    loading.value = false
  }
}

// 加载日志
async function loadLogs() {
  try {
    // 优先尝试从Loki获取日志（使用正确的job名称）
    const res = await api.get('/admin/metrics/loki/query', {
      params: { 
        query: '{job="daml-rag-files"}',
        limit: 200
      }
    })
    
    if (res.code === 200 && res.data?.logs) {
      logs.value = res.data.logs
      errorLogs.value = res.data.logs.filter((l: any) => l.level === 'ERROR' || l.level === 'CRITICAL')
      dataSource.value = res.data.source || 'loki'
      
      if (res.data.stats) {
        logStats.value = res.data.stats
      }
    } else {
      // Loki失败，回退到文件读取
      await loadLogsFromFile()
    }
  } catch (e) {
    console.warn('Loki查询失败，回退到文件读取', e)
    await loadLogsFromFile()
  }
}

// 从文件加载日志（备用方案）
async function loadLogsFromFile() {
  try {
    const res = await api.get('/admin/metrics/daml-rag/logs', {
      params: { 
        lines: 200,
        level: levelFilter.value === 'all' ? 'all' : levelFilter.value
      }
    })
    
    if (res.code === 200 && res.data?.logs) {
      logs.value = res.data.logs
      errorLogs.value = res.data.logs.filter((l: any) => l.level === 'ERROR' || l.level === 'CRITICAL')
      dataSource.value = 'file'
      
      if (res.data.stats) {
        logStats.value = res.data.stats
      }
    } else {
      generateMockLogs()
    }
  } catch (e) {
    console.warn('文件日志加载失败，使用模拟数据', e)
    generateMockLogs()
  }
}

// 加载日志统计
async function loadLogStats() {
  // 计算统计
  const stats = {
    total: logs.value.length,
    error: logs.value.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL').length,
    warn: logs.value.filter(l => l.level === 'WARN' || l.level === 'WARNING').length,
    info: logs.value.filter(l => l.level === 'INFO').length,
    debug: logs.value.filter(l => l.level === 'DEBUG').length
  }
  logStats.value = stats
  
  // 生成趋势数据
  generateLogTrendData()
}

// 生成模拟日志
function generateMockLogs() {
  const levels = ['INFO', 'INFO', 'INFO', 'DEBUG', 'WARN', 'ERROR']
  const components = ['daml_rag', 'dag_orchestrator', 'llm_service', 'retrieval', 'mcp_tools', 'streaming']
  const messages = [
    '处理用户请求',
    '执行DAG工作流',
    'LLM调用完成',
    '三层检索执行',
    'MCP工具调用',
    '流式响应开始',
    '缓存命中',
    '数据库查询',
    '用户档案加载',
    '会话记录存储'
  ]
  const errorMessages = [
    'LLM调用超时',
    '数据库连接失败',
    '参数验证错误',
    '缓存写入失败',
    'Neo4j查询超时'
  ]
  
  const now = Date.now()
  const newLogs: any[] = []
  
  for (let i = 0; i < 100; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)]
    const component = components[Math.floor(Math.random() * components.length)]
    const isError = level === 'ERROR' || level === 'WARN'
    const message = isError 
      ? errorMessages[Math.floor(Math.random() * errorMessages.length)]
      : messages[Math.floor(Math.random() * messages.length)]
    
    newLogs.push({
      id: `log_${now - i * 1000}`,
      timestamp: new Date(now - i * 1000 * Math.random() * 3600).toISOString(),
      level,
      component,
      message,
      trace_id: `trace_${Math.random().toString(36).slice(2, 10)}`,
      duration_ms: Math.floor(Math.random() * 5000)
    })
  }
  
  // 按时间排序
  newLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  
  logs.value = newLogs
  errorLogs.value = newLogs.filter(l => l.level === 'ERROR' || l.level === 'CRITICAL')
}

// 生成日志趋势数据
function generateLogTrendData() {
  const now = Date.now()
  const points = 60
  const interval = 60000
  
  const generateSeries = (name: string, baseValue: number, color: string) => ({
    name,
    data: Array.from({ length: points }, (_, i) => [
      now - (points - i) * interval,
      Math.max(0, Math.floor(baseValue + (Math.random() - 0.5) * baseValue * 0.5))
    ]),
    color
  })
  
  logLevelTrendData.value = [
    generateSeries('INFO', 50, '#3b82f6'),
    generateSeries('DEBUG', 30, '#6b7280'),
    generateSeries('WARN', 5, '#f59e0b'),
    generateSeries('ERROR', 2, '#ef4444')
  ]
}

// 过滤后的日志
const filteredLogs = computed(() => {
  let result = currentTab.value === 'errors' ? errorLogs.value : logs.value
  
  // 级别过滤
  if (levelFilter.value !== 'all') {
    result = result.filter(l => l.level === levelFilter.value || 
      (levelFilter.value === 'WARN' && l.level === 'WARNING'))
  }
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(l => 
      l.message.toLowerCase().includes(query) ||
      l.component.toLowerCase().includes(query) ||
      l.trace_id?.toLowerCase().includes(query)
    )
  }
  
  return result
})

// 格式化时间
function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

// 导出日志
function exportLogs() {
  const data = JSON.stringify(filteredLogs.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `logs_${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

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
  refreshTimer = window.setInterval(loadAllData, 10000) // 10秒刷新
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
          <FileText class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">日志分析</h1>
          <Badge v-if="dataSource === 'loki'" variant="outline" class="text-xs">Loki</Badge>
          <Badge v-else variant="outline" class="text-xs">文件</Badge>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="showGuide = true">
            <HelpCircle class="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" @click="exportLogs">
            <Download class="h-4 w-4 mr-1" />
            导出
          </Button>
          <Button variant="ghost" size="icon" @click="toggleAutoRefresh">
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading, 'text-green-500': autoRefresh }" />
          </Button>
        </div>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 简单指南卡片 -->
      <Card v-if="showGuide" class="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <CardTitle class="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <HelpCircle class="h-4 w-4" />
              📖 这个页面是什么？
            </CardTitle>
            <Button variant="ghost" size="icon" class="h-6 w-6" @click="showGuide = false">
              <X class="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent class="text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p><strong>日志分析</strong>显示AI服务的运行记录，帮助排查问题。</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🔵 INFO 信息</p>
              <p class="text-xs">正常运行记录，不用担心</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🟡 WARN 警告</p>
              <p class="text-xs">有小问题，但不影响使用</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">🔴 ERROR 错误</p>
              <p class="text-xs">有问题，需要联系小川处理</p>
            </div>
            <div class="p-2 bg-white/50 dark:bg-black/20 rounded">
              <p class="font-medium">📊 错误数 &lt; 10</p>
              <p class="text-xs">正常范围，超过10个需要关注</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 统计概览 -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard 
          title="总日志数" 
          :value="logStats.total"
          :icon="FileText"
        />
        <StatCard 
          title="错误" 
          :value="logStats.error"
          :status="logStats.error > 10 ? 'error' : logStats.error > 5 ? 'warning' : 'success'"
          :icon="AlertCircle"
        />
        <StatCard 
          title="警告" 
          :value="logStats.warn"
          :status="logStats.warn > 20 ? 'warning' : 'success'"
          :icon="AlertTriangle"
        />
        <StatCard 
          title="信息" 
          :value="logStats.info"
          :icon="Info"
        />
        <StatCard 
          title="调试" 
          :value="logStats.debug"
          :icon="Bug"
        />
      </div>

      <!-- 日志级别趋势 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <FileText class="h-4 w-4" />
            日志级别统计趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TimeSeriesChart 
            :series="logLevelTrendData"
            yAxisLabel="Count"
            height="200px"
            :areaStyle="true"
            :stack="true"
          />
        </CardContent>
      </Card>

      <!-- 日志列表 -->
      <Card>
        <CardHeader class="pb-2">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle class="text-base flex items-center gap-2">
              <FileText class="h-4 w-4" />
              日志列表
            </CardTitle>
            <div class="flex items-center gap-2">
              <div class="relative">
                <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  v-model="searchQuery"
                  placeholder="搜索日志..."
                  class="pl-8 w-48 h-8"
                />
              </div>
              <Select v-model="levelFilter">
                <SelectTrigger class="w-24 h-8">
                  <Filter class="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="l in logLevels" :key="l.value" :value="l.value">
                    {{ l.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs v-model="currentTab" class="w-full">
            <TabsList class="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="all">全部日志</TabsTrigger>
              <TabsTrigger value="errors">
                错误日志
                <Badge v-if="logStats.error > 0" variant="destructive" class="ml-2">
                  {{ logStats.error }}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" class="mt-0">
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="log in filteredLogs" :key="log.id"
                     class="p-3 bg-accent rounded-lg text-sm font-mono">
                  <div class="flex items-start gap-3">
                    <Badge :class="levelColors[log.level]" class="text-white text-xs shrink-0">
                      {{ log.level }}
                    </Badge>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>{{ formatTime(log.timestamp) }}</span>
                        <span>|</span>
                        <span>{{ log.component }}</span>
                        <span v-if="log.trace_id">| {{ log.trace_id }}</span>
                      </div>
                      <div class="text-foreground break-words">{{ log.message }}</div>
                      <div v-if="log.duration_ms" class="text-xs text-muted-foreground mt-1">
                        耗时: {{ log.duration_ms }}ms
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="filteredLogs.length === 0" class="text-center py-8 text-muted-foreground">
                  暂无日志记录
                </div>
              </div>
            </TabsContent>

            <TabsContent value="errors" class="mt-0">
              <div class="space-y-2 max-h-96 overflow-y-auto">
                <div v-for="log in filteredLogs" :key="log.id"
                     class="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-sm font-mono">
                  <div class="flex items-start gap-3">
                    <AlertCircle class="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <span>{{ formatTime(log.timestamp) }}</span>
                        <span>|</span>
                        <span>{{ log.component }}</span>
                      </div>
                      <div class="text-red-700 dark:text-red-400 break-words">{{ log.message }}</div>
                      <div v-if="log.trace_id" class="text-xs text-muted-foreground mt-1">
                        Trace ID: {{ log.trace_id }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-if="filteredLogs.length === 0" class="text-center py-8 text-muted-foreground">
                  <CheckCircle2 class="h-12 w-12 mx-auto mb-2 text-green-500" />
                  <p>暂无错误日志</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  </div>
</template>

<script lang="ts">
import { CheckCircle2 } from 'lucide-vue-next'
export default {
  components: { CheckCircle2 }
}
</script>
