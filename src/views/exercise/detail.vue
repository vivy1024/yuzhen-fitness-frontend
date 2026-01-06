<template>
  <div class="exercise-detail min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b">
      <div class="flex items-center justify-between px-4 h-14">
        <Button variant="ghost" size="icon" @click="router.back()">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <h1 class="text-lg font-semibold line-clamp-1 max-w-[200px]">
          {{ exercise?.name_zh || '动作详情' }}
        </h1>
        <Button variant="ghost" size="icon" @click="handleToggleFavorite">
          <Star :class="['w-5 h-5', isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400']" />
        </Button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="p-4 space-y-4">
      <Skeleton class="w-full h-64 rounded-xl" />
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
    <main v-else-if="exercise" class="pb-24">
      <!-- 性别切换 -->
      <div class="p-4 bg-white border-b">
        <GenderSwitch v-model="currentGender" variant="chip" />
      </div>

      <!-- 安全警告 -->
      <div v-if="exercise.warnings?.length" class="mx-4 mt-4">
        <Alert variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertTitle>安全提醒</AlertTitle>
          <AlertDescription>
            <ul class="list-disc list-inside space-y-1 mt-2">
              <li v-for="(warning, index) in exercise.warnings" :key="index">{{ warning }}</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      <!-- ========== 核心双栏布局：媒体+步骤 | 人体图+信息 ========== -->
      <div class="mx-4 mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 左栏：动作媒体 + 正确步骤 -->
        <div class="space-y-4">
          <!-- 动作媒体展示 -->
          <Card>
            <div class="relative w-full pb-[75%] bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-lg overflow-hidden">
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <Flame class="w-16 h-16 text-white mb-3" />
                <h2 class="text-white text-lg font-bold text-center px-4">{{ exercise.name_zh }}</h2>
              </div>
              <!-- 难度标签 -->
              <Badge :class="difficultyBadgeClass" class="absolute top-3 right-3 text-sm font-semibold">
                {{ getDifficultyText }}
              </Badge>
            </div>
          </Card>

          <!-- 动作要领 -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="flex items-center gap-2 text-base">
                <BookOpen class="w-5 h-5 text-primary" />
                动作要领
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol v-if="correctSteps.length" class="space-y-2">
                <li v-for="(step, index) in correctSteps" :key="index" class="flex gap-2">
                  <span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                    {{ index + 1 }}
                  </span>
                  <span class="text-sm text-gray-700">{{ step }}</span>
                </li>
              </ol>
              <p v-else class="text-sm text-gray-500">暂无动作要领</p>
            </CardContent>
          </Card>
        </div>

        <!-- 右栏：人体图 + 动作信息 -->
        <div class="space-y-4">
          <!-- 人体图卡片 -->
          <Card v-if="hasBodyMapImages">
            <CardHeader class="pb-2">
              <CardTitle class="flex items-center gap-2 text-base">
                <User class="w-5 h-5 text-primary" />
                肌肉激活图
              </CardTitle>
            </CardHeader>
            <CardContent>
              <!-- 人体图：正面+背面并排 -->
              <div class="flex justify-center gap-2">
                <div v-if="currentBodyMapFront" class="flex-1 max-w-[140px]">
                  <p class="text-xs text-gray-500 text-center mb-1">正面</p>
                  <LazyImage 
                    :src="currentBodyMapFront" 
                    alt="正面肌肉图" 
                    class="w-full h-auto rounded border"
                    :show-loading="true"
                  />
                </div>
                <div v-if="currentBodyMapBack" class="flex-1 max-w-[140px]">
                  <p class="text-xs text-gray-500 text-center mb-1">背面</p>
                  <LazyImage 
                    :src="currentBodyMapBack" 
                    alt="背面肌肉图" 
                    class="w-full h-auto rounded border"
                    :show-loading="true"
                  />
                </div>
              </div>
              <!-- 肌肉图例 -->
              <div class="mt-3 flex flex-wrap justify-center gap-3 text-xs">
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full bg-red-500"></span>
                  <span class="text-gray-600">主要肌群</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full bg-orange-400"></span>
                  <span class="text-gray-600">次要肌群</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- 动作信息 -->
          <Card>
            <CardHeader class="pb-2">
              <CardTitle class="flex items-center gap-2 text-base">
                <Info class="w-5 h-5 text-primary" />
                动作信息
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-2">
              <div class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">目标肌群</span>
                <span class="font-medium">{{ exercise.primary_muscle_zh || exercise.primary_muscle }}</span>
              </div>
              <div v-if="musclesPrimary.length" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">主要肌肉</span>
                <span class="font-medium text-right max-w-[60%]">{{ musclesPrimary.join('、') }}</span>
              </div>
              <div v-if="musclesSecondary.length" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">次要肌肉</span>
                <span class="font-medium text-right max-w-[60%]">{{ musclesSecondary.join('、') }}</span>
              </div>
              <div v-if="allMuscles.length > 1" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">涉及肌群</span>
                <span class="font-medium text-right max-w-[60%]">{{ allMuscles.join('、') }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">器械</span>
                <span class="font-medium">{{ equipmentText }}</span>
              </div>
              <div class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">难度</span>
                <span class="font-medium">{{ getDifficultyText }}</span>
              </div>
              <div v-if="mechanicText" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">运动机制</span>
                <span class="font-medium">{{ mechanicText }}</span>
              </div>
              <div v-if="forceText" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">力量类型</span>
                <span class="font-medium">{{ forceText }}</span>
              </div>
              <div v-if="gripsText" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">握法</span>
                <span class="font-medium">{{ gripsText }}</span>
              </div>
              <div v-if="kineticChainText" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">运动链</span>
                <span class="font-medium">{{ kineticChainText }}</span>
              </div>
              <div v-if="exercise.joints?.length" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">涉及关节</span>
                <span class="font-medium text-right max-w-[60%]">{{ exercise.joints.join('、') }}</span>
              </div>
              <div v-if="exercise.categories?.length" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">分类</span>
                <span class="font-medium text-right max-w-[60%]">{{ exercise.categories.join('、') }}</span>
              </div>
              <div v-if="exercise.variation_of" class="flex justify-between py-1.5 border-b text-sm">
                <span class="text-gray-500">变体来源</span>
                <span class="font-medium">动作 #{{ exercise.variation_of }}</span>
              </div>
              <div v-if="exercise.variations?.length" class="flex justify-between py-1.5 text-sm">
                <span class="text-gray-500">变体数量</span>
                <span class="font-medium">{{ exercise.variations.length }} 个</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- ========== 下方信息区域 ========== -->
      
      <!-- 训练参数 -->
      <Card class="mx-4 mt-4">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <Target class="w-5 h-5 text-primary" />
            训练参数建议
          </CardTitle>
        </CardHeader>
        <CardContent class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="text-center p-2.5 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-0.5">组数</p>
            <p class="text-base font-semibold">{{ exercise.set_range || '3-4' }}组</p>
          </div>
          <div class="text-center p-2.5 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-0.5">次数</p>
            <p class="text-base font-semibold">{{ exercise.rep_range || '8-12' }}次</p>
          </div>
          <div class="text-center p-2.5 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-0.5">休息</p>
            <p class="text-base font-semibold">{{ exercise.rest_period || '60-90秒' }}</p>
          </div>
          <div class="text-center p-2.5 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 mb-0.5">强度</p>
            <p class="text-base font-semibold">{{ exercise.intensity_percentage || '70-80%' }}</p>
          </div>
        </CardContent>
      </Card>

      <!-- 训练提示 -->
      <Card v-if="exercise.tips?.length" class="mx-4 mt-4">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <Lightbulb class="w-5 h-5 text-yellow-500" />
            训练提示
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="space-y-1.5">
            <li v-for="(tip, index) in exercise.tips" :key="index" class="flex gap-2 text-sm text-gray-700">
              <CheckCircle class="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              {{ tip }}
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- 进阶/退阶选项 -->
      <Card v-if="exercise.progression_options?.length || exercise.regression_options?.length" class="mx-4 mt-4">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <TrendingUp class="w-5 h-5 text-primary" />
            进阶/退阶选项
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-if="exercise.progression_options?.length">
            <h4 class="text-sm font-medium text-green-600 mb-1.5">进阶选项</h4>
            <ul class="space-y-1">
              <li v-for="(option, index) in exercise.progression_options" :key="index" class="text-sm text-gray-700">
                • {{ typeof option === 'string' ? option : option.name_zh || option.name }}
              </li>
            </ul>
          </div>
          <div v-if="exercise.regression_options?.length">
            <h4 class="text-sm font-medium text-orange-600 mb-1.5">退阶选项</h4>
            <ul class="space-y-1">
              <li v-for="(option, index) in exercise.regression_options" :key="index" class="text-sm text-gray-700">
                • {{ typeof option === 'string' ? option : option.name_zh || option.name }}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <!-- 数据来源 -->
      <div class="mx-4 mt-4 mb-4 text-center text-xs text-gray-500">
        <p v-if="exercise.data_source" class="mb-1">数据来源: {{ exercise.data_source }}</p>
        <p>
          动作数据参考：
          <a 
            href="https://musclewiki.com" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-primary hover:underline"
          >
            MuscleWiki (musclewiki.com)
          </a>
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft, Star, Flame, AlertCircle, BookOpen, Info, Target,
  Lightbulb, CheckCircle, TrendingUp, User
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/toast'
import { useExerciseStore } from '@/stores/exercise'
import GenderSwitch from '@/components/exercise/GenderSwitch.vue'
import LazyImage from '@/components/ui/lazy-image/LazyImage.vue'
import type { ExerciseDetail, Gender } from '@/types/exercise'

const router = useRouter()
const route = useRoute()
const exerciseStore = useExerciseStore()
const { toast } = useToast()

const exercise = ref<ExerciseDetail | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const currentGender = ref<Gender>('male')

const isFavorited = computed(() => {
  return exercise.value ? exerciseStore.isFavorite(exercise.value.id) : false
})

// ========== 人体图相关计算属性 ==========
const hasBodyMapImages = computed(() => {
  const local = exercise.value?.body_map_images_local
  const remote = exercise.value?.body_map_images
  if (!local && !remote) return false
  // 检查是否有任何有效图片
  const checkImages = (imgs: any) => {
    if (!imgs) return false
    return (imgs.male?.front || imgs.male?.back || imgs.female?.front || imgs.female?.back)
  }
  return checkImages(local) || checkImages(remote)
})

const currentBodyMapFront = computed(() => {
  const local = exercise.value?.body_map_images_local
  const remote = exercise.value?.body_map_images
  // 优先本地，其次远程
  if (currentGender.value === 'male') {
    return local?.male?.front || remote?.male?.front || null
  }
  return local?.female?.front || remote?.female?.front || null
})

const currentBodyMapBack = computed(() => {
  const local = exercise.value?.body_map_images_local
  const remote = exercise.value?.body_map_images
  if (currentGender.value === 'male') {
    return local?.male?.back || remote?.male?.back || null
  }
  return local?.female?.back || remote?.female?.back || null
})

// ========== 其他计算属性 ==========
const difficultyBadgeClass = computed(() => {
  const difficulty = getDifficultyText.value
  switch (difficulty) {
    case '零基础':
    case '新手':
    case '初学者':
    case '初级':
    case 'Beginner':
    case 'Novice':
      return 'bg-green-500 hover:bg-green-500 text-white'
    case '中级':
    case 'Intermediate':
      return 'bg-blue-500 hover:bg-blue-500 text-white'
    case '高级':
    case 'Advanced':
      return 'bg-red-500 hover:bg-red-500 text-white'
    default:
      return 'bg-gray-500 hover:bg-gray-500 text-white'
  }
})

const getDifficultyText = computed(() => {
  if (exercise.value?.difficulty_zh) return exercise.value.difficulty_zh
  const d = exercise.value?.difficulty
  if (!d) return '中级'
  if (typeof d === 'object' && d.name_zh) return d.name_zh
  const difficultyMap: Record<string, string> = {
    'Beginner': '初学者', 'Novice': '零基础', 'Intermediate': '中级', 'Advanced': '高级',
  }
  return difficultyMap[String(d)] || String(d)
})

const correctSteps = computed(() => {
  if (!exercise.value) return []
  if (exercise.value.correct_steps_zh?.length) return exercise.value.correct_steps_zh
  if (exercise.value.correct_steps?.length) {
    return exercise.value.correct_steps.map(s => typeof s === 'string' ? s : (s.text || s.text_en_us || ''))
  }
  return exercise.value.instructions || []
})

const allMuscles = computed(() => exercise.value?.all_muscles || [])
const musclesPrimary = computed(() => exercise.value?.muscles_primary || [])
const musclesSecondary = computed(() => exercise.value?.muscles_secondary || [])

const equipmentText = computed(() => {
  const e = exercise.value?.equipment
  if (!e) return '无'
  return exercise.value?.equipment_zh || (typeof e === 'string' ? e : '无')
})

const mechanicText = computed(() => {
  const m = exercise.value?.mechanic_type || exercise.value?.mechanic
  if (!m) return ''
  if (typeof m === 'object' && m.name_zh) return m.name_zh
  const map: Record<string, string> = { 'Compound': '复合动作', 'Isolation': '孤立动作' }
  return map[String(m)] || String(m)
})

const forceText = computed(() => {
  const f = exercise.value?.force_type || exercise.value?.force
  if (!f) return ''
  if (typeof f === 'object' && f.name_zh) return f.name_zh
  const map: Record<string, string> = { 'Push': '推', 'Pull': '拉', 'Static': '静态', 'N/A': '无' }
  return map[String(f)] || String(f)
})

const gripsText = computed(() => {
  const g = exercise.value?.grips
  if (!g || !g.length) return ''
  return g.map(grip => grip.name_zh || grip.name).join('、')
})

const kineticChainText = computed(() => {
  const k = exercise.value?.kinetic_chain_type
  if (!k) return ''
  const map: Record<string, string> = { 'open_chain': '开链运动', 'closed_chain': '闭链运动', 'mixed': '混合' }
  return map[k] || k
})

onMounted(() => { loadDetail() })

async function loadDetail() {
  const id = Number(route.params.id)
  if (!id) { error.value = '无效的动作ID'; loading.value = false; return }
  loading.value = true
  error.value = null
  try {
    await exerciseStore.fetchDetail(id)
    exercise.value = exerciseStore.currentExercise
    if (!exercise.value) error.value = '动作不存在'
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function handleToggleFavorite() {
  if (!exercise.value) return
  exerciseStore.toggleFavorite(exercise.value.id)
  toast({ description: isFavorited.value ? '已取消收藏' : '已添加到收藏' })
}
</script>
