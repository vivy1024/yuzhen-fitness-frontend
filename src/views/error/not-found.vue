<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search } from 'lucide-vue-next'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
    <div class="text-center space-y-6 max-w-md">
      <!-- 404 数字 -->
      <div class="relative">
        <div class="text-[120px] md:text-[160px] font-bold text-muted-foreground/10 leading-none select-none">
          404
        </div>
        <div class="absolute inset-0 flex items-center justify-center">
          <Search class="h-16 w-16 md:h-20 md:w-20 text-muted-foreground/30" />
        </div>
      </div>
      
      <!-- 提示文案 -->
      <div class="space-y-2">
        <h1 class="text-2xl md:text-3xl font-bold text-foreground">
          页面未找到
        </h1>
        <p class="text-muted-foreground">
          抱歉，您访问的页面不存在或已被移除
        </p>
      </div>
      
      <!-- 操作按钮 -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button 
          variant="outline" 
          class="gap-2"
          @click="goBack"
        >
          <ArrowLeft class="h-4 w-4" />
          返回上页
        </Button>
        <Button 
          class="gap-2"
          @click="goHome"
        >
          <Home class="h-4 w-4" />
          回到首页
        </Button>
      </div>
      
      <!-- 帮助链接 -->
      <p class="text-sm text-muted-foreground pt-4">
        如果问题持续存在，请
        <router-link to="/feedback" class="text-primary hover:underline">
          联系我们
        </router-link>
      </p>
    </div>
  </div>
</template>
