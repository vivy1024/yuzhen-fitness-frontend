<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>分享训练成果</DialogTitle>
        <DialogDescription>保存图片分享到朋友圈或社交媒体</DialogDescription>
      </DialogHeader>

      <div class="flex justify-center py-4">
        <canvas
          ref="canvasRef"
          :width="CARD_WIDTH"
          :height="CARD_HEIGHT"
          class="rounded-lg shadow-lg max-w-full h-auto"
          :style="{ maxWidth: '100%', height: 'auto' }"
        />
      </div>

      <div class="flex gap-3">
        <Button class="flex-1" @click="saveImage">
          <Download class="w-4 h-4 mr-2" />
          保存图片
        </Button>
        <Button variant="outline" class="flex-1" @click="copyImage">
          <Copy class="w-4 h-4 mr-2" />
          复制图片
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Download, Copy } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast/use-toast'

export interface ShareCardData {
  date: string
  totalVolume: number
  totalSets: number
  averageRPE: number
  feeling: string
  exerciseNames: string[]
  duration?: number
}

const props = defineProps<{
  open: boolean
  data: ShareCardData
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { toast } = useToast()
const canvasRef = ref<HTMLCanvasElement | null>(null)

const CARD_WIDTH = 540
const CARD_HEIGHT = 720
const DPR = 2

const feelingMap: Record<string, string> = {
  excellent: '😄 状态极佳',
  good: '🙂 状态良好',
  fair: '😐 状态一般',
  poor: '😞 状态较差',
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      drawCard()
    }
  }
)

function drawCard() {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = CARD_WIDTH * DPR
  canvas.height = CARD_HEIGHT * DPR
  canvas.style.width = `${CARD_WIDTH}px`
  canvas.style.height = `${CARD_HEIGHT}px`

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(DPR, DPR)

  // 背景渐变
  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT)
  gradient.addColorStop(0, '#1e3a5f')
  gradient.addColorStop(0.5, '#2563eb')
  gradient.addColorStop(1, '#7c3aed')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // 装饰圆
  ctx.globalAlpha = 0.1
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(CARD_WIDTH + 40, -40, 200, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-60, CARD_HEIGHT + 20, 180, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  // 品牌标题
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('💪 玉珍健身', 32, 48)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('你的AI健身教练', CARD_WIDTH - 32, 48)

  // 分隔线
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(32, 68)
  ctx.lineTo(CARD_WIDTH - 32, 68)
  ctx.stroke()

  // 日期
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(formatCardDate(props.data.date), CARD_WIDTH / 2, 100)

  // 主标题
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 32px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('训练完成 ✅', CARD_WIDTH / 2, 150)

  // 数据卡片区域
  const cardY = 185
  const cardH = 200
  const cardPadding = 32

  // 半透明背景
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  roundRect(ctx, cardPadding, cardY, CARD_WIDTH - cardPadding * 2, cardH, 16)
  ctx.fill()

  // 三列数据
  const colWidth = (CARD_WIDTH - cardPadding * 2) / 3
  const metrics = [
    { label: '总训练量', value: `${props.data.totalVolume.toFixed(1)}`, unit: 'kg' },
    { label: '总组数', value: `${props.data.totalSets}`, unit: '组' },
    { label: '平均RPE', value: `${props.data.averageRPE.toFixed(1)}`, unit: '/10' },
  ]

  metrics.forEach((metric, i) => {
    const cx = cardPadding + colWidth * i + colWidth / 2

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(metric.label, cx, cardY + 40)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 42px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(metric.value, cx, cardY + 95)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '14px "PingFang SC", "Microsoft YaHei", sans-serif'
    ctx.fillText(metric.unit, cx, cardY + 120)

    // 分隔线
    if (i < metrics.length - 1) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cardPadding + colWidth * (i + 1), cardY + 20)
      ctx.lineTo(cardPadding + colWidth * (i + 1), cardY + cardH - 20)
      ctx.stroke()
    }
  })

  // 训练感受
  const feelingText = feelingMap[props.data.feeling] || props.data.feeling
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('训练感受', CARD_WIDTH / 2, cardY + 165)

  ctx.fillStyle = '#ffffff'
  ctx.font = '18px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(feelingText, CARD_WIDTH / 2, cardY + 192)

  // 训练动作列表
  const listY = cardY + cardH + 30
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.font = '13px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('训练动作', cardPadding, listY)

  const displayExercises = props.data.exerciseNames.slice(0, 5)
  ctx.fillStyle = '#ffffff'
  ctx.font = '15px "PingFang SC", "Microsoft YaHei", sans-serif'
  displayExercises.forEach((name, i) => {
    ctx.fillText(`• ${name}`, cardPadding + 8, listY + 28 + i * 26)
  })
  if (props.data.exerciseNames.length > 5) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fillText(`  ...等${props.data.exerciseNames.length}个动作`, cardPadding + 8, listY + 28 + 5 * 26)
  }

  // 底部品牌区
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.fillRect(0, CARD_HEIGHT - 80, CARD_WIDTH, 80)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 16px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('玉珍健身 · 让每一次训练都有价值', CARD_WIDTH / 2, CARD_HEIGHT - 48)

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.font = '12px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('app.yuzhen-fitness.cn', CARD_WIDTH / 2, CARD_HEIGHT - 24)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function formatCardDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

function getCanvasBlob(): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvasRef.value?.toBlob((blob) => resolve(blob), 'image/png')
  })
}

async function saveImage() {
  const blob = await getCanvasBlob()
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `训练成果_${props.data.date}.png`
  a.click()
  URL.revokeObjectURL(url)

  toast({ title: '图片已保存', description: '训练成果图片已下载' })
}

async function copyImage() {
  try {
    const blob = await getCanvasBlob()
    if (!blob) return

    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ])
    toast({ title: '已复制', description: '图片已复制到剪贴板' })
  } catch {
    toast({
      title: '复制失败',
      description: '浏览器不支持复制图片，请使用保存功能',
      variant: 'destructive',
    })
  }
}
</script>
