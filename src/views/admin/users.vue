<script setup lang="ts">
/**
 * 用户管理页面
 * 用户列表、会员状态、搜索
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowLeft, RefreshCw, Search, Users, Crown, User, Mail, Calendar
} from 'lucide-vue-next'
import api from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const users = ref<any[]>([])
const searchQuery = ref('')
const stats = ref({ total: 0, members: 0, admins: 0 })

onMounted(async () => {
  await loadUsers()
})

async function loadUsers() {
  loading.value = true
  try {
    const params: any = {}
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    const res = await api.get('/admin/users', { params })
    if (res.code === 200) {
      users.value = res.data.users || []
      stats.value = res.data.stats || { total: 0, members: 0, admins: 0 }
    }
  } catch (e) {
    console.error('加载用户失败', e)
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/admin')
}

function getRoleBadge(role: string) {
  switch (role) {
    case 'admin': return { label: '管理员', class: 'bg-purple-500' }
    case 'expert': return { label: '专家', class: 'bg-blue-500' }
    default: return { label: '用户', class: 'bg-gray-500' }
  }
}

function getMembershipBadge(membership: any) {
  if (!membership?.is_active) return null
  return { label: membership.membership?.name || '会员', class: 'bg-amber-500' }
}

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div class="container flex h-14 items-center px-4">
        <Button variant="ghost" size="icon" @click="goBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <div class="flex-1 flex items-center justify-center gap-2">
          <Users class="h-5 w-5 text-primary" />
          <h1 class="text-lg font-semibold">用户管理</h1>
        </div>
        <Button variant="ghost" size="icon" @click="loadUsers">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 统计 -->
      <div class="grid grid-cols-3 gap-4">
        <Card>
          <CardContent class="p-4 text-center">
            <div class="text-2xl font-bold">{{ stats.total }}</div>
            <div class="text-sm text-muted-foreground">总用户</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4 text-center">
            <div class="text-2xl font-bold text-amber-500">{{ stats.members }}</div>
            <div class="text-sm text-muted-foreground">会员</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="p-4 text-center">
            <div class="text-2xl font-bold text-purple-500">{{ stats.admins }}</div>
            <div class="text-sm text-muted-foreground">管理员</div>
          </CardContent>
        </Card>
      </div>

      <!-- 搜索 -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="searchQuery" placeholder="搜索用户名或邮箱" class="pl-10" @keyup.enter="loadUsers" />
      </div>

      <!-- 用户列表 -->
      <div v-if="loading" class="text-center py-8 text-muted-foreground">加载中...</div>
      <div v-else-if="users.length === 0" class="text-center py-8 text-muted-foreground">暂无用户</div>
      <div v-else class="space-y-3">
        <Card v-for="user in users" :key="user.id">
          <CardContent class="p-4">
            <div class="flex items-center gap-4">
              <Avatar>
                <AvatarImage v-if="user.avatar" :src="user.avatar" />
                <AvatarFallback>{{ (user.name || user.username || 'U')[0].toUpperCase() }}</AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-medium truncate">{{ user.name || user.username || '未设置' }}</span>
                  <Badge :class="getRoleBadge(user.role).class" class="text-white text-xs">
                    {{ getRoleBadge(user.role).label }}
                  </Badge>
                  <Badge v-if="getMembershipBadge(user.membership)" :class="getMembershipBadge(user.membership)?.class" class="text-white text-xs">
                    <Crown class="h-3 w-3 mr-1" />{{ getMembershipBadge(user.membership)?.label }}
                  </Badge>
                </div>
                <div class="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span class="flex items-center gap-1 truncate">
                    <Mail class="h-3 w-3" />{{ user.email }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Calendar class="h-3 w-3" />{{ formatDate(user.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  </div>
</template>
