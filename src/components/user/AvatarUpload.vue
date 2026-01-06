<template>
  <div class="flex flex-col items-center gap-4">
    <!-- 头像预览 -->
    <div class="relative">
      <Avatar class="h-24 w-24">
        <AvatarImage v-if="previewUrl || currentAvatar" :src="previewUrl || currentAvatar" />
        <AvatarFallback class="text-2xl">
          {{ fallbackText }}
        </AvatarFallback>
      </Avatar>
      
      <!-- 上传按钮覆盖层 -->
      <label class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
        <Camera class="h-6 w-6 text-white" />
        <input
          type="file"
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />
      </label>
      
      <!-- 上传中状态 -->
      <div v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
        <Loader2 class="h-6 w-6 text-white animate-spin" />
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="flex gap-2">
      <Button v-if="previewUrl" size="sm" @click="handleUpload" :disabled="uploading">
        <Upload class="h-4 w-4 mr-1" />
        上传
      </Button>
      <Button v-if="previewUrl" variant="outline" size="sm" @click="handleCancel">
        取消
      </Button>
    </div>
    
    <!-- 提示文字 -->
    <p class="text-xs text-gray-500">点击头像更换，支持 JPG、PNG 格式</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Camera, Upload, Loader2 } from 'lucide-vue-next'
import { userProfileApi } from '@/api/user'
import { useToast } from '@/components/ui/toast'

const props = defineProps<{
  currentAvatar?: string
  nickname?: string
}>()

const emit = defineEmits<{
  (e: 'uploaded', url: string): void
}>()

const { toast } = useToast()

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref(false)

const fallbackText = computed(() => {
  if (props.nickname) {
    return props.nickname.slice(0, 2).toUpperCase()
  }
  return 'U'
})

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    toast({
      title: '文件类型错误',
      description: '请选择图片文件',
      variant: 'destructive',
    })
    return
  }
  
  // 验证文件大小（最大5MB）
  if (file.size > 5 * 1024 * 1024) {
    toast({
      title: '文件过大',
      description: '图片大小不能超过5MB',
      variant: 'destructive',
    })
    return
  }
  
  selectedFile.value = file
  
  // 创建预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

async function handleUpload() {
  if (!selectedFile.value) return
  
  uploading.value = true
  
  try {
    const result = await userProfileApi.uploadAvatar(selectedFile.value)
    
    if (result.code === 200 && result.data) {
      toast({
        title: '上传成功',
        description: '头像已更新',
      })
      emit('uploaded', result.data.avatar_url)
      handleCancel()
    } else {
      throw new Error(result.msg || '上传失败')
    }
  } catch (error: any) {
    toast({
      title: '上传失败',
      description: error.message || '请稍后重试',
      variant: 'destructive',
    })
  } finally {
    uploading.value = false
  }
}

function handleCancel() {
  selectedFile.value = null
  previewUrl.value = null
}
</script>
