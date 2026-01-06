<template>
  <div class="exercise-library min-h-screen bg-gray-50">
    <!-- 导航栏 -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b" role="banner">
      <div class="flex items-center justify-between px-4 h-14">
        <Button 
          variant="ghost" 
          size="icon" 
          @click="router.back()"
          :aria-label="ariaLabels.navigation.back"
        >
          <ArrowLeft class="w-5 h-5" aria-hidden="true" />
        </Button>
        <h1 class="text-lg font-semibold">动作库</h1>
        <span class="text-sm text-gray-500" aria-live="polite">{{ exerciseStore.totalCount }} 动作</span>
      </div>
    </header>

    <!-- 主内容区 -->
    <main id="main-content" class="pb-24" role="main" tabindex="-1">
      <!-- 搜索框 -->
      <div class="p-4 bg-white border-b" role="search">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" aria-hidden="true" />
          <Input
            v-model="searchKeyword"
            placeholder="搜索动作名称、肌群、器械..."
            class="pl-10 h-10 rounded-full bg-gray-100 border-0"
            :aria-label="ariaLabels.navigation.search"
            @keyup.enter="handleSearch"
          />
          <Button
            v-if="searchKeyword"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            aria-label="清除搜索"
            @click="handleClearSearch"
          >
            <X class="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <!-- 肌群选择器 -->
      <MuscleSelector
        v-model="selectedMuscle"
        :muscle-groups="muscleGroups"
        :loading="loadingMuscleGroups"
        @clear="handleClearMuscle"
      />

      <!-- 高级筛选 -->
      <Collapsible v-model:open="filterOpen" class="mx-4 mb-4">
        <CollapsibleTrigger as-child>
          <Button 
            variant="outline" 
            class="w-full justify-between"
            :aria-label="ariaLabels.navigation.filter"
            :aria-expanded="filterOpen"
          >
            <div class="flex items-center gap-2">
              <Filter class="w-4 h-4" aria-hidden="true" />
              <span>高级筛选</span>
              <Badge v-if="activeFilterCount > 0" class="ml-1" aria-label="`已选择 ${activeFilterCount} 个筛选条件`">
                {{ activeFilterCount }}
              </Badge>
            </div>
            <ChevronDown :class="['w-4 h-4 transition-transform', filterOpen && 'rotate-180']" aria-hidden="true" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="mt-3 space-y-4 bg-white rounded-lg p-4 shadow-sm">
          <!-- 器械类型 -->
          <div>
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Dumbbell class="w-4 h-4" />
              器械类型
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in filterOptions.equipment" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`eq-${item.value}`"
                  :checked="currentFilters.equipment?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('equipment', item.value, checked)"
                />
                <label :for="`eq-${item.value}`" class="ml-2 text-sm">{{ item.label }}</label>
              </div>
            </div>
          </div>

          <!-- 难度等级 -->
          <div>
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp class="w-4 h-4" />
              难度等级
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in filterOptions.difficulty" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`diff-${item.value}`"
                  :checked="currentFilters.difficulty?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('difficulty', item.value, checked)"
                />
                <label :for="`diff-${item.value}`" class="ml-2 text-sm">
                  <Badge :class="getDifficultyColor(item.label)">{{ item.label }}</Badge>
                </label>
              </div>
            </div>
          </div>

          <!-- 运动机制 -->
          <div v-if="filterOptions.mechanic?.length">
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Zap class="w-4 h-4" />
              运动机制
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in filterOptions.mechanic" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`mech-${item.value}`"
                  :checked="currentFilters.mechanic?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('mechanic', item.value, checked)"
                />
                <label :for="`mech-${item.value}`" class="ml-2 text-sm">{{ item.label }}</label>
              </div>
            </div>
          </div>

          <!-- 力量类型 -->
          <div v-if="filterOptions.force?.length">
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Activity class="w-4 h-4" />
              力量类型
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in filterOptions.force" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`force-${item.value}`"
                  :checked="currentFilters.force?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('force', item.value, checked)"
                />
                <label :for="`force-${item.value}`" class="ml-2 text-sm">{{ item.label }}</label>
              </div>
            </div>
          </div>

          <!-- 运动链类型 -->
          <div v-if="filterOptions.kinetic_chain?.length">
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Link class="w-4 h-4" />
              运动链类型
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in filterOptions.kinetic_chain" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`kc-${item.value}`"
                  :checked="currentFilters.kinetic_chain?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('kinetic_chain', item.value, checked)"
                />
                <label :for="`kc-${item.value}`" class="ml-2 text-sm">{{ item.label }}</label>
              </div>
            </div>
          </div>

          <!-- 安全等级 -->
          <div v-if="filterOptions.safety_level?.length">
            <h4 class="text-sm font-medium mb-2 flex items-center gap-2">
              <Shield class="w-4 h-4" />
              安全等级
            </h4>
            <div class="flex flex-wrap gap-2">
              <div v-for="item in filterOptions.safety_level" :key="item.value" class="flex items-center">
                <Checkbox
                  :id="`safety-${item.value}`"
                  :checked="currentFilters.safety_level?.includes(item.value)"
                  @update:model-value="(checked) => toggleFilter('safety_level', item.value, checked)"
                />
                <label :for="`safety-${item.value}`" class="ml-2 text-sm">
                  <Badge :class="getSafetyColor(item.value)">{{ item.label }}</Badge>
                </label>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex gap-3 pt-2">
            <Button variant="outline" class="flex-1" @click="handleFilterReset">
              重置
            </Button>
            <Button class="flex-1" @click="handleFilterApply">
              应用 ({{ exerciseStore.totalCount }} 个动作)
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <!-- 骨架屏加载 -->
      <div v-if="isInitialLoading" class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 px-3">
        <div v-for="i in 12" :key="i" class="bg-white rounded-lg overflow-hidden">
          <Skeleton class="w-full pb-[60%]" />
          <div class="p-1.5 space-y-1">
            <Skeleton class="h-3 w-3/4" />
            <Skeleton class="h-2 w-1/2" />
          </div>
        </div>
      </div>

      <!-- 动作列表 -->
      <div 
        v-else-if="exerciseStore.exercises.length > 0" 
        class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 px-3"
        role="list"
        :aria-label="`动作列表，共 ${exerciseStore.exercises.length} 个动作`"
      >
        <ExerciseCard
          v-for="exercise in exerciseStore.exercises"
          :key="exercise.id"
          :exercise="exercise"
          :is-favorited="exerciseStore.isFavorite(exercise.id)"
          role="listitem"
          @card-click="handleCardClick"
          @favorite="handleToggleFavorite"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-16 px-4">
        <Search class="w-16 h-16 text-gray-300 mb-4" />
        <p class="text-gray-500 mb-4">{{ getEmptyDescription() }}</p>
        <Button @click="handleResetAll">重置筛选</Button>
      </div>

      <!-- 分页 -->
      <nav 
        v-if="exerciseStore.pagination.totalPages > 1" 
        class="px-4 py-6 space-y-4"
        role="navigation"
        :aria-label="ariaLabels.pagination.page(exerciseStore.pagination.current, exerciseStore.pagination.totalPages)"
      >
        <div class="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            :disabled="exerciseStore.pagination.current === 1"
            :aria-label="ariaLabels.pagination.first"
            @click="handlePageChange(1)"
          >
            <ChevronsLeft class="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            :disabled="exerciseStore.pagination.current === 1"
            :aria-label="ariaLabels.pagination.previous"
            @click="handlePageChange(exerciseStore.pagination.current - 1)"
          >
            <ChevronLeft class="w-4 h-4" aria-hidden="true" />
          </Button>
          
          <span class="px-4 text-sm" aria-current="page">
            {{ exerciseStore.pagination.current }} / {{ exerciseStore.pagination.totalPages }}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            :disabled="exerciseStore.pagination.current === exerciseStore.pagination.totalPages"
            :aria-label="ariaLabels.pagination.next"
            @click="handlePageChange(exerciseStore.pagination.current + 1)"
          >
            <ChevronRight class="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            :disabled="exerciseStore.pagination.current === exerciseStore.pagination.totalPages"
            :aria-label="ariaLabels.pagination.last"
            @click="handlePageChange(exerciseStore.pagination.totalPages)"
          >
            <ChevronsRight class="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <!-- 页面跳转 -->
        <div class="flex items-center justify-center gap-2">
          <span class="text-sm text-gray-500">跳转到</span>
          <Input
            v-model.number="jumpPageInput"
            type="number"
            class="w-16 h-8 text-center"
            @keyup.enter="handlePageJump"
          />
          <Button size="sm" @click="handlePageJump">GO</Button>
        </div>

        <div class="text-center text-sm text-gray-500">
          共 {{ exerciseStore.pagination.total }} 个动作
        </div>
      </nav>
    </main>

    <!-- 性别切换浮动按钮 -->
    <GenderSwitch v-model="currentGender" variant="floating" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft, Search, X, Filter, ChevronDown, Dumbbell, TrendingUp,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Zap, Activity, Link, Shield
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/components/ui/toast'
import { useExerciseStore } from '@/stores/exercise'
import ExerciseCard from '@/components/exercise/ExerciseCard.vue'
import MuscleSelector from '@/components/exercise/MuscleSelector.vue'
import GenderSwitch from '@/components/exercise/GenderSwitch.vue'
import type { FilterConditions, MuscleGroup, Gender } from '@/types/exercise'
import { ariaLabels } from '@/utils/accessibility'

const router = useRouter()
const exerciseStore = useExerciseStore()
const { toast } = useToast()

// 状态
const searchKeyword = ref('')
const selectedMuscle = ref<string | undefined>(undefined)
const currentGender = ref<Gender>('male')
const filterOpen = ref(false)
const loadingMuscleGroups = ref(false)
const jumpPageInput = ref<number | string>('')

const currentFilters = ref<FilterConditions>({
  equipment: [],
  difficulty: [],
  grip: [],
  mechanic: [],
  force: [],
  kinetic_chain: [],
  safety_level: [],
})

const muscleGroups = ref<MuscleGroup[]>([])

const filterOptions = ref({
  equipment: [] as { value: string; label: string }[],
  difficulty: [] as { value: string; label: string }[],
  grip: [] as { value: string; label: string }[],
  mechanic: [] as { value: string; label: string }[],
  force: [] as { value: string; label: string }[],
  kinetic_chain: [] as { value: string; label: string }[],
  safety_level: [] as { value: string; label: string }[],
})

// 计算属性
const isInitialLoading = computed(() => exerciseStore.loading && exerciseStore.exercises.length === 0)

const activeFilterCount = computed(() => {
  let count = 0
  if (currentFilters.value.equipment?.length) count += currentFilters.value.equipment.length
  if (currentFilters.value.difficulty?.length) count += currentFilters.value.difficulty.length
  if (currentFilters.value.grip?.length) count += currentFilters.value.grip.length
  if (currentFilters.value.mechanic?.length) count += currentFilters.value.mechanic.length
  if (currentFilters.value.force?.length) count += currentFilters.value.force.length
  if (currentFilters.value.kinetic_chain?.length) count += currentFilters.value.kinetic_chain.length
  if (currentFilters.value.safety_level?.length) count += currentFilters.value.safety_level.length
  return count
})

// 初始化
onMounted(async () => {
  await loadFilterOptions()
  await exerciseStore.fetchList({ reset: true })
})

// 监听肌群选择
watch(selectedMuscle, async (newMuscle) => {
  await exerciseStore.fetchList({ reset: true, muscle: newMuscle })
})

// 方法
async function loadFilterOptions() {
  loadingMuscleGroups.value = true
  try {
    await exerciseStore.fetchFilterOptions()
    if (exerciseStore.filterOptions) {
      filterOptions.value = {
        equipment: exerciseStore.filterOptions.equipment || [],
        difficulty: exerciseStore.filterOptions.difficulty || [],
        grip: exerciseStore.filterOptions.grip || [],
        mechanic: exerciseStore.filterOptions.mechanic || [],
        force: exerciseStore.filterOptions.force || [],
        kinetic_chain: exerciseStore.filterOptions.kinetic_chain || [],
        safety_level: exerciseStore.filterOptions.safety_level || [],
      }
      muscleGroups.value = (exerciseStore.filterOptions.muscle || []).map((item: any) => ({
        id: item.value,
        name_zh: item.label,
        count: item.count || 0,
      }))
    }
  } finally {
    loadingMuscleGroups.value = false
  }
}

async function handleSearch() {
  await exerciseStore.search(searchKeyword.value)
}

async function handleClearSearch() {
  searchKeyword.value = ''
  await exerciseStore.search('')
}

async function handleClearMuscle() {
  selectedMuscle.value = undefined
  await exerciseStore.fetchList({ reset: true })
}

function toggleFilter(type: keyof FilterConditions, value: string, checked: boolean | string) {
  // shadcn-vue Checkbox 的 checked 可能是 boolean 或 'indeterminate'
  const isChecked = checked === true
  const arr = (currentFilters.value[type] as string[]) || []
  
  if (isChecked) {
    if (!arr.includes(value)) {
      currentFilters.value[type] = [...arr, value]
    }
  } else {
    currentFilters.value[type] = arr.filter(v => v !== value)
  }
  
  console.log(`[Filter] ${type}: ${value} -> ${isChecked}`, currentFilters.value)
}

async function handleFilterApply() {
  await exerciseStore.updateFilters(currentFilters.value)
  filterOpen.value = false
  toast({ description: `筛选已应用 - ${exerciseStore.totalCount} 个动作` })
}

async function handleFilterReset() {
  currentFilters.value = { equipment: [], difficulty: [], grip: [], mechanic: [], force: [], kinetic_chain: [], safety_level: [] }
  await exerciseStore.updateFilters(currentFilters.value)
  toast({ description: '筛选已重置' })
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case '初学者':
    case '零基础':
    case '新手':
      return 'bg-green-500 text-white'
    case '中级': return 'bg-blue-500 text-white'
    case '高级': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

function getSafetyColor(level: string): string {
  switch (level) {
    case 'LOW_RISK': return 'bg-green-500 text-white'
    case 'MODERATE_RISK': return 'bg-yellow-500 text-white'
    case 'HIGH_RISK': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

async function handlePageChange(page: number) {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await exerciseStore.fetchList({ page, muscle: selectedMuscle.value, search: searchKeyword.value })
}

async function handlePageJump() {
  const page = Number(jumpPageInput.value)
  if (!page || page < 1 || page > exerciseStore.pagination.totalPages) {
    toast({ description: `请输入有效页码（1-${exerciseStore.pagination.totalPages}）`, variant: 'destructive' })
    jumpPageInput.value = ''
    return
  }
  await handlePageChange(page)
  jumpPageInput.value = ''
}

function handleCardClick(id: number) {
  router.push(`/exercise/${id}`)
}

function handleToggleFavorite(id: number) {
  exerciseStore.toggleFavorite(id)
  const isFav = exerciseStore.isFavorite(id)
  toast({ description: isFav ? '已添加到收藏' : '已取消收藏' })
}

async function handleResetAll() {
  searchKeyword.value = ''
  selectedMuscle.value = undefined
  currentFilters.value = { equipment: [], difficulty: [], grip: [], mechanic: [], force: [], kinetic_chain: [], safety_level: [] }
  await exerciseStore.reset()
  await exerciseStore.fetchList({ reset: true })
  toast({ description: '已重置所有筛选' })
}

function getEmptyDescription(): string {
  if (exerciseStore.error) return '加载失败，请重试'
  if (searchKeyword.value) return `未找到"${searchKeyword.value}"相关动作`
  if (selectedMuscle.value) return '该肌群暂无动作'
  return '暂无动作数据'
}
</script>
