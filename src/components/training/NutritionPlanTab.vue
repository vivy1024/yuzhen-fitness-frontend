<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
        <UtensilsCrossed class="w-4 h-4" />
        饮食计划
      </h2>
      <Button variant="outline" size="sm" @click="foodSelectorOpen = true">
        <Plus class="w-3.5 h-3.5 mr-1" />
        添加食物
      </Button>
    </div>

    <!-- 餐次 Tabs -->
    <Tabs v-model="activeMeal" class="w-full">
      <TabsList class="w-full grid grid-cols-4">
        <TabsTrigger
          v-for="meal in mealTypes"
          :key="meal.value"
          :value="meal.value"
          class="text-xs"
        >
          {{ meal.label }}
          <span v-if="getFoodsForMeal(meal.value).length" class="ml-0.5 text-[10px] text-primary">
            {{ getFoodsForMeal(meal.value).length }}
          </span>
        </TabsTrigger>
      </TabsList>

      <TabsContent v-for="meal in mealTypes" :key="meal.value" :value="meal.value" class="mt-3">
        <div v-if="getFoodsForMeal(meal.value).length === 0" class="py-6 text-center">
          <UtensilsCrossed class="w-7 h-7 mx-auto text-muted-foreground/40 mb-2" />
          <p class="text-sm text-muted-foreground">{{ meal.label }}暂无食物</p>
          <Button variant="ghost" size="sm" class="mt-1" @click="foodSelectorOpen = true">添加食物</Button>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="(item, idx) in getFoodsForMeal(meal.value)"
            :key="`${meal.value}-${idx}`"
            class="flex items-center gap-2 p-2.5 rounded-lg border bg-card"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ item.food_name }}</p>
              <p class="text-[10px] text-muted-foreground">
                {{ calcNutrition(item, 'energy') }} kcal · 蛋白{{ calcNutrition(item, 'protein') }}g
              </p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <Input
                :model-value="String(item.portion_grams)"
                type="number"
                min="10"
                step="10"
                class="w-16 h-7 text-xs text-center"
                @update:model-value="updatePortion(meal.value, idx, Number($event))"
              />
              <span class="text-xs text-muted-foreground">g</span>
              <Button variant="ghost" size="icon" class="h-6 w-6" @click="removeFood(meal.value, idx)">
                <X class="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <!-- 营养汇总 -->
    <div v-if="nutritionItems.length > 0" class="grid grid-cols-4 gap-2 p-3 rounded-lg bg-muted/50">
      <div class="text-center">
        <p class="text-lg font-semibold text-primary">{{ totalNutrition.energy }}</p>
        <p class="text-[10px] text-muted-foreground">千卡</p>
      </div>
      <div class="text-center">
        <p class="text-lg font-semibold text-blue-500">{{ totalNutrition.protein }}</p>
        <p class="text-[10px] text-muted-foreground">蛋白质(g)</p>
      </div>
      <div class="text-center">
        <p class="text-lg font-semibold text-amber-500">{{ totalNutrition.carb }}</p>
        <p class="text-[10px] text-muted-foreground">碳水(g)</p>
      </div>
      <div class="text-center">
        <p class="text-lg font-semibold text-red-400">{{ totalNutrition.fat }}</p>
        <p class="text-[10px] text-muted-foreground">脂肪(g)</p>
      </div>
    </div>

    <FoodSelector v-model:open="foodSelectorOpen" @confirm="handleFoodsSelected" />
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { UtensilsCrossed, Plus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import FoodSelector from './FoodSelector.vue'
import type { FoodBasic } from '@/api/food'

export interface NutritionPlanItem {
  food_id?: number
  food_name: string
  meal_type: string
  portion_grams: number
  day_of_week?: number
  notes?: string
  // 缓存营养数据（每100g）
  _energy_per100?: number | null
  _protein_per100?: number | null
  _carb_per100?: number | null
  _fat_per100?: number | null
}

const nutritionItems = defineModel<NutritionPlanItem[]>('items', { default: () => [] })
const activeDay = defineModel<number>('dayOfWeek', { default: 1 })

const foodSelectorOpen = ref(false)
const activeMeal = ref('breakfast')

const mealTypes = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' },
]

function getFoodsForMeal(meal: string): NutritionPlanItem[] {
  return nutritionItems.value.filter(
    n => n.meal_type === meal && (n.day_of_week === activeDay.value || !n.day_of_week)
  )
}

function calcNutrition(item: NutritionPlanItem, type: 'energy' | 'protein' | 'carb' | 'fat'): string {
  const ratio = item.portion_grams / 100
  const map = {
    energy: item._energy_per100,
    protein: item._protein_per100,
    carb: item._carb_per100,
    fat: item._fat_per100,
  }
  const val = map[type]
  return val != null ? Math.round(val * ratio).toString() : '-'
}

const totalNutrition = computed(() => {
  const dayItems = nutritionItems.value.filter(
    n => n.day_of_week === activeDay.value || !n.day_of_week
  )
  let energy = 0, protein = 0, carb = 0, fat = 0
  for (const item of dayItems) {
    const ratio = item.portion_grams / 100
    if (item._energy_per100) energy += item._energy_per100 * ratio
    if (item._protein_per100) protein += item._protein_per100 * ratio
    if (item._carb_per100) carb += item._carb_per100 * ratio
    if (item._fat_per100) fat += item._fat_per100 * ratio
  }
  return {
    energy: Math.round(energy),
    protein: Math.round(protein),
    carb: Math.round(carb),
    fat: Math.round(fat),
  }
})

function handleFoodsSelected(foods: FoodBasic[]) {
  for (const food of foods) {
    nutritionItems.value.push({
      food_id: food.id,
      food_name: food.name,
      meal_type: activeMeal.value,
      portion_grams: 100,
      day_of_week: activeDay.value,
      _energy_per100: food.energy_kcal,
      _protein_per100: food.protein,
      _carb_per100: food.carbohydrate,
      _fat_per100: food.fat,
    })
  }
}

function updatePortion(meal: string, localIdx: number, grams: number) {
  const items = getFoodsForMeal(meal)
  const globalIdx = nutritionItems.value.indexOf(items[localIdx])
  if (globalIdx >= 0) {
    nutritionItems.value[globalIdx].portion_grams = Math.max(10, grams)
  }
}

function removeFood(meal: string, localIdx: number) {
  const items = getFoodsForMeal(meal)
  const globalIdx = nutritionItems.value.indexOf(items[localIdx])
  if (globalIdx >= 0) {
    nutritionItems.value.splice(globalIdx, 1)
  }
}
</script>
