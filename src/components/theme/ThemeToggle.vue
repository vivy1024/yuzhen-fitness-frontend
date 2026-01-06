<script setup lang="ts">
/**
 * 主题切换组件
 * 支持浅色/深色/跟随系统三种模式
 */
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme, type ThemeMode } from '@/composables/useTheme'
import { Sun, Moon, Monitor } from 'lucide-vue-next'

interface Props {
  /** 显示模式：icon-仅图标，select-下拉选择，full-完整显示 */
  variant?: 'icon' | 'select' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'icon'
})

const { mode, isDark, toggleTheme, setTheme } = useTheme()

// 主题选项
const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色模式', icon: Sun },
  { value: 'dark', label: '深色模式', icon: Moon },
  { value: 'system', label: '跟随系统', icon: Monitor },
]

// 当前图标
const currentIcon = computed(() => {
  if (mode.value === 'system') return Monitor
  return isDark.value ? Moon : Sun
})

// 处理选择变化
function handleSelect(value: string) {
  setTheme(value as ThemeMode)
}
</script>

<template>
  <!-- 图标模式：点击切换 -->
  <Button 
    v-if="variant === 'icon'"
    variant="ghost" 
    size="icon"
    @click="toggleTheme"
    class="relative"
  >
    <Sun class="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <Moon class="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    <span class="sr-only">切换主题</span>
  </Button>

  <!-- 下拉选择模式 -->
  <Select v-else-if="variant === 'select'" :model-value="mode" @update:model-value="handleSelect">
    <SelectTrigger class="w-[140px]">
      <SelectValue placeholder="选择主题" />
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

  <!-- 完整显示模式：带标签的选择器 -->
  <div v-else class="flex items-center gap-3">
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <component :is="currentIcon" class="h-4 w-4" />
      <span>主题</span>
    </div>
    <Select :model-value="mode" @update:model-value="handleSelect">
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
</template>
