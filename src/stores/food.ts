/**
 * Food Store
 * 食物库状态管理
 * 参考 exercise store 实现
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { foodApi, type FoodBasic, type FoodDetail, type FoodCategory } from '@/api/food'

export const useFoodStore = defineStore('food', () => {
  // ==================== 状态 ====================
  
  const foods = ref<FoodBasic[]>([])
  const currentFood = ref<FoodDetail | null>(null)
  const categories = ref<FoodCategory[]>([])
  const selectedCategory = ref<string | undefined>(undefined)
  const searchKeyword = ref('')
  
  const pagination = ref({
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

  // ==================== 初始化 ====================

  // 从 localStorage 加载收藏
  function loadFavorites() {
    try {
      const saved = localStorage.getItem('yuzhen_food_favorites')
      if (saved) {
        favorites.value = new Set(JSON.parse(saved))
      }
    } catch (e) {
      console.error('加载食物收藏失败:', e)
    }
  }

  // 保存收藏到 localStorage
  function saveFavorites() {
    try {
      localStorage.setItem('yuzhen_food_favorites', JSON.stringify([...favorites.value]))
    } catch (e) {
      console.error('保存食物收藏失败:', e)
    }
  }

  // ==================== 方法 ====================

  /**
   * 获取食物列表
   */
  async function fetchList(params?: {
    reset?: boolean
    page?: number
    category?: string
    search?: string
  }) {
    loading.value = true
    error.value = null

    try {
      const page = params?.reset ? 1 : (params?.page || pagination.value.current)
      
      const response = await foodApi.getList({
        page,
        per_page: pagination.value.pageSize,
        search: params?.search ?? searchKeyword.value,
        category: params?.category ?? selectedCategory.value,
      })

      if (response.code === 200 && response.data) {
        foods.value = response.data.data || []
        pagination.value = {
          current: response.data.meta?.current_page || page,
          pageSize: response.data.meta?.per_page || 20,
          total: response.data.meta?.total || 0,
          totalPages: response.data.meta?.last_page || 0,
        }
      } else {
        error.value = response.msg
      }
    } catch (e: any) {
      error.value = e.message || '获取食物列表失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取食物详情
   */
  async function fetchDetail(id: number) {
    loading.value = true
    error.value = null

    try {
      const response = await foodApi.getDetail(id)
      if (response.code === 200 && response.data) {
        currentFood.value = response.data
      } else {
        error.value = response.msg
      }
    } catch (e: any) {
      error.value = e.message || '获取食物详情失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取分类列表（带缓存）
   * 缓存有效期：24小时
   */
  async function fetchCategories() {
    const CACHE_KEY = 'food_categories'
    const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

    try {
      // 尝试从缓存读取
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const now = Date.now()
        
        // 检查缓存是否过期
        if (now - timestamp < CACHE_DURATION) {
          categories.value = data
          console.log('✅ 使用缓存的食物分类（0ms延迟）')
          return
        }
      }

      // 缓存不存在或已过期，从API获取
      const response = await foodApi.getCategories()
      if (response.code === 200 && response.data) {
        categories.value = response.data
        
        // 保存到缓存
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: response.data,
          timestamp: Date.now()
        }))
        console.log('✅ 食物分类已缓存（24小时有效期）')
      }
    } catch (e: any) {
      console.error('获取食物分类失败:', e)
      
      // 如果API失败，尝试使用过期的缓存
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { data } = JSON.parse(cached)
        categories.value = data
        console.warn('⚠️ API失败，使用过期缓存')
      }
    }
  }

  /**
   * 搜索食物
   */
  async function search(keyword: string) {
    searchKeyword.value = keyword
    await fetchList({ reset: true, search: keyword })
  }

  /**
   * 按分类筛选
   */
  async function filterByCategory(category: string | undefined) {
    selectedCategory.value = category
    await fetchList({ reset: true, category })
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
    saveFavorites()
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
    foods.value = []
    selectedCategory.value = undefined
    searchKeyword.value = ''
    pagination.value = { current: 1, pageSize: 20, total: 0, totalPages: 0 }
    error.value = null
  }

  /**
   * 清除分类缓存
   */
  function clearCategoryCache() {
    localStorage.removeItem('food_categories')
    console.log('✅ 已清除食物分类缓存')
  }

  // 初始化时加载收藏
  loadFavorites()

  return {
    // 状态
    foods,
    currentFood,
    categories,
    selectedCategory,
    searchKeyword,
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
    fetchCategories,
    search,
    filterByCategory,
    toggleFavorite,
    isFavorite,
    reset,
    clearCategoryCache,
  }
})
