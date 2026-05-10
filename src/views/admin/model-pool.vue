<script setup lang="ts">
/**
 * 模型池管理页面
 * 展示 yuzhenfork 的模型池状态，支持启用/禁用模型
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Cpu, RefreshCw } from 'lucide-vue-next'

const router = useRouter()

interface ModelInfo {
  id: string
  backendName: string
  modelId: string
  weight: number
  costTier: string
  contextWindow: number
  enabled: boolean
}

const loading = ref(true)
const models = ref<ModelInfo[]>([])
const strategy = ref('weighted-random')

// Mock 数据（后续接入真实 API）
const mockModels: ModelInfo[] = [
  {
    id: '1',
    backendName: 'openai-primary',
    modelId: 'gpt-4o',
    weight: 40,
    costTier: 'high',
    contextWindow: 128000,
    enabled: true
  },
  {
    id: '2',
    backendName: 'openai-mini',
    modelId: 'gpt-4o-mini',
    weight: 30,
    costTier: 'low',
    contextWindow: 128000,
    enabled: true
  },
  {
    id: '3',
    backendName: 'deepseek-chat',
    modelId: 'deepseek-chat',
    weight: 20,
    costTier: 'low',
    contextWindow: 64000,
    enabled: true
  },
  {
    id: '4',
    backendName: 'claude-sonnet',
    modelId: 'claude-3-5-sonnet-20241022',
    weight: 10,
    costTier: 'high',
    contextWindow: 200000,
    enabled: false
  }
]

const enabledCount = computed(() => models.value.filter(m => m.enabled).length)
const totalCount = computed(() => models.value.length)

onMounted(async () => {
  await loadModels()
})

async function loadModels() {
  loading.value = true
  try {
    // TODO: 接入真实 API GET http://localhost:4567/api/models
    // const res = await fetch('http://localhost:4567/api/models')
    // const data = await res.json()
    // models.value = data.models
    
    // 暂用 mock 数据
    await new Promise(resolve => setTimeout(resolve, 500))
    models.value = mockModels
  } finally {
    loading.value = false
  }
}

function toggleModel(model: ModelInfo) {
  model.enabled = !model.enabled
  // TODO: 调用 API 更新模型状态
  // await fetch(`http://localhost:4567/api/models/${model.id}/toggle`, { method: 'POST' })
}

function getCostBadgeVariant(tier: string) {
  switch (tier) {
    case 'high': return 'destructive'
    case 'medium': return 'default'
    case 'low': return 'secondary'
    default: return 'outline'
  }
}

function formatContextWindow(tokens: number) {
  return `${(tokens / 1000).toFixed(0)}K`
}

function goBack() {
  router.push('/admin')
}
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
          <Cpu class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">模型池管理</h1>
        </div>
        <Button variant="ghost" size="icon" @click="loadModels">
          <RefreshCw class="h-4 w-4" />
        </Button>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 总览卡片 -->
      <div class="grid grid-cols-3 gap-4">
        <Card>
          <CardContent class="p-4 text-center">
            <div class="text-sm text-muted-foreground">可用模型</div>
            <div class="text-2xl font-bold text-green-500">{{ enabledCount }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4 text-center">
            <div class="text-sm text-muted-foreground">总模型数</div>
            <div class="text-2xl font-bold">{{ totalCount }}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4 text-center">
            <div class="text-sm text-muted-foreground">调度策略</div>
            <div class="text-sm font-medium text-primary mt-1">{{ strategy }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- 模型列表 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">模型列表</CardTitle>
          <CardDescription>管理模型池中的模型状态和权重配置</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="loading" class="flex items-center justify-center py-8">
            <RefreshCw class="h-5 w-5 animate-spin text-muted-foreground" />
            <span class="ml-2 text-muted-foreground">加载中...</span>
          </div>
          <div v-else class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>后端名称</TableHead>
                  <TableHead>模型ID</TableHead>
                  <TableHead class="text-center">权重</TableHead>
                  <TableHead class="text-center">成本层级</TableHead>
                  <TableHead class="text-center">上下文窗口</TableHead>
                  <TableHead class="text-center">状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="model in models" :key="model.id">
                  <TableCell class="font-medium">{{ model.backendName }}</TableCell>
                  <TableCell>
                    <code class="text-xs bg-muted px-1.5 py-0.5 rounded">{{ model.modelId }}</code>
                  </TableCell>
                  <TableCell class="text-center">{{ model.weight }}%</TableCell>
                  <TableCell class="text-center">
                    <Badge :variant="getCostBadgeVariant(model.costTier)">
                      {{ model.costTier }}
                    </Badge>
                  </TableCell>
                  <TableCell class="text-center">{{ formatContextWindow(model.contextWindow) }}</TableCell>
                  <TableCell class="text-center">
                    <Switch
                      :checked="model.enabled"
                      @update:checked="() => toggleModel(model)"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <!-- 权重分布图占位 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">权重分布</CardTitle>
          <CardDescription>各模型流量分配比例（ECharts 后续接入）</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-center justify-center h-48 border-2 border-dashed rounded-lg text-muted-foreground">
            <div class="text-center">
              <Cpu class="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p class="text-sm">权重分布饼图</p>
              <p class="text-xs mt-1">ECharts 后续接入</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  </div>
</template>
