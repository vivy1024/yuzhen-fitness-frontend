<script setup lang="ts">
/**
 * 支付流程组件
 * 收款码+截图上传的打赏支付方式
 * MVP阶段：用户扫码付款后上传截图，管理员后台审核开通
 */
import { ref, computed, watch } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useMembershipStore } from '@/stores/membership'
import { useToast } from '@/components/ui/toast'
import { 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Clock,
  Upload,
  ArrowLeft,
  ArrowRight
} from 'lucide-vue-next'
import type { MembershipTier } from '@/api/membership'

interface Props {
  open: boolean
  tier: MembershipTier | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
  'cancel': []
}>()

const membershipStore = useMembershipStore()
const { toast } = useToast()

type PaymentMethod = 'wechat' | 'alipay'
const selectedMethod = ref<PaymentMethod>('wechat')

type PaymentStep = 'select' | 'scan' | 'upload' | 'reviewing' | 'success' | 'failed'
const currentStep = ref<PaymentStep>('select')

const qrCodeUrls = ref({ wechat: '', alipay: '' })
const proofFile = ref<File | null>(null)
const proofPreview = ref<string>('')
const uploading = ref(false)
const currentOrderNo = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const currentQRCode = computed(() => {
  return selectedMethod.value === 'wechat' ? qrCodeUrls.value.wechat : qrCodeUrls.value.alipay
})

const paymentMethods = [
  { id: 'wechat' as PaymentMethod, name: '微信支付', icon: '💚', desc: '推荐使用' },
  { id: 'alipay' as PaymentMethod, name: '支付宝', icon: '💙', desc: '' }
]

watch(() => props.open, async (open) => {
  if (open) {
    await loadQRCodes()
  } else {
    resetState()
  }
})

async function loadQRCodes() {
  try {
    const result = await membershipStore.getPaymentQRCodes()
    if (result.success && result.data) {
      qrCodeUrls.value = result.data
    }
  } catch (error) {
    console.error('加载收款码失败:', error)
  }
}

async function startPayment() {
  if (!props.tier) return
  const result = await membershipStore.createOrder(props.tier.id, selectedMethod.value)
  if (result.success && result.order) {
    currentOrderNo.value = result.order.order_no
    currentStep.value = 'scan'
  } else {
    toast({ title: '创建订单失败', description: result.message || '请稍后重试', variant: 'destructive' })
  }
}

function goToUpload() { currentStep.value = 'upload' }
function backToScan() {
  currentStep.value = 'scan'
  proofFile.value = null
  proofPreview.value = ''
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    if (!file.type.startsWith('image/')) {
      toast({ title: '文件格式错误', description: '请上传图片格式文件', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '文件过大', description: '图片大小不能超过5MB', variant: 'destructive' })
      return
    }
    proofFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => { proofPreview.value = e.target?.result as string }
    reader.readAsDataURL(file)
  }
}

async function uploadProof() {
  if (!proofFile.value || !currentOrderNo.value) return
  uploading.value = true
  try {
    const result = await membershipStore.uploadPaymentProof(currentOrderNo.value, proofFile.value, selectedMethod.value)
    if (result.success) {
      currentStep.value = 'reviewing'
      toast({ title: '上传成功', description: '截图已提交，请等待审核' })
    } else {
      toast({ title: '上传失败', description: result.error || '请稍后重试', variant: 'destructive' })
    }
  } catch (error) {
    toast({ title: '上传失败', description: '网络错误，请稍后重试', variant: 'destructive' })
  } finally {
    uploading.value = false
  }
}

function cancelPayment() { emit('cancel'); closeDialog() }
function closeDialog() { resetState(); isOpen.value = false }
function resetState() {
  currentStep.value = 'select'
  selectedMethod.value = 'wechat'
  proofFile.value = null
  proofPreview.value = ''
  currentOrderNo.value = ''
  uploading.value = false
}
function finishAndClose() { emit('success'); closeDialog() }
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {{ currentStep === 'success' ? '支付成功' : 
             currentStep === 'failed' ? '支付失败' : 
             currentStep === 'reviewing' ? '等待审核' :
             currentStep === 'upload' ? '上传支付截图' :
             currentStep === 'scan' ? '扫码支付' : '确认支付' }}
        </DialogTitle>
        <DialogDescription v-if="tier && currentStep === 'select'">
          {{ tier.name }} - ¥{{ tier.price.toFixed(2) }}
        </DialogDescription>
      </DialogHeader>

      <!-- 步骤1: 选择支付方式 -->
      <div v-if="currentStep === 'select'" class="space-y-4">
        <div class="space-y-2">
          <p class="text-sm font-medium">选择支付方式</p>
          <div class="grid grid-cols-2 gap-3">
            <Card 
              v-for="method in paymentMethods" 
              :key="method.id"
              :class="['cursor-pointer transition-all', selectedMethod === method.id ? 'ring-2 ring-primary' : 'hover:bg-accent']"
              @click="selectedMethod = method.id"
            >
              <CardContent class="p-4 flex flex-col items-center gap-2">
                <span class="text-2xl">{{ method.icon }}</span>
                <span class="font-medium text-sm">{{ method.name }}</span>
                <span v-if="method.desc" class="text-xs text-muted-foreground">{{ method.desc }}</span>
              </CardContent>
            </Card>
          </div>
        </div>
        <Card v-if="tier" class="bg-muted/50">
          <CardContent class="p-4 space-y-2">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">套餐</span>
              <span>{{ tier.name }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">时长</span>
              <span>{{ tier.duration_days }}天</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>应付金额</span>
              <span class="text-lg text-primary">¥{{ tier.price.toFixed(2) }}</span>
            </div>
          </CardContent>
        </Card>
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="closeDialog">取消</Button>
          <Button class="flex-1" :disabled="membershipStore.paymentLoading" @click="startPayment">
            <Loader2 v-if="membershipStore.paymentLoading" class="h-4 w-4 mr-2 animate-spin" />
            下一步<ArrowRight class="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <!-- 步骤2: 扫码支付 -->
      <div v-else-if="currentStep === 'scan'" class="space-y-4">
        <div class="text-center space-y-4">
          <div class="mx-auto w-56 h-56 bg-white rounded-lg flex items-center justify-center p-2 border">
            <img v-if="currentQRCode" :src="currentQRCode" alt="收款码" class="w-full h-full object-contain" />
            <div v-else class="text-center space-y-2">
              <QrCode class="h-12 w-12 mx-auto text-muted-foreground" />
              <p class="text-sm text-muted-foreground">加载中...</p>
            </div>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-medium">请使用{{ selectedMethod === 'wechat' ? '微信' : '支付宝' }}扫码支付</p>
            <p class="text-xs text-muted-foreground">支付金额：<span class="text-primary font-bold">¥{{ tier?.price.toFixed(2) }}</span></p>
          </div>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="cancelPayment">取消</Button>
          <Button class="flex-1" @click="goToUpload">已完成支付<ArrowRight class="h-4 w-4 ml-2" /></Button>
        </div>
      </div>

      <!-- 步骤3: 上传截图 -->
      <div v-else-if="currentStep === 'upload'" class="space-y-4">
        <p class="text-sm text-muted-foreground">请上传支付成功的截图，我们将在24小时内审核并开通会员</p>
        <div class="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors" @click="fileInput?.click()">
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
          <div v-if="proofPreview" class="space-y-2">
            <img :src="proofPreview" alt="预览" class="max-h-40 mx-auto rounded" />
            <p class="text-sm text-muted-foreground">点击更换图片</p>
          </div>
          <div v-else class="space-y-2">
            <Upload class="h-10 w-10 mx-auto text-muted-foreground" />
            <p class="text-sm font-medium">点击上传支付截图</p>
            <p class="text-xs text-muted-foreground">支持 JPG、PNG 格式，最大 5MB</p>
          </div>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" @click="backToScan"><ArrowLeft class="h-4 w-4 mr-2" />返回</Button>
          <Button class="flex-1" :disabled="!proofFile || uploading" @click="uploadProof">
            <Loader2 v-if="uploading" class="h-4 w-4 mr-2 animate-spin" />提交审核
          </Button>
        </div>
      </div>

      <!-- 步骤4: 审核中 -->
      <div v-else-if="currentStep === 'reviewing'" class="py-6 text-center space-y-4">
        <div class="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock class="h-10 w-10 text-amber-500" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">等待审核</h3>
          <p class="text-sm text-muted-foreground mt-1">您的支付截图已提交，我们将在24小时内完成审核</p>
        </div>
        <div class="bg-muted/50 rounded-lg p-3">
          <p class="text-xs text-muted-foreground">订单号</p>
          <p class="font-mono text-sm font-medium">{{ currentOrderNo }}</p>
        </div>
        <Badge variant="outline" class="bg-amber-50 text-amber-700 border-amber-200">审核通过后会员自动生效</Badge>
        <Button class="w-full" @click="finishAndClose">知道了</Button>
      </div>

      <!-- 支付成功 -->
      <div v-else-if="currentStep === 'success'" class="py-8 text-center space-y-4">
        <div class="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 class="h-10 w-10 text-green-500" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">支付成功！</h3>
          <p class="text-sm text-muted-foreground mt-1">您已成功开通{{ tier?.name }}</p>
        </div>
        <Badge variant="default" class="bg-green-500">会员权益已生效</Badge>
      </div>

      <!-- 支付失败 -->
      <div v-else-if="currentStep === 'failed'" class="py-8 text-center space-y-4">
        <div class="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle class="h-10 w-10 text-red-500" />
        </div>
        <div>
          <h3 class="text-lg font-semibold">支付失败</h3>
          <p class="text-sm text-muted-foreground mt-1">支付未完成或审核未通过，请重试</p>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" class="flex-1" @click="closeDialog">关闭</Button>
          <Button class="flex-1" @click="currentStep = 'select'">重新支付</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
