<template>
  <div class="food-detail min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
      <div class="flex items-center justify-between px-4 h-14">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="text-lg font-semibold line-clamp-1 max-w-[200px]">
          {{ food?.name || '食物详情' }}
        </h1>
        <Button
          variant="ghost"
          size="icon"
          @click="handleToggleFavorite"
        >
          <Star :class="['w-5 h-5', isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400']" />
        </Button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="p-4 space-y-4">
      <Skeleton class="w-full h-48 rounded-xl" />
      <Skeleton class="h-8 w-3/4" />
      <Skeleton class="h-4 w-1/2" />
      <Skeleton class="h-32 w-full" />
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-16 px-4">
      <AlertCircle class="w-16 h-16 text-red-400 mb-4" />
      <p class="text-gray-500 mb-4">{{ error }}</p>
      <Button @click="loadDetail">重试</Button>
    </div>

    <!-- 详情内容 -->
    <main v-else-if="food" class="pb-24">
      <!-- 图片区域 -->
      <div class="relative w-full h-[180px] sm:h-[200px] md:h-[240px] bg-gradient-to-br from-emerald-500 to-teal-600">
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <component :is="categoryIcon" class="w-10 h-10 text-white mb-1" />
          <h2 class="text-white text-base font-bold text-center px-4 line-clamp-2">{{ food.name }}</h2>
          <p class="text-white/80 text-sm mt-1">{{ food.category }}</p>
        </div>
        
        <!-- GI值标签 -->
        <Badge 
          v-if="food.gi_value"
          :class="giBadgeClass"
          class="absolute top-3 right-3 text-xs font-medium"
        >
          GI: {{ food.gi_value }} ({{ giLabel }})
        </Badge>
      </div>

      <!-- 热量概览 -->
      <Card class="mx-4 -mt-6 relative z-10">
        <CardContent class="p-4">
          <div class="flex items-center justify-around">
            <div class="text-center">
              <div class="flex items-center justify-center gap-1 mb-1">
                <Flame class="w-5 h-5 text-red-500" />
                <span class="text-2xl font-bold text-red-500">{{ food.energy_kcal || 0 }}</span>
              </div>
              <p class="text-xs text-gray-500">千卡/100g</p>
            </div>
            <div class="w-px h-10 bg-gray-200"></div>
            <div class="text-center">
              <span class="text-2xl font-bold text-blue-500">{{ food.protein || 0 }}</span>
              <span class="text-sm text-gray-500">g</span>
              <p class="text-xs text-gray-500">蛋白质</p>
            </div>
            <div class="w-px h-10 bg-gray-200"></div>
            <div class="text-center">
              <span class="text-2xl font-bold text-orange-500">{{ food.fat || 0 }}</span>
              <span class="text-sm text-gray-500">g</span>
              <p class="text-xs text-gray-500">脂肪</p>
            </div>
            <div class="w-px h-10 bg-gray-200"></div>
            <div class="text-center">
              <span class="text-2xl font-bold text-green-500">{{ food.carbohydrate || 0 }}</span>
              <span class="text-sm text-gray-500">g</span>
              <p class="text-xs text-gray-500">碳水</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 宏量营养素 -->
      <Card class="mx-4 mt-4">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <TrendingUp class="w-5 h-5 text-primary" />
            宏量营养素
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-sm text-gray-500">蛋白质</span>
            <div class="flex items-center gap-2">
              <Progress :model-value="getMacroPercent(food.protein || 0, 50)" class="w-20 h-2" />
              <span class="text-sm font-medium w-12 text-right">{{ food.protein || 0 }}g</span>
            </div>
          </div>
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-sm text-gray-500">脂肪</span>
            <div class="flex items-center gap-2">
              <Progress :model-value="getMacroPercent(food.fat || 0, 50)" class="w-20 h-2" />
              <span class="text-sm font-medium w-12 text-right">{{ food.fat || 0 }}g</span>
            </div>
          </div>
          <div class="flex justify-between items-center py-2 border-b">
            <span class="text-sm text-gray-500">碳水化合物</span>
            <div class="flex items-center gap-2">
              <Progress :model-value="getMacroPercent(food.carbohydrate || 0, 100)" class="w-20 h-2" />
              <span class="text-sm font-medium w-12 text-right">{{ food.carbohydrate || 0 }}g</span>
            </div>
          </div>
          <div v-if="food.dietary_fiber" class="flex justify-between items-center py-2 border-b">
            <span class="text-sm text-gray-500">膳食纤维</span>
            <div class="flex items-center gap-2">
              <Progress :model-value="getMacroPercent(food.dietary_fiber, 30)" class="w-20 h-2" />
              <span class="text-sm font-medium w-12 text-right">{{ food.dietary_fiber }}g</span>
            </div>
          </div>
          <div v-if="food.cholesterol !== null && food.cholesterol !== undefined" class="flex justify-between items-center py-2">
            <span class="text-sm text-gray-500">胆固醇</span>
            <span class="text-sm font-medium">{{ food.cholesterol }}mg</span>
          </div>
        </CardContent>
      </Card>

      <!-- 矿物质 -->
      <Card v-if="hasMinerals" class="mx-4 mt-4">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <Gem class="w-5 h-5 text-primary" />
            矿物质
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-3">
            <div v-if="food.calcium" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">钙</span>
              <span class="text-sm font-medium">{{ food.calcium }}mg</span>
            </div>
            <div v-if="food.iron" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">铁</span>
              <span class="text-sm font-medium">{{ food.iron }}mg</span>
            </div>
            <div v-if="food.zinc" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">锌</span>
              <span class="text-sm font-medium">{{ food.zinc }}mg</span>
            </div>
            <div v-if="food.selenium" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">硒</span>
              <span class="text-sm font-medium">{{ food.selenium }}μg</span>
            </div>
            <div v-if="food.potassium" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">钾</span>
              <span class="text-sm font-medium">{{ food.potassium }}mg</span>
            </div>
            <div v-if="food.phosphorus" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">磷</span>
              <span class="text-sm font-medium">{{ food.phosphorus }}mg</span>
            </div>
            <div v-if="food.sodium" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">钠</span>
              <span class="text-sm font-medium">{{ food.sodium }}mg</span>
            </div>
            <div v-if="food.magnesium" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">镁</span>
              <span class="text-sm font-medium">{{ food.magnesium }}mg</span>
            </div>
            <div v-if="food.copper" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">铜</span>
              <span class="text-sm font-medium">{{ food.copper }}mg</span>
            </div>
            <div v-if="food.manganese" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">锰</span>
              <span class="text-sm font-medium">{{ food.manganese }}mg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 维生素 -->
      <Card v-if="hasVitamins" class="mx-4 mt-4">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <Sparkles class="w-5 h-5 text-primary" />
            维生素
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-2 gap-3">
            <div v-if="food.vitamin_a" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">维生素A</span>
              <span class="text-sm font-medium">{{ food.vitamin_a }}μg</span>
            </div>
            <div v-if="food.vitamin_c" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">维生素C</span>
              <span class="text-sm font-medium">{{ food.vitamin_c }}mg</span>
            </div>
            <div v-if="food.vitamin_e_total" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">维生素E</span>
              <span class="text-sm font-medium">{{ food.vitamin_e_total }}mg</span>
            </div>
            <div v-if="food.thiamin" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">维生素B1</span>
              <span class="text-sm font-medium">{{ food.thiamin }}mg</span>
            </div>
            <div v-if="food.riboflavin" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">维生素B2</span>
              <span class="text-sm font-medium">{{ food.riboflavin }}mg</span>
            </div>
            <div v-if="food.niacin" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">烟酸</span>
              <span class="text-sm font-medium">{{ food.niacin }}mg</span>
            </div>
            <div v-if="food.carotene" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">胡萝卜素</span>
              <span class="text-sm font-medium">{{ food.carotene }}μg</span>
            </div>
            <div v-if="food.retinol" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm text-gray-600">视黄醇</span>
              <span class="text-sm font-medium">{{ food.retinol }}μg</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 其他信息 -->
      <Card v-if="food.water || food.ash || food.edible" class="mx-4 mt-4">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <Info class="w-5 h-5 text-primary" />
            其他信息
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-if="food.edible" class="flex justify-between py-2 border-b">
            <span class="text-sm text-gray-500">可食部</span>
            <span class="text-sm font-medium">{{ food.edible }}%</span>
          </div>
          <div v-if="food.water" class="flex justify-between py-2 border-b">
            <span class="text-sm text-gray-500">水分</span>
            <span class="text-sm font-medium">{{ food.water }}g</span>
          </div>
          <div v-if="food.ash" class="flex justify-between py-2">
            <span class="text-sm text-gray-500">灰分</span>
            <span class="text-sm font-medium">{{ food.ash }}g</span>
          </div>
        </CardContent>
      </Card>

      <!-- 数据来源 -->
      <div class="mx-4 mt-4 mb-4 text-center text-xs text-gray-400">
        数据来源：《中国食物成分表》
      </div>

      <!-- 添加到饮食记录按钮 -->
      <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button class="w-full" size="lg" @click="showAddIntakeDialog = true">
          <Plus class="w-5 h-5 mr-2" />
          添加到饮食记录
        </Button>
      </div>
    </main>

    <!-- 添加饮食记录对话框 -->
    <Dialog v-model:open="showAddIntakeDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加饮食记录</DialogTitle>
          <DialogDescription>
            记录您摄入的 {{ food?.name }}
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label>摄入量 (克)</Label>
            <Input v-model.number="intakeAmount" type="number" placeholder="100" />
          </div>
          <div class="space-y-2">
            <Label>餐次</Label>
            <Select v-model="intakeMeal">
              <SelectTrigger>
                <SelectValue placeholder="选择餐次" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">早餐</SelectItem>
                <SelectItem value="lunch">午餐</SelectItem>
                <SelectItem value="dinner">晚餐</SelectItem>
                <SelectItem value="snack">加餐</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="intakeAmount && food" class="p-3 bg-gray-50 rounded-lg">
            <p class="text-sm font-medium mb-2">营养摄入预览</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>热量: <span class="font-medium text-red-500">{{ calculateNutrition('calories') }}kcal</span></div>
              <div>蛋白质: <span class="font-medium">{{ calculateNutrition('protein') }}g</span></div>
              <div>脂肪: <span class="font-medium">{{ calculateNutrition('fat') }}g</span></div>
              <div>碳水: <span class="font-medium">{{ calculateNutrition('carbs') }}g</span></div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddIntakeDialog = false">取消</Button>
          <Button @click="handleAddIntake">确认添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Star, Flame, AlertCircle, TrendingUp, Info, Plus, Gem, Sparkles,
  Wheat, Carrot, Apple, Drumstick, Milk, Droplets, UtensilsCrossed, Fish, Egg, Cookie
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { useFoodStore } from '@/stores/food'
import { foodApi, type FoodDetail } from '@/api/food'

const route = useRoute()
const router = useRouter()
const foodStore = useFoodStore()
const { toast } = useToast()

// 状态
const food = ref<FoodDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showAddIntakeDialog = ref(false)
const intakeAmount = ref<number>(100)
const intakeMeal = ref<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')

// 计算属性
const isFavorited = computed(() => food.value ? foodStore.isFavorite(food.value.id) : false)

const categoryIcon = computed(() => {
  if (!food.value) return UtensilsCrossed
  const category = food.value.category || ''
  if (category.includes('谷') || category.includes('薯')) return Wheat
  if (category.includes('蔬菜')) return Carrot
  if (category.includes('水果')) return Apple
  if (category.includes('畜') || category.includes('禽')) return Drumstick
  if (category.includes('鱼') || category.includes('虾') || category.includes('蟹') || category.includes('贝')) return Fish
  if (category.includes('蛋')) return Egg
  if (category.includes('乳') || category.includes('奶')) return Milk
  if (category.includes('豆')) return Cookie
  if (category.includes('油') || category.includes('调')) return Droplets
  return UtensilsCrossed
})

const giBadgeClass = computed(() => {
  const gi = food.value?.gi_value
  if (!gi) return 'bg-gray-500 hover:bg-gray-500 text-white'
  if (gi <= 55) return 'bg-green-500 hover:bg-green-500 text-white'
  if (gi <= 70) return 'bg-yellow-500 hover:bg-yellow-500 text-white'
  return 'bg-red-500 hover:bg-red-500 text-white'
})

const giLabel = computed(() => {
  const gi = food.value?.gi_value
  if (!gi) return ''
  if (gi <= 55) return '低GI'
  if (gi <= 70) return '中GI'
  return '高GI'
})

const hasMinerals = computed(() => {
  if (!food.value) return false
  return !!(food.value.calcium || food.value.iron || food.value.zinc || 
            food.value.selenium || food.value.potassium || food.value.phosphorus ||
            food.value.sodium || food.value.magnesium || food.value.copper || food.value.manganese)
})

const hasVitamins = computed(() => {
  if (!food.value) return false
  return !!(food.value.vitamin_a || food.value.vitamin_c || food.value.vitamin_e_total ||
            food.value.thiamin || food.value.riboflavin || food.value.niacin ||
            food.value.carotene || food.value.retinol)
})

// 方法
function getMacroPercent(value: number, max: number): number {
  return Math.min((value / max) * 100, 100)
}

function calculateNutrition(type: 'calories' | 'protein' | 'fat' | 'carbs'): string {
  if (!food.value || !intakeAmount.value) return '0'
  const ratio = intakeAmount.value / 100
  let value = 0
  switch (type) {
    case 'calories': value = (food.value.energy_kcal || 0) * ratio; break
    case 'protein': value = (food.value.protein || 0) * ratio; break
    case 'fat': value = (food.value.fat || 0) * ratio; break
    case 'carbs': value = (food.value.carbohydrate || 0) * ratio; break
  }
  return value.toFixed(1)
}

onMounted(() => {
  loadDetail()
})

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id || isNaN(id)) {
    error.value = '无效的食物ID'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await foodApi.getDetail(id)
    if (response.code === 200 && response.data) {
      food.value = response.data
    } else {
      error.value = response.msg || '食物不存在'
    }
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function handleToggleFavorite() {
  if (!food.value) return
  foodStore.toggleFavorite(food.value.id)
  toast({ description: isFavorited.value ? '已取消收藏' : '已添加到收藏' })
}

async function handleAddIntake() {
  if (!food.value || !intakeAmount.value) {
    toast({ description: '请输入摄入量', variant: 'destructive' })
    return
  }

  const ratio = intakeAmount.value / 100
  const now = new Date()
  
  const response = await foodApi.addIntake({
    foodId: food.value.id,
    foodName: food.value.name,
    amount: intakeAmount.value,
    meal: intakeMeal.value,
    date: now.toISOString().split('T')[0],
    time: now.toTimeString().split(' ')[0].substring(0, 5),
    calories: Math.round((food.value.energy_kcal || 0) * ratio),
    protein: Math.round((food.value.protein || 0) * ratio * 10) / 10,
    fat: Math.round((food.value.fat || 0) * ratio * 10) / 10,
    carbs: Math.round((food.value.carbohydrate || 0) * ratio * 10) / 10,
  })

  if (response.code === 200) {
    toast({ description: '已添加到饮食记录' })
    showAddIntakeDialog.value = false
    intakeAmount.value = 100
  } else {
    toast({ description: response.msg || '添加失败', variant: 'destructive' })
  }
}
</script>
