<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 h-14">
        <Button variant="ghost" size="icon" @click="$router.back()">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="text-lg font-semibold">我的健身档案</h1>
        <Button variant="ghost" size="sm" @click="handleEdit">
          <Edit class="h-4 w-4 mr-1" />
          编辑
        </Button>
      </div>
    </header>

    <div v-if="userStore.userProfile" class="p-4 space-y-4">
      <!-- 档案完整度 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base">档案完整度</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-2">
            <Progress :model-value="userStore.completionRate" class="h-2" />
            <p class="text-sm text-gray-500 text-center">
              {{ userStore.completionRate < 100 ? '完善档案可获得更精准的训练计划' : '档案已完善，可以开始训练了！' }}
            </p>
          </div>
        </CardContent>
      </Card>

      <!-- 基础信息 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <User class="h-4 w-4" />
            基础信息
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <InfoRow label="昵称" :value="userStore.userProfile.basic_info.nickname || '-'" />
          <InfoRow label="年龄" :value="userStore.userProfile.basic_info.age ? userStore.userProfile.basic_info.age + '岁' : '-'" />
          <InfoRow label="性别" :value="translateGender(userStore.userProfile.basic_info.gender)" />
          <InfoRow label="身高" :value="userStore.userProfile.basic_info.height ? Number(userStore.userProfile.basic_info.height).toFixed(1) + 'cm' : '-'" />
          <InfoRow label="体重" :value="userStore.userProfile.basic_info.weight ? Number(userStore.userProfile.basic_info.weight).toFixed(1) + 'kg' : '-'" />
          <InfoRow label="体脂率" :value="userStore.userProfile.basic_info.body_fat_percentage ? Number(userStore.userProfile.basic_info.body_fat_percentage).toFixed(1) + '%' : '-'" />
          <InfoRow label="健身水平" :value="translateFitnessLevel(userStore.userProfile.basic_info.fitness_level)" />
        </CardContent>
      </Card>

      <!-- FFMI数据 -->
      <Card v-if="userStore.ffmiData" class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Dumbbell class="h-4 w-4" />
            FFMI分析
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">BMI指数</span>
            <Badge :variant="getBMIVariant(userStore.ffmiData.bmi)">
              {{ userStore.ffmiData.bmi }}
            </Badge>
          </div>
          <InfoRow label="瘦体重" :value="userStore.ffmiData.lean_body_mass + 'kg'" />
          <InfoRow label="FFMI指数" :value="String(userStore.ffmiData.normalized_ffmi)" />
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">肌肉水平</span>
            <Badge variant="default" class="bg-green-500">
              {{ userStore.ffmiData.assessment }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <!-- 健身目标 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Target class="h-4 w-4" />
            健身目标
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex justify-between items-start">
            <span class="text-sm text-gray-600 dark:text-gray-400">主要目标</span>
            <div class="flex flex-wrap gap-1 justify-end max-w-[60%]">
              <Badge v-for="(goal, index) in userStore.userProfile.fitness_goals.primary_goals" :key="index" variant="default">
                {{ goal }}
              </Badge>
              <Badge v-if="!userStore.userProfile.fitness_goals.primary_goals?.length" variant="secondary">未设置</Badge>
            </div>
          </div>
          <div class="flex justify-between items-start">
            <span class="text-sm text-gray-600 dark:text-gray-400">次要目标</span>
            <div class="flex flex-wrap gap-1 justify-end max-w-[60%]">
              <Badge v-for="(goal, index) in userStore.userProfile.fitness_goals.secondary_goals" :key="index" variant="outline">
                {{ goal }}
              </Badge>
              <Badge v-if="!userStore.userProfile.fitness_goals.secondary_goals?.length" variant="secondary">未设置</Badge>
            </div>
          </div>
          <InfoRow label="目标体重" :value="userStore.userProfile.fitness_goals.target_weight ? Number(userStore.userProfile.fitness_goals.target_weight) + 'kg' : '-'" />
          <InfoRow label="训练分化" :value="userStore.userProfile.fitness_goals.training_split || '-'" />
        </CardContent>
      </Card>

      <!-- 训练偏好 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Settings class="h-4 w-4" />
            训练偏好
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <InfoRow label="训练场地" :value="userStore.userProfile.training_preferences.training_location || '-'" />
          <div class="flex justify-between items-center">
            <span class="text-sm text-gray-600 dark:text-gray-400">训练强度</span>
            <Badge :variant="getIntensityVariant(userStore.userProfile.training_preferences.training_intensity)">
              {{ translateIntensity(userStore.userProfile.training_preferences.training_intensity) }}
            </Badge>
          </div>
          <div class="flex justify-between items-start">
            <span class="text-sm text-gray-600 dark:text-gray-400">可用器械</span>
            <div class="flex flex-wrap gap-1 justify-end max-w-[60%]">
              <Badge v-for="(equipment, index) in userStore.userProfile.training_preferences.available_equipment" :key="index" variant="outline">
                {{ equipment }}
              </Badge>
              <Badge v-if="!userStore.userProfile.training_preferences.available_equipment?.length" variant="secondary">未设置</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 健康状况 -->
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-base flex items-center gap-2">
            <Heart class="h-4 w-4" />
            健康状况
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div class="flex justify-between items-start">
            <span class="text-sm text-gray-600 dark:text-gray-400">慢性疾病</span>
            <div class="flex flex-wrap gap-1 justify-end max-w-[60%]">
              <Badge v-if="userStore.userProfile.health_status.chronic_diseases?.length" 
                     v-for="(disease, index) in userStore.userProfile.health_status.chronic_diseases" 
                     :key="index" 
                     variant="destructive">
                {{ disease }}
              </Badge>
              <Badge v-else variant="default" class="bg-green-500">无</Badge>
            </div>
          </div>
          <div class="flex justify-between items-start">
            <span class="text-sm text-gray-600 dark:text-gray-400">受伤历史</span>
            <div class="flex flex-wrap gap-1 justify-end max-w-[60%]">
              <Badge v-if="userStore.userProfile.health_status.injury_history?.length" 
                     v-for="(injury, index) in userStore.userProfile.health_status.injury_history" 
                     :key="index" 
                     variant="outline" 
                     class="border-yellow-500 text-yellow-600">
                {{ injury }}
              </Badge>
              <Badge v-else variant="default" class="bg-green-500">无</Badge>
            </div>
          </div>
          <div class="flex justify-between items-start">
            <span class="text-sm text-gray-600 dark:text-gray-400">用药情况</span>
            <div class="flex flex-wrap gap-1 justify-end max-w-[60%]">
              <Badge v-if="userStore.userProfile.health_status.medications?.length" 
                     v-for="(med, index) in userStore.userProfile.health_status.medications" 
                     :key="index" 
                     variant="secondary">
                {{ med }}
              </Badge>
              <Badge v-else variant="default" class="bg-green-500">无</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 操作按钮 -->
      <div class="space-y-3 pt-4">
        <Button class="w-full" @click="handleEdit">
          <Edit class="h-4 w-4 mr-2" />
          编辑档案
        </Button>
        <Button variant="outline" class="w-full" @click="handleSync" :disabled="isSyncing">
          <RefreshCw class="h-4 w-4 mr-2" :class="{ 'animate-spin': isSyncing }" />
          同步到服务器
        </Button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <User class="h-16 w-16 text-gray-300 mb-4" />
      <p class="text-gray-500 mb-4">暂无档案数据</p>
      <Button @click="handleEdit">创建档案</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Edit, User, Dumbbell, Target, Settings, Heart, RefreshCw } from 'lucide-vue-next'
import type { FitnessLevel, Gender, TrainingIntensity } from '@/types/user-profile'
import InfoRow from '@/components/user/InfoRow.vue'

const router = useRouter()
const userStore = useUserStore()
const { toast } = useToast()

// 独立的同步状态，避免与页面加载状态混淆
const isSyncing = ref(false)

// 翻译函数
function translateGender(gender: Gender | null | undefined): string {
  if (!gender) return '-'
  return gender === 'male' ? '男' : '女'
}

function translateFitnessLevel(level: FitnessLevel | null | undefined): string {
  if (!level) return '-'
  const map: Record<FitnessLevel, string> = {
    beginner: '初学者',
    novice: '新手',
    intermediate: '中级',
    advanced: '高级',
  }
  return map[level] || level
}

function translateIntensity(intensity?: TrainingIntensity): string {
  if (!intensity) return '-'
  const map: Record<TrainingIntensity, string> = {
    low: '低强度',
    moderate: '中等强度',
    high: '高强度',
  }
  return map[intensity] || intensity
}

// 获取Badge变体
function getBMIVariant(bmi: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (bmi < 18.5) return 'outline'
  if (bmi < 24) return 'default'
  if (bmi < 28) return 'outline'
  return 'destructive'
}

function getIntensityVariant(intensity?: TrainingIntensity): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!intensity) return 'secondary'
  const map: Record<TrainingIntensity, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    low: 'secondary',
    moderate: 'default',
    high: 'destructive',
  }
  return map[intensity] || 'secondary'
}

function handleEdit() {
  router.push('/user-profile/edit')
}

async function handleSync() {
  isSyncing.value = true
  try {
    const result = await userStore.uploadToServer()
    toast({
      title: result.success ? '同步成功' : '同步失败',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    })
  } finally {
    isSyncing.value = false
  }
}

onMounted(async () => {
  await userStore.init()
})
</script>
