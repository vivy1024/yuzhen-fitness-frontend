<script setup lang="ts">
/**
 * 账单历史组件
 * 显示所有支付记录，支持订单详情查看和删除
 */
import { ref, onMounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useMembershipStore } from '@/stores/membership'
import { showSuccess, showError } from '@/components/ui/toast'
import { 
  Receipt, 
  CreditCard, 
  Calendar,
  ChevronRight,
  RefreshCw,
  FileText,
  Trash2,
  X
} from 'lucide-vue-next'
import type { BillingRecord } from '@/api/membership'

const membershipStore = useMembershipStore()

// 详情弹窗
const showDetailDialog = ref(false)
const selectedRecord = ref<BillingRecord | null>(null)

// 删除确认弹窗
const showDeleteDialog = ref(false)
const recordToDelete = ref<BillingRecord | null>(null)
const deleting = ref(false)

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取支付方式图标
function getPaymentMethodIcon(method: string) {
  return method === 'wechat' ? '💚' : '💙'
}

// 获取支付方式名称
function getPaymentMethodName(method: string) {
  return method === 'wechat' ? '微信支付' : '支付宝'
}

// 获取状态徽章
function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return { text: '已支付', variant: 'default' as const }
    case 'pending':
      return { text: '待支付', variant: 'outline' as const }
    case 'cancelled':
      return { text: '已取消', variant: 'secondary' as const }
    case 'refunded':
      return { text: '已退款', variant: 'secondary' as const }
    case 'failed':
      return { text: '支付失败', variant: 'destructive' as const }
    default:
      return { text: status, variant: 'outline' as const }
  }
}

// 是否可以删除（仅待支付订单）
function canDelete(status: string) {
  return status === 'pending'
}

// 查看详情
function viewDetail(record: BillingRecord) {
  selectedRecord.value = record
  showDetailDialog.value = true
}

// 确认删除
function confirmDelete(record: BillingRecord) {
  recordToDelete.value = record
  showDeleteDialog.value = true
}

// 执行删除
async function handleDelete() {
  if (!recordToDelete.value) return
  
  deleting.value = true
  const result = await membershipStore.deleteOrder(recordToDelete.value.id)
  deleting.value = false
  
  if (result.success) {
    showSuccess('订单已删除')
    showDeleteDialog.value = false
    recordToDelete.value = null
  } else {
    showError(result.message || '删除失败')
  }
}

// 加载账单历史
async function loadBillingHistory() {
  await membershipStore.fetchBillingHistory()
}

// 加载更多
async function loadMore() {
  await membershipStore.fetchBillingHistory(membershipStore.billingPage + 1)
}

// 刷新
async function refresh() {
  await membershipStore.fetchBillingHistory(1)
}

onMounted(() => {
  loadBillingHistory()
})
</script>

<template>
  <div class="space-y-4">
    <!-- 标题栏 -->
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold flex items-center gap-2">
        <Receipt class="h-5 w-5" />
        账单记录
      </h3>
      <Button variant="ghost" size="sm" @click="refresh" :disabled="membershipStore.billingLoading">
        <RefreshCw :class="['h-4 w-4', membershipStore.billingLoading ? 'animate-spin' : '']" />
      </Button>
    </div>

    <!-- 加载状态 -->
    <div v-if="membershipStore.billingLoading && membershipStore.billingRecords.length === 0" class="space-y-3">
      <Card v-for="i in 3" :key="i">
        <CardContent class="p-4">
          <div class="flex items-center gap-4">
            <Skeleton class="h-10 w-10 rounded-lg" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-3 w-24" />
            </div>
            <Skeleton class="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- 账单列表 -->
    <div v-else-if="membershipStore.billingRecords.length > 0" class="space-y-3">
      <Card 
        v-for="record in membershipStore.billingRecords" 
        :key="record.id"
        class="hover:bg-accent/50 transition-colors"
      >
        <CardContent class="p-4">
          <div class="flex items-center gap-4">
            <!-- 支付方式图标 -->
            <div class="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">
              {{ getPaymentMethodIcon(record.payment_method) }}
            </div>

            <!-- 订单信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium truncate">{{ record.membership_name }}</span>
                <Badge :variant="getStatusBadge(record.status).variant" class="text-xs">
                  {{ getStatusBadge(record.status).text }}
                </Badge>
              </div>
              <div class="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span class="flex items-center gap-1">
                  <Calendar class="h-3 w-3" />
                  {{ formatDate(record.paid_at || record.created_at) }}
                </span>
                <span>{{ record.duration_days }}天</span>
              </div>
            </div>

            <!-- 金额 -->
            <div class="text-right">
              <div class="font-semibold">
                {{ record.status === 'refunded' ? '-' : '' }}¥{{ record.amount.toFixed(2) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ getPaymentMethodName(record.payment_method) }}
              </div>
            </div>
          </div>

          <!-- 订单号和操作按钮 -->
          <div class="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>订单号：{{ record.order_no }}</span>
            <div class="flex gap-2">
              <Button variant="ghost" size="sm" class="h-6 text-xs" @click="viewDetail(record)">
                <FileText class="h-3 w-3 mr-1" />
                详情
              </Button>
              <Button 
                v-if="canDelete(record.status)"
                variant="ghost" 
                size="sm" 
                class="h-6 text-xs text-destructive hover:text-destructive"
                @click.stop="confirmDelete(record)"
              >
                <Trash2 class="h-3 w-3 mr-1" />
                删除
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 加载更多 -->
      <div v-if="membershipStore.billingRecords.length < membershipStore.billingTotal" class="text-center pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          @click="loadMore"
          :disabled="membershipStore.billingLoading"
        >
          <RefreshCw v-if="membershipStore.billingLoading" class="h-4 w-4 mr-2 animate-spin" />
          加载更多
        </Button>
      </div>
    </div>

    <!-- 空状态 -->
    <Card v-else class="bg-muted/30">
      <CardContent class="py-12 text-center">
        <Receipt class="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <p class="text-muted-foreground">暂无账单记录</p>
        <p class="text-sm text-muted-foreground/70 mt-1">开通会员后，账单将显示在这里</p>
      </CardContent>
    </Card>

    <!-- 订单详情弹窗 -->
    <Dialog v-model:open="showDetailDialog">
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>订单详情</DialogTitle>
          <DialogDescription>查看订单的详细信息</DialogDescription>
        </DialogHeader>
        
        <div v-if="selectedRecord" class="space-y-4">
          <!-- 订单状态 -->
          <div class="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span class="text-sm text-muted-foreground">订单状态</span>
            <Badge :variant="getStatusBadge(selectedRecord.status).variant">
              {{ getStatusBadge(selectedRecord.status).text }}
            </Badge>
          </div>

          <!-- 订单信息 -->
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">订单号</span>
              <span class="font-mono">{{ selectedRecord.order_no }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">套餐名称</span>
              <span class="font-medium">{{ selectedRecord.membership_name }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">套餐时长</span>
              <span>{{ selectedRecord.duration_days }}天</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">订单金额</span>
              <span class="text-lg font-bold">¥{{ selectedRecord.amount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">支付方式</span>
              <span>{{ getPaymentMethodName(selectedRecord.payment_method) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">创建时间</span>
              <span>{{ formatDate(selectedRecord.created_at) }}</span>
            </div>
            <div v-if="selectedRecord.paid_at" class="flex justify-between text-sm">
              <span class="text-muted-foreground">支付时间</span>
              <span>{{ formatDate(selectedRecord.paid_at) }}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showDetailDialog = false">关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除确认弹窗 -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除订单？</AlertDialogTitle>
          <AlertDialogDescription>
            删除后将无法恢复。订单号：{{ recordToDelete?.order_no }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleting">取消</AlertDialogCancel>
          <AlertDialogAction 
            @click="handleDelete"
            :disabled="deleting"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {{ deleting ? '删除中...' : '确认删除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
