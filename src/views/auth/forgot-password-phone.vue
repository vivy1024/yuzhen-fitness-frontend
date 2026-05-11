<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api/auth'
import { sendSmsCode as sendSmsCodeApi } from '@/api/sms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { showError, showSuccess } from '@/components/ui/toast'
import { Phone, Lock, Loader2, Dumbbell, ArrowLeft, Eye, EyeOff } from 'lucide-vue-next'
import CaptchaDialog from '@/components/auth/CaptchaDialog.vue'

const router = useRouter()

// 步骤控制
const step = ref<1 | 2 | 3>(1)
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 表单数据
const phone = ref('')
const smsCode = ref('')
const password = ref('')
const passwordConfirmation = ref('')

// 短信倒计时
const smsCountdown = ref(0)
const smsTimerRef = ref<ReturnType<typeof setInterval> | null>(null)

// 图形验证码弹窗
const captchaVisible = ref(false)

onBeforeUnmount(() => {
  if (smsTimerRef.value) clearInterval(smsTimerRef.value)
})

// 验证
const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phone.value))
const isPasswordValid = computed(() => password.value.length >= 6)
const isPasswordMatch = computed(() => password.value === passwordConfirmation.value)

// 步骤1：点击发送验证码 → 先弹图形验证码
function handleSendCode() {
  if (!isPhoneValid.value) {
    showError('请输入正确的手机号')
    return
  }
  captchaVisible.value = true
}

// 图形验证码通过后，发送短信
async function onCaptchaSuccess(_captchaToken: string) {
  try {
    const response = await sendSmsCodeApi(phone.value)
    if (response.code === 200) {
      showSuccess('验证码已发送')
      step.value = 2
      smsCountdown.value = 60
      smsTimerRef.value = setInterval(() => {
        smsCountdown.value--
        if (smsCountdown.value <= 0) {
          clearInterval(smsTimerRef.value!)
          smsTimerRef.value = null
        }
      }, 1000)
    } else {
      showError(response.msg || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  }
}

// 步骤2：验证短信验证码，进入步骤3
function handleVerifyCode() {
  if (!smsCode.value || smsCode.value.length < 4) {
    showError('请输入正确的验证码')
    return
  }
  step.value = 3
}

// 步骤3：重置密码
async function handleResetPassword() {
  if (!isPasswordValid.value) {
    showError('密码至少6位')
    return
  }
  if (!isPasswordMatch.value) {
    showError('两次密码不一致')
    return
  }

  if (loading.value) return
  loading.value = true

  try {
    const response = await api.post('/auth/sms/reset-password', {
      phone: phone.value,
      code: smsCode.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })

    if (response.code === 200) {
      showSuccess(response.msg || '密码重置成功')
      setTimeout(() => {
        router.push('/auth/login')
      }, 1500)
    } else {
      showError(response.msg || '重置失败')
    }
  } catch (error: any) {
    showError(error.message || '重置失败')
  } finally {
    loading.value = false
  }
}

// 重新发送验证码
function resendCode() {
  captchaVisible.value = true
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-4 shadow-lg">
          <Dumbbell class="h-8 w-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">重置密码</h1>
        <p class="text-muted-foreground mt-1">通过手机号找回密码</p>
      </div>

      <Card class="border-0 shadow-xl">
        <CardHeader class="space-y-1 pb-4">
          <CardTitle class="text-xl text-center">
            {{ step === 1 ? '输入手机号' : step === 2 ? '验证手机号' : '设置新密码' }}
          </CardTitle>
          <CardDescription class="text-center">
            {{ step === 1 ? '请输入绑定的手机号' : step === 2 ? '请输入收到的短信验证码' : '请设置新的登录密码' }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <!-- 步骤1：输入手机号 -->
          <form v-if="step === 1" @submit.prevent="handleSendCode" class="space-y-4">
            <div class="space-y-2">
              <Label for="reset-phone">手机号</Label>
              <div class="relative">
                <Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-phone"
                  v-model="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  class="pl-10"
                  autocomplete="tel"
                  maxlength="11"
                  required
                />
              </div>
            </div>

            <Button type="submit" class="w-full" :disabled="!isPhoneValid">
              获取验证码
            </Button>
          </form>

          <!-- 步骤2：输入验证码 -->
          <form v-else-if="step === 2" @submit.prevent="handleVerifyCode" class="space-y-4">
            <div class="space-y-2">
              <Label for="reset-code">短信验证码</Label>
              <div class="flex gap-2">
                <Input
                  id="reset-code"
                  v-model="smsCode"
                  type="text"
                  placeholder="请输入验证码"
                  maxlength="6"
                  class="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  @click="resendCode"
                  :disabled="smsCountdown > 0"
                  class="shrink-0"
                >
                  {{ smsCountdown > 0 ? `${smsCountdown}秒` : '重新发送' }}
                </Button>
              </div>
              <p class="text-xs text-muted-foreground">验证码已发送至 {{ phone }}</p>
            </div>

            <Button type="submit" class="w-full" :disabled="!smsCode">
              下一步
            </Button>
          </form>

          <!-- 步骤3：设置新密码 -->
          <form v-else @submit.prevent="handleResetPassword" class="space-y-4">
            <div class="space-y-2">
              <Label for="new-password">新密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入新密码（至少6位）"
                  class="pl-10 pr-10"
                  minlength="6"
                  required
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <EyeOff v-if="showPassword" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="confirm-password">确认密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  v-model="passwordConfirmation"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="请再次输入新密码"
                  class="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <EyeOff v-if="showConfirmPassword" class="h-4 w-4" />
                  <Eye v-else class="h-4 w-4" />
                </button>
              </div>
              <p v-if="passwordConfirmation && !isPasswordMatch" class="text-xs text-red-600">
                两次密码不一致
              </p>
            </div>

            <Button type="submit" class="w-full" :disabled="!isPasswordValid || !isPasswordMatch || loading">
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? '重置中...' : '重置密码' }}
            </Button>
          </form>

          <!-- 返回登录 -->
          <div class="mt-6 text-center">
            <router-link to="/auth/login" class="inline-flex items-center text-sm text-primary hover:underline">
              <ArrowLeft class="mr-1 h-4 w-4" />
              返回登录
            </router-link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- 图形验证码弹窗 -->
  <CaptchaDialog
    :visible="captchaVisible"
    :on-success="onCaptchaSuccess"
    @update:visible="captchaVisible = $event"
  />
</template>
