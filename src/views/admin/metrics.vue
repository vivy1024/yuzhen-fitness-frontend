<script setup lang="ts">
/**
 * 统一可观测性仪表盘
 *
 * 7 个 Tab：系统总览 / 模型对比 / DAG vs Agent / 工具热力图 / 用户消费 / 质量趋势 / 数据库
 * 数据来源：MySQL chat_sessions 聚合查询，后端 Redis 缓存 10 分钟
 */
import { ref, watch } from 'vue'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  getSystemOverview,
  getModelComparison,
  getModeComparison,
  getToolUsage,
  getUserConsumption,
  getQualityTrend,
  type SystemOverviewData,
  type ModelComparisonItem,
  type ModeComparisonItem,
  type ToolUsageData,
  type UserConsumptionData,
  type QualityTrendData,
} from '@/api/admin/metrics'

// ========== 状态 ==========
const activeTab = ref('overview')
const days = ref('7')
const loading = ref(false)

const overviewData = ref<SystemOverviewData | null>(null)
const modelData = ref<ModelComparisonItem[]>([])
const modeData = ref<ModeComparisonItem[]>([])
const toolData = ref<ToolUsageData | null>(null)
const userData = ref<UserConsumptionData | null>(null)
const qualityData = ref<QualityTrendData | null>(null)

// ========== 数据加载 ==========
async function loadTabData() {
  loading.value = true
  const d = parseInt(days.value)
  try {
    switch (activeTab.value) {
      case 'overview': {
        const res = await getSystemOverview(d)
        if (res.code === 200) overviewData.value = res.data
        break
      }
      case 'models': {
        const res = await getModelComparison(d)
        if (res.code === 200) modelData.value = res.data
        break
      }
      case 'modes': {
        const res = await getModeComparison(d)
        if (res.code === 200) modeData.value = res.data
        break
      }
      case 'tools': {
        const res = await getToolUsage(d)
        if (res.code === 200) toolData.value = res.data
        break
      }
      case 'users': {
        const res = await getUserConsumption(d)
        if (res.code === 200) userData.value = res.data
        break
      }
      case 'quality': {
        const res = await getQualityTrend(d)
        if (res.code === 200) qualityData.value = res.data
        break
      }
    }
  } catch (e) {
    console.error('仪表盘数据加载失败:', e)
  } finally {
    loading.value = false
  }
}

watch([activeTab, days], () => loadTabData(), { immediate: true })

// ========== 工具函数 ==========
function fmt(val: number | null | undefined, decimals = 1): string {
  if (val == null) return '-'
  return Number(val).toFixed(decimals)
}

function fmtMs(val: number | null | undefined): string {
  if (val == null) return '-'
  const n = Number(val)
  return n >= 1000 ? `${(n / 1000).toFixed(1)}s` : `${n.toFixed(0)}ms`
}

function fmtNum(val: number | null | undefined): string {
  if (val == null) return '-'
  const n = Number(val)
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

const backendLabels: Record<string, string> = {
  anthropic: 'Claude Haiku',
  deepseek: 'DeepSeek',
  glm: 'GLM (免费)',
  siliconflow: 'SiliconFlow (免费)',
  template: 'Template (兜底)',
  unknown: '未知',
}

function backendLabel(key: string): string {
  return backendLabels[key] || key
}

const tierLabels: Record<string, string> = {
  newbie: '新手',
  free: '免费',
  warmheart: '暖心',
  energy: '能量',
}
</script>

<template>
  <div class="p-6 space-y-4">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">统一监控仪表盘</h1>
      <Select v-model="days">
        <SelectTrigger class="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">最近 7 天</SelectItem>
          <SelectItem value="30">最近 30 天</SelectItem>
          <SelectItem value="90">最近 90 天</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <Tabs v-model="activeTab">
      <TabsList class="grid w-full grid-cols-7">
        <TabsTrigger value="overview">系统总览</TabsTrigger>
        <TabsTrigger value="models">模型对比</TabsTrigger>
        <TabsTrigger value="modes">DAG vs Agent</TabsTrigger>
        <TabsTrigger value="tools">工具热力图</TabsTrigger>
        <TabsTrigger value="users">用户消费</TabsTrigger>
        <TabsTrigger value="quality">质量趋势</TabsTrigger>
        <TabsTrigger value="databases">数据库</TabsTrigger>
      </TabsList>

      <!-- ========== 系统总览 ========== -->
      <TabsContent value="overview">
        <div v-if="loading" class="text-center py-12 text-muted-foreground">加载中...</div>
        <div v-else-if="overviewData" class="space-y-4">
          <!-- 核心指标卡片 -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">总请求数</CardTitle></CardHeader>
              <CardContent><p class="text-2xl font-bold">{{ fmtNum(overviewData.stats.total_requests) }}</p></CardContent>
            </Card>
            <Card>
              <CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">平均 TTFB</CardTitle></CardHeader>
              <CardContent><p class="text-2xl font-bold">{{ fmtMs(overviewData.stats.avg_ttfb_ms) }}</p></CardContent>
            </Card>
            <Card>
              <CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">成功率</CardTitle></CardHeader>
              <CardContent><p class="text-2xl font-bold">{{ fmt(overviewData.stats.success_rate) }}%</p></CardContent>
            </Card>
            <Card>
              <CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">活跃用户</CardTitle></CardHeader>
              <CardContent><p class="text-2xl font-bold">{{ overviewData.stats.active_users }}</p></CardContent>
            </Card>
          </div>
          <!-- 额外指标 -->
          <div class="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">总积分消耗</CardTitle></CardHeader>
              <CardContent><p class="text-xl font-semibold">{{ fmtNum(overviewData.stats.total_credits) }}</p></CardContent>
            </Card>
            <Card>
              <CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">总 Token</CardTitle></CardHeader>
              <CardContent><p class="text-xl font-semibold">{{ fmtNum(overviewData.stats.total_tokens) }}</p></CardContent>
            </Card>
            <Card>
              <CardHeader class="pb-2"><CardTitle class="text-sm text-muted-foreground">平均耗时</CardTitle></CardHeader>
              <CardContent><p class="text-xl font-semibold">{{ fmtMs(overviewData.stats.avg_duration_ms) }}</p></CardContent>
            </Card>
          </div>
          <!-- 趋势表格 -->
          <Card>
            <CardHeader><CardTitle>每日趋势</CardTitle></CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead><tr class="border-b">
                    <th class="text-left py-2">日期</th>
                    <th class="text-right py-2">请求数</th>
                    <th class="text-right py-2">TTFB</th>
                    <th class="text-right py-2">耗时</th>
                    <th class="text-right py-2">成功率</th>
                    <th class="text-right py-2">活跃用户</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="row in overviewData.trend" :key="row.date" class="border-b hover:bg-muted/50">
                      <td class="py-2">{{ row.date }}</td>
                      <td class="text-right">{{ row.requests }}</td>
                      <td class="text-right">{{ fmtMs(row.avg_ttfb_ms) }}</td>
                      <td class="text-right">{{ fmtMs(row.avg_duration_ms) }}</td>
                      <td class="text-right">{{ fmt(row.success_rate) }}%</td>
                      <td class="text-right">{{ row.active_users }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- ========== 模型对比 ========== -->
      <TabsContent value="models">
        <div v-if="loading" class="text-center py-12 text-muted-foreground">加载中...</div>
        <Card v-else>
          <CardHeader><CardTitle>模型性能对比</CardTitle></CardHeader>
          <CardContent>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead><tr class="border-b">
                  <th class="text-left py-2">模型</th>
                  <th class="text-right py-2">调用量</th>
                  <th class="text-right py-2">TTFB</th>
                  <th class="text-right py-2">耗时</th>
                  <th class="text-right py-2">Token/s</th>
                  <th class="text-right py-2">总Token</th>
                  <th class="text-right py-2">积分</th>
                  <th class="text-right py-2">成功率</th>
                  <th class="text-right py-2">降级</th>
                </tr></thead>
                <tbody>
                  <tr v-for="m in modelData" :key="m.backend_used" class="border-b hover:bg-muted/50">
                    <td class="py-2 font-medium">{{ backendLabel(m.backend_used) }}</td>
                    <td class="text-right">{{ fmtNum(m.total_calls) }}</td>
                    <td class="text-right">{{ fmtMs(m.avg_ttfb_ms) }}</td>
                    <td class="text-right">{{ fmtMs(m.avg_duration_ms) }}</td>
                    <td class="text-right">{{ fmt(m.avg_tokens_per_sec) }}</td>
                    <td class="text-right">{{ fmtNum(m.total_input_tokens + m.total_output_tokens) }}</td>
                    <td class="text-right">{{ fmtNum(m.total_credits) }}</td>
                    <td class="text-right">{{ fmt(m.success_rate) }}%</td>
                    <td class="text-right">{{ fmt(m.avg_fallback_count) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="modelData.length === 0" class="text-center py-8 text-muted-foreground">暂无数据（需要有性能字段的对话记录）</p>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- ========== DAG vs Agent ========== -->
      <TabsContent value="modes">
        <div v-if="loading" class="text-center py-12 text-muted-foreground">加载中...</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card v-for="m in modeData" :key="m.execution_mode">
            <CardHeader>
              <CardTitle class="flex items-center gap-2">
                <Badge :variant="m.execution_mode === 'dag' ? 'default' : 'secondary'">
                  {{ m.execution_mode === 'dag' ? 'DAG 固定编排' : 'Agent 动态决策' }}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span class="text-muted-foreground">调用量</span>
                  <p class="text-lg font-semibold">{{ fmtNum(m.total_calls) }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">平均 TTFB</span>
                  <p class="text-lg font-semibold">{{ fmtMs(m.avg_ttfb_ms) }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">平均耗时</span>
                  <p class="text-lg font-semibold">{{ fmtMs(m.avg_duration_ms) }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">Token/s</span>
                  <p class="text-lg font-semibold">{{ fmt(m.avg_tokens_per_sec) }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">总积分</span>
                  <p class="text-lg font-semibold">{{ fmtNum(m.total_credits) }}</p>
                </div>
                <div>
                  <span class="text-muted-foreground">成功率</span>
                  <p class="text-lg font-semibold">{{ fmt(m.success_rate) }}%</p>
                </div>
                <div>
                  <span class="text-muted-foreground">质量评分</span>
                  <p class="text-lg font-semibold">{{ fmt(m.avg_quality_score, 2) }}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <p v-if="modeData.length === 0" class="col-span-2 text-center py-8 text-muted-foreground">暂无数据</p>
        </div>
      </TabsContent>

      <!-- ========== 工具热力图 ========== -->
      <TabsContent value="tools">
        <div v-if="loading" class="text-center py-12 text-muted-foreground">加载中...</div>
        <div v-else-if="toolData" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- 工具调用频次 -->
          <Card>
            <CardHeader><CardTitle>工具调用频次 Top 20</CardTitle></CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div v-for="tool in toolData.tools" :key="tool.name" class="flex items-center gap-2">
                  <span class="text-sm w-40 truncate" :title="tool.name">{{ tool.name }}</span>
                  <div class="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                    <div
                      class="bg-primary h-full rounded-full transition-all"
                      :style="{ width: `${Math.min(100, (tool.count / (toolData!.tools[0]?.count || 1)) * 100)}%` }"
                    />
                  </div>
                  <span class="text-sm text-muted-foreground w-10 text-right">{{ tool.count }}</span>
                </div>
              </div>
              <p v-if="toolData.tools.length === 0" class="text-center py-4 text-muted-foreground">暂无数据</p>
            </CardContent>
          </Card>
          <!-- 工具组合 -->
          <Card>
            <CardHeader><CardTitle>常见工具组合 Top 10</CardTitle></CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div v-for="combo in toolData.combos" :key="combo.combo" class="flex items-center justify-between text-sm border-b py-2">
                  <span class="truncate max-w-[280px]" :title="combo.combo">{{ combo.combo }}</span>
                  <Badge variant="outline">{{ combo.count }}</Badge>
                </div>
              </div>
              <p v-if="toolData.combos.length === 0" class="text-center py-4 text-muted-foreground">暂无数据</p>
              <p class="text-xs text-muted-foreground mt-4">共 {{ toolData.total_sessions }} 个使用工具的会话</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- ========== 用户消费 ========== -->
      <TabsContent value="users">
        <div v-if="loading" class="text-center py-12 text-muted-foreground">加载中...</div>
        <div v-else-if="userData" class="space-y-4">
          <!-- Top 用户排行 -->
          <Card>
            <CardHeader><CardTitle>用户消费排行 Top 20</CardTitle></CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead><tr class="border-b">
                    <th class="text-left py-2">#</th>
                    <th class="text-left py-2">用户</th>
                    <th class="text-left py-2">会员</th>
                    <th class="text-right py-2">查询数</th>
                    <th class="text-right py-2">积分</th>
                    <th class="text-right py-2">Token</th>
                    <th class="text-right py-2">质量</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="(u, i) in userData.top_users" :key="u.id" class="border-b hover:bg-muted/50">
                      <td class="py-2">{{ i + 1 }}</td>
                      <td>{{ u.name }}</td>
                      <td><Badge variant="outline">{{ tierLabels[u.membership_tier] || u.membership_tier }}</Badge></td>
                      <td class="text-right">{{ u.total_queries }}</td>
                      <td class="text-right">{{ fmtNum(u.total_credits) }}</td>
                      <td class="text-right">{{ fmtNum(u.total_tokens) }}</td>
                      <td class="text-right">{{ fmt(u.avg_quality, 2) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-if="userData.top_users.length === 0" class="text-center py-8 text-muted-foreground">暂无数据</p>
            </CardContent>
          </Card>
          <!-- 消费趋势 -->
          <Card>
            <CardHeader><CardTitle>每日消费趋势</CardTitle></CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead><tr class="border-b">
                    <th class="text-left py-2">日期</th>
                    <th class="text-right py-2">积分</th>
                    <th class="text-right py-2">活跃用户</th>
                    <th class="text-right py-2">查询数</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="row in userData.trend" :key="row.date" class="border-b hover:bg-muted/50">
                      <td class="py-2">{{ row.date }}</td>
                      <td class="text-right">{{ fmtNum(row.total_credits) }}</td>
                      <td class="text-right">{{ row.active_users }}</td>
                      <td class="text-right">{{ row.total_queries }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- ========== 质量趋势 ========== -->
      <TabsContent value="quality">
        <div v-if="loading" class="text-center py-12 text-muted-foreground">加载中...</div>
        <div v-else-if="qualityData" class="space-y-4">
          <!-- 个性化等级分布 -->
          <Card>
            <CardHeader><CardTitle>个性化等级分布</CardTitle></CardHeader>
            <CardContent>
              <div class="flex gap-4 flex-wrap">
                <div v-for="g in qualityData.grade_distribution" :key="g.personalization_grade" class="text-center">
                  <p class="text-3xl font-bold">{{ g.count }}</p>
                  <Badge :variant="g.personalization_grade === 'S' ? 'default' : 'outline'">
                    {{ g.personalization_grade }}
                  </Badge>
                </div>
              </div>
              <p v-if="qualityData.grade_distribution.length === 0" class="text-center py-4 text-muted-foreground">暂无评分数据</p>
            </CardContent>
          </Card>
          <!-- 趋势表格 -->
          <Card>
            <CardHeader><CardTitle>每日质量趋势</CardTitle></CardHeader>
            <CardContent>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead><tr class="border-b">
                    <th class="text-left py-2">日期</th>
                    <th class="text-right py-2">综合评分</th>
                    <th class="text-right py-2">UX 评分</th>
                    <th class="text-right py-2">个性化 %</th>
                    <th class="text-right py-2">FewShot</th>
                    <th class="text-right py-2">会话数</th>
                  </tr></thead>
                  <tbody>
                    <tr v-for="row in qualityData.trend" :key="row.date" class="border-b hover:bg-muted/50">
                      <td class="py-2">{{ row.date }}</td>
                      <td class="text-right">{{ fmt(row.avg_overall_score, 2) }}</td>
                      <td class="text-right">{{ fmt(row.avg_ux_score, 2) }}</td>
                      <td class="text-right">{{ fmt(row.avg_personalization_pct) }}%</td>
                      <td class="text-right">{{ row.fewshot_count }}</td>
                      <td class="text-right">{{ row.total_sessions }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- ========== 数据库 ========== -->
      <TabsContent value="databases">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>🐬 MySQL</CardTitle></CardHeader>
            <CardContent class="space-y-2 text-sm">
              <p>phpMyAdmin 管理界面</p>
              <p class="text-muted-foreground">公网: 182.92.78.183:30932</p>
              <a href="https://fitness-phpadmin.zeabur.app" target="_blank" rel="noopener"
                class="text-primary hover:underline">打开 phpMyAdmin →</a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>🔵 Neo4j</CardTitle></CardHeader>
            <CardContent class="space-y-2 text-sm">
              <p>Neo4j Browser 图数据库可视化</p>
              <p class="text-muted-foreground">Bolt: 182.92.78.183:32372</p>
              <p class="text-muted-foreground">认证: neo4j / build_body_2024</p>
              <a href="https://fitness-neo4j.zeabur.app" target="_blank" rel="noopener"
                class="text-primary hover:underline">打开 Neo4j Browser →</a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>🟣 Qdrant</CardTitle></CardHeader>
            <CardContent class="space-y-2 text-sm">
              <p>向量数据库 Dashboard</p>
              <p class="text-muted-foreground">内网: fitness_qdrant.zeabur.internal:6333</p>
              <a href="https://qdrant-dashboard.zeabur.app" target="_blank" rel="noopener"
                class="text-primary hover:underline">打开 Qdrant Dashboard →</a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>🔴 Redis</CardTitle></CardHeader>
            <CardContent class="space-y-2 text-sm">
              <p>缓存数据库（仅内网访问）</p>
              <p class="text-muted-foreground">内网: fitness-redis.zeabur.internal:6379</p>
              <p class="text-muted-foreground">状态: 通过 /api/health/components 查看</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>
