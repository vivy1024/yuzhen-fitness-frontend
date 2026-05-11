<template>
  <div class="min-h-screen bg-background pb-20">
    <!-- 顶部导航 -->
    <div class="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.back()">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <h1 class="text-lg font-semibold">{{ isEdit ? '编辑计划' : '创建训练计划' }}</h1>
        </div>
        <Button size="sm" :disabled="saving" @click="handleSave">
          <Loader2 v-if="saving" class="w-4 h-4 mr-1 animate-spin" />
          {{ isEdit ? '保存' : '创建' }}
        </Button>
      </div>
    </div>

    <div class="p-4 space-y-6">
      <!-- 基本信息 -->
      <section class="space-y-3">
        <h2 class="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <FileText class="w-4 h-4" />
          基本信息
        </h2>
        <Input v-model="form.name" placeholder="计划名称（如：增肌4周计划）" />
        <Textarea v-model="form.description" placeholder="计划描述（可选）" :rows="2" />

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label class="text-xs text-muted-foreground mb-1 block">训练目标</Label>
            <Select v-model="form.goal">
              <SelectTrigger><SelectValue placeholder="选择目标" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hypertrophy">增肌</SelectItem>
                <SelectItem value="fat_loss">减脂</SelectItem>
                <SelectItem value="strength">增强力量</SelectItem>
                <SelectItem value="endurance">提高耐力</SelectItem>
                <SelectItem value="body_shaping">塑形</SelectItem>
                <SelectItem value="general_fitness">综合健身</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label class="text-xs text-muted-foreground mb-1 block">难度</Label>
            <Select v-model="form.difficulty">
              <SelectTrigger><SelectValue placeholder="选择难度" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="novice">零基础</SelectItem>
                <SelectItem value="beginner">初学者</SelectItem>
                <SelectItem value="intermediate">中级</SelectItem>
                <SelectItem value="advanced">高级</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <Label class="text-xs text-muted-foreground mb-1 block">周期（周）</Label>
            <Input v-model.number="form.duration_weeks" type="number" min="1" max="52" />
          </div>
          <div>
            <Label class="text-xs text-muted-foreground mb-1 block">每星期训练次数</Label>
            <Input v-model.number="form.workouts_per_week" type="number" min="1" max="7" />
          </div>
        </div>
      </section>

      <!-- 周视图 -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar class="w-4 h-4" />
            训练安排
          </h2>
          <Button variant="outline" size="sm" @click="selectorOpen = true">
            <Plus class="w-3.5 h-3.5 mr-1" />
            添加动作
          </Button>
        </div>

        <!-- 星期 Tabs -->
        <Tabs v-model="activeDay" class="w-full">
          <TabsList class="w-full grid grid-cols-7">
            <TabsTrigger
              v-for="d in weekDays"
              :key="d.value"
              :value="String(d.value)"
              class="text-xs px-1"
            >
              {{ d.label }}
              <span v-if="getExercisesForDay(d.value).length" class="ml-0.5 text-[10px] text-primary">
                {{ getExercisesForDay(d.value).length }}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent v-for="d in weekDays" :key="d.value" :value="String(d.value)" class="mt-3">
            <div v-if="getExercisesForDay(d.value).length === 0" class="py-8 text-center">
              <Dumbbell class="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
              <p class="text-sm text-muted-foreground">{{ d.label }}暂无训练动作</p>
              <Button variant="ghost" size="sm" class="mt-2" @click="selectorOpen = true">
                添加动作
              </Button>
            </div>

            <div v-else class="space-y-2">
              <ExerciseConfig
                v-for="(ex, idx) in getExercisesForDay(d.value)"
                :key="`${d.value}-${idx}`"
                :exercise="ex"
                @update="updateExercise(d.value, idx, $event)"
                @remove="removeExercise(d.value, idx)"
              />
            </div>
          </TabsContent>
        </Tabs>

        <!-- 总计 -->
        <div v-if="form.exercises.length > 0" class="text-xs text-muted-foreground text-center">
          共 {{ form.exercises.length }} 个动作，分布在 {{ activeDayCount }} 天
        </div>
      </section>

      <!-- 饮食计划 -->
      <NutritionPlanTab v-model:items="form.nutrition" v-model:day-of-week="currentDayNumber" />
    </div>

    <!-- 动作选择器 -->
    <ExerciseSelector v-model:open="selectorOpen" @confirm="handleExercisesSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, FileText, Calendar, Plus, Dumbbell, Loader2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/toast'
import ExerciseSelector from '@/components/training/ExerciseSelector.vue'
import ExerciseConfig from '@/components/training/ExerciseConfig.vue'
import NutritionPlanTab from '@/components/training/NutritionPlanTab.vue'
import type { NutritionPlanItem } from '@/components/training/NutritionPlanTab.vue'
import { createTrainingPlan, updateTrainingPlan, getTrainingPlanDetail } from '@/api/training-plan'
import type { CreatePlanData } from '@/api/training-plan'
import type { PlanExerciseForm } from '@/components/training/ExerciseConfig.vue'
import type { ExerciseBasic } from '@/types/exercise'

const router = useRouter()
const route = useRoute()
const { toast } = useToast()

const isEdit = computed(() => !!route.params.id)
const planId = computed(() => Number(route.params.id))

const saving = ref(false)
const selectorOpen = ref(false)
const activeDay = ref('1')

const form = ref({
  name: '',
  description: '',
  goal: '' as string,
  difficulty: '' as string,
  duration_weeks: 4,
  workouts_per_week: 3,
  exercises: [] as PlanExerciseForm[],
  nutrition: [] as NutritionPlanItem[],
})

const weekDays = [
  { value: 1, label: '星期一' },
  { value: 2, label: '星期二' },
  { value: 3, label: '星期三' },
  { value: 4, label: '星期四' },
  { value: 5, label: '星期五' },
  { value: 6, label: '星期六' },
  { value: 7, label: '星期日' },
]

const activeDayCount = computed(() => {
  const days = new Set(form.value.exercises.map(e => e.day_of_week))
  return days.size
})

const currentDayNumber = computed(() => Number(activeDay.value))

function getExercisesForDay(day: number): PlanExerciseForm[] {
  return form.value.exercises.filter(e => e.day_of_week === day)
}

function handleExercisesSelected(exercises: ExerciseBasic[]) {
  const currentDay = Number(activeDay.value)
  const existingCount = getExercisesForDay(currentDay).length

  exercises.forEach((ex, i) => {
    form.value.exercises.push({
      exercise_id: ex.id,
      exercise_name: ex.name_zh,
      day_of_week: currentDay,
      sets: 3,
      reps: '8-12',
      weight: '',
      rest_time: '60s',
      notes: '',
      order_index: existingCount + i,
    })
  })
}

function updateExercise(day: number, localIdx: number, data: PlanExerciseForm) {
  const dayExercises = getExercisesForDay(day)
  const globalIdx = form.value.exercises.indexOf(dayExercises[localIdx])
  if (globalIdx >= 0) {
    form.value.exercises[globalIdx] = data
  }
}

function removeExercise(day: number, localIdx: number) {
  const dayExercises = getExercisesForDay(day)
  const globalIdx = form.value.exercises.indexOf(dayExercises[localIdx])
  if (globalIdx >= 0) {
    form.value.exercises.splice(globalIdx, 1)
  }
}

async function handleSave() {
  if (!form.value.name.trim()) {
    toast({ title: '请输入计划名称', variant: 'destructive' })
    return
  }
  if (form.value.exercises.length === 0) {
    toast({ title: '请至少添加一个训练动作', variant: 'destructive' })
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      description: form.value.description || undefined,
      goal: (form.value.goal || undefined) as CreatePlanData['goal'],
      difficulty: (form.value.difficulty || undefined) as CreatePlanData['difficulty'],
      duration_weeks: form.value.duration_weeks,
      workouts_per_week: form.value.workouts_per_week,
      exercises: form.value.exercises.map((e, i) => ({
        exercise_id: e.exercise_id,
        exercise_name: e.exercise_name,
        day_of_week: e.day_of_week,
        sets: e.sets,
        reps: e.reps,
        weight: e.weight || undefined,
        rest_time: e.rest_time || undefined,
        notes: e.notes || undefined,
        order_index: e.order_index ?? i,
      })),
      nutrition: form.value.nutrition.map(n => ({
        food_id: n.food_id,
        food_name: n.food_name,
        meal_type: n.meal_type,
        portion_grams: n.portion_grams,
        day_of_week: n.day_of_week,
        notes: n.notes || undefined,
      })),
    }

    if (isEdit.value) {
      await updateTrainingPlan(planId.value, payload)
      toast({ title: '计划已更新' })
    } else {
      await createTrainingPlan(payload as any)
      toast({ title: '计划创建成功' })
    }
    router.push('/training/plans')
  } catch (err: any) {
    toast({ title: err?.response?.data?.msg || '保存失败', variant: 'destructive' })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (isEdit.value) {
    try {
      const res = await getTrainingPlanDetail(planId.value)
      if (res.code === 200 && res.data) {
        const d = res.data
        form.value.name = d.name
        form.value.description = d.description || ''
        form.value.goal = d.goal || ''
        form.value.difficulty = d.difficulty || ''
        form.value.duration_weeks = d.weeks
        form.value.workouts_per_week = d.frequency
        if (d.planExercises?.length) {
          form.value.exercises = d.planExercises.map(e => ({
            exercise_id: e.exerciseId,
            exercise_name: e.exerciseName,
            day_of_week: e.dayOfWeek,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            rest_time: e.restTime,
            notes: e.notes,
            order_index: e.orderIndex,
          }))
        }
        if (d.nutritionPlans?.length) {
          form.value.nutrition = d.nutritionPlans.map(n => ({
            food_id: n.foodId,
            food_name: n.foodName,
            meal_type: n.mealType,
            portion_grams: n.portionGrams,
            day_of_week: n.dayOfWeek,
            notes: n.notes,
            _energy_per100: n.nutrition?.energyKcal ?? null,
            _protein_per100: n.nutrition?.protein ?? null,
            _carb_per100: n.nutrition?.carbohydrate ?? null,
            _fat_per100: n.nutrition?.fat ?? null,
          }))
        }
      }
    } catch {
      toast({ title: '加载计划失败', variant: 'destructive' })
    }
  }
})
</script>
