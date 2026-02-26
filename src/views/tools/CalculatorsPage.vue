<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Flame,
  Dumbbell,
  Target,
  Gauge,
  Weight,
  CalendarDays,
  PieChart,
  ArrowLeft,
} from 'lucide-vue-next'

const router = useRouter()

const calculators = [
  {
    id: 'tdee',
    name: 'TDEE 热量计算',
    description: '基础代谢 + 活动消耗 + 目标热量',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    id: 'ffmi',
    name: 'FFMI 体成分',
    description: 'BMI + FFMI + 自然潜力评估',
    icon: Target,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    id: 'one-rm',
    name: '1RM 估算',
    description: '根据重量×次数估算最大力量',
    icon: Dumbbell,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    id: 'intensity',
    name: 'RPE / 强度转换',
    description: 'RPE ↔ RIR ↔ %1RM 互转',
    icon: Gauge,
    color: 'text-red-500',
    bg: 'bg-red-50',
  },
  {
    id: 'weight',
    name: '训练重量推荐',
    description: '基于 1RM 和训练目标推荐重量',
    icon: Weight,
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    id: 'carb-cycling',
    name: '碳循环计算',
    description: '高/中/低碳日宏量分配',
    icon: CalendarDays,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    id: 'macros',
    name: '宏量营养素',
    description: '蛋白质 / 碳水 / 脂肪分配',
    icon: PieChart,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
] as const

function openCalculator(id: string) {
  router.push(`/tools/calculators/${id}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="router.back()">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <h1 class="text-lg font-semibold">健身计算器</h1>
    </div>

    <!-- 卡片网格 -->
    <div class="p-4 grid grid-cols-2 gap-3">
      <Card
        v-for="calc in calculators"
        :key="calc.id"
        class="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
        @click="openCalculator(calc.id)"
      >
        <CardContent class="p-4 flex flex-col items-center text-center gap-2">
          <div :class="[calc.bg, 'w-12 h-12 rounded-xl flex items-center justify-center']">
            <component :is="calc.icon" :class="[calc.color, 'w-6 h-6']" />
          </div>
          <div class="font-medium text-sm">{{ calc.name }}</div>
          <div class="text-xs text-muted-foreground leading-tight">{{ calc.description }}</div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
