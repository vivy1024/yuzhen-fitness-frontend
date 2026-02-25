<script setup lang="ts">
import { ref, computed } from 'vue'
import { calculateOneRM, type OneRMParams, type OneRMResult } from '@/api/calculators'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

const weight = ref<number | undefined>()
const reps = ref<number | undefined>()
const formula = ref<OneRMParams['formula']>('average')
const loading = ref(false)
const error = ref('')
const result = ref<OneRMResult | null>(null)

const canSubmit = computed(() =>
  weight.value && weight.value > 0 && reps.value && reps.value >= 1 && reps.value <= 30
)

const formulaOptions = [
  { value: 'epley', label: 'Epley 公式' },
  { value: 'brzycki', label: 'Brzycki 公式' },
  { value: 'average', label: '平均值（推荐）' },
] as const

async function handleSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  error.value = ''
  try {
    const res = await calculateOneRM({
      weight_kg: weight.value!,
      reps: reps.value!,
      formula: formula.value,
    })
    result.value = res.data.data
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '计算失败，请稍后重试'
    result.value = null
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-4 max-w-lg mx-auto px-4">
    <!-- 表单 -->
    <Card>
      <CardContent class="pt-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="weight">重量 (kg)</Label>
            <Input
              id="weight"
              v-model.number="weight"
              type="number"
              placeholder="如 80"
              min="1"
              step="0.5"
            />
          </div>
          <div class="space-y-2">
            <Label for="reps">次数</Label>
            <Input
              id="reps"
              v-model.number="reps"
              type="number"
              placeholder="1-30"
              min="1"
              max="30"
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label>计算公式</Label>
          <Select v-model="formula">
            <SelectTrigger>
              <SelectValue placeholder="选择公式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="opt in formulaOptions"
                :key="opt.value"
                :value="opt.value"
              >
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          class="w-full"
          :disabled="!canSubmit || loading"
          @click="handleSubmit"
        >
          {{ loading ? '计算中...' : '计算 1RM' }}
        </Button>

        <p v-if="error" class="text-sm text-destructive text-center">
          {{ error }}
        </p>
      </CardContent>
    </Card>

    <!-- 结果 -->
    <template v-if="result">
      <!-- 1RM 主结果 -->
      <Card>
        <CardContent class="pt-6 text-center">
          <p class="text-sm text-muted-foreground">预估 1RM</p>
          <p class="text-5xl font-bold tracking-tight mt-1">
            {{ result.estimated_1rm }}
            <span class="text-lg font-normal text-muted-foreground">kg</span>
          </p>
          <p class="text-xs text-muted-foreground mt-2">
            使用 {{ result.formula_used }} 公式
          </p>
        </CardContent>
      </Card>

      <!-- 三公式对比 -->
      <Card>
        <CardContent class="pt-6">
          <p class="text-sm font-medium mb-3">公式对比</p>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div
              v-for="(val, key) in result.formulas"
              :key="key"
              class="rounded-lg bg-muted/50 p-3"
            >
              <p class="text-xs text-muted-foreground capitalize">{{ key }}</p>
              <p class="text-lg font-semibold mt-1">{{ val }} kg</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 百分比对照表 -->
      <Card>
        <CardContent class="pt-6">
          <p class="text-sm font-medium mb-3">训练负荷参考</p>
          <div class="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead class="w-[80px]">%1RM</TableHead>
                  <TableHead class="w-[90px]">重量</TableHead>
                  <TableHead>典型次数</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="row in result.percentage_table"
                  :key="row.percentage"
                >
                  <TableCell class="font-medium">{{ row.percentage }}%</TableCell>
                  <TableCell>{{ row.weight }} kg</TableCell>
                  <TableCell class="text-muted-foreground">{{ row.typical_reps }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
