<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { recommendWeight, type WeightResult } from '@/api/calculators'

const form = ref({
  estimated_1rm: undefined as number | undefined,
  training_goal: 'hypertrophy' as 'strength' | 'hypertrophy' | 'endurance' | 'power',
  target_reps: undefined as number | undefined,
  target_rpe: undefined as number | undefined,
})

const loading = ref(false)
const error = ref('')
const result = ref<WeightResult | null>(null)

const goalOptions = [
  { value: 'strength', label: '力量' },
  { value: 'hypertrophy', label: '增肌' },
  { value: 'endurance', label: '耐力' },
  { value: 'power', label: '爆发力' },
]

async function submit() {
  error.value = ''
  if (!form.value.estimated_1rm) {
    error.value = '请输入预估 1RM'
    return
  }
  loading.value = true
  try {
    const params: Record<string, any> = {
      estimated_1rm: form.value.estimated_1rm,
      training_goal: form.value.training_goal,
    }
    if (form.value.target_reps) params.target_reps = form.value.target_reps
    if (form.value.target_rpe) params.target_rpe = form.value.target_rpe

    const res = await recommendWeight(params as any)
    result.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.msg || '推荐失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- 表单 -->
    <Card>
      <CardContent class="p-4 space-y-3">
        <div>
          <Label>预估 1RM (kg)</Label>
          <Input v-model.number="form.estimated_1rm" type="number" placeholder="例如 100" />
        </div>

        <div>
          <Label>训练目标</Label>
          <Select v-model="form.training_goal">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="o in goalOptions" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label>目标次数 <span class="text-muted-foreground text-xs">可选</span></Label>
            <Input v-model.number="form.target_reps" type="number" placeholder="8" />
          </div>
          <div>
            <Label>目标 RPE <span class="text-muted-foreground text-xs">可选</span></Label>
            <Input v-model.number="form.target_rpe" type="number" placeholder="8" />
          </div>
        </div>

        <Button class="w-full" :disabled="loading" @click="submit">
          {{ loading ? '计算中...' : '推荐重量' }}
        </Button>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      </CardContent>
    </Card>

    <!-- 结果 -->
    <Card v-if="result">
      <CardContent class="p-4 space-y-4">
        <div class="text-center">
          <div class="text-sm text-muted-foreground">推荐重量</div>
          <div class="text-4xl font-bold text-primary">{{ result.recommended_weight }} kg</div>
          <div class="text-xs text-muted-foreground mt-1">{{ result.training_goal }}</div>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center text-sm">
          <div class="bg-blue-50 rounded-lg p-3">
            <div class="text-xs text-blue-600">重量范围</div>
            <div class="font-semibold text-blue-700">
              {{ result.weight_range.min }}–{{ result.weight_range.max }} kg
            </div>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <div class="text-xs text-green-600">%1RM</div>
            <div class="font-semibold text-green-700">
              {{ result.percentage_of_1rm }}%
            </div>
          </div>
          <div class="bg-amber-50 rounded-lg p-3">
            <div class="text-xs text-amber-600">次数范围</div>
            <div class="font-semibold text-amber-700">
              {{ result.rep_range[0] }}–{{ result.rep_range[1] }} 次
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
