<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { showSuccess, showError } from '@/components/ui/toast'
import { Eye, EyeOff, Mail, Lock, Loader2, Dumbbell, ArrowLeft, CheckCircle } from 'lucide-vue-next'
import { sendEmailCode, resetPassword, checkEmailExists } from '@/api/email'

const router = useRouter()

// 步骤：1-输入邮箱 2-输入验证码和新密码 3-完成
const step = ref(1)
const loading = ref(false)
const emailCountdown = ref(0)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// 表单数据
const form = ref({
  email: '',
  code: '',
  password: '',
  password_confirmation: ''
})

// 验证
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))
const isCodeValid = computed(() => /^\d{6}$/.test(form.value.code))
const isPasswordValid = computed(() => form.value.password.length >= 6)
const isPasswordMatch = computed(() => form.value.password === form.value.password_confirmation)

// 密码强度
const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return { level: 0, text: '', color: '' }
  
  let score = 0
  if (pwd.length >= 6) score++
  if (pwd.length >= 8) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++
  
  if (score <= 2) return { level: 1, text: '弱', color: 'bg-red-500' }
  if (score <= 3) return { level: 2, text: '中', color: 'bg-yellow-500' }
  return { level: 3, text: '强', color: 'bg-green-500' }
})

// 发送验证码
async function handleSendCode() {
  if (!isEmailValid.value) {
    showError('请输入正确的邮箱地址')
    return
  }

  loading.value = true
  try {
    // 先检查邮箱是否已注册
    const checkRes = await checkEmailExists(form.value.email)
    if (!checkRes.data?.exists) {
      showError('该邮箱未注册，请先注册账号')
      loading.value = false
      return
    }

    // 发送验证码
    const res = await sendEmailCode(form.value.email)
    if (res.success) {
      showSuccess('验证码已发送到您的邮箱')
      step.value = 2
      startCountdown()
    } else {
      showError(res.message || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  } finally {
    loading.value = false
  }
}

// 重新发送验证码
async function handleResendCode() {
  if (emailCountdown.value > 0) return
  
  loading.value = true
  try {
    const res = await sendEmailCode(form.value.email)
    if (res.success) {
      showSuccess('验证码已重新发送')
      startCountdown()
    } else {
      showError(res.message || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  } finally {
    loading.value = false
  }
}

// 开始倒计时
function startCountdown() {
  emailCountdown.value = 60
  const timer = setInterval(() => {
    emailCountdown.value--
    if (emailCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 重置密码
async function handleResetPassword() {
  if (!isCodeValid.value) {
    showError('请输入6位验证码')
    return
  }
  if (!isPasswordValid.value) {
    showError('密码长度不能少于6位')
    return
  }
  if (!isPasswordMatch.value) {
    showError('两次输入的密码不一致')
    return
  }

  loading.value = true
  try {
    const res = await resetPassword({
      email: form.value.email,
      code: form.value.code,
      password: form.value.password,
      password_confirmation: form.value.password_confirmation
    })
    
    if (res.success) {
      showSuccess('密码重置成功')
      step.value = 3
    } else {
      showError(res.message || '重置失败')
    }
  } catch (error: any) {
    showError(error.message || '重置失败')
  } finally {
    loading.value = false
  }
}

// 返回登录
function goToLogin() {
  router.push('/auth/login')
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
        <h1 class="text-2xl font-bold text-gray-900">玉珍健身</h1>
        <p class="text-gray-500 mt-1">找回您的密码</p>
      </div>

      <Card class="border-0 shadow-xl">
        <CardHeader class="space-y-1 pb-4">
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="step > 1 && step < 3 ? step-- : goToLogin()">
              <ArrowLeft class="h-4 w-4" />
            </Button>
            <CardTitle class="text-xl">
              {{ step === 1 ? '找回密码' : step === 2 ? '重置密码' : '重置成功' }}
            </CardTitle>
          </div>
          <CardDescription>
            {{ step === 1 ? '请输入您注册时使用的邮箱' : step === 2 ? '请输入验证码和新密码' : '您的密码已成功重置' }}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <!-- 步骤1：输入邮箱 -->
          <form v-if="step === 1" @submit.prevent="handleSendCode" class="space-y-4">
            <div class="space-y-2">
              <Label for="email">邮箱地址</Label>
              <div class="relative">
                <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="请输入注册邮箱"
                  class="pl-10"
                  required
                />
              </div>
            </div>

            <Button type="submit" class="w-full" :disabled="loading || !isEmailValid">
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? '发送中...' : '发送验证码' }}
            </Button>
          </form>

          <!-- 步骤2：输入验证码和新密码 -->
          <form v-else-if="step === 2" @submit.prevent="handleResetPassword" class="space-y-4">
            <div class="space-y-2">
              <Label>邮箱</Label>
              <div class="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                {{ form.email }}
              </div>
            </div>

            <div class="space-y-2">
              <Label for="code">验证码</Label>
              <div class="flex gap-2">
                <Input
                  id="code"
                  v-model="form.code"
                  type="text"
                  placeholder="请输入6位验证码"
                  maxlength="6"
                  class="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  @click="handleResendCode"
                  :disabled="emailCountdown > 0 || loading"
                  class="shrink-0"
                >
                  {{ emailCountdown > 0 ? `${emailCountdown}秒` : '重新发送' }}
                </Button>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="password">新密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入新密码（至少6位）"
                  class="pl-10 pr-10"
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
              <div v-if="form.password" class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full transition-all duration-300"
                    :class="passwordStrength.color"
                    :style="{ width: `${passwordStrength.level * 33.33}%` }"
                  />
                </div>
                <span class="text-xs text-muted-foreground">{{ passwordStrength.text }}</span>
              </div>
            </div>

            <div class="space-y-2">
              <Label for="password_confirmation">确认密码</Label>
              <div class="relative">
                <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password_confirmation"
                  v-model="form.password_confirmation"
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
              <!-- 密码匹配提示 -->
              <div v-if="form.password_confirmation" class="text-xs">
                <span v-if="isPasswordMatch" class="text-green-600">✓ 密码匹配</span>
                <span v-else class="text-red-500">✗ 密码不匹配</span>
              </div>
            </div>

            <Button 
              type="submit" 
              class="w-full" 
              :disabled="loading || !isCodeValid || !isPasswordValid || !isPasswordMatch"
            >
              <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
              {{ loading ? '重置中...' : '重置密码' }}
            </Button>
          </form>

          <!-- 步骤3：完成 -->
          <div v-else class="text-center py-6">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle class="h-8 w-8 text-green-600" />
            </div>
            <p class="text-gray-600 mb-6">您的密码已成功重置，请使用新密码登录</p>
            <Button class="w-full" @click="goToLogin">
              返回登录
            </Button>
          </div>

          <!-- 返回登录链接 -->
          <div v-if="step < 3" class="mt-6 text-center text-sm text-muted-foreground">
            想起密码了？
            <router-link to="/auth/login" class="text-primary font-medium hover:underline">
              返回登录
            </router-link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
