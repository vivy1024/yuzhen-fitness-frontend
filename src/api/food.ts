/**
 * Food API
 * 食物库 API 调用层
 *
 * 连接到 Laravel 后端: http://localhost:8000/api
 * 数据来源: 1,851条食物数据（中国食物成分表）
 *
 * @module api/food
 */

import { getToken } from '@/utils/token'

/**
 * 食物基本信息
 */
export interface FoodBasic {
  id: number
  food_code: string
  name: string
  category: string
  subcategory: string | null
  energy_kcal: number | null
  protein: number | null
  fat: number | null
  carbohydrate: number | null
  dietary_fiber: number | null
  gi_value: number | null
  price_level: string | null
}

/**
 * 食物详细信息
 */
export interface FoodDetail extends FoodBasic {
  edible: number
  water: number | null
  energy_kj: number | null
  cholesterol: number | null
  ash: number | null
  
  // 维生素
  vitamin_a: number | null
  carotene: number | null
  retinol: number | null
  thiamin: number | null
  riboflavin: number | null
  niacin: number | null
  vitamin_c: number | null
  vitamin_e_total: number | null
  
  // 矿物质
  calcium: number | null
  phosphorus: number | null
  potassium: number | null
  sodium: number | null
  magnesium: number | null
  iron: number | null
  zinc: number | null
  selenium: number | null
  copper: number | null
  manganese: number | null
  
  // 元数据
  remark: string | null
  view_count: number
  created_at: string
  updated_at: string
}

/**
 * 食物分类
 */
export interface FoodCategory {
  name: string
  count: number
}

/**
 * 分页信息
 */
export interface FoodPagination {
  current_page: number
  per_page: number
  total: number
  last_page: number
}

/**
 * 食物列表响应
 */
export interface FoodListResponse {
  data: FoodBasic[]
  meta: FoodPagination
}

/**
 * 饮食记录
 */
export interface FoodIntake {
  id?: string
  foodId: number
  foodName: string
  amount: number // 克
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  date: string
  time: string
  calories: number
  protein: number
  fat: number
  carbs: number
}

/**
 * 营养统计
 */
export interface NutritionStats {
  date: string
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  totalFiber: number
  meals: {
    breakfast: FoodIntake[]
    lunch: FoodIntake[]
    dinner: FoodIntake[]
    snack: FoodIntake[]
  }
  targets: {
    calories: number
    protein: number
    fat: number
    carbs: number
  }
}

/**
 * API响应类型
 */
interface ApiResponse<T> {
  code: number
  msg: string
  data: T | null
}

// Laravel API 基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

/**
 * 食物库 API
 */
export const foodApi = {
  /**
   * 获取食物列表
   */
  getList: async (params?: {
    page?: number
    per_page?: number
    search?: string
    category?: string
  }): Promise<ApiResponse<FoodListResponse>> => {
    try {
      const queryParams = new URLSearchParams()
      if (params?.page) queryParams.append('page', String(params.page))
      if (params?.per_page) queryParams.append('per_page', String(params.per_page))
      if (params?.search) queryParams.append('search', params.search)
      if (params?.category) queryParams.append('category', params.category)
      
      const token = getToken()
      const response = await fetch(
        `${API_BASE_URL}/foods?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // 转换后端返回格式为Store期望的格式
      // 后端返回: { rows, total, page, per_page, total_pages }
      // Store期望: { data, meta: { current_page, per_page, total, last_page } }
      const backendData = result.data
      return {
        code: 200,
        msg: '成功',
        data: {
          data: backendData.rows || [],
          meta: {
            current_page: backendData.page || 1,
            per_page: backendData.per_page || 20,
            total: backendData.total || 0,
            last_page: backendData.total_pages || 0,
          }
        },
      }
    } catch (error: any) {
      console.error('获取食物列表失败:', error)
      return {
        code: 500,
        msg: error.message || '网络错误',
        data: null,
      }
    }
  },

  /**
   * 获取食物详情
   */
  getDetail: async (id: number): Promise<ApiResponse<FoodDetail | null>> => {
    try {
      const token = getToken()
      const response = await fetch(
        `${API_BASE_URL}/foods/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      )
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            code: 404,
            msg: '食物不存在',
            data: null,
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // 转换后端返回格式，展平嵌套的macros、vitamins、minerals对象
      const backendData = result.data
      const flattenedData = {
        ...backendData,
        // 展平macros
        protein: backendData.macros?.protein ?? null,
        fat: backendData.macros?.fat ?? null,
        carbohydrate: backendData.macros?.carbohydrate ?? null,
        dietary_fiber: backendData.macros?.dietary_fiber ?? null,
        cholesterol: backendData.macros?.cholesterol ?? null,
        // 展平vitamins
        vitamin_a: backendData.vitamins?.vitamin_a ?? null,
        carotene: backendData.vitamins?.carotene ?? null,
        retinol: backendData.vitamins?.retinol ?? null,
        thiamin: backendData.vitamins?.thiamin ?? null,
        riboflavin: backendData.vitamins?.riboflavin ?? null,
        niacin: backendData.vitamins?.niacin ?? null,
        vitamin_c: backendData.vitamins?.vitamin_c ?? null,
        vitamin_e_total: backendData.vitamins?.vitamin_e_total ?? null,
        // 展平minerals
        calcium: backendData.minerals?.calcium ?? null,
        phosphorus: backendData.minerals?.phosphorus ?? null,
        potassium: backendData.minerals?.potassium ?? null,
        sodium: backendData.minerals?.sodium ?? null,
        magnesium: backendData.minerals?.magnesium ?? null,
        iron: backendData.minerals?.iron ?? null,
        zinc: backendData.minerals?.zinc ?? null,
        selenium: backendData.minerals?.selenium ?? null,
        copper: backendData.minerals?.copper ?? null,
        manganese: backendData.minerals?.manganese ?? null,
      }
      
      return {
        code: 200,
        msg: '成功',
        data: flattenedData,
      }
    } catch (error: any) {
      console.error('获取食物详情失败:', error)
      return {
        code: 500,
        msg: error.message || '网络错误',
        data: null,
      }
    }
  },

  /**
   * 搜索食物
   */
  search: async (keyword: string, page: number = 1): Promise<ApiResponse<FoodListResponse>> => {
    return foodApi.getList({
      search: keyword,
      page,
    })
  },

  /**
   * 获取食物分类列表
   */
  getCategories: async (): Promise<ApiResponse<FoodCategory[]>> => {
    try {
      const token = getToken()
      const response = await fetch(
        `${API_BASE_URL}/foods/categories`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }
      )
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      return {
        code: 200,
        msg: '成功',
        data: result.data,
      }
    } catch (error: any) {
      console.error('获取食物分类失败:', error)
      return {
        code: 500,
        msg: error.message || '网络错误',
        data: null,
      }
    }
  },

  /**
   * 添加饮食记录
   * 临时使用 localStorage 存储
   */
  addIntake: async (intake: Omit<FoodIntake, 'id'>): Promise<ApiResponse<FoodIntake>> => {
    try {
      const id = `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newIntake: FoodIntake = { ...intake, id }
      
      const existingData = localStorage.getItem('yuzhen_food_intakes')
      const intakes: FoodIntake[] = existingData ? JSON.parse(existingData) : []
      intakes.push(newIntake)
      localStorage.setItem('yuzhen_food_intakes', JSON.stringify(intakes))
      
      return {
        code: 200,
        msg: '添加成功',
        data: newIntake,
      }
    } catch (error: any) {
      console.error('添加饮食记录失败:', error)
      return {
        code: 500,
        msg: error.message || '添加失败',
        data: null,
      }
    }
  },

  /**
   * 获取饮食记录
   */
  getIntakes: async (date?: string): Promise<ApiResponse<FoodIntake[]>> => {
    try {
      const existingData = localStorage.getItem('yuzhen_food_intakes')
      let intakes: FoodIntake[] = existingData ? JSON.parse(existingData) : []
      
      if (date) {
        intakes = intakes.filter(intake => intake.date === date)
      }
      
      intakes.sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.time}`)
        const dateB = new Date(`${b.date} ${b.time}`)
        return dateB.getTime() - dateA.getTime()
      })
      
      return {
        code: 200,
        msg: '成功',
        data: intakes,
      }
    } catch (error: any) {
      console.error('获取饮食记录失败:', error)
      return {
        code: 500,
        msg: error.message || '获取失败',
        data: null,
      }
    }
  },

  /**
   * 删除饮食记录
   */
  deleteIntake: async (id: string): Promise<ApiResponse<boolean>> => {
    try {
      const existingData = localStorage.getItem('yuzhen_food_intakes')
      let intakes: FoodIntake[] = existingData ? JSON.parse(existingData) : []
      
      intakes = intakes.filter(intake => intake.id !== id)
      localStorage.setItem('yuzhen_food_intakes', JSON.stringify(intakes))
      
      return {
        code: 200,
        msg: '删除成功',
        data: true,
      }
    } catch (error: any) {
      console.error('删除饮食记录失败:', error)
      return {
        code: 500,
        msg: error.message || '删除失败',
        data: null,
      }
    }
  },

  /**
   * 获取营养统计
   */
  getNutritionStats: async (date: string): Promise<ApiResponse<NutritionStats>> => {
    try {
      const intakesResponse = await foodApi.getIntakes(date)
      const intakes = intakesResponse.data || []
      
      const meals = {
        breakfast: intakes.filter(i => i.meal === 'breakfast'),
        lunch: intakes.filter(i => i.meal === 'lunch'),
        dinner: intakes.filter(i => i.meal === 'dinner'),
        snack: intakes.filter(i => i.meal === 'snack'),
      }
      
      const totalCalories = intakes.reduce((sum, i) => sum + i.calories, 0)
      const totalProtein = intakes.reduce((sum, i) => sum + i.protein, 0)
      const totalFat = intakes.reduce((sum, i) => sum + i.fat, 0)
      const totalCarbs = intakes.reduce((sum, i) => sum + i.carbs, 0)
      const totalFiber = 0
      
      const targets = {
        calories: 2000,
        protein: 120,
        fat: 65,
        carbs: 250,
      }
      
      return {
        code: 200,
        msg: '成功',
        data: {
          date,
          totalCalories,
          totalProtein,
          totalFat,
          totalCarbs,
          totalFiber,
          meals,
          targets,
        },
      }
    } catch (error: any) {
      console.error('获取营养统计失败:', error)
      return {
        code: 500,
        msg: error.message || '获取失败',
        data: null,
      }
    }
  },
}
