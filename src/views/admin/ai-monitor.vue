<script setup lang="ts">
/**
 * AI服务监控页面
 * 展示三轨评分统计、Few-Shot池、DAG使用情况、DAML-RAG系统监控
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, RefreshCw, Brain, Star, Users, TrendingUp,
  CheckCircle2, AlertTriangle, BarChart3, Server, Database, Cpu, HardDrive, Activity,
  LineChart, Radio, GitBranch, FileText, ChevronRight
} from 'lucide-vue-next'
import api from '@/api/auth'

// Dashboard导航
const dashboards = [
  { 
    name: '性能监控', 
    route: '/admin/dashboards/performance',
    icon: LineChart,
    description: '请求耗时、错误率、缓存命中率'
  },
  { 
    name: '流式输出', 
    route: '/admin/dashboards/streaming',
    icon: Radio,
    description: 'TTFB、成功率、令牌生成速率'
  },
  { 
    name: '工作流性能', 
    route: '/admin/dashboards/workflow',
    icon: GitBranch,
    description: '步骤耗时、缓存、LLM调用'
  },
  { 
    name: '日志分析', 
    route: '/admin/dashboards/logs',
    icon: FileText,
    description: '实时日志、错误追踪'
  }
]

const router = useRouter()
const loading = ref(false)
const currentTab = ref('overview')

// 三轨评分统计
const qualityStats = ref<any>(null)
// Few-Shot池统计
const fewshotStats = ref<any>(null)
// DAML-RAG系统监控
const damlRagHealth = ref<any>(null)
const damlRagMetrics = ref<any>(null)
const streamingStats = ref<any>(null)

// DAML-RAG API基础URL
const DAML_RAG_URL = 'http://localhost:8001'

onMounted(async () => {
  await loadAllStats()
})

async function loadAllStats() {
  loading.value = true
  try {
    // 并行加载所有数据
    const [qualityRes, fewshotRes] = await Promise.all([
      api.get('/v2/quality/stats'),
      api.get('/v2/quality/fewshot-pool-stats')
    ])
    
    if (qualityRes.code === 200) {
      qualityStats.value = qualityRes.data
    }
    if (fewshotRes.code === 200) {
      fewshotStats.value = fewshotRes.data
    }
    
    // 加载DAML-RAG监控数据（独立try-catch，不影响其他数据）
    await loadDamlRagStats()
  } catch (e) {
    console.error('加载统计失败', e)
  } finally {
    loading.value = false
  }
}

async function loadDamlRagStats() {
  try {
    // 健康检查
    const healthRes = await fetch(`${DAML_RAG_URL}/api/health`)
    if (healthRes.ok) {
      const healthData = await healthRes.json()
      damlRagHealth.value = healthData.data
    }
  } catch (e) {
    console.warn('DAML-RAG健康检查失败', e)
    damlRagHealth.value = null
  }
  
  try {
    // 性能指标
    const metricsRes = await fetch(`${DAML_RAG_URL}/api/health/metrics`)
    if (metricsRes.ok) {
      const metricsData = await metricsRes.json()
      damlRagMetrics.value = metricsData.data
    }
  } catch (e) {
    console.warn('DAML-RAG指标获取失败', e)
    damlRagMetrics.value = null
  }
  
  try {
    // 流式监控统计
    const streamRes = await fetch(`${DAML_RAG_URL}/api/health/metrics/streaming?time_window=3600`)
    if (streamRes.ok) {
      const streamData = await streamRes.json()
      streamingStats.value = streamData.data
    }
  } catch (e) {
    console.warn('流式监控获取失败', e)
    streamingStats.value = null
  }
}

function goBack() {
  router.push('/admin')
}

// 个性化等级颜色
const gradeColors: Record<string, string> = {
  'S': 'bg-purple-500',
  'A': 'bg-green-500',
  'B': 'bg-blue-500',
  'C': 'bg-yellow-500',
  'D': 'bg-red-500'
}

// 计算等级分布百分比
const gradeDistribution = computed(() => {
  if (!qualityStats.value?.grade_distribution) return []
  const dist = qualityStats.value.grade_distribution
  const total = Object.values(dist).reduce((a: number, b: any) => a + b, 0) as number
  if (total === 0) return []
  
  return ['S', 'A', 'B', 'C', 'D'].map(grade => ({
    grade,
    count: dist[grade] || 0,
    percent: total > 0 ? Math.round(((dist[grade] || 0) / total) * 100) : 0
  }))
})

// DAML-RAG服务状态
const damlRagStatus = computed(() => {
  if (!damlRagHealth.value) return { status: 'offline', color: 'bg-gray-500' }
  const status = damlRagHealth.value.status
  if (status === 'healthy') return { status: '健康', color: 'bg-green-500' }
  if (status === 'degraded') return { status: '降级', color: 'bg-yellow-500' }
  return { status: '异常', color: 'bg-red-500' }
})

// 数据库连接状态
const dbConnections = computed(() => {
  if (!damlRagHealth.value?.components?.databases?.connections) return []
  const conns = damlRagHealth.value.components.databases.connections
  return Object.entries(conns).map(([name, status]) => ({
    name: name.toUpperCase(),
    status: status === 'connected' ? '已连接' : '未连接',
    connected: status === 'connected'
  }))
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
          <Brain class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">AI服务监控</h1>
        </div>
        <Button variant="ghost" size="icon" @click="loadAllStats">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- Dashboard快捷入口 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <LineChart class="h-4 w-4" />
            监控面板
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="dash in dashboards" :key="dash.route"
                 @click="router.push(dash.route)"
                 class="flex items-center gap-3 p-3 bg-accent rounded-lg cursor-pointer hover:bg-accent/80 transition-colors">
              <component :is="dash.icon" class="h-5 w-5 text-primary shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-sm">{{ dash.name }}</div>
                <div class="text-xs text-muted-foreground truncate">{{ dash.description }}</div>
              </div>
              <ChevronRight class="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 核心指标 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 class="h-4 w-4" />
              总会话数
            </div>
            <div class="text-2xl font-bold">{{ qualityStats?.total_sessions || 0 }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <Star class="h-4 w-4" />
              已评分
            </div>
            <div class="text-2xl font-bold text-amber-500">{{ qualityStats?.rated_sessions || 0 }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 class="h-4 w-4" />
              Few-Shot合格
            </div>
            <div class="text-2xl font-bold text-green-500">{{ qualityStats?.fewshot_eligible || 0 }}</div>
            <div class="text-xs text-muted-foreground">
              合格率 {{ qualityStats?.fewshot_rate || 0 }}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle class="h-4 w-4" />
              安全问题
            </div>
            <div class="text-2xl font-bold" :class="qualityStats?.unsafe_count > 0 ? 'text-red-500' : 'text-green-500'">
              {{ qualityStats?.unsafe_count || 0 }}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs v-model="currentTab" class="w-full">
        <TabsList class="grid w-full grid-cols-4">
          <TabsTrigger value="overview">三轨评分</TabsTrigger>
          <TabsTrigger value="fewshot">Few-Shot池</TabsTrigger>
          <TabsTrigger value="grades">等级分布</TabsTrigger>
          <TabsTrigger value="damlrag">系统监控</TabsTrigger>
        </TabsList>

        <!-- 三轨评分概览 -->
        <TabsContent value="overview" class="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">用户体验评分（5维度）</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-for="(label, key) in {
                ux_clarity: '清晰度',
                ux_practicality: '实用性',
                ux_detail: '详细度',
                ux_friendliness: '友好度',
                ux_satisfaction: '满意度'
              }" :key="key" class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>{{ label }}</span>
                  <span class="font-medium">{{ qualityStats?.avg_scores?.[key]?.toFixed(2) || '-' }}</span>
                </div>
                <Progress :model-value="(qualityStats?.avg_scores?.[key] || 0) * 20" class="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">个性化感知评分</CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>档案利用率</span>
                  <span class="font-medium">{{ qualityStats?.avg_scores?.profile_utilization_rate?.toFixed(1) || '-' }}%</span>
                </div>
                <Progress :model-value="qualityStats?.avg_scores?.profile_utilization_rate || 0" class="h-2" />
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>综合评分</span>
                  <span class="font-medium">{{ qualityStats?.avg_scores?.overall_score?.toFixed(2) || '-' }}</span>
                </div>
                <Progress :model-value="(qualityStats?.avg_scores?.overall_score || 0) * 20" class="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">专家评审</CardTitle>
            </CardHeader>
            <CardContent>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">已评审会话</span>
                <span class="font-medium">{{ qualityStats?.expert_review_count || 0 }}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Few-Shot池 -->
        <TabsContent value="fewshot" class="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">Few-Shot池状态</CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-4 bg-accent rounded-lg">
                  <div class="text-2xl font-bold text-green-500">
                    {{ fewshotStats?.total_eligible || qualityStats?.fewshot_eligible || 0 }}
                  </div>
                  <div class="text-sm text-muted-foreground">合格样本</div>
                </div>
                <div class="text-center p-4 bg-accent rounded-lg">
                  <div class="text-2xl font-bold text-blue-500">
                    {{ fewshotStats?.avg_score?.toFixed(2) || qualityStats?.avg_scores?.overall_score?.toFixed(2) || '-' }}
                  </div>
                  <div class="text-sm text-muted-foreground">平均分</div>
                </div>
              </div>

              <div v-if="fewshotStats?.by_grade" class="space-y-2">
                <div class="text-sm font-medium">按等级分布</div>
                <div v-for="(count, grade) in fewshotStats.by_grade" :key="grade" 
                     class="flex items-center gap-2">
                  <Badge :class="gradeColors[grade as string]">{{ grade }}</Badge>
                  <span class="text-sm">{{ count }} 个</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">准入规则</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <CheckCircle2 class="h-4 w-4 text-green-500" />
                <span>三轨评分均≥4.0分</span>
              </div>
              <div class="flex items-center gap-2">
                <AlertTriangle class="h-4 w-4 text-amber-500" />
                <span>安全性评分≥3分（一票否决）</span>
              </div>
              <div class="flex items-center gap-2">
                <Users class="h-4 w-4 text-blue-500" />
                <span>冷启动期（前3条）门槛降至3.5分</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- 等级分布 -->
        <TabsContent value="grades" class="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-base">个性化等级分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div v-if="gradeDistribution.length === 0" class="text-center py-8 text-muted-foreground">
                暂无数据
              </div>
              <div v-else class="space-y-3">
                <div v-for="item in gradeDistribution" :key="item.grade" class="space-y-1">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <Badge :class="gradeColors[item.grade]">{{ item.grade }}</Badge>
                      <span class="text-sm">{{ item.count }} 个</span>
                    </div>
                    <span class="text-sm text-muted-foreground">{{ item.percent }}%</span>
                  </div>
                  <Progress :model-value="item.percent" class="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">等级说明</CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 text-sm">
              <div class="flex items-center gap-2">
                <Badge class="bg-purple-500">S</Badge>
                <span>卓越级（档案利用率≥90%）</span>
              </div>
              <div class="flex items-center gap-2">
                <Badge class="bg-green-500">A</Badge>
                <span>优秀级（档案利用率≥75%）</span>
              </div>
              <div class="flex items-center gap-2">
                <Badge class="bg-blue-500">B</Badge>
                <span>良好级（档案利用率≥60%）</span>
              </div>
              <div class="flex items-center gap-2">
                <Badge class="bg-yellow-500">C</Badge>
                <span>一般级（档案利用率≥40%）</span>
              </div>
              <div class="flex items-center gap-2">
                <Badge class="bg-red-500">D</Badge>
                <span>待改进（档案利用率<40%）</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- DAML-RAG系统监控 -->
        <TabsContent value="damlrag" class="mt-4 space-y-4">
          <!-- 服务状态 -->
          <Card>
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <Server class="h-4 w-4" />
                DAML-RAG服务状态
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm">服务状态</span>
                <Badge :class="damlRagStatus.color" class="text-white">
                  {{ damlRagStatus.status }}
                </Badge>
              </div>
              <div v-if="damlRagHealth" class="flex items-center justify-between">
                <span class="text-sm">版本</span>
                <span class="font-mono text-sm">{{ damlRagHealth.version || '-' }}</span>
              </div>
              <div v-if="!damlRagHealth" class="text-center py-4 text-muted-foreground">
                <AlertTriangle class="h-8 w-8 mx-auto mb-2 text-amber-500" />
                <p>无法连接DAML-RAG服务</p>
                <p class="text-xs">请确保服务运行在 localhost:8001</p>
              </div>
            </CardContent>
          </Card>

          <!-- 数据库连接 -->
          <Card v-if="dbConnections.length > 0">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <Database class="h-4 w-4" />
                数据库连接
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-3">
                <div v-for="db in dbConnections" :key="db.name" 
                     class="flex items-center justify-between p-2 bg-accent rounded">
                  <span class="text-sm font-medium">{{ db.name }}</span>
                  <Badge :class="db.connected ? 'bg-green-500' : 'bg-red-500'" class="text-white text-xs">
                    {{ db.status }}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 系统资源 -->
          <Card v-if="damlRagMetrics?.system">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <Cpu class="h-4 w-4" />
                系统资源
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>CPU使用率</span>
                  <span class="font-medium">{{ damlRagMetrics.system.cpu_percent }}%</span>
                </div>
                <Progress :model-value="damlRagMetrics.system.cpu_percent" class="h-2" />
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>内存使用率</span>
                  <span class="font-medium">{{ damlRagMetrics.system.memory_percent }}%</span>
                </div>
                <Progress :model-value="damlRagMetrics.system.memory_percent" class="h-2" />
              </div>
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>磁盘使用率</span>
                  <span class="font-medium">{{ damlRagMetrics.system.disk_percent }}%</span>
                </div>
                <Progress :model-value="damlRagMetrics.system.disk_percent" class="h-2" />
              </div>
            </CardContent>
          </Card>

          <!-- 流式会话监控 -->
          <Card v-if="streamingStats">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <Activity class="h-4 w-4" />
                流式会话（最近1小时）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 gap-4">
                <div class="text-center p-3 bg-accent rounded-lg">
                  <div class="text-xl font-bold">{{ streamingStats.total_sessions || 0 }}</div>
                  <div class="text-xs text-muted-foreground">总会话数</div>
                </div>
                <div class="text-center p-3 bg-accent rounded-lg">
                  <div class="text-xl font-bold" :class="(streamingStats.success_rate || 0) >= 90 ? 'text-green-500' : 'text-amber-500'">
                    {{ (streamingStats.success_rate || 0).toFixed(1) }}%
                  </div>
                  <div class="text-xs text-muted-foreground">成功率</div>
                </div>
                <div class="text-center p-3 bg-accent rounded-lg">
                  <div class="text-xl font-bold text-blue-500">
                    {{ streamingStats.avg_ttfb_ms ? (streamingStats.avg_ttfb_ms / 1000).toFixed(2) + 's' : '-' }}
                  </div>
                  <div class="text-xs text-muted-foreground">平均TTFB</div>
                </div>
                <div class="text-center p-3 bg-accent rounded-lg">
                  <div class="text-xl font-bold text-purple-500">
                    {{ streamingStats.avg_tokens_per_second?.toFixed(1) || '-' }}
                  </div>
                  <div class="text-xs text-muted-foreground">令牌/秒</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 进程信息 -->
          <Card v-if="damlRagMetrics?.process">
            <CardHeader>
              <CardTitle class="text-base flex items-center gap-2">
                <HardDrive class="h-4 w-4" />
                进程信息
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">进程内存</span>
                <span class="font-medium">{{ damlRagMetrics.process.memory_mb?.toFixed(0) || '-' }} MB</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">线程数</span>
                <span class="font-medium">{{ damlRagMetrics.process.num_threads || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">进程CPU</span>
                <span class="font-medium">{{ damlRagMetrics.process.cpu_percent?.toFixed(1) || '-' }}%</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  </div>
</template>
