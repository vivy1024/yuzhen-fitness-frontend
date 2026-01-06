<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { sendEmailCode as sendEmailCodeApi } from '@/api/email'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { showSuccess, showError } from '@/components/ui/toast'
import { Eye, EyeOff, Mail, Lock, User, Loader2, Dumbbell, CheckCircle2, XCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const emailCountdown = ref(0)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = ref({
  nickname: '',
  email: '',
  emailCode: '',
  password: '',
  password_confirmation: '',
  agree: false
})

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))

const passwordStrength = computed(() => {
  const password = form.value.password
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
})

const passwordMatch = computed(() => {
  if (!form.value.password_confirmation) return null
  return form.value.password === form.value.password_confirmation
})

const isFormValid = computed(() => {
  return form.value.nickname.length >= 2 && form.value.nickname.length <= 20 &&
    isEmailValid.value && form.value.emailCode.length === 6 &&
    form.value.password.length >= 6 && form.value.password === form.value.password_confirmation &&
    form.value.agree
})

async function sendEmailCode() {
  if (!isEmailValid.value) {
    showError('请输入正确的邮箱地址')
    return
  }
  
  // 防止重复点击：立即开始倒计时
  if (emailCountdown.value > 0) {
    return
  }
  emailCountdown.value = 60
  
  try {
    const response = await sendEmailCodeApi(form.value.email, 'register')
    // 后端返回 { success: true, message: '...' } 格式
    if (response.success) {
      showSuccess('验证码已发送到您的邮箱')
      // 启动倒计时
      const timer = setInterval(() => {
        emailCountdown.value--
        if (emailCountdown.value <= 0) clearInterval(timer)
      }, 1000)
    } else {
      // 发送失败，重置倒计时
      emailCountdown.value = 0
      showError(response.message || response.msg || '发送失败')
    }
  } catch (error: any) {
    // 请求异常，重置倒计时
    emailCountdown.value = 0
    showError(error.message || '发送失败')
  }
}

async function handleRegister() {
  if (!isFormValid.value) {
    showError('请完整填写表单')
    return
  }
  loading.value = true
  try {
    const result = await authStore.register({
      nickname: form.value.nickname,
      email: form.value.email,
      email_code: form.value.emailCode,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })
    if (result.success) {
      showSuccess(result.message || '注册成功')
      setTimeout(() => router.push('/'), 1000)
    } else {
      showError(result.message || '注册失败')
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
        <h1 class="text-2xl font-bold text-gray-900">创建账号</h1>
        <p class="text-gray-500 mt-1">开始你的健身之旅</p>
      </div>

      <Card class="border-0 shadow-xl">
        <CardHeader class="space-y-1 pb-4">
          <CardTitle class="text-xl text-center">注册新账号</CardTitle>
          <CardDescription class="text-center">填写以下信息完成注册</CardDescription>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleRegister" class="space-y-4">
            <!-- 昵称 -->
            <div class="space-y-2">
              <Label for="nickname">昵称</Label>
              <div class="relative">
                <User class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nickname"
                  v-model="form.nickname"
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
                  v-model="form.email"
                  type="email"
                  placeholder="请输入邮箱地址"
                  class="pl-10"
                  required
                />
              </div>
            </div>

            <!-- 邮箱验证码 -->
            <div class="space-y-2">
              <Label for="emailCode">邮箱验证码</Label>
              <div class="flex gap-2">
                <Input
                  id="emailCode"
                  v-model="form.emailCode"
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
                  :disabled="emailCountdown > 0 || !isEmailValid"
                  class="shrink-0"
                >
                  {{ emailCountdown > 0 ? `${emailCountdown}秒` : '获取验证码' }}
                </Button>
              </div>
            </div>

            <!-- 密码 -->
            <div class="space-y-2">
              <Label for="password">密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  v-model="form.password"
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
              <!-- 密码强度指示器 -->
              <div v-if="form.password" class="space-y-1">
                <div class="flex gap-1">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="h-1 flex-1 rounded-full transition-colors"
                    :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200'"
                  />
                </div>
                <p class="text-xs" :class="{
                  'text-red-600': passwordStrength.score === 1,
                  'text-yellow-600': passwordStrength.score === 2,
                  'text-green-600': passwordStrength.score === 3,
                }">
                  密码强度：{{ passwordStrength.text }}
                </p>
              </div>
            </div>

            <!-- 确认密码 -->
            <div class="space-y-2">
              <Label for="confirmPassword">确认密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  v-model="form.password_confirmation"
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
              <!-- 密码匹配提示 -->
              <div v-if="passwordMatch !== null" class="flex items-center gap-1 text-xs">
                <CheckCircle2 v-if="passwordMatch" class="h-3 w-3 text-green-600" />
                <XCircle v-else class="h-3 w-3 text-red-600" />
                <span :class="passwordMatch ? 'text-green-600' : 'text-red-600'">
                  {{ passwordMatch ? '密码一致' : '密码不一致' }}
                </span>
              </div>
            </div>

            <!-- 用户协议 -->
            <div class="flex items-start space-x-2">
              <Checkbox 
                id="agree" 
                v-model="form.agree" 
                class="mt-1" 
              />
              <label for="agree" class="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                我已阅读并同意
                <a href="#" class="text-primary hover:underline">用户协议</a>
                和
                <a href="#" class="text-primary hover:underline">隐私政策</a>
              </label>
            </div>

            <Button type="submit" class="w-full" :disabled="!isFormValid || loading">
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? '注册中...' : '立即注册' }}
            </Button>
          </form>

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
</template>
