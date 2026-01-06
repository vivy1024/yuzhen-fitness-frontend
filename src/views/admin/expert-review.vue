<script setup lang="ts">
/**
 * 专家评审页面（三轨评分核心）
 * 
 * 三轨评分体系：
 * 1. 程序自动评分（个性化感知） - DAML-RAG自动计算
 * 2. 用户体验评分 - 用户手动评价
 * 3. 专家/管理员评审 - 本页面实现
 * 
 * 只有三轨评分都完成，才能导入Few-Shot库
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/toast'
import { 
  ArrowLeft, RefreshCw, Star, CheckCircle2, AlertTriangle, 
  MessageSquare, Brain, User, Shield, Target, Sparkles
} from 'lucide-vue-next'
import api from '@/api/auth'

const router = useRouter()
const { toast } = useToast()

const loading = ref(false)
const sessions = ref<any[]>([])
const currentTab = ref('pending')

// 评审弹窗
const reviewDialog = ref(false)
const selectedSession = ref<any>(null)
const reviewing = ref(false)

// 专家评分（6维度）
const expertScores = ref({
  accuracy: [4],      // 准确性
  scientific: [4],    // 科学性
  safety: [4],        // 安全性（一票否决）
  completeness: [4],  // 完整性
  practicality: [4],  // 实用性
  personalization: [4] // 个性化
})
const expertComments = ref('')

onMounted(async () => {
  await loadSessions()
})

async function loadSessions() {
  loading.value = true
  try {
    // 获取待评审的会话（有用户评分但无专家评分）
    const endpoint = currentTab.value === 'pending' 
      ? '/admin/sessions/pending-review'
      : '/admin/sessions/reviewed'
    
    const res = await api.get(endpoint)
    if (res.code === 200) {
      sessions.value = res.data.sessions || []
    }
  } catch (e) {
    console.error('加载会话失败', e)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/admin')
}

function openReviewDialog(session: any) {
  selectedSession.value = session
  // 重置评分
  expertScores.value = {
    accuracy: [4],
    scientific: [4],
    safety: [4],
    completeness: [4],
    practicality: [4],
    personalization: [4]
  }
  expertComments.value = ''
  reviewDialog.value = true
}

async function submitReview() {
  if (!selectedSession.value) return
  
  reviewing.value = true
  try {
    const res = await api.post(`/v2/quality/rating/${selectedSession.value.session_id}/expert`, {
      accuracy: expertScores.value.accuracy[0],
      scientific: expertScores.value.scientific[0],
      safety: expertScores.value.safety[0],
      completeness: expertScores.value.completeness[0],
      practicality: expertScores.value.practicality[0],
      personalization: expertScores.value.personalization[0],
      comments: expertComments.value
    })
    
    if (res.code === 200) {
      toast({ 
        title: '评审提交成功', 
        description: res.data.fewshot_eligible ? '已导入Few-Shot库' : '评分已保存'
      })
      reviewDialog.value = false
      await loadSessions()
    } else {
      toast({ title: '提交失败', description: res.msg, variant: 'destructive' })
    }
  } catch (e: any) {
    toast({ title: '提交失败', description: e.message, variant: 'destructive' })
  } finally {
    reviewing.value = false
  }
}

// 计算专家评分平均值
const expertAverage = computed(() => {
  const scores = [
    expertScores.value.accuracy[0],
    expertScores.value.scientific[0],
    expertScores.value.safety[0],
    expertScores.value.completeness[0],
    expertScores.value.practicality[0],
    expertScores.value.personalization[0]
  ]
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
})

// 安全性警告
const safetyWarning = computed(() => expertScores.value.safety[0] < 3)

// 个性化等级颜色
const gradeColors: Record<string, string> = {
  'S': 'bg-purple-500',
  'A': 'bg-green-500',
  'B': 'bg-blue-500',
  'C': 'bg-yellow-500',
  'D': 'bg-red-500'
}

function getUxAverage(session: any) {
  const scores = [
    session.ux_clarity,
    session.ux_practicality,
    session.ux_detail,
    session.ux_friendliness,
    session.ux_satisfaction
  ].filter(s => s !== null)
  if (scores.length === 0) return null
  return (scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(2)
}

function getPersonalizationAverage(session: any) {
  const scores = [
    session.profile_utilization_rate,
    session.goal_alignment,
    session.uniqueness,
    session.dynamic_adjustment
  ].filter(s => s !== null)
  if (scores.length === 0) return null
  return ((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) / 20).toFixed(2)
}

function onTabChange(tab: string) {
  currentTab.value = tab
  loadSessions()
}

const scoreLabels: Record<string, { label: string; icon: any; desc: string }> = {
  accuracy: { label: '准确性', icon: Target, desc: '信息是否准确无误' },
  scientific: { label: '科学性', icon: Brain, desc: '是否符合运动科学原理' },
  safety: { label: '安全性', icon: Shield, desc: '是否存在安全隐患（<3分一票否决）' },
  completeness: { label: '完整性', icon: CheckCircle2, desc: '回答是否完整全面' },
  practicality: { label: '实用性', icon: Sparkles, desc: '建议是否可操作' },
  personalization: { label: '个性化', icon: User, desc: '是否针对用户情况定制' }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div class="flex-1 flex items-center justify-center gap-2">
          <Star class="h-5 w-5 text-amber-500" />
          <h1 class="text-lg font-semibold">专家评审</h1>
        </div>
        <Button variant="ghost" size="icon" @click="loadSessions">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 三轨评分说明 -->
      <Card class="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent class="p-4">
          <div class="flex items-start gap-3">
            <div class="p-2 rounded-lg bg-purple-500/20">
              <Star class="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h3 class="font-semibold">三轨评分体系</h3>
              <p class="text-sm text-muted-foreground mt-1">
                只有三轨评分都完成且达标，对话才能导入Few-Shot库用于AI学习
              </p>
              <div class="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">1. 程序自动评分</Badge>
                <Badge variant="outline">2. 用户体验评分</Badge>
                <Badge class="bg-amber-500 text-white">3. 专家评审 ←</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs :default-value="currentTab" @update:model-value="onTabChange">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="pending">待评审</TabsTrigger>
          <TabsTrigger value="reviewed">已评审</TabsTrigger>
        </TabsList>

        <TabsContent :value="currentTab" class="mt-4">
          <div v-if="loading" class="text-center py-8 text-muted-foreground">加载中...</div>
          <div v-else-if="sessions.length === 0" class="text-center py-8 text-muted-foreground">
            {{ currentTab === 'pending' ? '暂无待评审会话' : '暂无已评审会话' }}
          </div>
          <div v-else class="space-y-4">
            <Card v-for="session in sessions" :key="session.id" class="overflow-hidden">
              <CardContent class="p-4">
                <div class="space-y-3">
                  <!-- 会话信息 -->
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <Badge v-if="session.personalization_grade" :class="gradeColors[session.personalization_grade]" class="text-white">
                          {{ session.personalization_grade }}级
                        </Badge>
                        <Badge v-if="session.fewshot_eligible" class="bg-green-500 text-white">
                          <CheckCircle2 class="h-3 w-3 mr-1" />Few-Shot
                        </Badge>
                      </div>
                      <p class="text-sm mt-2 line-clamp-2">{{ session.user_query }}</p>
                    </div>
                  </div>

                  <!-- 三轨评分状态 -->
                  <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div class="p-2 bg-accent rounded">
                      <div class="text-muted-foreground">程序评分</div>
                      <div class="font-medium text-blue-500">
                        {{ getPersonalizationAverage(session) || '-' }}
                      </div>
                    </div>
                    <div class="p-2 bg-accent rounded">
                      <div class="text-muted-foreground">用户评分</div>
                      <div class="font-medium text-amber-500">
                        {{ getUxAverage(session) || '-' }}
                      </div>
                    </div>
                    <div class="p-2 bg-accent rounded">
                      <div class="text-muted-foreground">专家评分</div>
                      <div class="font-medium" :class="session.expert_avg ? 'text-purple-500' : 'text-muted-foreground'">
                        {{ session.expert_avg?.toFixed(2) || '待评' }}
                      </div>
                    </div>
                  </div>

                  <!-- 操作按钮 -->
                  <div class="flex justify-end">
                    <Button 
                      v-if="currentTab === 'pending'" 
                      size="sm" 
                      @click="openReviewDialog(session)"
                    >
                      <Star class="h-4 w-4 mr-1" />开始评审
                    </Button>
                    <Button 
                      v-else 
                      variant="outline" 
                      size="sm" 
                      @click="openReviewDialog(session)"
                    >
                      查看详情
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>

    <!-- 评审弹窗 -->
    <Dialog v-model:open="reviewDialog">
      <DialogContent class="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>专家评审</DialogTitle>
        </DialogHeader>
        
        <div v-if="selectedSession" class="space-y-6">
          <!-- 对话内容 -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm flex items-center gap-2">
                <MessageSquare class="h-4 w-4" />对话内容
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3">
              <div>
                <div class="text-xs text-muted-foreground mb-1">用户问题</div>
                <p class="text-sm bg-accent p-2 rounded">{{ selectedSession.user_query }}</p>
              </div>
              <div>
                <div class="text-xs text-muted-foreground mb-1">AI回答</div>
                <p class="text-sm bg-accent p-2 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {{ selectedSession.llm_response?.substring(0, 500) }}{{ selectedSession.llm_response?.length > 500 ? '...' : '' }}
                </p>
              </div>
            </CardContent>
          </Card>

          <!-- 已有评分 -->
          <div class="grid grid-cols-2 gap-4">
            <Card>
              <CardContent class="p-4">
                <div class="text-sm text-muted-foreground">程序自动评分</div>
                <div class="text-xl font-bold text-blue-500">
                  {{ getPersonalizationAverage(selectedSession) || '-' }}
                </div>
                <Badge v-if="selectedSession.personalization_grade" :class="gradeColors[selectedSession.personalization_grade]" class="text-white mt-1">
                  {{ selectedSession.personalization_grade }}级
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardContent class="p-4">
                <div class="text-sm text-muted-foreground">用户体验评分</div>
                <div class="text-xl font-bold text-amber-500">
                  {{ getUxAverage(selectedSession) || '-' }}
                </div>
              </CardContent>
            </Card>
          </div>

          <!-- 专家评分（6维度） -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="text-sm flex items-center justify-between">
                <span class="flex items-center gap-2">
                  <Star class="h-4 w-4 text-amber-500" />专家评分
                </span>
                <span class="text-lg font-bold" :class="safetyWarning ? 'text-red-500' : 'text-purple-500'">
                  {{ expertAverage }}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-4">
              <div v-for="(config, key) in scoreLabels" :key="key" class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <component :is="config.icon" class="h-4 w-4 text-muted-foreground" />
                    <span class="text-sm font-medium">{{ config.label }}</span>
                    <span class="text-xs text-muted-foreground">{{ config.desc }}</span>
                  </div>
                  <span class="font-bold" :class="key === 'safety' && expertScores[key as keyof typeof expertScores][0] < 3 ? 'text-red-500' : ''">
                    {{ expertScores[key as keyof typeof expertScores][0] }}
                  </span>
                </div>
                <Slider 
                  v-model="expertScores[key as keyof typeof expertScores]" 
                  :min="1" 
                  :max="5" 
                  :step="1"
                  :class="key === 'safety' && expertScores[key as keyof typeof expertScores][0] < 3 ? '[&_[role=slider]]:bg-red-500' : ''"
                />
              </div>

              <!-- 安全性警告 -->
              <div v-if="safetyWarning" class="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle class="h-5 w-5 text-red-500" />
                <div>
                  <div class="font-medium text-red-500">安全性一票否决</div>
                  <div class="text-xs text-muted-foreground">安全性评分低于3分，此对话将不会导入Few-Shot库</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 评审意见 -->
          <div class="space-y-2">
            <label class="text-sm font-medium">评审意见（可选）</label>
            <Textarea v-model="expertComments" placeholder="请填写评审意见、改进建议等" rows="3" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="reviewDialog = false">取消</Button>
          <Button :disabled="reviewing" @click="submitReview">
            <CheckCircle2 class="h-4 w-4 mr-1" />提交评审
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
