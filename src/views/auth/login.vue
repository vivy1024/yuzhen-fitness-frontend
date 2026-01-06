<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { sendSmsCode as sendSmsCodeApi, smsLogin } from '@/api/sms'
import { sendEmailCode as sendEmailCodeApi } from '@/api/email'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { showSuccess, showError } from '@/components/ui/toast'
import { Eye, EyeOff, Mail, Phone, Lock, Loader2, Dumbbell } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const loginType = ref<'email' | 'phone'>('email')
const showPassword = ref(false)
const loading = ref(false)
const smsCountdown = ref(0)
const emailCountdown = ref(0)

// 邮箱登录表单
const emailForm = ref({
  email: '',
  password: '',
  remember_me: false
})

// 手机号登录表单
const phoneForm = ref({
  phone: '',
  code: ''
})

// 验证
const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(phoneForm.value.phone))
const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.value.email))

// 邮箱登录
async function handleEmailLogin() {
  if (!emailForm.value.email || !emailForm.value.password) {
    showError('请填写邮箱和密码')
    return
  }
  
  loading.value = true
  try {
    const result = await authStore.login(emailForm.value)
    
    if (result.success) {
      showSuccess(result.message || '登录成功')
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      showError(result.message || '登录失败')
    }
  } finally {
    loading.value = false
  }
}

// 手机号登录
async function handlePhoneLogin() {
  if (!phoneForm.value.phone || !phoneForm.value.code) {
    showError('请填写手机号和验证码')
    return
  }
  
  loading.value = true
  try {
    const response = await smsLogin(phoneForm.value.phone, phoneForm.value.code)
    
    if (response.code === 200 && response.data) {
      authStore.user = response.data.user
      authStore.isAuthenticated = true
      
      localStorage.setItem('access_token', response.data.access_token)
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token)
      }
      localStorage.setItem('user_info', JSON.stringify(response.data.user))
      
      showSuccess('登录成功')
      setTimeout(() => {
        router.push('/')
      }, 1000)
    } else {
      showError(response.msg || '登录失败')
    }
  } catch (error: any) {
    showError(error.message || '登录失败')
  } finally {
    loading.value = false
  }
}

// 发送短信验证码
async function sendSmsCode() {
  if (!isPhoneValid.value) {
    showError('请输入正确的手机号')
    return
  }

  try {
    const response = await sendSmsCodeApi(phoneForm.value.phone)
    
    if (response.code === 200) {
      showSuccess('验证码已发送')
      smsCountdown.value = 60
      const timer = setInterval(() => {
        smsCountdown.value--
        if (smsCountdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      showError(response.msg || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  }
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
        <p class="text-gray-500 mt-1">专业健身指导平台</p>
      </div>

      <Card class="border-0 shadow-xl">
        <CardHeader class="space-y-1 pb-4">
          <CardTitle class="text-xl text-center">登录账号</CardTitle>
          <CardDescription class="text-center">选择登录方式开始健身之旅</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs v-model="loginType" class="w-full">
            <TabsList class="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="email">邮箱登录</TabsTrigger>
              <TabsTrigger value="phone">手机号登录</TabsTrigger>
            </TabsList>
            
            <!-- 邮箱登录 -->
            <TabsContent value="email">
              <form @submit.prevent="handleEmailLogin" class="space-y-4">
                <div class="space-y-2">
                  <Label for="email">邮箱地址</Label>
                  <div class="relative">
                    <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      v-model="emailForm.email"
                      type="email"
                      placeholder="请输入邮箱"
                      class="pl-10"
                      required
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="password">密码</Label>
                  <div class="relative">
                    <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      v-model="emailForm.password"
                      :type="showPassword ? 'text' : 'password'"
                      placeholder="请输入密码"
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
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <Checkbox id="remember" v-model="emailForm.remember_me" />
                    <label for="remember" class="text-sm text-muted-foreground cursor-pointer">
                      记住我
                    </label>
                  </div>
                  <router-link to="/auth/forgot-password" class="text-sm text-primary hover:underline">
                    忘记密码？
                  </router-link>
                </div>

                <Button type="submit" class="w-full" :disabled="loading">
                  <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                  {{ loading ? '登录中...' : '登录' }}
                </Button>
              </form>
            </TabsContent>

            <!-- 手机号登录 -->
            <TabsContent value="phone">
              <form @submit.prevent="handlePhoneLogin" class="space-y-4">
                <div class="space-y-2">
                  <Label for="phone">手机号</Label>
                  <div class="relative">
                    <Phone class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      v-model="phoneForm.phone"
                      type="tel"
                      placeholder="请输入手机号"
                      class="pl-10"
                      maxlength="11"
                      required
                    />
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="code">验证码</Label>
                  <div class="flex gap-2">
                    <Input
                      id="code"
                      v-model="phoneForm.code"
                      type="text"
                      placeholder="请输入验证码"
                      maxlength="6"
                      class="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      @click="sendSmsCode"
                      :disabled="smsCountdown > 0 || !isPhoneValid"
                      class="shrink-0"
                    >
                      {{ smsCountdown > 0 ? `${smsCountdown}秒` : '获取验证码' }}
                    </Button>
                  </div>
                </div>

                <Button type="submit" class="w-full" :disabled="loading">
                  <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                  {{ loading ? '登录中...' : '登录' }}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <!-- 注册链接 -->
          <div class="mt-6 text-center text-sm text-muted-foreground">
            还没有账号？
            <router-link to="/auth/register" class="text-primary font-medium hover:underline">
              立即注册
            </router-link>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
