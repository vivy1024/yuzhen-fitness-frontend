<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, MessageSquare, Dumbbell, Apple, User, Target } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = [
  { path: '/', name: '首页', icon: Home },
  { path: '/ai/chat', name: 'AI顾问', icon: MessageSquare },
  { path: '/training', name: '训练', icon: Target },
  { path: '/exercise', name: '动作库', icon: Dumbbell },
  { path: '/food', name: '食物库', icon: Apple },
  { path: '/me', name: '我的', icon: User },
]

const currentPath = computed(() => route.path)

// 判断当前路径是否匹配导航项（支持子路由匹配）
function isActive(itemPath: string): boolean {
  if (itemPath === '/') {
    return currentPath.value === '/'
  }
  return currentPath.value.startsWith(itemPath)
}

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 bg-background border-t safe-area-bottom">
    <div class="grid grid-cols-6 h-16">
      <button
        v-for="item in navItems"
        :key="item.path"
        class="flex flex-col items-center justify-center gap-1 transition-colors"
        :class="isActive(item.path) ? 'text-primary' : 'text-muted-foreground'"
        @click="navigate(item.path)"
      >
        <component :is="item.icon" class="h-5 w-5" />
        <span class="text-xs font-medium">{{ item.name }}</span>
      </button>
    </div>
  </nav>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
