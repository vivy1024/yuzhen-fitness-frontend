<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-vue-next'
import TDEECalculator from '@/components/calculators/TDEECalculator.vue'
import FFMICalculator from '@/components/calculators/FFMICalculator.vue'
import OneRMCalculator from '@/components/calculators/OneRMCalculator.vue'
import IntensityConverter from '@/components/calculators/IntensityConverter.vue'
import WeightRecommender from '@/components/calculators/WeightRecommender.vue'
import CarbCyclingCalculator from '@/components/calculators/CarbCyclingCalculator.vue'
import MacroCalculator from '@/components/calculators/MacroCalculator.vue'

const route = useRoute()
const router = useRouter()

const calculatorMap: Record<string, { component: any; title: string }> = {
  tdee: { component: TDEECalculator, title: 'TDEE 热量计算' },
  ffmi: { component: FFMICalculator, title: 'FFMI 体成分' },
  'one-rm': { component: OneRMCalculator, title: '1RM 估算' },
  intensity: { component: IntensityConverter, title: 'RPE / 强度转换' },
  weight: { component: WeightRecommender, title: '训练重量推荐' },
  'carb-cycling': { component: CarbCyclingCalculator, title: '碳循环计算' },
  macros: { component: MacroCalculator, title: '宏量营养素' },
}

const current = computed(() => {
  const id = route.params.id as string
  return calculatorMap[id] ?? null
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="router.push('/tools/calculators')">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <h1 class="text-lg font-semibold">{{ current?.title ?? '计算器' }}</h1>
    </div>

    <div v-if="current" class="p-4">
      <component :is="current.component" />
    </div>
    <div v-else class="p-8 text-center text-muted-foreground">
      未找到该计算器
    </div>
  </div>
</template>
