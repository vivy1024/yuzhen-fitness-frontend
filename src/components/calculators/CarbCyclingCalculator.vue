<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateCarbCycling, type CarbCyclingResult } from '@/api/calculators'

const form = ref({
  tdee: undefined as number | undefined,
  weight_kg: undefined as number | undefined,
  fitness_goal: 'maintenance' as 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp',
  training_days: [] as number[],
})

const loading = ref(false)
const error = ref('')
const result = ref<CarbCyclingResult | null>(null)

const goalOptions = [
  { value: 'fat_loss', label: '减脂' },
  { value: 'mild_fat_loss', label: '温和减脂' },
  { value: 'maintenance', label: '维持' },
  { value: 'lean_bulk', label: '精益增肌' },
  { value: 'hypertrophy', label: '增肌' },
  { value: 'recomp', label: '重组' },
]

const weekdays = [
  { value: 0, label: '周一' },
  { value: 1, label: '周二' },
  { value: 2, label: '周三' },
  { value: 3, label: '周四' },
  { value: 4, label: '周五' },
  { value: 5, label: '周六' },
  { value: 6, label: '周日' },
]

function toggleDay(day: number) {
  const idx = form.value.training_days.indexOf(day)
  if (idx >= 0) {
    form.value.training_days = form.value.training_days.filter(d => d !== day)
  } else {
    form.value.training_days = [...form.value.training_days, day].sort()
  }
}

async function submit() {
  error.value = ''
  if (!form.value.tdee || !form.value.weight_kg || form.value.training_days.length === 0) {
    error.value = '请填写完整参数并选择训练日'
    return
  }
  loading.value = true
  try {
    const res = await calculateCarbCycling({
      tdee: form.value.tdee,
      weight_kg: form.value.weight_kg,
      fitness_goal: form.value.fitness_goal,
      training_days: form.value.training_days,
    })
    result.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.msg || '计算失败'
  } finally {
    loading.value = false
  }
}

const carbTypeLabel: Record<string, string> = {
  high: '高碳',
  medium: '中碳',
  low: '低碳',
}
const carbTypeColor: Record<string, string> = {
  high: 'text-green-600 bg-green-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-red-600 bg-red-50',
}
</script>

<template>
  <div class="space-y-4">
    <!-- 表单 -->
    <Card>
      <CardContent class="p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label>TDEE (kcal)</Label>
            <Input v-model.number="form.tdee" type="number" placeholder="2400" />
          </div>
          <div>
            <Label>体重 (kg)</Label>
            <Input v-model.number="form.weight_kg" type="number" placeholder="70" />
          </div>
        </div>

        <div>
          <Label>健身目标</Label>
          <Select v-model="form.fitness_goal">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="o in goalOptions" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label class="mb-2 block">训练日（点击选择）</Label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="d in weekdays"
              :key="d.value"
              type="button"
              :class="[
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                form.training_days.includes(d.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              ]"
              @click="toggleDay(d.value)"
            >
              {{ d.label }}
            </button>
          </div>
        </div>

        <Button class="w-full" :disabled="loading" @click="submit">
          {{ loading ? '计算中...' : '计算碳循环' }}
        </Button>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      </CardContent>
    </Card>

    <!-- 结果 -->
    <template v-if="result">
      <Card>
        <CardContent class="p-4">
          <div class="text-center mb-3">
            <div class="text-sm text-muted-foreground">恒定蛋白质</div>
            <div class="text-2xl font-bold">{{ result.constant_protein_g }}g / 天</div>
            <div class="text-xs text-muted-foreground mt-1">
              周均热量 {{ result.weekly_average_calories }} kcal
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 text-center text-sm mb-4">
            <div class="bg-green-50 rounded-lg p-2">
              <div class="font-semibold text-green-700">{{ result.high_carb_days }}天</div>
              <div class="text-xs text-green-600">高碳</div>
            </div>
            <div class="bg-amber-50 rounded-lg p-2">
              <div class="font-semibold text-amber-700">{{ result.medium_carb_days }}天</div>
              <div class="text-xs text-amber-600">中碳</div>
            </div>
            <div class="bg-red-50 rounded-lg p-2">
              <div class="font-semibold text-red-700">{{ result.low_carb_days }}天</div>
              <div class="text-xs text-red-600">低碳</div>
            </div>
          </div>

          <!-- 每日详情 -->
          <div class="space-y-2">
            <div
              v-for="day in result.weekly_plan"
              :key="day.day"
              class="flex items-center justify-between text-sm border rounded-lg px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <span class="font-medium w-8">{{ day.day_name }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full', carbTypeColor[day.carb_type]]">
                  {{ carbTypeLabel[day.carb_type] }}
                </span>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ day.calories }}kcal · P{{ day.protein_g }} C{{ day.carbs_g }} F{{ day.fat_g }}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
