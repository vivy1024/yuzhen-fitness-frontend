<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-base flex items-center gap-2">
        <Dumbbell class="h-5 w-5 text-amber-500" />
        力量数据
      </CardTitle>
      <p class="text-sm text-muted-foreground">
        记录您的最大力量水平（可选，非初学者建议填写）
      </p>
    </CardHeader>
    <CardContent class="space-y-4">
      <!-- 提示信息 -->
      <div class="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm text-blue-600 dark:text-blue-400">
        <Info class="h-4 w-4 flex-shrink-0" />
        <span>1RM = 单次最大重量，3RM = 3次最大重量（所有字段可选填）</span>
      </div>

      <!-- 6个动作卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 卧推 -->
        <div class="p-4 rounded-lg border-l-4 border-l-red-500 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <span class="text-red-600 dark:text-red-400 text-sm font-bold">卧</span>
            </div>
            <h4 class="font-medium">卧推 (Bench Press)</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">1RM (kg)</Label>
              <Input type="number" v-model.number="localData.bench_press!.one_rm" placeholder="kg" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">3RM (kg)</Label>
              <Input type="number" v-model.number="localData.bench_press!.three_rm" placeholder="kg" />
            </div>
          </div>
        </div>

        <!-- 深蹲 -->
        <div class="p-4 rounded-lg border-l-4 border-l-blue-500 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span class="text-blue-600 dark:text-blue-400 text-sm font-bold">蹲</span>
            </div>
            <h4 class="font-medium">深蹲 (Squat)</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">1RM (kg)</Label>
              <Input type="number" v-model.number="localData.squat!.one_rm" placeholder="kg" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">3RM (kg)</Label>
              <Input type="number" v-model.number="localData.squat!.three_rm" placeholder="kg" />
            </div>
          </div>
        </div>

        <!-- 硬拉 -->
        <div class="p-4 rounded-lg border-l-4 border-l-amber-500 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <span class="text-amber-600 dark:text-amber-400 text-sm font-bold">拉</span>
            </div>
            <h4 class="font-medium">硬拉 (Deadlift)</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">1RM (kg)</Label>
              <Input type="number" v-model.number="localData.deadlift!.one_rm" placeholder="kg" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">3RM (kg)</Label>
              <Input type="number" v-model.number="localData.deadlift!.three_rm" placeholder="kg" />
            </div>
          </div>
        </div>

        <!-- 推举 -->
        <div class="p-4 rounded-lg border-l-4 border-l-green-500 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <span class="text-green-600 dark:text-green-400 text-sm font-bold">推</span>
            </div>
            <h4 class="font-medium">推举 (Overhead Press)</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">1RM (kg)</Label>
              <Input type="number" v-model.number="localData.overhead_press!.one_rm" placeholder="kg" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">3RM (kg)</Label>
              <Input type="number" v-model.number="localData.overhead_press!.three_rm" placeholder="kg" />
            </div>
          </div>
        </div>

        <!-- 引体向上 -->
        <div class="p-4 rounded-lg border-l-4 border-l-purple-500 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <span class="text-purple-600 dark:text-purple-400 text-sm font-bold">引</span>
            </div>
            <h4 class="font-medium">引体向上 (Pull Up)</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">1RM (kg)</Label>
              <Input type="number" v-model.number="localData.pull_up!.one_rm" placeholder="负重kg" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">3RM (kg)</Label>
              <Input type="number" v-model.number="localData.pull_up!.three_rm" placeholder="负重kg" />
            </div>
          </div>
        </div>

        <!-- 双杠臂屈伸 -->
        <div class="p-4 rounded-lg border-l-4 border-l-orange-500 bg-gray-50 dark:bg-gray-800">
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
              <span class="text-orange-600 dark:text-orange-400 text-sm font-bold">臂</span>
            </div>
            <h4 class="font-medium">双杠臂屈伸 (Dip)</h4>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label class="text-xs">1RM (kg)</Label>
              <Input type="number" v-model.number="localData.dip!.one_rm" placeholder="负重kg" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">3RM (kg)</Label>
              <Input type="number" v-model.number="localData.dip!.three_rm" placeholder="负重kg" />
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { StrengthData } from '@/types/user-profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dumbbell, Info } from 'lucide-vue-next'

interface Props {
  modelValue?: StrengthData
}

interface Emits {
  (event: 'update:modelValue', value: StrengthData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 创建默认数据结构
function createDefaultData(): StrengthData {
  return {
    bench_press: { one_rm: undefined, three_rm: undefined },
    squat: { one_rm: undefined, three_rm: undefined },
    deadlift: { one_rm: undefined, three_rm: undefined },
    overhead_press: { one_rm: undefined, three_rm: undefined },
    pull_up: { one_rm: undefined, three_rm: undefined },
    dip: { one_rm: undefined, three_rm: undefined },
  }
}

// 合并props数据到默认结构
function mergeData(source?: StrengthData): StrengthData {
  const defaults = createDefaultData()
  if (!source) return defaults
  return {
    bench_press: { ...defaults.bench_press, ...source.bench_press },
    squat: { ...defaults.squat, ...source.squat },
    deadlift: { ...defaults.deadlift, ...source.deadlift },
    overhead_press: { ...defaults.overhead_press, ...source.overhead_press },
    pull_up: { ...defaults.pull_up, ...source.pull_up },
    dip: { ...defaults.dip, ...source.dip },
  }
}

// 使用reactive直接绑定，避免watch循环
const localData = reactive<StrengthData>(mergeData(props.modelValue))

// 防止循环更新的标志
let isUpdatingFromProps = false

// 监听props变化，同步到本地数据（用于从服务器加载后回显）
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !isUpdatingFromProps) {
      isUpdatingFromProps = true
      const merged = mergeData(newValue)
      Object.assign(localData, merged)
      // 使用nextTick确保更新完成后再重置标志
      setTimeout(() => { isUpdatingFromProps = false }, 0)
    }
  },
  { deep: true }
)

// 监听本地数据变化，同步到父组件
watch(
  () => localData,
  (newValue) => {
    if (!isUpdatingFromProps) {
      emit('update:modelValue', { ...newValue })
    }
  },
  { deep: true }
)
</script>
