<script setup lang="ts">
/**
 * TDEE 计算结果卡片
 * 展示热量计算结果 + 宏量营养素分配
 */
import { computed } from 'vue'
import { Flame, Beef, Wheat, Droplets } from 'lucide-vue-next'

interface Props {
  result: {
    bmr?: number
    tdee?: number
    targetCalories?: number
    surplus?: number
    macros?: {
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
    }
    formula?: string
    notes?: string
  }
}

const props = defineProps<Props>()

const macroPercentages = computed(() => {
  const m = props.result.macros
  if (!m || !m.calories) return null
  const total = (m.protein || 0) * 4 + (m.carbs || 0) * 4 + (m.fat || 0) * 9
  if (total === 0) return null
  return {
    protein: Math.round(((m.protein || 0) * 4 / total) * 100),
    carbs: Math.round(((m.carbs || 0) * 4 / total) * 100),
    fat: Math.round(((m.fat || 0) * 9 / total) * 100),
  }
})

const surplusLabel = computed(() => {
  const s = props.result.surplus
  if (!s) return null
  if (s > 0) return { text: `+${s} kcal 盈余`, color: 'text-green-600' }
  if (s < 0) return { text: `${s} kcal 赤字`, color: 'text-orange-600' }
  return { text: '维持热量', color: 'text-muted-foreground' }
})
</script>

<template>
  <div class="rounded-lg border border-border bg-card p-3 space-y-3">
    <!-- 标题行 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Flame class="h-4 w-4 text-orange-500" />
        <span class="text-sm font-medium">热量计算结果</span>
      </div>
      <span v-if="result.formula" class="text-[10px] text-muted-foreground">{{ result.formula }}</span>
    </div>

    <!-- 核心数值 -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="rounded-md bg-muted/50 p-2">
        <div class="text-lg font-bold text-foreground">{{ result.bmr || '—' }}</div>
        <div class="text-[10px] text-muted-foreground">BMR</div>
      </div>
      <div class="rounded-md bg-muted/50 p-2">
        <div class="text-lg font-bold text-foreground">{{ result.tdee || '—' }}</div>
        <div class="text-[10px] text-muted-foreground">TDEE</div>
      </div>
      <div class="rounded-md bg-primary/10 p-2">
        <div class="text-lg font-bold text-primary">{{ result.targetCalories || '—' }}</div>
        <div class="text-[10px] text-muted-foreground">目标热量</div>
      </div>
    </div>

    <!-- 盈余/赤字 -->
    <div v-if="surplusLabel" class="text-xs text-center" :class="surplusLabel.color">
      {{ surplusLabel.text }}
    </div>

    <!-- 宏量营养素 -->
    <div v-if="result.macros" class="space-y-2">
      <div class="text-xs font-medium text-muted-foreground">宏量营养素分配</div>
      
      <!-- 进度条 -->
      <div v-if="macroPercentages" class="flex h-2 rounded-full overflow-hidden">
        <div class="bg-red-400" :style="{ width: macroPercentages.protein + '%' }" />
        <div class="bg-amber-400" :style="{ width: macroPercentages.carbs + '%' }" />
        <div class="bg-blue-400" :style="{ width: macroPercentages.fat + '%' }" />
      </div>

      <!-- 数值 -->
      <div class="grid grid-cols-3 gap-2 text-xs">
        <div class="flex items-center gap-1">
          <Beef class="h-3 w-3 text-red-400" />
          <span>蛋白质 <b>{{ result.macros.protein }}g</b></span>
        </div>
        <div class="flex items-center gap-1">
          <Wheat class="h-3 w-3 text-amber-400" />
          <span>碳水 <b>{{ result.macros.carbs }}g</b></span>
        </div>
        <div class="flex items-center gap-1">
          <Droplets class="h-3 w-3 text-blue-400" />
          <span>脂肪 <b>{{ result.macros.fat }}g</b></span>
        </div>
      </div>
    </div>

    <!-- 备注 -->
    <div v-if="result.notes" class="text-xs text-muted-foreground border-t border-border/50 pt-2">
      {{ result.notes }}
    </div>
  </div>
</template>
