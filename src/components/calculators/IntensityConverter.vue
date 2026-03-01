<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { convertIntensity, type IntensityResult } from '@/api/calculators'

const form = ref({
  input_type: 'rpe' as 'rpe' | 'rir' | 'percentage',
  value: undefined as number | undefined,
})

const loading = ref(false)
const error = ref('')
const result = ref<IntensityResult | null>(null)

const typeOptions = [
  { value: 'rpe', label: 'RPE 自觉用力' },
  { value: 'rir', label: 'RIR 储备次数' },
  { value: 'percentage', label: '%1RM 百分比' },
]

async function submit() {
  error.value = ''
  if (form.value.value === undefined) {
    error.value = '请输入数值'
    return
  }
  loading.value = true
  try {
    const res = await convertIntensity({
      input_type: form.value.input_type,
      value: form.value.value,
    })
    result.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.msg || '转换失败'
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
          <Label>输入类型</Label>
          <Select v-model="form.input_type">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="o in typeOptions" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>数值</Label>
          <Input v-model.number="form.value" type="number" placeholder="例如 8" />
        </div>

        <Button class="w-full" :disabled="loading" @click="submit">
          {{ loading ? '转换中...' : '转换强度' }}
        </Button>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>
      </CardContent>
    </Card>

    <!-- 结果 -->
    <Card v-if="result">
      <CardContent class="p-4 space-y-3">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-blue-50 rounded-lg p-3">
            <div class="text-xs text-blue-600">RPE</div>
            <div class="text-xl font-bold text-blue-700">{{ result.rpe }}</div>
          </div>
          <div class="bg-amber-50 rounded-lg p-3">
            <div class="text-xs text-amber-600">RIR</div>
            <div class="text-xl font-bold text-amber-700">{{ result.rir }}</div>
          </div>
          <div class="bg-green-50 rounded-lg p-3">
            <div class="text-xs text-green-600">%1RM</div>
            <div class="text-xl font-bold text-green-700">{{ result.percentage_low }}–{{ result.percentage_high }}%</div>
          </div>
        </div>

        <div class="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
          {{ result.description }}
        </div>
      </CardContent>
    </Card>
  </div>
</template>
