<script setup lang="ts">
/**
 * 设置页面
 * 包含主题、通知、离线数据、账号管理等设置
 * 
 * @author 玉珍健身 v3.0
 * @created 2026-01-06
 * @updated 2026-01-06
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
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
  RefreshCw
} from 'lucide-vue-next'
import { showSuccess, showError } from '@/components/ui/toast'
import { changePassword, deleteAccount, clearCache } from '@/api/settings'

const router = useRouter()
const authStore = useAuthStore()
const { mode, setTheme } = useTheme()

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

// 初始化
onMounted(() => {
  // 计算缓存大小
  calculateCacheSize()
})

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
function handleThemeChange(value: string) {
  setTheme(value as ThemeMode)
  showSuccess('主题已切换')
}

// 处理通知设置变更
function handleNotificationChange(type: keyof typeof notifications.value, value: boolean) {
  notifications.value[type] = value
  // TODO: 保存到后端
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
  
  if (passwordForm.value.new.length < 6) {
    showError('新密码至少6位')
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
    const keysToKeep = ['yuzhen_token', 'yuzhen_user', 'yuzhen_theme_mode', 'yuzhen_terms_agreed', 'yuzhen_language']
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
          <div class="flex items-center justify-between">
            <Label class="font-medium">训练提醒</Label>
            <Switch 
              :checked="notifications.training" 
              @update:checked="(v) => handleNotificationChange('training', v)"
            />
          </div>
          <div class="flex items-center justify-between">
            <Label class="font-medium">营养提醒</Label>
            <Switch 
              :checked="notifications.nutrition" 
              @update:checked="(v) => handleNotificationChange('nutrition', v)"
            />
          </div>
          <div class="flex items-center justify-between">
            <Label class="font-medium">系统通知</Label>
            <Switch 
              :checked="notifications.system" 
              @update:checked="(v) => handleNotificationChange('system', v)"
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
            <span class="font-medium text-destructive">删除账号</span>
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
            <Input v-model="passwordForm.new" type="password" placeholder="请输入新密码（至少6位）" />
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
          <DialogTitle class="text-destructive">删除账号</DialogTitle>
          <DialogDescription>
            此操作不可撤销！删除后您的所有数据将被永久删除。
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
            {{ deleteLoading ? '删除中...' : '确认删除' }}
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
  </div>
</template>
