<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateMacros, type MacroResult } from '@/api/calculators'

const form = ref({
  target_calories: undefined as number | undefined,
  weight_kg: undefined as number | undefined,
  fitness_goal: 'maintenance' as 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp',
  method: 'balanced' as 'balanced' | 'body_weight' | 'ratio',
})

const loading = ref(false)
const error = ref('')
const result = ref<MacroResult | null>(null)

const goalOptions = [
  { value: 'fat_loss', label: '减脂' },
  { value: 'mild_fat_loss', label: '温和减脂' },
  { value: 'maintenance', label: '维持' },
  { value: 'lean_bulk', label: '精益增肌' },
  { value: 'hypertrophy', label: '增肌' },
  { value: 'recomp', label: '重组' },
]

const methodOptions = [
  { value: 'balanced', label: '均衡分配' },
  { value: 'body_weight', label: '按体重计算' },
  { value: 'ratio', label: '按比例分配' },
]

async function submit() {
  error.value = ''
  if (!form.value.target_calories || !form.value.weight_kg) {
    error.value = '请填写目标热量和体重'
    return
  }
  loading.value = true
  try {
    const res = await calculateMacros({
      target_calories: form.value.target_calories,
      weight_kg: form.value.weight_kg,
      fitness_goal: form.value.fitness_goal,
      method: form.value.method,
    })
    result.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.msg || '计算失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardContent class="p-4 space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label>目标热量 (kcal)</Label>
            <Input v-model.number="form.target_calories" type="number" placeholder="2200" />
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
          <Label>计算方式</Label>
          <Select v-model="form.method">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="o in methodOptions" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button class="w-full" :disabled="loading" @click="submit">
          {{ loading ? '计算中...' : '计算宏量' }}
        </Button>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      </CardContent>
    </Card>

    <template v-if="result">
      <Card>
        <CardContent class="p-4">
          <div class="text-center mb-4">
            <div class="text-sm text-muted-foreground">目标热量</div>
            <div class="text-2xl font-bold">{{ result.target_calories }} kcal</div>
          </div>

          <!-- 三大营养素 -->
          <div class="grid grid-cols-3 gap-3 text-center mb-4">
            <div class="bg-blue-50 rounded-xl p-3">
              <div class="text-2xl font-bold text-blue-600">{{ result.macros.protein_g }}g</div>
              <div class="text-xs text-blue-500 mt-1">蛋白质</div>
              <div class="text-xs text-muted-foreground">{{ result.ratios.protein }}%</div>
            </div>
            <div class="bg-amber-50 rounded-xl p-3">
              <div class="text-2xl font-bold text-amber-600">{{ result.macros.carbs_g }}g</div>
              <div class="text-xs text-amber-500 mt-1">碳水</div>
              <div class="text-xs text-muted-foreground">{{ result.ratios.carbs }}%</div>
            </div>
            <div class="bg-rose-50 rounded-xl p-3">
              <div class="text-2xl font-bold text-rose-600">{{ result.macros.fat_g }}g</div>
              <div class="text-xs text-rose-500 mt-1">脂肪</div>
              <div class="text-xs text-muted-foreground">{{ result.ratios.fat }}%</div>
            </div>
          </div>

          <!-- 每公斤体重 -->
          <div class="text-sm text-muted-foreground space-y-1">
            <div class="flex justify-between">
              <span>蛋白质 / kg</span>
              <span class="font-medium text-foreground">{{ result.per_kg.protein }}g</span>
            </div>
            <div class="flex justify-between">
              <span>碳水 / kg</span>
              <span class="font-medium text-foreground">{{ result.per_kg.carbs }}g</span>
            </div>
            <div class="flex justify-between">
              <span>脂肪 / kg</span>
              <span class="font-medium text-foreground">{{ result.per_kg.fat }}g</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
