<script setup lang="ts">
/**
 * TDEE 计算器组件
 * 计算基础代谢率(BMR)、每日总能量消耗(TDEE)及目标热量与宏量营养素分配
 */
import { ref, reactive } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateTDEE, type TDEEParams, type TDEEResult } from '@/api/calculators'

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: '久坐' },
  { value: 'lightly_active', label: '轻度活动(1-3次/周)' },
  { value: 'moderately_active', label: '中度活动(3-5次/周)' },
  { value: 'very_active', label: '高度活动(6-7次/周)' },
  { value: 'extremely_active', label: '极高活动' },
] as const

const GOAL_OPTIONS = [
  { value: 'fat_loss', label: '减脂' },
  { value: 'mild_fat_loss', label: '温和减脂' },
  { value: 'maintenance', label: '维持' },
  { value: 'lean_bulk', label: '精益增肌' },
  { value: 'hypertrophy', label: '增肌' },
  { value: 'recomp', label: '重组' },
] as const

const form = reactive({
  age: undefined as number | undefined,
  gender: '' as 'male' | 'female' | '',
  weight_kg: undefined as number | undefined,
  height_cm: undefined as number | undefined,
  activity_level: '' as TDEEParams['activity_level'] | '',
  fitness_goal: '' as TDEEParams['fitness_goal'] | '',
})

const loading = ref(false)
const error = ref('')
const result = ref<TDEEResult | null>(null)

async function onSubmit() {
  error.value = ''
  if (!form.age || !form.gender || !form.weight_kg || !form.height_cm || !form.activity_level || !form.fitness_goal) {
    error.value = '请填写所有字段'
    return
  }

  loading.value = true
  try {
    const res = await calculateTDEE({
      age: form.age,
      gender: form.gender,
      weight_kg: form.weight_kg,
      height_cm: form.height_cm,
      activity_level: form.activity_level as TDEEParams['activity_level'],
      fitness_goal: form.fitness_goal as TDEEParams['fitness_goal'],
    })
    result.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.message || '计算失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardContent class="p-4 space-y-4">
        <!-- 年龄 & 性别 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="tdee-age">年龄</Label>
            <Input id="tdee-age" v-model.number="form.age" type="number" placeholder="25" min="10" max="120" />
          </div>
          <div class="space-y-1.5">
            <Label for="tdee-gender">性别</Label>
            <Select v-model="form.gender">
              <SelectTrigger id="tdee-gender"><SelectValue placeholder="选择性别" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男</SelectItem>
                <SelectItem value="female">女</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 体重 & 身高 -->
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="tdee-weight">体重 (kg)</Label>
            <Input id="tdee-weight" v-model.number="form.weight_kg" type="number" placeholder="70" min="20" max="300" step="0.1" />
          </div>
          <div class="space-y-1.5">
            <Label for="tdee-height">身高 (cm)</Label>
            <Input id="tdee-height" v-model.number="form.height_cm" type="number" placeholder="175" min="100" max="250" step="0.1" />
          </div>
        </div>

        <!-- 活动水平 -->
        <div class="space-y-1.5">
          <Label for="tdee-activity">活动水平</Label>
          <Select v-model="form.activity_level">
            <SelectTrigger id="tdee-activity"><SelectValue placeholder="选择活动水平" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in ACTIVITY_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 健身目标 -->
        <div class="space-y-1.5">
          <Label for="tdee-goal">健身目标</Label>
          <Select v-model="form.fitness_goal">
            <SelectTrigger id="tdee-goal"><SelectValue placeholder="选择健身目标" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in GOAL_OPTIONS" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <Button class="w-full" :disabled="loading" @click="onSubmit">
          {{ loading ? '计算中...' : '计算 TDEE' }}
        </Button>
      </CardContent>
    </Card>

    <!-- 结果 -->
    <Card v-if="result">
      <CardContent class="p-4 space-y-4">
        <h3 class="text-lg font-semibold">计算结果</h3>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="rounded-lg bg-muted p-3">
            <p class="text-xs text-muted-foreground">BMR</p>
            <p class="text-xl font-bold">{{ Math.round(result.bmr) }}</p>
            <p class="text-xs text-muted-foreground">kcal</p>
          </div>
          <div class="rounded-lg bg-muted p-3">
            <p class="text-xs text-muted-foreground">TDEE</p>
            <p class="text-xl font-bold">{{ Math.round(result.tdee) }}</p>
            <p class="text-xs text-muted-foreground">kcal</p>
          </div>
          <div class="rounded-lg bg-primary/10 p-3">
            <p class="text-xs text-muted-foreground">目标热量</p>
            <p class="text-xl font-bold text-primary">{{ Math.round(result.target_calories) }}</p>
            <p class="text-xs text-muted-foreground">kcal</p>
          </div>
        </div>

        <div v-if="result.deficit_or_surplus !== 0" class="text-center text-sm text-muted-foreground">
          {{ result.deficit_or_surplus > 0 ? '热量盈余' : '热量缺口' }}：
          <span class="font-medium" :class="result.deficit_or_surplus > 0 ? 'text-green-600' : 'text-orange-600'">
            {{ Math.abs(Math.round(result.deficit_or_surplus)) }} kcal
          </span>
        </div>

        <!-- 宏量营养素 -->
        <h4 class="text-sm font-medium">宏量营养素分配</h4>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">蛋白质</p>
            <p class="text-lg font-bold">{{ Math.round(result.macros.protein_g) }}g</p>
            <p class="text-xs text-muted-foreground">{{ Math.round(result.macros.ratios.protein) }}%</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">脂肪</p>
            <p class="text-lg font-bold">{{ Math.round(result.macros.fat_g) }}g</p>
            <p class="text-xs text-muted-foreground">{{ Math.round(result.macros.ratios.fat) }}%</p>
          </div>
          <div class="rounded-lg border p-3">
            <p class="text-xs text-muted-foreground">碳水</p>
            <p class="text-lg font-bold">{{ Math.round(result.macros.carbs_g) }}g</p>
            <p class="text-xs text-muted-foreground">{{ Math.round(result.macros.ratios.carbs) }}%</p>
          </div>
        </div>

        <p class="text-xs text-muted-foreground text-center">
          公式：{{ result.formula_used }}
        </p>
      </CardContent>
    </Card>
  </div>
</template>
