<script setup lang="ts">
/**
 * 设置页面
 * 包含主题、通知、离线数据、账号管理等设置
 *
 * @author 玉珍健身 v3.0
 * @created 2026-01-06
 * @updated 2026-02-27
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { AcceptableValue } from 'reka-ui'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import { validatePasswordStrength } from '@/utils/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Sun,
  Moon,
  Monitor,
  Bell,
  Lock,
  Trash2,
  HardDrive,
  Info,
  ChevronRight,
  LogOut,
  RefreshCw,
  MessageSquare,
  Smartphone
} from 'lucide-vue-next'
import { showSuccess, showError } from '@/components/ui/toast'
import { changePassword, deleteAccount, clearCache, updateSettings } from '@/api/settings'
import { usePushNotification } from '@/composables/usePushNotification'
import {
  getPhoneStatus,
  bindPhone,
  unbindPhone,
  changePhone,
  sendBindCode,
  type PhoneStatus
} from '@/api/phone-binding'
import { sendSmsCode } from '@/api/sms'

const router = useRouter()
const authStore = useAuthStore()
const chatStore = useChatStore()
const { mode, setTheme } = useTheme()
const { isSupported: pushSupported, isSubscribed: pushEnabled, permission: pushPermission, reminderTime, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe, setReminderTime } = usePushNotification()
const pushLoading = ref(false)

// Persona 风格选项
const personaOptions = [
  { value: 'coach_professional', label: '🎓 专业教练', desc: '严谨专业，数据驱动' },
  { value: 'coach_friendly', label: '😊 健身好友', desc: '轻松友好，鼓励为主' },
  { value: 'coach_concise', label: '⚡ 简洁教练', desc: '直给结论，高效实用' },
]

function handlePersonaChange(value: AcceptableValue) {
  chatStore.setPersonaId(String(value))
  showSuccess('回答风格已切换')
}

// 通知设置
const notifications = ref({
  training: true,
  nutrition: true,
  system: true
})

// 离线数据
const cacheInfo = ref({
  totalSize: '0 KB',
  itemCount: 0,
  loading: false
})

// 密码修改对话框
const showPasswordDialog = ref(false)
const passwordForm = ref({
  current: '',
  new: '',
  confirm: ''
})
const passwordLoading = ref(false)

// 删除账号对话框
const showDeleteDialog = ref(false)
const deletePassword = ref('')
const deleteLoading = ref(false)

// 清除缓存对话框
const showClearCacheDialog = ref(false)
const clearCacheLoading = ref(false)

// ========== 手机号绑定相关 ==========
const phoneStatus = ref<PhoneStatus | null>(null)
const phoneLoading = ref(false)

// 绑定手机号对话框
const showBindPhoneDialog = ref(false)
const bindPhoneForm = ref({
  phone: '',
  code: ''
})
const bindPhoneCountdown = ref(0)
const bindPhoneSendingCode = ref(false)

// 解绑手机号对话框
const showUnbindPhoneDialog = ref(false)
const unbindPassword = ref('')
const unbindLoading = ref(false)

// 更换手机号对话框
const showChangePhoneDialog = ref(false)
const changePhoneForm = ref({
  newPhone: '',
  newCode: '',
  oldCode: ''
})
const newPhoneCountdown = ref(0)
const oldPhoneCountdown = ref(0)
const sendingNewCode = ref(false)
const sendingOldCode = ref(false)

// 密码强度计算（与register.vue保持一致）
const passwordStrength = computed(() => {
  const password = passwordForm.value.new
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

// 定时器收集（用于组件卸载时清理）
const activeTimers: ReturnType<typeof setInterval>[] = []

// 初始化
onMounted(() => {
  // 计算缓存大小
  calculateCacheSize()
  // 获取手机号绑定状态
  fetchPhoneStatus()
})

onBeforeUnmount(() => {
  activeTimers.forEach(t => clearInterval(t))
})

// 获取手机号绑定状态
async function fetchPhoneStatus() {
  try {
    const response = await getPhoneStatus()
    if (response.code === 200) {
      phoneStatus.value = response.data
    }
  } catch (error) {
    console.error('获取手机号状态失败:', error)
  }
}

// 计算缓存大小
function calculateCacheSize() {
  cacheInfo.value.loading = true
  try {
    let totalBytes = 0
    let itemCount = 0
    
    // 计算localStorage大小
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        const value = localStorage.getItem(key) || ''
        totalBytes += key.length + value.length
        itemCount++
      }
    }
    
    // 转换为可读格式
    if (totalBytes < 1024) {
      cacheInfo.value.totalSize = `${totalBytes} B`
    } else if (totalBytes < 1024 * 1024) {
      cacheInfo.value.totalSize = `${(totalBytes / 1024).toFixed(1)} KB`
    } else {
      cacheInfo.value.totalSize = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
    }
    
    cacheInfo.value.itemCount = itemCount
  } catch (error) {
    cacheInfo.value.totalSize = '未知'
    cacheInfo.value.itemCount = 0
  } finally {
    cacheInfo.value.loading = false
  }
}

// 主题选项
const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色模式', icon: Sun },
  { value: 'dark', label: '深色模式', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

// 当前主题图标
const currentThemeIcon = computed(() => {
  const option = themeOptions.find(o => o.value === mode.value)
  return option?.icon || Monitor
})

// 返回主页
function goBack() {
  // 直接返回主页，避免router.back()导致的循环问题
  router.push('/')
}

// 处理主题变更
function handleThemeChange(value: AcceptableValue) {
  setTheme(String(value) as ThemeMode)
  showSuccess('主题已切换')
}

// 处理通知设置变更
async function handleNotificationChange(type: keyof typeof notifications.value, value: boolean) {
  notifications.value[type] = value
  try {
    await updateSettings({ notifications: { ...notifications.value } })
  } catch {
    notifications.value[type] = !value
  }
}

// 处理推送开关
async function handlePushToggle(enabled: boolean) {
  pushLoading.value = true
  try {
    if (enabled) {
      const ok = await pushSubscribe()
      if (ok) {
        showSuccess('训练提醒已开启')
      } else if (pushPermission.value === 'denied') {
        showError('浏览器已禁止通知，请在设置中允许')
      } else {
        showError('推送订阅失败')
      }
    } else {
      await pushUnsubscribe()
      showSuccess('训练提醒已关闭')
    }
  } finally {
    pushLoading.value = false
  }
}

// 修改密码
async function handleChangePassword() {
  if (!passwordForm.value.current || !passwordForm.value.new || !passwordForm.value.confirm) {
    showError('请填写完整信息')
    return
  }
  
  if (passwordForm.value.new !== passwordForm.value.confirm) {
    showError('两次输入的密码不一致')
    return
  }
  
  // 使用统一的密码验证规则
  const validation = validatePasswordStrength(passwordForm.value.new)
  if (!validation.valid) {
    showError(validation.message)
    return
  }
  
  passwordLoading.value = true
  try {
    await changePassword({
      current_password: passwordForm.value.current,
      new_password: passwordForm.value.new,
      new_password_confirmation: passwordForm.value.confirm
    })
    showSuccess('密码修改成功')
    showPasswordDialog.value = false
    passwordForm.value = { current: '', new: '', confirm: '' }
  } catch (error: any) {
    showError(error.message || '密码修改失败')
  } finally {
    passwordLoading.value = false
  }
}

// 删除账号
async function handleDeleteAccount() {
  if (!deletePassword.value) {
    showError('请输入密码确认')
    return
  }
  
  deleteLoading.value = true
  try {
    await deleteAccount(deletePassword.value)
    showSuccess('账号已删除')
    await authStore.logout()
    router.push('/auth/login')
  } catch (error: any) {
    showError(error.message || '删除失败')
  } finally {
    deleteLoading.value = false
  }
}

// 清除缓存
async function handleClearCache() {
  clearCacheLoading.value = true
  try {
    // 1. 清除本地存储的缓存数据
    const keysToKeep = ['yuzhen_token', 'yuzhen_user', 'yuzhen_theme_mode', 'yuzhen_terms_agreed', 'yuzhen_language', 'yuzhen_persona_id']
    const allKeys = Object.keys(localStorage)
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    
    // 2. 清除Service Worker缓存
    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map(name => caches.delete(name)))
      console.log('✅ 已清除Service Worker缓存')
    }
    
    // 3. 尝试调用后端清除缓存
    try {
      await clearCache()
    } catch {
      // 后端API可能未实现，忽略错误
    }
    
    // 重新计算缓存大小
    calculateCacheSize()
    
    showSuccess('缓存已清除（包括离线数据）')
    showClearCacheDialog.value = false
  } catch (error: any) {
    showError(error.message || '清除失败')
  } finally {
    clearCacheLoading.value = false
  }
}

// 退出登录
async function handleLogout() {
  await authStore.logout()
  showSuccess('已退出登录')
  router.push('/auth/login')
}

// 跳转到关于页面
function goToAbout() {
  router.push('/settings/about')
}

// ========== 手机号绑定相关函数 ==========

// 手机号验证
const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(bindPhoneForm.value.phone))
const isNewPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(changePhoneForm.value.newPhone))

// 发送绑定验证码
async function handleSendBindCode() {
  if (!isPhoneValid.value) {
    showError('请输入正确的手机号')
    return
  }
  if (bindPhoneCountdown.value > 0) return

  bindPhoneSendingCode.value = true
  try {
    const response = await sendSmsCode(bindPhoneForm.value.phone)
    if (response.code === 200) {
      showSuccess('验证码已发送')
      bindPhoneCountdown.value = 60
      const timer = setInterval(() => {
        bindPhoneCountdown.value--
        if (bindPhoneCountdown.value <= 0) clearInterval(timer)
      }, 1000)
      activeTimers.push(timer)
    } else {
      showError(response.msg || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  } finally {
    bindPhoneSendingCode.value = false
  }
}

// 绑定手机号
async function handleBindPhone() {
  if (!isPhoneValid.value || !bindPhoneForm.value.code) {
    showError('请填写完整信息')
    return
  }

  phoneLoading.value = true
  try {
    const response = await bindPhone(bindPhoneForm.value.phone, bindPhoneForm.value.code)
    if (response.code === 200) {
      showSuccess('手机号绑定成功')
      showBindPhoneDialog.value = false
      bindPhoneForm.value = { phone: '', code: '' }
      await fetchPhoneStatus()
    } else {
      showError(response.msg || '绑定失败')
    }
  } catch (error: any) {
    showError(error.message || '绑定失败')
  } finally {
    phoneLoading.value = false
  }
}

// 解绑手机号
async function handleUnbindPhone() {
  if (!unbindPassword.value) {
    showError('请输入密码')
    return
  }

  unbindLoading.value = true
  try {
    const response = await unbindPhone(unbindPassword.value)
    if (response.code === 200) {
      showSuccess('手机号已解绑')
      showUnbindPhoneDialog.value = false
      unbindPassword.value = ''
      await fetchPhoneStatus()
    } else {
      showError(response.msg || '解绑失败')
    }
  } catch (error: any) {
    showError(error.message || '解绑失败')
  } finally {
    unbindLoading.value = false
  }
}

// 发送新手机验证码
async function handleSendNewCode() {
  if (!isNewPhoneValid.value) {
    showError('请输入正确的新手机号')
    return
  }
  if (newPhoneCountdown.value > 0) return

  sendingNewCode.value = true
  try {
    const response = await sendSmsCode(changePhoneForm.value.newPhone)
    if (response.code === 200) {
      showSuccess('验证码已发送到新手机')
      newPhoneCountdown.value = 60
      const timer = setInterval(() => {
        newPhoneCountdown.value--
        if (newPhoneCountdown.value <= 0) clearInterval(timer)
      }, 1000)
      activeTimers.push(timer)
    } else {
      showError(response.msg || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  } finally {
    sendingNewCode.value = false
  }
}

// 发送原手机验证码
async function handleSendOldCode() {
  if (!phoneStatus.value?.phone) {
    showError('未找到原手机号')
    return
  }
  if (oldPhoneCountdown.value > 0) return

  sendingOldCode.value = true
  try {
    // 从脱敏的手机号中提取真实手机号需要后端支持
    // 这里使用发送绑定验证码接口，后端会自动识别当前用户
    const response = await sendBindCode(phoneStatus.value.phone?.replace(/\*/g, '') || '')
    if (response.code === 200) {
      showSuccess('验证码已发送到原手机')
      oldPhoneCountdown.value = 60
      const timer = setInterval(() => {
        oldPhoneCountdown.value--
        if (oldPhoneCountdown.value <= 0) clearInterval(timer)
      }, 1000)
      activeTimers.push(timer)
    } else {
      showError(response.msg || '发送失败')
    }
  } catch (error: any) {
    showError(error.message || '发送失败')
  } finally {
    sendingOldCode.value = false
  }
}

// 更换手机号
async function handleChangePhone() {
  if (!isNewPhoneValid.value || !changePhoneForm.value.newCode) {
    showError('请填写完整信息')
    return
  }

  phoneLoading.value = true
  try {
    const response = await changePhone(
      changePhoneForm.value.newPhone,
      changePhoneForm.value.newCode,
      changePhoneForm.value.oldCode || undefined
    )
    if (response.code === 200) {
      showSuccess('手机号更换成功')
      showChangePhoneDialog.value = false
      changePhoneForm.value = { newPhone: '', newCode: '', oldCode: '' }
      await fetchPhoneStatus()
    } else {
      showError(response.msg || '更换失败')
    }
  } catch (error: any) {
    showError(error.message || '更换失败')
  } finally {
    phoneLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 顶部导航 -->
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="flex-1 text-center text-lg font-semibold">设置</h1>
        <div class="w-10" />
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 通用设置 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base">通用设置</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 主题设置 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <component :is="currentThemeIcon" class="h-4 w-4 text-primary" />
              </div>
              <Label class="font-medium">主题</Label>
            </div>
            <Select :model-value="mode" @update:model-value="handleThemeChange">
              <SelectTrigger class="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in themeOptions" :key="option.value" :value="option.value">
                  <div class="flex items-center gap-2">
                    <component :is="option.icon" class="h-4 w-4" />
                    <span>{{ option.label }}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 回答风格设置 -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare class="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label class="font-medium">回答风格</Label>
                <p class="text-xs text-muted-foreground">
                  {{ personaOptions.find(o => o.value === chatStore.currentPersonaId)?.desc }}
                </p>
              </div>
            </div>
            <Select :model-value="chatStore.currentPersonaId" @update:model-value="handlePersonaChange">
              <SelectTrigger class="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in personaOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <!-- 通知设置 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Bell class="h-4 w-4" />
            通知设置
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- PWA 推送提醒 -->
          <div v-if="pushSupported" class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <Label class="font-medium">训练推送提醒</Label>
                <p class="text-xs text-muted-foreground mt-0.5">
                  {{ pushPermission === 'denied' ? '浏览器已禁止通知' : '到点提醒你该训练了' }}
                </p>
              </div>
              <Switch
                :checked="pushEnabled"
                :disabled="pushLoading || pushPermission === 'denied'"
                @update:checked="handlePushToggle"
              />
            </div>
            <div v-if="pushEnabled" class="flex items-center justify-between pl-1">
              <Label class="text-sm text-muted-foreground">提醒时间</Label>
              <Input
                type="time"
                :model-value="reminderTime"
                class="w-28 h-8 text-sm"
                @change="setReminderTime(($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <Label class="font-medium">训练提醒</Label>
            <Switch
              :checked="notifications.training"
              @update:checked="(v: boolean) => handleNotificationChange('training', v)"
            />
          </div>
          <div class="flex items-center justify-between">
            <Label class="font-medium">营养提醒</Label>
            <Switch 
              :checked="notifications.nutrition" 
              @update:checked="(v: boolean) => handleNotificationChange('nutrition', v)"
            />
          </div>
          <div class="flex items-center justify-between">
            <Label class="font-medium">系统通知</Label>
            <Switch 
              :checked="notifications.system" 
              @update:checked="(v: boolean) => handleNotificationChange('system', v)"
            />
          </div>
        </CardContent>
      </Card>

      <!-- 数据管理 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <HardDrive class="h-4 w-4" />
            数据管理
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- 缓存信息 -->
          <div class="p-3 -mx-3 rounded-lg bg-muted/50">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-muted-foreground">本地缓存</span>
              <Button 
                variant="ghost" 
                size="icon" 
                class="h-6 w-6"
                @click="calculateCacheSize"
                :disabled="cacheInfo.loading"
              >
                <RefreshCw class="h-3 w-3" :class="{ 'animate-spin': cacheInfo.loading }" />
              </Button>
            </div>
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ cacheInfo.totalSize }}</span>
              <span class="text-xs text-muted-foreground">{{ cacheInfo.itemCount }} 项</span>
            </div>
          </div>
          
          <!-- 清除缓存 -->
          <div 
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="showClearCacheDialog = true"
          >
            <div class="flex items-center gap-3">
              <Trash2 class="h-4 w-4 text-muted-foreground" />
              <span class="font-medium">清除缓存</span>
            </div>
            <ChevronRight class="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <!-- 账号安全 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Lock class="h-4 w-4" />
            账号安全
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-1">
          <!-- 手机号绑定 -->
          <div
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="phoneStatus?.has_phone ? showChangePhoneDialog = true : showBindPhoneDialog = true"
          >
            <div class="flex items-center gap-3">
              <div class="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Smartphone class="h-4 w-4 text-primary" />
              </div>
              <div>
                <span class="font-medium">手机号</span>
                <p class="text-xs text-muted-foreground">
                  {{ phoneStatus?.has_phone ? phoneStatus.phone : '未绑定' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="phoneStatus?.has_phone" class="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">已绑定</span>
              <ChevronRight class="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          <!-- 解绑手机号（已绑定时显示） -->
          <div
            v-if="phoneStatus?.has_phone"
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="showUnbindPhoneDialog = true"
          >
            <span class="font-medium text-orange-600">解绑手机号</span>
            <ChevronRight class="h-5 w-5 text-muted-foreground" />
          </div>

          <div
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="showPasswordDialog = true"
          >
            <span class="font-medium">修改密码</span>
            <ChevronRight class="h-5 w-5 text-muted-foreground" />
          </div>
          <div
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="handleLogout"
          >
            <span class="font-medium text-orange-600">退出登录</span>
            <LogOut class="h-5 w-5 text-orange-600" />
          </div>
          <div
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="showDeleteDialog = true"
          >
            <span class="font-medium text-destructive">注销账号</span>
            <Trash2 class="h-5 w-5 text-destructive" />
          </div>
        </CardContent>
      </Card>

      <!-- 关于 -->
      <Card>
        <CardHeader class="pb-3">
          <CardTitle class="text-base flex items-center gap-2">
            <Info class="h-4 w-4" />
            关于
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="goToAbout"
          >
            <span class="font-medium">关于玉珍健身</span>
            <div class="flex items-center gap-2 text-muted-foreground">
              <span class="text-sm">v3.0.0</span>
              <ChevronRight class="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </main>

    <!-- 修改密码对话框 -->
    <Dialog v-model:open="showPasswordDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
          <DialogDescription>请输入当前密码和新密码</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>当前密码</Label>
            <Input v-model="passwordForm.current" type="password" placeholder="请输入当前密码" />
          </div>
          <div class="space-y-2">
            <Label>新密码</Label>
            <Input v-model="passwordForm.new" type="password" placeholder="请输入新密码（至少8位，包含字母和数字）" />
            <!-- 密码强度指示器 -->
            <div v-if="passwordForm.new" class="space-y-1">
              <div class="flex gap-1">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="h-1 flex-1 rounded-full transition-colors"
                  :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-muted'"
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
          <div class="space-y-2">
            <Label>确认新密码</Label>
            <Input v-model="passwordForm.confirm" type="password" placeholder="请再次输入新密码" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showPasswordDialog = false">取消</Button>
          <Button @click="handleChangePassword" :disabled="passwordLoading">
            {{ passwordLoading ? '提交中...' : '确认修改' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 删除账号确认对话框 -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="text-destructive">注销账号</DialogTitle>
          <DialogDescription>
            注销后，您的账号数据将在30天内被永久删除，包括训练记录、AI对话历史和个人档案。30天内重新登录可撤销注销。
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>请输入密码确认</Label>
            <Input v-model="deletePassword" type="password" placeholder="请输入您的密码" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">取消</Button>
          <Button variant="destructive" @click="handleDeleteAccount" :disabled="deleteLoading">
            {{ deleteLoading ? '注销中...' : '确认注销' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 清除缓存确认对话框 -->
    <AlertDialog v-model:open="showClearCacheDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>清除缓存</AlertDialogTitle>
          <AlertDialogDescription>
            确定要清除本地缓存数据吗？这不会影响您的账号数据。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="handleClearCache" :disabled="clearCacheLoading">
            {{ clearCacheLoading ? '清除中...' : '确认清除' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- 绑定手机号对话框 -->
    <Dialog v-model:open="showBindPhoneDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>绑定手机号</DialogTitle>
          <DialogDescription>绑定后可使用手机号登录和找回密码</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>手机号</Label>
            <Input v-model="bindPhoneForm.phone" type="tel" placeholder="请输入手机号" maxlength="11" />
          </div>
          <div class="space-y-2">
            <Label>验证码</Label>
            <div class="flex gap-2">
              <Input v-model="bindPhoneForm.code" type="text" placeholder="请输入验证码" maxlength="6" class="flex-1" />
              <Button
                type="button"
                variant="outline"
                @click="handleSendBindCode"
                :disabled="bindPhoneCountdown > 0 || !isPhoneValid || bindPhoneSendingCode"
                class="shrink-0"
              >
                {{ bindPhoneSendingCode ? '发送中' : bindPhoneCountdown > 0 ? `${bindPhoneCountdown}秒` : '获取验证码' }}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showBindPhoneDialog = false">取消</Button>
          <Button @click="handleBindPhone" :disabled="phoneLoading">
            {{ phoneLoading ? '绑定中...' : '确认绑定' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 解绑手机号对话框 -->
    <Dialog v-model:open="showUnbindPhoneDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="text-orange-600">解绑手机号</DialogTitle>
          <DialogDescription>
            解绑后将无法使用手机号登录。请确保已绑定邮箱。
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>请输入密码确认</Label>
            <Input v-model="unbindPassword" type="password" placeholder="请输入您的密码" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showUnbindPhoneDialog = false">取消</Button>
          <Button variant="destructive" @click="handleUnbindPhone" :disabled="unbindLoading">
            {{ unbindLoading ? '解绑中...' : '确认解绑' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- 更换手机号对话框 -->
    <Dialog v-model:open="showChangePhoneDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>更换手机号</DialogTitle>
          <DialogDescription>需要验证新手机号</DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <!-- 原手机号验证（如果已绑定） -->
          <div v-if="phoneStatus?.has_phone" class="space-y-2">
            <Label>原手机号验证码</Label>
            <div class="flex gap-2">
              <Input v-model="changePhoneForm.oldCode" type="text" placeholder="原手机验证码" maxlength="6" class="flex-1" />
              <Button
                type="button"
                variant="outline"
                @click="handleSendOldCode"
                :disabled="oldPhoneCountdown > 0 || sendingOldCode"
                class="shrink-0"
              >
                {{ sendingOldCode ? '发送中' : oldPhoneCountdown > 0 ? `${oldPhoneCountdown}秒` : '发送' }}
              </Button>
            </div>
            <p class="text-xs text-muted-foreground">验证码将发送到 {{ phoneStatus.phone }}</p>
          </div>

          <div class="space-y-2">
            <Label>新手机号</Label>
            <Input v-model="changePhoneForm.newPhone" type="tel" placeholder="请输入新手机号" maxlength="11" />
          </div>

          <div class="space-y-2">
            <Label>新手机验证码</Label>
            <div class="flex gap-2">
              <Input v-model="changePhoneForm.newCode" type="text" placeholder="新手机验证码" maxlength="6" class="flex-1" />
              <Button
                type="button"
                variant="outline"
                @click="handleSendNewCode"
                :disabled="newPhoneCountdown > 0 || !isNewPhoneValid || sendingNewCode"
                class="shrink-0"
              >
                {{ sendingNewCode ? '发送中' : newPhoneCountdown > 0 ? `${newPhoneCountdown}秒` : '获取验证码' }}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showChangePhoneDialog = false">取消</Button>
          <Button @click="handleChangePhone" :disabled="phoneLoading">
            {{ phoneLoading ? '更换中...' : '确认更换' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
