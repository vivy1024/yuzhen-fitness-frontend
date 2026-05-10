<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { showError } from '@/components/ui/toast'
import { Loader2, RefreshCw } from 'lucide-vue-next'

interface Props {
  visible: boolean
  onSuccess: (captchaToken: string) => void
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
}>()

const captchaId = ref('')
const captchaSvg = ref('')
const captchaAnswer = ref('')
const loadingCaptcha = ref(false)
const verifying = ref(false)

// 获取图形验证码
async function fetchCaptcha() {
  loadingCaptcha.value = true
  captchaAnswer.value = ''
  try {
    const response = await api.get<{ captcha_id: string; svg: string; expires_in: number }>('/auth/captcha')
    if (response.code === 200 && response.data) {
      captchaId.value = response.data.captcha_id
      captchaSvg.value = response.data.svg
    } else {
      showError(response.msg || '获取验证码失败')
    }
  } catch (error: any) {
    showError(error.message || '获取验证码失败')
  } finally {
    loadingCaptcha.value = false
  }
}

// 验证图形验证码
async function verifyCaptcha() {
  if (!captchaAnswer.value.trim()) {
    showError('请输入验证码')
    return
  }

  verifying.value = true
  try {
    const response = await api.post<{ captcha_token: string }>('/auth/captcha/verify', {
      captcha_id: captchaId.value,
      answer: captchaAnswer.value.trim(),
    })
    if (response.code === 200 && response.data?.captcha_token) {
      props.onSuccess(response.data.captcha_token)
      closeDialog()
    } else {
      showError(response.msg || '验证失败，请重试')
      // 验证失败刷新验证码
      fetchCaptcha()
    }
  } catch (error: any) {
    showError(error.message || '验证失败')
    fetchCaptcha()
  } finally {
    verifying.value = false
  }
}

function closeDialog() {
  captchaAnswer.value = ''
  captchaSvg.value = ''
  captchaId.value = ''
  emit('update:visible', false)
}

// 弹窗打开时自动获取验证码
watch(() => props.visible, (val) => {
  if (val) {
    fetchCaptcha()
  }
})
</script>

<template>
  <Dialog :open="visible" @update:open="closeDialog">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>安全验证</DialogTitle>
        <DialogDescription>请输入图片中的验证码</DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <!-- 验证码图片 -->
        <div class="flex items-center justify-center gap-3">
          <div
            v-if="captchaSvg"
            class="border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center min-h-[60px]"
            v-html="captchaSvg"
          />
          <div
            v-else
            class="border rounded-lg bg-gray-50 flex items-center justify-center min-h-[60px] w-[200px]"
          >
            <Loader2 v-if="loadingCaptcha" class="h-5 w-5 animate-spin text-muted-foreground" />
            <span v-else class="text-sm text-muted-foreground">加载中...</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            @click="fetchCaptcha"
            :disabled="loadingCaptcha"
            title="刷新验证码"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loadingCaptcha }" />
          </Button>
        </div>

        <!-- 输入框 -->
        <div class="space-y-2">
          <Label for="captcha-input">验证码</Label>
          <Input
            id="captcha-input"
            v-model="captchaAnswer"
            type="text"
            placeholder="请输入图片中的字符"
            maxlength="6"
            autocomplete="off"
            @keyup.enter="verifyCaptcha"
          />
        </div>

        <!-- 验证按钮 -->
        <Button
          class="w-full"
          @click="verifyCaptcha"
          :disabled="!captchaAnswer.trim() || verifying"
        >
          <Loader2 v-if="verifying" class="mr-2 h-4 w-4 animate-spin" />
          {{ verifying ? '验证中...' : '确认' }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
