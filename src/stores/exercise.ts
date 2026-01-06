/**
 * Exercise Store
 * 动作库状态管理
 * 复刻自 yuzhen_fitness_v2
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { exerciseApi } from '@/api/exercise'
import type {
  ExerciseBasic,
  ExerciseDetail,
  FilterOptions,
  FilterConditions,
  PaginationInfo,
} from '@/types/exercise'

export const useExerciseStore = defineStore('exercise', () => {
  // ==================== 状态 ====================
  
  const exercises = ref<ExerciseBasic[]>([])
  const currentExercise = ref<ExerciseDetail | null>(null)
  const filterOptions = ref<FilterOptions | null>(null)
  const currentFilters = ref<FilterConditions>({})
  const searchKeyword = ref('')
  const selectedMuscle = ref<string | undefined>(undefined)
  
  const pagination = ref<PaginationInfo>({
    current: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  })
  
  const loading = ref(false)
  const error = ref<string | null>(null)
  const favorites = ref<Set<number>>(new Set())

  // ==================== 计算属性 ====================
  
  const totalCount = computed(() => pagination.value.total)
  const hasMore = computed(() => pagination.value.current < pagination.value.totalPages)

  // ==================== 方法 ====================

  /**
   * 获取动作列表
   */
  async function fetchList(params?: {
    reset?: boolean
    page?: number
    muscle?: string
    search?: string
  }) {
    loading.value = true
    error.value = null

    try {
      const page = params?.reset ? 1 : (params?.page || pagination.value.current)
      
      const response = await exerciseApi.getList({
        page,
        pageSize: pagination.value.pageSize,
        search: params?.search ?? searchKeyword.value,
        muscle: params?.muscle ?? selectedMuscle.value,
        filters: currentFilters.value,
      })

      if (response.code === 200 && response.data) {
        exercises.value = response.data.items
        pagination.value = response.data.pagination
      } else {
        error.value = response.msg
      }
    } catch (e: any) {
      error.value = e.message || '获取动作列表失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取动作详情
   */
  async function fetchDetail(id: number) {
    loading.value = true
    error.value = null

    try {
      const response = await exerciseApi.getDetail(id)
      if (response.code === 200 && response.data) {
        currentExercise.value = response.data
      } else {
        error.value = response.msg
      }
    } catch (e: any) {
      error.value = e.message || '获取动作详情失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取筛选选项（带缓存）
   * 缓存有效期：24小时
   */
  async function fetchFilterOptions() {
    const CACHE_KEY = 'exercise_filter_options'
    const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

    try {
      // 尝试从缓存读取
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const now = Date.now()
        
        // 检查缓存是否过期
        if (now - timestamp < CACHE_DURATION) {
          filterOptions.value = data
          console.log('✅ 使用缓存的筛选选项（0ms延迟）')
          return
        }
      }

      // 缓存不存在或已过期，从API获取
      const response = await exerciseApi.getFilterOptions()
      if (response.code === 200 && response.data) {
        filterOptions.value = response.data
        
        // 保存到缓存
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }))
        console.log('✅ 筛选选项已缓存（24小时有效期）')
      }
    } catch (e: any) {
      console.error('获取筛选选项失败:', e)
      
      // 如果API失败，尝试使用过期的缓存
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data } = JSON.parse(cached)
        filterOptions.value = data
        console.warn('⚠️ API失败，使用过期缓存')
      }
    }
  }

  /**
   * 搜索动作
   */
  async function search(keyword: string) {
    searchKeyword.value = keyword
    await fetchList({ reset: true, search: keyword })
  }

  /**
   * 更新筛选条件
   */
  async function updateFilters(filters: FilterConditions) {
    currentFilters.value = filters
    await fetchList({ reset: true })
  }

  /**
   * 切换收藏
   */
  function toggleFavorite(id: number) {
    if (favorites.value.has(id)) {
      favorites.value.delete(id)
    } else {
      favorites.value.add(id)
    }
  }

  /**
   * 检查是否收藏
   */
  function isFavorite(id: number): boolean {
    return favorites.value.has(id)
  }

  /**
   * 重置状态
   */
  function reset() {
    exercises.value = []
    currentFilters.value = {}
    searchKeyword.value = ''
    selectedMuscle.value = undefined
    pagination.value = { current: 1, pageSize: 20, total: 0, totalPages: 0 }
    error.value = null
  }

  /**
   * 清除筛选选项缓存
   */
  function clearFilterCache() {
    localStorage.removeItem('exercise_filter_options')
    console.log('✅ 已清除动作库筛选选项缓存')
  }

  return {
    // 状态
    exercises,
    currentExercise,
    filterOptions,
    currentFilters,
    searchKeyword,
    selectedMuscle,
    pagination,
    loading,
    error,
    favorites,
    // 计算属性
    totalCount,
    hasMore,
    // 方法
    fetchList,
    fetchDetail,
    fetchFilterOptions,
    search,
    updateFilters,
    toggleFavorite,
    isFavorite,
    reset,
    clearFilterCache,
  }
})
