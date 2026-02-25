<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { calculateFFMI, type FFMIResult } from '@/api/calculators'

const form = reactive({
  height_cm: undefined as number | undefined,
  weight_kg: undefined as number | undefined,
  gender: 'male' as 'male' | 'female',
  body_fat: undefined as number | undefined,
})

const loading = ref(false)
const result = ref<FFMIResult | null>(null)
const error = ref('')

function getBmiBadgeVariant(status: string) {
  const map: Record<string, string> = {
    '偏瘦': 'secondary', '正常': 'default', '超重': 'warning', '肥胖': 'destructive',
    'Underweight': 'secondary', 'Normal': 'default', 'Overweight': 'warning', 'Obese': 'destructive',
  }
  return (map[status] ?? 'outline') as 'default' | 'secondary' | 'destructive' | 'outline'
}

async function handleSubmit() {
  error.value = ''
  if (!form.height_cm || !form.weight_kg) {
    error.value = '请填写身高和体重'
    return
  }
  loading.value = true
  try {
    const res = await calculateFFMI({
      height_cm: form.height_cm,
      weight_kg: form.weight_kg,
      gender: form.gender,
      body_fat: form.body_fat || undefined,
    })
    result.value = res.data
  } catch (e: any) {
    error.value = e?.response?.data?.msg || e?.message || '计算失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto px-4">
    <!-- 表单 -->
    <Card>
      <CardContent class="pt-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="height">身高 (cm)</Label>
            <Input id="height" v-model.number="form.height_cm" type="number" placeholder="170" min="100" max="250" />
          </div>
          <div class="space-y-2">
            <Label for="weight">体重 (kg)</Label>
            <Input id="weight" v-model.number="form.weight_kg" type="number" placeholder="70" min="30" max="300" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label>性别</Label>
            <Select v-model="form.gender">
              <SelectTrigger><SelectValue placeholder="选择性别" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男</SelectItem>
                <SelectItem value="female">女</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="bf">体脂率 % (可选)</Label>
            <Input id="bf" v-model.number="form.body_fat" type="number" placeholder="15" min="3" max="60" />
          </div>
        </div>

        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

        <Button class="w-full" :disabled="loading" @click="handleSubmit">
          {{ loading ? '计算中...' : '计算 FFMI' }}
        </Button>
      </CardContent>
    </Card>

    <!-- 结果 -->
    <Card v-if="result">
      <CardContent class="pt-6 space-y-5">
        <!-- BMI -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-muted-foreground">BMI</span>
          <div class="flex items-center gap-2">
            <span class="font-medium">{{ result.bmi.toFixed(1) }}</span>
            <Badge :variant="getBmiBadgeVariant(result.bmi_status)">{{ result.bmi_status }}</Badge>
          </div>
        </div>

        <!-- FFMI 核心 -->
        <div class="text-center py-3">
          <p class="text-sm text-muted-foreground mb-1">FFMI</p>
          <p class="text-4xl font-bold tracking-tight">{{ result.ffmi.toFixed(1) }}</p>
          <p class="text-sm text-muted-foreground mt-1">
            标准化 FFMI: <span class="font-medium text-foreground">{{ result.normalized_ffmi.toFixed(1) }}</span>
          </p>
        </div>

        <!-- 评级 -->
        <div class="text-center">
          <Badge variant="outline" class="text-base px-4 py-1">{{ result.assessment }}</Badge>
        </div>

        <!-- 体脂估算提示 -->
        <p v-if="result.used_estimated_bf" class="text-xs text-muted-foreground text-center bg-muted/50 rounded-md py-2 px-3">
          未提供体脂率，使用估算值 {{ result.body_fat_used.toFixed(1) }}%。输入实际体脂率可获得更准确结果。
        </p>

        <!-- 瘦体重 -->
        <div class="flex items-center justify-between text-sm">
          <span class="text-muted-foreground">瘦体重</span>
          <span class="font-medium">{{ result.lean_body_mass.toFixed(1) }} kg</span>
        </div>

        <!-- 自然潜力 -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">自然潜力开发</span>
            <span class="font-medium">{{ result.natural_potential.percentage }}%</span>
          </div>
          <div class="h-2 rounded-full bg-muted overflow-hidden">
            <div
              class="h-full rounded-full bg-primary transition-all duration-500"
              :style="{ width: `${Math.min(result.natural_potential.percentage, 100)}%` }"
            />
          </div>
          <p class="text-xs text-muted-foreground">{{ result.natural_potential.description }}</p>
        </div>

        <!-- 训练建议 -->
        <div class="space-y-2">
          <p class="text-sm font-medium">{{ result.training_recommendation.focus }}</p>
          <ul class="space-y-1">
            <li
              v-for="(tip, i) in result.training_recommendation.suggestions"
              :key="i"
              class="text-sm text-muted-foreground flex gap-2"
            >
              <span class="text-primary shrink-0">•</span>
              <span>{{ tip }}</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
