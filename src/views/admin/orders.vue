<script setup lang="ts">
/**
 * 管理员订单审核页面
 * 审核用户上传的支付截图
 */
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast'
import { 
  CheckCircle2, XCircle, Clock, Search, RefreshCw, 
  Eye, Image as ImageIcon, User, Calendar, CreditCard, ArrowLeft
} from 'lucide-vue-next'
import api from '@/api/auth'

interface Order {
  id: number
  order_no: string
  amount: number
  status: string
  pay_method: string
  payment_proof_url: string
  proof_uploaded_at: string
  created_at: string
  user: { id: number; name: string; email: string; avatar: string }
  membership: { id: number; name: string; price: number }
}

interface Stats {
  pending: number
  reviewing: number
  paid: number
  cancelled: number
  total_revenue: number
  today_revenue: number
}

const router = useRouter()
const { toast } = useToast()

const loading = ref(false)
const orders = ref<Order[]>([])
const stats = ref<Stats | null>(null)
const currentTab = ref('reviewing')
const searchQuery = ref('')

// 审核弹窗
const reviewDialog = ref(false)
const selectedOrder = ref<Order | null>(null)
const rejectNote = ref('')
const reviewing = ref(false)

// 图片预览
const imagePreview = ref(false)
const previewUrl = ref('')

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待支付', variant: 'secondary' },
  reviewing: { label: '待审核', variant: 'default' },
  paid: { label: '已支付', variant: 'outline' },
  cancelled: { label: '已取消', variant: 'destructive' },
  refunded: { label: '已退款', variant: 'destructive' }
}

// 处理图片URL，使用API代理绕过ORB限制
function getFullImageUrl(url: string): string {
  if (!url) return ''
  // 从URL中提取订单号
  const match = url.match(/payment_proofs\/([^_]+)_/)
  if (match) {
    const orderNo = match[1]
    // 使用API代理获取图片
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    return `${apiBaseUrl}/membership/orders/${orderNo}/proof-image`
  }
  // 如果无法提取订单号，返回原URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const backendUrl = apiBaseUrl.replace('/api', '')
  return backendUrl + url
}

onMounted(async () => {
  await Promise.all([loadStats(), loadOrders()])
})

async function loadStats() {
  try {
    const res = await api.get('/admin/orders/stats')
    if (res.code === 200) {
      stats.value = res.data
    }
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

async function loadOrders() {
  loading.value = true
  try {
    const endpoint = currentTab.value === 'reviewing' ? '/admin/orders/pending' : '/admin/orders'
    const params: any = {}
    if (currentTab.value !== 'reviewing' && currentTab.value !== 'all') {
      params.status = currentTab.value
    }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    
    const res = await api.get(endpoint, { params })
    if (res.code === 200) {
      orders.value = res.data.orders
    }
  } catch (e) {
    console.error('加载订单失败', e)
  } finally {
    loading.value = false
  }
}

function openReviewDialog(order: Order) {
  selectedOrder.value = order
  rejectNote.value = ''
  reviewDialog.value = true
}

function openImagePreview(url: string) {
  previewUrl.value = url
  imagePreview.value = true
}

async function approveOrder() {
  if (!selectedOrder.value) return
  reviewing.value = true
  try {
    const res = await api.post(`/admin/orders/${selectedOrder.value.id}/approve`)
    if (res.code === 200) {
      toast({ title: '审核通过', description: '会员已激活' })
      reviewDialog.value = false
      await Promise.all([loadStats(), loadOrders()])
    } else {
      toast({ title: '操作失败', description: res.msg, variant: 'destructive' })
    }
  } catch (e: any) {
    toast({ title: '操作失败', description: e.message, variant: 'destructive' })
  } finally {
    reviewing.value = false
  }
}

async function rejectOrder() {
  if (!selectedOrder.value || !rejectNote.value.trim()) {
    toast({ title: '请填写拒绝原因', variant: 'destructive' })
    return
  }
  reviewing.value = true
  try {
    const res = await api.post(`/admin/orders/${selectedOrder.value.id}/reject`, { note: rejectNote.value })
    if (res.code === 200) {
      toast({ title: '已拒绝', description: '用户可重新上传截图' })
      reviewDialog.value = false
      await Promise.all([loadStats(), loadOrders()])
    } else {
      toast({ title: '操作失败', description: res.msg, variant: 'destructive' })
    }
  } catch (e: any) {
    toast({ title: '操作失败', description: e.message, variant: 'destructive' })
  } finally {
    reviewing.value = false
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

function onTabChange(tab: string) {
  currentTab.value = tab
  loadOrders()
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="router.push('/admin')">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div class="flex-1 flex items-center justify-center">
          <h1 class="text-lg font-semibold">订单管理</h1>
        </div>
        <Button variant="ghost" size="icon" @click="loadOrders">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </header>

    <main class="container mx-auto p-4 space-y-6">

    <!-- 统计卡片 -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4">
          <div class="text-sm text-muted-foreground">待审核</div>
          <div class="text-2xl font-bold text-amber-500">{{ stats.reviewing }}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-sm text-muted-foreground">已支付</div>
          <div class="text-2xl font-bold text-green-500">{{ stats.paid }}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-sm text-muted-foreground">今日收入</div>
          <div class="text-2xl font-bold">¥{{ Number(stats.today_revenue || 0).toFixed(2) }}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <div class="text-sm text-muted-foreground">总收入</div>
          <div class="text-2xl font-bold">¥{{ Number(stats.total_revenue || 0).toFixed(2) }}</div>
        </CardContent>
      </Card>
    </div>

    <!-- 搜索和筛选 -->
    <div class="flex gap-4">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="搜索订单号或用户名" class="pl-10" @keyup.enter="loadOrders" />
      </div>
    </div>

    <!-- 订单列表 -->
    <Tabs :default-value="currentTab" @update:model-value="onTabChange">
      <TabsList>
        <TabsTrigger value="reviewing">待审核 ({{ stats?.reviewing || 0 }})</TabsTrigger>
        <TabsTrigger value="all">全部订单</TabsTrigger>
        <TabsTrigger value="paid">已支付</TabsTrigger>
        <TabsTrigger value="pending">待支付</TabsTrigger>
      </TabsList>

      <TabsContent :value="currentTab" class="mt-4">
        <div v-if="loading" class="text-center py-8 text-muted-foreground">加载中...</div>
        <div v-else-if="orders.length === 0" class="text-center py-8 text-muted-foreground">暂无订单</div>
        <div v-else class="space-y-4">
          <Card v-for="order in orders" :key="order.id" class="overflow-hidden">
            <CardContent class="p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 space-y-2">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm">{{ order.order_no }}</span>
                    <Badge :variant="statusMap[order.status]?.variant || 'secondary'">
                      {{ statusMap[order.status]?.label || order.status }}
                    </Badge>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-muted-foreground">
                    <span class="flex items-center gap-1">
                      <User class="h-3 w-3" />{{ order.user?.name || '未知用户' }}
                    </span>
                    <span class="flex items-center gap-1">
                      <CreditCard class="h-3 w-3" />{{ order.membership?.name }} ¥{{ order.amount }}
                    </span>
                    <span class="flex items-center gap-1">
                      <Calendar class="h-3 w-3" />{{ formatDate(order.created_at) }}
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Button v-if="order.payment_proof_url" variant="outline" size="sm" @click="openImagePreview(getFullImageUrl(order.payment_proof_url))">
                    <ImageIcon class="h-4 w-4 mr-1" />查看截图
                  </Button>
                  <Button v-if="order.status === 'reviewing'" size="sm" @click="openReviewDialog(order)">
                    <Eye class="h-4 w-4 mr-1" />审核
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>

    <!-- 审核弹窗 -->
    <Dialog v-model:open="reviewDialog">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>审核订单</DialogTitle>
        </DialogHeader>
        <div v-if="selectedOrder" class="space-y-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-muted-foreground">订单号：</span>{{ selectedOrder.order_no }}</div>
            <div><span class="text-muted-foreground">金额：</span>¥{{ selectedOrder.amount }}</div>
            <div><span class="text-muted-foreground">用户：</span>{{ selectedOrder.user?.name }}</div>
            <div><span class="text-muted-foreground">套餐：</span>{{ selectedOrder.membership?.name }}</div>
            <div><span class="text-muted-foreground">支付方式：</span>{{ selectedOrder.pay_method === 'wechat' ? '微信' : '支付宝' }}</div>
            <div><span class="text-muted-foreground">上传时间：</span>{{ formatDate(selectedOrder.proof_uploaded_at) }}</div>
          </div>
          
          <div v-if="selectedOrder.payment_proof_url" class="border rounded-lg p-2">
            <img :src="getFullImageUrl(selectedOrder.payment_proof_url)" alt="支付截图" class="max-h-64 mx-auto cursor-pointer" @click="openImagePreview(getFullImageUrl(selectedOrder.payment_proof_url))" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">拒绝原因（拒绝时必填）</label>
            <Textarea v-model="rejectNote" placeholder="请填写拒绝原因，如：截图模糊、金额不符等" rows="3" />
          </div>
        </div>
        <DialogFooter class="gap-2">
          <Button variant="destructive" :disabled="reviewing" @click="rejectOrder">
            <XCircle class="h-4 w-4 mr-1" />拒绝
          </Button>
          <Button :disabled="reviewing" @click="approveOrder">
            <CheckCircle2 class="h-4 w-4 mr-1" />通过
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 图片预览 -->
    <Dialog v-model:open="imagePreview">
      <DialogContent class="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>支付截图预览</DialogTitle>
        </DialogHeader>
        <img :src="previewUrl" alt="支付截图" class="w-full" />
      </DialogContent>
    </Dialog>
    </main>
  </div>
</template>
