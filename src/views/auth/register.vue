<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import { sendEmailCode as sendEmailCodeApi } from '@/api/email'
import { sendSmsCode as sendSmsCodeApi } from '@/api/sms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { showSuccess, showError } from '@/components/ui/toast'
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2, Dumbbell, CheckCircle2, XCircle } from 'lucide-vue-next'
import { recordConsent } from '@/api/consent'
import CaptchaDialog from '@/components/auth/CaptchaDialog.vue'

const CONSENT_VERSION = '2026-03-01'

const router = useRouter()
const authStore = useAuthStore()

// 注册类型切换
const registerType = ref<'email' | 'phone'>('phone')

// 通用状态
const loading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 邮箱注册状态
const emailCountdown = ref(0)
const sendingEmailCode = ref(false)
const emailForm = ref({
  nickname: '',
  email: '',
  emailCode: '',
  password: '',
  password_confirmation: '',
  agree: false
})

// 手机号注册状态
const phoneCountdown = ref(0)
const sendingPhoneCode = ref(false)
const phoneForm = ref({
  nickname: '',
  phone: '',
  phoneCode: '',
  password: '',
  password_confirmation: '',
  agree: false
})

// 图形验证码弹窗
const captchaVisible = ref(false)

// REQ-H3: 定时器引用，用于组件卸载时清理
const emailTimerRef = ref<ReturnType<typeof setInterval> | null>(null)
const phoneTimerRef = ref<ReturnType<typeof setInterval> | null>(null)

onBeforeUnmount(() => {
  if (emailTimerRef.value) clearInterval(emailTimerRef.value)
  if (phoneTimerRef.value) clearInterval(phoneTimerRef.value)
})

// 邮箱验证
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.value.email))

// 手机号验证
const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phoneForm.value.phone))

// 密码强度计算（共用）
function getPasswordStrength(password: string) {
  if (!password) return { score: 0, text: '', color: '' }
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++
  const level = Math.min(score, 3)
  const texts = ['', '弱', '中', '强']
  const colors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-green-500']
  return { score: level, text: texts[level], color: colors[level] }
}

const emailPasswordStrength = computed(() => getPasswordStrength(emailForm.value.password))
const phonePasswordStrength = computed(() => getPasswordStrength(phoneForm.value.password))

// 密码匹配验证
const emailPasswordMatch = computed(() => {
  if (!emailForm.value.password_confirmation) return null
  return emailForm.value.password === emailForm.value.password_confirmation
})

const phonePasswordMatch = computed(() => {
  if (!phoneForm.value.password_confirmation) return null
  return phoneForm.value.password === phoneForm.value.password_confirmation
})

// 表单完整性验证
const isEmailFormValid = computed(() => {
  return emailForm.value.nickname.length >= 2 && emailForm.value.nickname.length <= 20 &&
    isEmailValid.value && emailForm.value.emailCode.length === 6 &&
    emailForm.value.password.length >= 6 && emailForm.value.password === emailForm.value.password_confirmation &&
    emailForm.value.agree
})

const isPhoneFormValid = computed(() => {
  return phoneForm.value.nickname.length >= 2 && phoneForm.value.nickname.length <= 20 &&
    isPhoneValid.value && phoneForm.value.phoneCode.length === 6 &&
    phoneForm.value.password.length >= 6 && phoneForm.value.password === phoneForm.value.password_confirmation &&
    phoneForm.value.agree
})

// 发送邮箱验证码（防抖）
const debouncedSendEmailCode = useDebounceFn(async () => {
  if (sendingEmailCode.value || emailCountdown.value > 0) return

  sendingEmailCode.value = true
  try {
    const response = await sendEmailCodeApi(emailForm.value.email, 'register')
    if (response.code === 200) {
      showSuccess('验证码已发送到您的邮箱')
      emailCountdown.value = 60
      emailTimerRef.value = setInterval(() => {
        emailCountdown.value--
        if (emailCountdown.value <= 0) {
          clearInterval(emailTimerRef.value!)
          emailTimerRef.value = null
        }
      }, 1000)
    } else {
      showError(response.msg || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  } finally {
    sendingEmailCode.value = false
  }
}, 300)

async function sendEmailCode() {
  if (!isEmailValid.value) {
    showError('请输入正确的邮箱地址')
    return
  }
  debouncedSendEmailCode()
}

// 发送手机验证码 - 先弹图形验证码
function sendPhoneCode() {
  if (!isPhoneValid.value) {
    showError('请输入正确的手机号')
    return
  }
  if (sendingPhoneCode.value || phoneCountdown.value > 0) return
  captchaVisible.value = true
}

// 图形验证码通过后，真正发送短信
async function onCaptchaSuccess(_captchaToken: string) {
  sendingPhoneCode.value = true
  try {
    const response = await sendSmsCodeApi(phoneForm.value.phone)
    if (response.code === 200) {
      showSuccess('验证码已发送')
      phoneCountdown.value = 60
      phoneTimerRef.value = setInterval(() => {
        phoneCountdown.value--
        if (phoneCountdown.value <= 0) {
          clearInterval(phoneTimerRef.value!)
          phoneTimerRef.value = null
        }
      }, 1000)
    } else {
      showError(response.msg || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  } finally {
    sendingPhoneCode.value = false
  }
}

// 邮箱注册
async function handleEmailRegister() {
  if (!isEmailFormValid.value) {
    showError('请完整填写表单')
    return
  }
  if (loading.value) return
  loading.value = true
  try {
    const result = await authStore.register({
      nickname: emailForm.value.nickname,
      email: emailForm.value.email,
      email_code: emailForm.value.emailCode,
      password: emailForm.value.password,
      password_confirmation: emailForm.value.password_confirmation,
    })
    if (result.success) {
      // 静默记录协议同意
      recordConsent('terms', CONSENT_VERSION).catch(() => {})
      recordConsent('privacy', CONSENT_VERSION).catch(() => {})
      setTimeout(() => router.push('/'), 1000)
    }
  } finally {
    loading.value = false
  }
}

// 手机号注册（REQ-C2: 统一走 authStore）
async function handlePhoneRegister() {
  if (!isPhoneFormValid.value) {
    showError('请完整填写表单')
    return
  }
  if (loading.value) return
  loading.value = true
  try {
    const result = await authStore.registerByPhone({
      nickname: phoneForm.value.nickname,
      phone: phoneForm.value.phone,
      phone_code: phoneForm.value.phoneCode,
      password: phoneForm.value.password,
      password_confirmation: phoneForm.value.password_confirmation,
    })
    if (result.success) {
      // 静默记录协议同意
      recordConsent('terms', CONSENT_VERSION).catch(() => {})
      recordConsent('privacy', CONSENT_VERSION).catch(() => {})
      setTimeout(() => router.push('/'), 1000)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 mb-4 shadow-lg">
          <Dumbbell class="h-8 w-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">创建账号</h1>
        <p class="text-muted-foreground mt-1">开始你的健身之旅</p>
      </div>

      <Card class="border-0 shadow-xl">
        <CardHeader class="space-y-1 pb-4">
          <CardTitle class="text-xl text-center">注册新账号</CardTitle>
          <CardDescription class="text-center">选择注册方式</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs v-model="registerType" class="w-full">
            <TabsList class="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">邮箱注册</TabsTrigger>
              <TabsTrigger value="phone">手机号注册</TabsTrigger>
            </TabsList>

            <!-- 邮箱注册 -->
            <TabsContent value="email">
              <form @submit.prevent="handleEmailRegister" class="space-y-4">
                <!-- 昵称 -->
                <div class="space-y-2">
                  <Label for="email-nickname">昵称</Label>
                  <div class="relative">
                    <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-nickname"
                      v-model="emailForm.nickname"
                      type="text"
                      placeholder="请输入昵称（2-20个字符）"
                      class="pl-10"
                      minlength="2"
                      maxlength="20"
                      required
                    />
                  </div>
                </div>

                <!-- 邮箱 -->
                <div class="space-y-2">
                  <Label for="email">邮箱地址</Label>
                  <div class="relative">
                    <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      v-model="emailForm.email"
                      type="email"
                      placeholder="请输入邮箱地址"
                      class="pl-10 pr-10"
                      required
                    />
                    <div v-if="emailForm.email" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 v-if="isEmailValid" class="h-4 w-4 text-green-600" />
                      <XCircle v-else class="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                  <p v-if="emailForm.email && !isEmailValid" class="text-xs text-red-600">
                    请输入有效的邮箱地址
                  </p>
                </div>

                <!-- 邮箱验证码 -->
                <div class="space-y-2">
                  <Label for="emailCode">邮箱验证码</Label>
                  <div class="flex gap-2">
                    <Input
                      id="emailCode"
                      v-model="emailForm.emailCode"
                      type="text"
                      placeholder="请输入6位验证码"
                      maxlength="6"
                      class="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      @click="sendEmailCode"
                      :disabled="emailCountdown > 0 || !isEmailValid || sendingEmailCode"
                      class="shrink-0"
                    >
                      <Loader2 v-if="sendingEmailCode" class="mr-1 h-4 w-4 animate-spin" />
                      {{ sendingEmailCode ? '发送中' : emailCountdown > 0 ? `${emailCountdown}秒` : '获取验证码' }}
                    </Button>
                  </div>
                </div>

                <!-- 密码 -->
                <div class="space-y-2">
                  <Label for="email-password">密码</Label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-password"
                      v-model="emailForm.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="请输入密码（至少6位）"
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
                  <div v-if="emailForm.password" class="space-y-1">
                    <div class="flex gap-1">
                      <div
                        v-for="i in 3"
                        :key="i"
                        class="h-1 flex-1 rounded-full transition-colors"
                        :class="i <= emailPasswordStrength.score ? emailPasswordStrength.color : 'bg-muted'"
                      />
                    </div>
                    <p class="text-xs" :class="{
                      'text-red-600': emailPasswordStrength.score === 1,
                      'text-yellow-600': emailPasswordStrength.score === 2,
                      'text-green-600': emailPasswordStrength.score === 3,
                    }">
                      密码强度：{{ emailPasswordStrength.text }}
                    </p>
                  </div>
                </div>

                <!-- 确认密码 -->
                <div class="space-y-2">
                  <Label for="email-confirm-password">确认密码</Label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email-confirm-password"
                      v-model="emailForm.password_confirmation"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="请再次输入密码"
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
                  <div v-if="emailPasswordMatch !== null" class="flex items-center gap-1 text-xs">
                    <CheckCircle2 v-if="emailPasswordMatch" class="h-3 w-3 text-green-600" />
                    <XCircle v-else class="h-3 w-3 text-red-600" />
                    <span :class="emailPasswordMatch ? 'text-green-600' : 'text-red-600'">
                      {{ emailPasswordMatch ? '密码一致' : '密码不一致' }}
                    </span>
                  </div>
                </div>

                <!-- 用户协议 -->
                <div class="flex items-start space-x-2">
                  <Checkbox
                    id="email-agree"
                    v-model="emailForm.agree"
                    class="mt-1"
                  />
                  <label for="email-agree" class="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    我已阅读并同意
                    <router-link to="/legal/terms" class="text-primary hover:underline">用户协议</router-link>
                    和
                    <router-link to="/legal/privacy" class="text-primary hover:underline">隐私政策</router-link>
                  </label>
                </div>

                <Button type="submit" class="w-full" :disabled="!isEmailFormValid || loading">
                  <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                  {{ loading ? '注册中...' : '立即注册' }}
                </Button>
              </form>
            </TabsContent>

            <!-- 手机号注册 -->
            <TabsContent value="phone">
              <form @submit.prevent="handlePhoneRegister" class="space-y-4">
                <!-- 昵称 -->
                <div class="space-y-2">
                  <Label for="phone-nickname">昵称</Label>
                  <div class="relative">
                    <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-nickname"
                      v-model="phoneForm.nickname"
                      type="text"
                      placeholder="请输入昵称（2-20个字符）"
                      class="pl-10"
                      minlength="2"
                      maxlength="20"
                      required
                    />
                  </div>
                </div>

                <!-- 手机号 -->
                <div class="space-y-2">
                  <Label for="phone">手机号</Label>
                  <div class="relative">
                    <Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      v-model="phoneForm.phone"
                      type="tel"
                      placeholder="请输入手机号"
                      class="pl-10 pr-10"
                      maxlength="11"
                      required
                    />
                    <div v-if="phoneForm.phone" class="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 v-if="isPhoneValid" class="h-4 w-4 text-green-600" />
                      <XCircle v-else class="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                  <p v-if="phoneForm.phone && !isPhoneValid" class="text-xs text-red-600">
                    请输入正确的手机号格式
                  </p>
                </div>

                <!-- 手机验证码 -->
                <div class="space-y-2">
                  <Label for="phoneCode">验证码</Label>
                  <div class="flex gap-2">
                    <Input
                      id="phoneCode"
                      v-model="phoneForm.phoneCode"
                      type="text"
                      placeholder="请输入6位验证码"
                      maxlength="6"
                      class="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      @click="sendPhoneCode"
                      :disabled="phoneCountdown > 0 || !isPhoneValid || sendingPhoneCode"
                      class="shrink-0"
                    >
                      <Loader2 v-if="sendingPhoneCode" class="mr-1 h-4 w-4 animate-spin" />
                      {{ sendingPhoneCode ? '发送中' : phoneCountdown > 0 ? `${phoneCountdown}秒` : '获取验证码' }}
                    </Button>
                  </div>
                </div>

                <!-- 密码 -->
                <div class="space-y-2">
                  <Label for="phone-password">密码</Label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-password"
                      v-model="phoneForm.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="请输入密码（至少6位）"
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
                  <div v-if="phoneForm.password" class="space-y-1">
                    <div class="flex gap-1">
                      <div
                        v-for="i in 3"
                        :key="i"
                        class="h-1 flex-1 rounded-full transition-colors"
                        :class="i <= phonePasswordStrength.score ? phonePasswordStrength.color : 'bg-muted'"
                      />
                    </div>
                    <p class="text-xs" :class="{
                      'text-red-600': phonePasswordStrength.score === 1,
                      'text-yellow-600': phonePasswordStrength.score === 2,
                      'text-green-600': phonePasswordStrength.score === 3,
                    }">
                      密码强度：{{ phonePasswordStrength.text }}
                    </p>
                  </div>
                </div>

                <!-- 确认密码 -->
                <div class="space-y-2">
                  <Label for="phone-confirm-password">确认密码</Label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone-confirm-password"
                      v-model="phoneForm.password_confirmation"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="请再次输入密码"
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
                  <div v-if="phonePasswordMatch !== null" class="flex items-center gap-1 text-xs">
                    <CheckCircle2 v-if="phonePasswordMatch" class="h-3 w-3 text-green-600" />
                    <XCircle v-else class="h-3 w-3 text-red-600" />
                    <span :class="phonePasswordMatch ? 'text-green-600' : 'text-red-600'">
                      {{ phonePasswordMatch ? '密码一致' : '密码不一致' }}
                    </span>
                  </div>
                </div>

                <!-- 用户协议 -->
                <div class="flex items-start space-x-2">
                  <Checkbox
                    id="phone-agree"
                    v-model="phoneForm.agree"
                    class="mt-1"
                  />
                  <label for="phone-agree" class="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    我已阅读并同意
                    <router-link to="/legal/terms" class="text-primary hover:underline">用户协议</router-link>
                    和
                    <router-link to="/legal/privacy" class="text-primary hover:underline">隐私政策</router-link>
                  </label>
                </div>

                <Button type="submit" class="w-full" :disabled="!isPhoneFormValid || loading">
                  <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                  {{ loading ? '注册中...' : '立即注册' }}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <!-- 登录链接 -->
          <div class="mt-6 text-center text-sm text-muted-foreground">
            已有账号？
            <router-link to="/auth/login" class="text-primary font-medium hover:underline">
              去登录
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