<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 h-14">
        <Button variant="ghost" size="icon" @click="handleBack">
          <ArrowLeft class="h-5 w-5" />
        </Button>
        <h1 class="text-lg font-semibold">编辑健身档案</h1>
        <Badge variant="outline">{{ completionRate }}%</Badge>
      </div>
      <p class="px-4 pb-3 text-xs text-gray-500 text-center">
        更新您的个人信息，让智能健身顾问为您制定更精准的训练计划
      </p>
    </header>

    <!-- 步骤指示器 -->
    <div class="px-4 py-3 bg-white dark:bg-gray-800 border-b">
      <div class="flex justify-between items-center">
        <div v-for="(step, index) in steps" :key="index" 
             class="flex-1 flex flex-col items-center"
             :class="{ 'opacity-50': index > currentStep }">
          <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
               :class="index <= currentStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'">
            {{ index + 1 }}
          </div>
          <span class="text-xs mt-1 text-center">{{ step }}</span>
        </div>
      </div>
    </div>

    <!-- 表单内容 -->
    <div v-if="userStore.userProfile" class="p-4">
      <!-- 步骤1: 基础信息 -->
      <div v-show="currentStep === 0" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">基础信息</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="nickname">昵称</Label>
              <Input id="nickname" v-model="formData.nickname" placeholder="请输入昵称" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="age">年龄</Label>
                <Input id="age" type="number" v-model.number="formData.age" placeholder="岁" />
              </div>
              <div class="space-y-2">
                <Label>性别</Label>
                <Select v-model="formData.gender">
                  <SelectTrigger>
                    <SelectValue placeholder="选择性别" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男</SelectItem>
                    <SelectItem value="female">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="height">身高 (cm)</Label>
                <Input id="height" type="number" v-model.number="formData.height" placeholder="cm" />
              </div>
              <div class="space-y-2">
                <Label for="weight">体重 (kg)</Label>
                <Input id="weight" type="number" v-model.number="formData.weight" placeholder="kg" />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="bodyFat">体脂率 (%) - 可选</Label>
              <Input id="bodyFat" type="number" v-model.number="formData.body_fat_percentage" placeholder="%" />
            </div>
            <div class="space-y-2">
              <Label>健身水平</Label>
              <Select v-model="formData.fitness_level">
                <SelectTrigger>
                  <SelectValue placeholder="选择健身水平" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in FITNESS_LEVEL_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }} - {{ option.description }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 步骤2: 健身目标 -->
      <div v-show="currentStep === 1" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">健身目标</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>主要目标（单选）</Label>
              <p class="text-xs text-muted-foreground mb-2">主要目标决定训练参数（组数、次数、强度、休息时间）</p>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="goal in FITNESS_GOALS_OPTIONS" :key="goal"
                       :variant="formData.primary_goal === goal ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="formData.primary_goal = goal">
                  {{ goal }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <Label>次要目标（可多选）</Label>
              <p class="text-xs text-muted-foreground mb-2">次要目标用于动作选择和计划微调</p>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="goal in FITNESS_GOALS_OPTIONS" :key="goal"
                       :variant="formData.secondary_goals.includes(goal) ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleGoal('secondary', goal)">
                  {{ goal }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="targetWeight">目标体重 (kg) - 可选</Label>
              <Input id="targetWeight" type="number" v-model.number="formData.target_weight" placeholder="kg" />
            </div>
            <div class="space-y-2">
              <Label>训练分化</Label>
              <Select v-model="formData.training_split">
                <SelectTrigger>
                  <SelectValue placeholder="选择训练分化" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="option in TRAINING_SPLIT_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="text-base">训练偏好</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>训练场地</Label>
              <Select v-model="formData.training_location">
                <SelectTrigger>
                  <SelectValue placeholder="选择训练场地" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="健身房">健身房</SelectItem>
                  <SelectItem value="家里">家里</SelectItem>
                  <SelectItem value="户外">户外</SelectItem>
                  <SelectItem value="混合">混合</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>训练强度</Label>
              <Select v-model="formData.training_intensity">
                <SelectTrigger>
                  <SelectValue placeholder="选择训练强度" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低强度</SelectItem>
                  <SelectItem value="moderate">中等强度</SelectItem>
                  <SelectItem value="high">高强度</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>可用器械（可多选）</Label>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="equipment in EQUIPMENT_OPTIONS" :key="equipment"
                       :variant="formData.available_equipment.includes(equipment) ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleEquipment(equipment)">
                  {{ equipment }}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 步骤3: 力量数据 -->
      <div v-show="currentStep === 2" class="space-y-4">
        <StrengthDataForm v-model="formData.strength_data" />
      </div>

      <!-- 步骤4: 健康状况 -->
      <div v-show="currentStep === 3" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">健康状况</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>慢性疾病（可多选）</Label>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="disease in CHRONIC_DISEASE_OPTIONS" :key="disease"
                       :variant="formData.chronic_diseases.includes(disease) ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleHealth('chronic_diseases', disease)">
                  {{ disease }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <Label>受伤历史（可多选）</Label>
              <!-- 无伤病选项 -->
              <div class="mb-2">
                <Badge 
                       :variant="formData.injury_history.includes('无') ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleHealth('injury_history', '无')">
                  无
                </Badge>
              </div>
              <!-- 分组伤病选项 -->
              <div class="space-y-3">
                <div v-for="(injuries, category) in INJURY_HISTORY_GROUPED_OPTIONS" :key="category" class="space-y-1">
                  <p class="text-sm font-medium text-muted-foreground">{{ category }}</p>
                  <div class="flex flex-wrap gap-2">
                    <Badge v-for="injury in injuries" :key="injury.value"
                           :variant="formData.injury_history.includes(injury.value) ? 'default' : 'outline'"
                           class="cursor-pointer"
                           :title="injury.description"
                           @click="toggleHealth('injury_history', injury.value)">
                      {{ injury.value }}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <Label>用药情况（可多选）</Label>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="med in MEDICATION_OPTIONS" :key="med"
                       :variant="formData.medications.includes(med) ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleHealth('medications', med)">
                  {{ med }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <Label for="healthNotes">其他备注</Label>
              <Textarea id="healthNotes" v-model="formData.other_notes" placeholder="其他健康相关信息..." rows="3" />
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- 步骤5: 营养档案 -->
      <div v-show="currentStep === 4" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="text-base">营养档案</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>人群类型</Label>
              <Select v-model="formData.population_type">
                <SelectTrigger>
                  <SelectValue placeholder="选择人群类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="type in POPULATION_TYPE_OPTIONS" :key="type" :value="type">
                    {{ type }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>饮食偏好（可多选）</Label>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="pref in DIETARY_PREFERENCE_OPTIONS" :key="pref"
                       :variant="formData.dietary_preferences.includes(pref) ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleNutrition('dietary_preferences', pref)">
                  {{ pref }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <Label>过敏食物（可多选）</Label>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="allergy in ALLERGY_OPTIONS" :key="allergy"
                       :variant="formData.allergies.includes(allergy) ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleNutrition('allergies', allergy)">
                  {{ allergy }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <Label>补剂使用（可多选）</Label>
              <div class="flex flex-wrap gap-2">
                <Badge v-for="supp in SUPPLEMENT_OPTIONS" :key="supp"
                       :variant="formData.supplements.includes(supp) ? 'default' : 'outline'"
                       class="cursor-pointer"
                       @click="toggleNutrition('supplements', supp)">
                  {{ supp }}
                </Badge>
              </div>
            </div>
            <div class="space-y-2">
              <Label>预算限制</Label>
              <Select v-model="formData.budget">
                <SelectTrigger>
                  <SelectValue placeholder="选择预算级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="budget in BUDGET_OPTIONS" :key="budget.value" :value="budget.value">
                    {{ budget.label }} - {{ budget.description }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <!-- 休息模式 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">休息模式</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>选择适合您的训练与休息节奏</Label>
              <div class="space-y-2">
                <div v-for="option in REST_PATTERN_OPTIONS" :key="option.value"
                     class="p-3 rounded-lg border cursor-pointer transition-colors"
                     :class="formData.rest_pattern === option.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'"
                     @click="formData.rest_pattern = option.value">
                  <div class="flex items-center justify-between">
                    <span class="font-medium">{{ option.label }}</span>
                    <Badge v-if="option.recommendedFor.includes(formData.fitness_level)" variant="secondary" class="text-xs">推荐</Badge>
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">{{ option.description }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-else class="flex items-center justify-center min-h-[50vh]">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
      <span class="ml-2">正在加载档案...</span>
    </div>

    <!-- 底部操作按钮 -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t space-y-2">
      <div class="flex gap-2">
        <Button v-if="currentStep > 0" variant="outline" class="flex-1" @click="handlePrevStep">
          上一步
        </Button>
        <Button v-if="currentStep < steps.length - 1" class="flex-1" @click="handleNextStep">
          下一步
        </Button>
        <Button v-if="currentStep === steps.length - 1" class="flex-1" @click="handleSave">
          <Save class="h-4 w-4 mr-2" />
          保存
        </Button>
      </div>
      <Button v-if="currentStep === steps.length - 1" variant="outline" class="w-full" @click="handleUpload" :disabled="userStore.loading">
        <Cloud class="h-4 w-4 mr-2" />
        上传到服务器
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Cloud, Loader2 } from 'lucide-vue-next'
import StrengthDataForm from '@/components/user-profile/StrengthDataForm.vue'
import { 
  FITNESS_LEVEL_OPTIONS, 
  TRAINING_SPLIT_OPTIONS, 
  FITNESS_GOALS_OPTIONS, 
  EQUIPMENT_OPTIONS,
  CHRONIC_DISEASE_OPTIONS,
  INJURY_HISTORY_GROUPED_OPTIONS,
  MEDICATION_OPTIONS,
  REST_PATTERN_OPTIONS,
  POPULATION_TYPE_OPTIONS,
  DIETARY_PREFERENCE_OPTIONS,
  ALLERGY_OPTIONS,
  SUPPLEMENT_OPTIONS,
  BUDGET_OPTIONS,
} from '@/types/user-profile'
import type { Gender, FitnessLevel, TrainingSplit, TrainingLocation, TrainingIntensity, StrengthData, RestPattern, BudgetLevel } from '@/types/user-profile'

const router = useRouter()
const userStore = useUserStore()
const { toast } = useToast()

const steps = ['基础信息', '健身目标', '力量数据', '健康状况', '营养档案']
const currentStep = ref(0)

// 表单数据
const formData = reactive({
  // 基础信息
  nickname: '',
  age: null as number | null,
  gender: 'male' as Gender,
  height: null as number | null,
  weight: null as number | null,
  body_fat_percentage: null as number | null,
  fitness_level: 'beginner' as FitnessLevel,
  // 健身目标
  primary_goal: '' as string,  // 主要目标（单选）
  secondary_goals: [] as string[],  // 次要目标（多选）
  target_weight: null as number | null,
  training_split: null as TrainingSplit | null,
  // 训练偏好
  training_location: null as TrainingLocation | null,
  training_intensity: 'moderate' as TrainingIntensity,
  available_equipment: [] as string[],
  // 健康状况
  chronic_diseases: [] as string[],
  injury_history: [] as string[],
  medications: [] as string[],
  other_notes: '',
  // 力量数据
  strength_data: {
    bench_press: { one_rm: undefined, three_rm: undefined },
    squat: { one_rm: undefined, three_rm: undefined },
    deadlift: { one_rm: undefined, three_rm: undefined },
    overhead_press: { one_rm: undefined, three_rm: undefined },
    pull_up: { one_rm: undefined, three_rm: undefined },
    dip: { one_rm: undefined, three_rm: undefined },
  } as StrengthData,
  // 休息模式
  rest_pattern: null as RestPattern | null,
  // 营养档案
  population_type: null as string | null,
  dietary_preferences: [] as string[],
  allergies: [] as string[],
  supplements: [] as string[],
  budget: null as BudgetLevel | null,
})

const completionRate = computed(() => userStore.completionRate)

// 初始化表单数据
function initFormData() {
  if (!userStore.userProfile) return
  
  const profile = userStore.userProfile
  formData.nickname = profile.basic_info.nickname || ''
  formData.age = profile.basic_info.age
  formData.gender = profile.basic_info.gender
  formData.height = profile.basic_info.height
  formData.weight = profile.basic_info.weight
  formData.body_fat_percentage = profile.basic_info.body_fat_percentage || null
  formData.fitness_level = profile.basic_info.fitness_level
  
  formData.primary_goal = profile.fitness_goals.primary_goal || ''
  formData.secondary_goals = [...(profile.fitness_goals.secondary_goals || [])]
  formData.target_weight = profile.fitness_goals.target_weight || null
  formData.training_split = profile.fitness_goals.training_split
  
  formData.training_location = profile.training_preferences.training_location
  formData.training_intensity = profile.training_preferences.training_intensity || 'moderate'
  formData.available_equipment = [...(profile.training_preferences.available_equipment || [])]
  
  formData.chronic_diseases = [...(profile.health_status.chronic_diseases || [])]
  formData.injury_history = [...(profile.health_status.injury_history || [])]
  formData.medications = [...(profile.health_status.medications || [])]
  formData.other_notes = profile.health_status.other_notes || ''
  
  // 力量数据
  if (profile.strength_data) {
    formData.strength_data = {
      bench_press: { one_rm: profile.strength_data.bench_press?.one_rm, three_rm: profile.strength_data.bench_press?.three_rm },
      squat: { one_rm: profile.strength_data.squat?.one_rm, three_rm: profile.strength_data.squat?.three_rm },
      deadlift: { one_rm: profile.strength_data.deadlift?.one_rm, three_rm: profile.strength_data.deadlift?.three_rm },
      overhead_press: { one_rm: profile.strength_data.overhead_press?.one_rm, three_rm: profile.strength_data.overhead_press?.three_rm },
      pull_up: { one_rm: profile.strength_data.pull_up?.one_rm, three_rm: profile.strength_data.pull_up?.three_rm },
      dip: { one_rm: profile.strength_data.dip?.one_rm, three_rm: profile.strength_data.dip?.three_rm },
    }
  }
  
  // 休息模式
  formData.rest_pattern = profile.preferred_rest_pattern || null
  
  // 营养档案
  if (profile.nutrition_profile?.user_settings) {
    formData.population_type = profile.nutrition_profile.user_settings.population_type || null
    formData.dietary_preferences = [...(profile.nutrition_profile.user_settings.dietary_preferences || [])]
    formData.allergies = [...(profile.nutrition_profile.user_settings.allergies || [])]
    formData.supplements = [...(profile.nutrition_profile.user_settings.supplements || [])]
    formData.budget = profile.nutrition_profile.user_settings.budget || null
  }
}

// 切换目标选择（仅用于次要目标）
function toggleGoal(type: 'secondary', goal: string) {
  const arr = formData.secondary_goals
  const index = arr.indexOf(goal)
  if (index === -1) {
    arr.push(goal)
  } else {
    arr.splice(index, 1)
  }
}

// 切换器械选择
function toggleEquipment(equipment: string) {
  const index = formData.available_equipment.indexOf(equipment)
  if (index === -1) {
    formData.available_equipment.push(equipment)
  } else {
    formData.available_equipment.splice(index, 1)
  }
}

// 切换健康状况选择
function toggleHealth(field: 'chronic_diseases' | 'injury_history' | 'medications', value: string) {
  const arr = formData[field]
  const index = arr.indexOf(value)
  if (index === -1) {
    // 如果选择"无"，清空其他选项
    if (value === '无') {
      arr.length = 0
    }
    arr.push(value)
    // 如果选择了其他选项，移除"无"
    if (value !== '无') {
      const noIndex = arr.indexOf('无')
      if (noIndex !== -1) arr.splice(noIndex, 1)
    }
  } else {
    arr.splice(index, 1)
  }
}

// 切换营养档案选择
function toggleNutrition(field: 'dietary_preferences' | 'allergies' | 'supplements', value: string) {
  const arr = formData[field]
  const index = arr.indexOf(value)
  if (index === -1) {
    if (value === '无' || value === '无特殊偏好') {
      arr.length = 0
    }
    arr.push(value)
    if (value !== '无' && value !== '无特殊偏好') {
      const noIndex = arr.findIndex(v => v === '无' || v === '无特殊偏好')
      if (noIndex !== -1) arr.splice(noIndex, 1)
    }
  } else {
    arr.splice(index, 1)
  }
}

// 保存表单数据到Store
function saveFormToStore() {
  if (!userStore.userProfile) return
  
  userStore.updateBasicInfo({
    nickname: formData.nickname,
    age: formData.age as number,
    gender: formData.gender,
    height: formData.height as number,
    weight: formData.weight as number,
    body_fat_percentage: formData.body_fat_percentage || undefined,
    fitness_level: formData.fitness_level,
  })
  
  userStore.updateFitnessGoals({
    primary_goal: formData.primary_goal,
    secondary_goals: formData.secondary_goals,
    target_weight: formData.target_weight || undefined,
    goal_priority: {},
    training_split: formData.training_split,
  })
  
  userStore.updateTrainingPreferences({
    training_split: formData.training_split,
    available_equipment: formData.available_equipment,
    training_location: formData.training_location,
    training_intensity: formData.training_intensity,
  })
  
  userStore.updateHealthStatus({
    chronic_diseases: formData.chronic_diseases,
    injury_history: formData.injury_history,
    medications: formData.medications,
    other_notes: formData.other_notes || undefined,
  })
  
  // 保存力量数据
  userStore.updateStrengthData(formData.strength_data)
  
  // 保存休息模式
  userStore.updateRestPattern(formData.rest_pattern)
  
  // 保存营养档案
  userStore.updateNutritionProfile({
    user_settings: {
      population_type: formData.population_type || '',
      dietary_preferences: formData.dietary_preferences,
      allergies: formData.allergies,
      supplements: formData.supplements,
      budget: formData.budget || 'moderate',
    },
  })
}

async function handleBack() {
  router.back()
}

function handlePrevStep() {
  if (currentStep.value > 0) {
    saveFormToStore()
    currentStep.value--
  }
}

function handleNextStep() {
  saveFormToStore()
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

async function handleSave() {
  saveFormToStore()
  const result = await userStore.saveToLocal()
  toast({
    title: result.success ? '保存成功' : '保存失败',
    description: result.message,
    variant: result.success ? 'default' : 'destructive',
  })
  if (result.success) {
    router.back()
  }
}

async function handleUpload() {
  saveFormToStore()
  const result = await userStore.uploadToServer()
  toast({
    title: result.success ? '上传成功' : '上传失败',
    description: result.message,
    variant: result.success ? 'default' : 'destructive',
  })
  if (result.success) {
    router.back()
  }
}

onMounted(async () => {
  await userStore.init()
  initFormData()
})
</script>
