<script setup lang="ts">
/**
 * 关于页面
 * 显示应用信息、版本、开发者信息等
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Dumbbell, ExternalLink, Shield } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 是否是管理员
const isAdmin = computed(() => authStore.isAdmin)

// 应用信息
const appInfo = {
  name: '玉珍健身',
  version: '3.0.0',
  build: '20260106',
  description: '智能健身应用，AI驱动的训练计划',
  developer: '玉珍健身团队',
  website: 'https://yuzhen.fitness',
  email: 'support@yuzhen.fitness'
}

// 技术栈
const techStack = [
  'Vue 3 + TypeScript',
  'Vite + PWA',
  'TailwindCSS + shadcn-vue',
  'DAML-RAG AI引擎',
  'GraphRAG知识图谱'
]

function goBack() {
  // 返回到设置页面，而不是使用router.back()避免循环
  router.push('/settings')
}

function openLink(url: string) {
  window.open(url, '_blank')
}

function goToTerms() {
  router.push('/legal/terms')
}

function goToAdminOrders() {
  router.push('/admin')
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
        <h1 class="flex-1 text-center text-lg font-semibold">关于</h1>
        <div class="w-10" />
      </div>
    </header>

    <main class="container px-4 py-6 space-y-6">
      <!-- 应用Logo和名称 -->
      <div class="flex flex-col items-center py-8">
        <div class="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mb-4 shadow-lg">
          <Dumbbell class="h-10 w-10 text-white" />
        </div>
        <h2 class="text-2xl font-bold">{{ appInfo.name }}</h2>
        <p class="text-muted-foreground mt-1">{{ appInfo.description }}</p>
        <div class="flex items-center gap-2 mt-3">
          <span class="text-sm text-muted-foreground">版本 {{ appInfo.version }}</span>
          <span class="text-muted-foreground">·</span>
          <span class="text-sm text-muted-foreground">Build {{ appInfo.build }}</span>
        </div>
      </div>

      <!-- 功能特点 -->
      <Card>
        <CardContent class="pt-6">
          <h3 class="font-semibold mb-4">核心功能</h3>
          <ul class="space-y-3 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              <span>AI智能健身顾问，基于DAML-RAG框架</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              <span>1790+专业健身动作库，详细教程指导</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              <span>1880+食物营养数据库，科学饮食规划</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              <span>个性化训练计划，智能进度追踪</span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary">•</span>
              <span>GraphRAG知识图谱，专业健身知识</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- 技术栈 -->
      <Card>
        <CardContent class="pt-6">
          <h3 class="font-semibold mb-4">技术栈</h3>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="tech in techStack" 
              :key="tech"
              class="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary"
            >
              {{ tech }}
            </span>
          </div>
        </CardContent>
      </Card>

      <!-- 联系方式 -->
      <Card>
        <CardContent class="pt-6 space-y-4">
          <h3 class="font-semibold">联系我们</h3>
          
          <div class="space-y-3">
            <div 
              class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              @click="openLink(`mailto:${appInfo.email}`)"
            >
              <span class="text-sm">邮箱</span>
              <div class="flex items-center gap-2 text-muted-foreground">
                <span class="text-sm">{{ appInfo.email }}</span>
                <ExternalLink class="h-4 w-4" />
              </div>
            </div>
            
            <Separator />
            
            <div 
              class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              @click="openLink(appInfo.website)"
            >
              <span class="text-sm">官网</span>
              <div class="flex items-center gap-2 text-muted-foreground">
                <span class="text-sm">{{ appInfo.website }}</span>
                <ExternalLink class="h-4 w-4" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 法律信息 -->
      <Card>
        <CardContent class="pt-6">
          <div 
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="goToTerms"
          >
            <span class="text-sm font-medium">用户协议与隐私政策</span>
            <ExternalLink class="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <!-- 管理员入口（仅管理员可见） -->
      <Card v-if="isAdmin">
        <CardContent class="pt-6">
          <h3 class="font-semibold mb-4 flex items-center gap-2">
            <Shield class="h-4 w-4 text-amber-500" />
            管理员功能
          </h3>
          <div 
            class="flex items-center justify-between p-3 -mx-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
            @click="goToAdminOrders"
          >
            <span class="text-sm font-medium">管理后台</span>
            <ExternalLink class="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <!-- 版权信息 -->
      <div class="text-center py-6 text-sm text-muted-foreground">
        <p>© 2026 {{ appInfo.developer }}</p>
        <p class="mt-1">保留所有权利</p>
      </div>
    </main>
  </div>
</template>
