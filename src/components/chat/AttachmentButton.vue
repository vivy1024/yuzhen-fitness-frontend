<script setup lang="ts">
/**
 * AttachmentButton - 图片附件按钮组件
 *
 * 功能：选择图片/拍照 → 前端压缩 → 预览 → 删除
 * 限制：单次最多 3 张，每张 ≤ 5MB，支持 JPEG/PNG/WebP
 */
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Paperclip, X, Camera, Image as ImageIcon } from 'lucide-vue-next'

export interface PendingAttachment {
  id: string
  file: File
  preview: string
  base64: string
  mime_type: string
  size: number
}

const MAX_ATTACHMENTS = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const emit = defineEmits<{
  (e: 'add-attachment', attachment: PendingAttachment): void
  (e: 'remove-attachment', id: string): void
}>()

const props = defineProps<{
  attachments: PendingAttachment[]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const showMenu = ref(false)
const isProcessing = ref(false)

const canAdd = computed(() => props.attachments.length < MAX_ATTACHMENTS)

function openFilePicker() {
  showMenu.value = false
  if (fileInput.value) {
    fileInput.value.accept = 'image/*'
    fileInput.value.capture = ''
    fileInput.value.click()
  }
}

function openCamera() {
  showMenu.value = false
  if (fileInput.value) {
    fileInput.value.accept = 'image/*'
    fileInput.value.capture = 'environment'
    fileInput.value.click()
  }
}

async function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  isProcessing.value = true
  try {
    for (const file of Array.from(files)) {
      if (props.attachments.length >= MAX_ATTACHMENTS) break
      if (file.size > MAX_FILE_SIZE) continue
      if (!file.type.startsWith('image/')) continue

      const result = await compressImage(file)
      const attachment: PendingAttachment = {
        id: crypto.randomUUID(),
        file,
        preview: `data:image/jpeg;base64,${result.base64}`,
        base64: result.base64,
        mime_type: result.mime_type,
        size: result.size,
      }
      emit('add-attachment', attachment)
    }
  } finally {
    isProcessing.value = false
    if (input) input.value = ''
  }
}

async function compressImage(file: File): Promise<{ base64: string; mime_type: string; size: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxSize = 1024
      let width = img.width
      let height = img.height
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const base64 = dataUrl.split(',')[1]
      const size = Math.round(base64.length * 0.75)
      URL.revokeObjectURL(img.src)
      resolve({ base64, mime_type: 'image/jpeg', size })
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('图片加载失败'))
    }
    img.src = URL.createObjectURL(file)
  })
}

function removeAttachment(id: string) {
  emit('remove-attachment', id)
}
</script>

<template>
  <!-- 图片预览区域 -->
  <div v-if="attachments.length > 0" class="flex gap-2 px-3 pt-2">
    <div
      v-for="att in attachments"
      :key="att.id"
      class="relative w-16 h-16 rounded-lg overflow-hidden border border-border"
    >
      <img :src="att.preview" class="w-full h-full object-cover" alt="预览" />
      <button
        class="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
        @click="removeAttachment(att.id)"
      >
        <X class="w-3 h-3" />
      </button>
    </div>
  </div>

  <!-- 附件按钮 -->
  <div class="relative">
    <Button
      variant="ghost"
      size="icon"
      :disabled="!canAdd || isProcessing"
      @click="showMenu = !showMenu"
      class="h-9 w-9"
    >
      <Paperclip class="h-4 w-4" />
    </Button>

    <!-- 选择菜单 -->
    <div
      v-if="showMenu"
      class="absolute bottom-full left-0 mb-1 bg-popover border border-border rounded-lg shadow-md p-1 min-w-[120px] z-50"
    >
      <button
        class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent"
        @click="openFilePicker"
      >
        <ImageIcon class="w-4 h-4" />
        选择图片
      </button>
      <button
        class="flex items-center gap-2 w-full px-3 py-2 text-sm rounded hover:bg-accent"
        @click="openCamera"
      >
        <Camera class="w-4 h-4" />
        拍照
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileSelect"
    />
  </div>
</template>
