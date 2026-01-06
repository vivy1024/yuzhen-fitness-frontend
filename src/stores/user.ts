/**
 * User Profile Store
 * 用户档案状态管理 - 复刻自 yuzhen_fitness_v2
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile, FFMIAssessment, BasicInfo, FitnessGoals, TrainingPreferences, StrengthData, HealthStatus, NutritionProfile } from '@/types/user-profile'
import { userProfileApi, type FFMIHistory } from '@/api/user'
import { calculateFFMI } from '@/utils/ffmi-calculator'
import { warmupUser } from '@/api/warmup'

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile_v2',
  CURRENT_USER_ID: 'current_user_id',
  LAST_SYNC: 'last_sync_at',
} as const

interface StoredProfile {
  userId: number
  profile: UserProfile
  savedAt: string
  syncedToServer: boolean
}

export const useUserStore = defineStore('user', () => {
  // ==================== State ====================
  const userProfile = ref<UserProfile | null>(null)
  const ffmiData = ref<FFMIAssessment | null>(null)
  const loading = ref(false)
  const lastSyncAt = ref<string | null>(null)
  const syncedToServer = ref(false)
  const error = ref('')
  const ffmiHistory = ref<FFMIHistory[]>([])

  // ==================== Getters ====================
  const isComplete = computed(() => {
    if (!userProfile.value) return false
    const profile = userProfile.value
    const required = [
      profile.basic_info.nickname,
      profile.basic_info.age,
      profile.basic_info.gender,
      profile.basic_info.height,
      profile.basic_info.weight,
      profile.basic_info.fitness_level,
      profile.fitness_goals.primary_goals.length > 0,
      profile.fitness_goals.training_split,
      profile.training_preferences.available_equipment.length > 0,
      profile.training_preferences.training_location,
    ]
    return required.every(Boolean)
  })

  const completionRate = computed(() => {
    if (!userProfile.value) return 0
    let total = 0, filled = 0

    // 基础信息（7个字段）
    total += 7
    if (userProfile.value.basic_info.nickname) filled++
    if (userProfile.value.basic_info.age) filled++
    if (userProfile.value.basic_info.gender) filled++
    if (userProfile.value.basic_info.height) filled++
    if (userProfile.value.basic_info.weight) filled++
    if (userProfile.value.basic_info.fitness_level) filled++
    if (userProfile.value.basic_info.body_fat_percentage) filled++

    // 健身目标（3个字段）
    total += 3
    if (userProfile.value.fitness_goals.primary_goals.length > 0) filled++
    if (userProfile.value.fitness_goals.training_split) filled++
    if (userProfile.value.fitness_goals.target_weight) filled++

    // 训练偏好（2个字段）
    total += 2
    if (userProfile.value.training_preferences.available_equipment.length > 0) filled++
    if (userProfile.value.training_preferences.training_location) filled++

    // 力量数据（非初学者，6个动作）
    if (!isBeginner.value) {
      total += 6
      if (userProfile.value.strength_data?.bench_press) filled++
      if (userProfile.value.strength_data?.squat) filled++
      if (userProfile.value.strength_data?.deadlift) filled++
      if (userProfile.value.strength_data?.overhead_press) filled++
      if (userProfile.value.strength_data?.pull_up) filled++
      if (userProfile.value.strength_data?.dip) filled++
    }

    // 健康状况（1个字段）
    total += 1
    if (userProfile.value.health_status.chronic_diseases.length > 0) filled++

    // 营养档案（2个字段）
    total += 2
    if (userProfile.value.nutrition_profile.user_settings.population_type) filled++
    if (userProfile.value.nutrition_profile.user_settings.budget) filled++

    return Math.round((filled / total) * 100)
  })

  const isBeginner = computed(() => userProfile.value?.basic_info.fitness_level === 'beginner')
  const userId = computed(() => userProfile.value?.user_id || null)
  const userName = computed(() => userProfile.value?.basic_info.nickname || '未设置')

  // ==================== Actions ====================
  async function init(): Promise<void> {
    try {
      // 优先从服务器加载
      try {
        const serverProfile = await loadFromServer()
        if (serverProfile) return
      } catch (err) {
        console.warn('从服务器加载失败，尝试本地加载:', err)
      }
      
      // 从LocalStorage加载
      const localProfile = await loadFromLocal()
      if (localProfile) return
      
      // 创建空档案
      createEmptyProfile()
    } catch (err) {
      console.error('初始化档案失败:', err)
      createEmptyProfile()
    }
  }

  async function saveToLocal(): Promise<{ success: boolean; message: string }> {
    if (!userProfile.value) {
      return { success: false, message: '没有档案数据' }
    }

    try {
      const userIdFromStorage = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)
      if (!userIdFromStorage) throw new Error('用户ID不存在')

      const storedData: StoredProfile = {
        userId: parseInt(userIdFromStorage),
        profile: userProfile.value,
        savedAt: new Date().toISOString(),
        syncedToServer: syncedToServer.value,
      }

      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(storedData))
      lastSyncAt.value = storedData.savedAt
      return { success: true, message: '数据已安全保存到本地' }
    } catch (err: any) {
      error.value = err.message || '保存失败'
      return { success: false, message: error.value }
    }
  }

  async function loadFromLocal(): Promise<UserProfile | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
      if (!stored) return null

      const data: StoredProfile = JSON.parse(stored)
      userProfile.value = data.profile
      lastSyncAt.value = data.savedAt
      syncedToServer.value = data.syncedToServer || false

      if (data.profile.ffmi_assessment) {
        ffmiData.value = data.profile.ffmi_assessment
      }

      return data.profile
    } catch (err: any) {
      error.value = '从LocalStorage加载失败'
      return null
    }
  }

  async function uploadToServer(): Promise<{ success: boolean; message: string }> {
    if (!userProfile.value) {
      return { success: false, message: '没有档案数据' }
    }

    const { age, height, weight } = userProfile.value.basic_info
    if (!age || !height || !weight) {
      return { success: false, message: '请先填写基础信息（年龄、身高、体重）再上传' }
    }

    loading.value = true
    error.value = ''

    try {
      // 处理strength_data，将undefined转换为null以确保JSON序列化正确
      const processedStrengthData = userProfile.value.strength_data ? {
        bench_press: {
          one_rm: userProfile.value.strength_data.bench_press?.one_rm ?? null,
          three_rm: userProfile.value.strength_data.bench_press?.three_rm ?? null,
        },
        squat: {
          one_rm: userProfile.value.strength_data.squat?.one_rm ?? null,
          three_rm: userProfile.value.strength_data.squat?.three_rm ?? null,
        },
        deadlift: {
          one_rm: userProfile.value.strength_data.deadlift?.one_rm ?? null,
          three_rm: userProfile.value.strength_data.deadlift?.three_rm ?? null,
        },
        overhead_press: {
          one_rm: userProfile.value.strength_data.overhead_press?.one_rm ?? null,
          three_rm: userProfile.value.strength_data.overhead_press?.three_rm ?? null,
        },
        pull_up: {
          one_rm: userProfile.value.strength_data.pull_up?.one_rm ?? null,
          three_rm: userProfile.value.strength_data.pull_up?.three_rm ?? null,
        },
        dip: {
          one_rm: userProfile.value.strength_data.dip?.one_rm ?? null,
          three_rm: userProfile.value.strength_data.dip?.three_rm ?? null,
        },
      } : null
      
      const apiPayload = {
        nickname: userProfile.value.basic_info.nickname || '',
        gender: userProfile.value.basic_info.gender,
        age: userProfile.value.basic_info.age,
        height: userProfile.value.basic_info.height,
        weight: userProfile.value.basic_info.weight,
        body_fat_percentage: userProfile.value.basic_info.body_fat_percentage || null,
        fitness_level: userProfile.value.basic_info.fitness_level || null,
        region: userProfile.value.basic_info.region || null,
        sleep_hours: userProfile.value.basic_info.sleep_hours || null,
        primary_goals: userProfile.value.fitness_goals.primary_goals || [],
        secondary_goals: userProfile.value.fitness_goals.secondary_goals || [],
        target_weight: userProfile.value.fitness_goals.target_weight || null,
        training_split: userProfile.value.fitness_goals.training_split || null,
        training_location: userProfile.value.training_preferences.training_location || null,
        available_equipment: userProfile.value.training_preferences.available_equipment || [],
        training_intensity: userProfile.value.training_preferences.training_intensity || null,
        // 休息模式
        preferred_rest_pattern: userProfile.value.preferred_rest_pattern || null,
        strength_data: processedStrengthData,
        chronic_diseases: userProfile.value.health_status.chronic_diseases || [],
        medications: userProfile.value.health_status.medications || [],
        injury_history: userProfile.value.health_status.injury_history || [],
        health_notes: userProfile.value.health_status.other_notes || null,
        nutrition_settings: userProfile.value.nutrition_profile.user_settings || {},
        ffmi_assessment: userProfile.value.ffmi_assessment || undefined,
        version: userProfile.value.version || 1,
      }

      const result = await userProfileApi.update(apiPayload as any)

      if (result.code === 200) {
        syncedToServer.value = true
        await saveToLocal()
        
        // 上传成功后触发DAML-RAG预热，刷新缓存中的用户档案
        triggerWarmup()
        
        return { success: true, message: '档案已成功上传到服务器' }
      } else {
        throw new Error(result.msg || '上传失败')
      }
    } catch (err: any) {
      error.value = err.message || '上传失败'
      return { success: false, message: error.value }
    } finally {
      loading.value = false
    }
  }

  async function loadFromServer(): Promise<UserProfile | null> {
    const hasToken = localStorage.getItem('access_token')
    if (!hasToken) return null

    const localData = await loadFromLocal()
    if (localData && !syncedToServer.value) return localData

    loading.value = true
    error.value = ''

    try {
      const result = await userProfileApi.get()

      if (result.code === 200 && result.data) {
        const phpData: any = result.data

        const mappedProfile: UserProfile = {
          user_id: phpData.user_id || parseInt(localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID) || '1'),
          basic_info: {
            nickname: phpData.basic_info?.nickname || '',
            age: phpData.basic_info?.age || null as any,
            gender: phpData.basic_info?.gender || null,
            height: phpData.basic_info?.height || null as any,
            weight: phpData.basic_info?.weight || null as any,
            body_fat_percentage: phpData.basic_info?.body_fat_percentage || null,
            fitness_level: phpData.basic_info?.fitness_level || null,
            region: phpData.basic_info?.region || null,
            sleep_hours: phpData.basic_info?.sleep_hours || null,
          },
          fitness_goals: {
            primary_goals: phpData.fitness_goals?.primary_goals || [],
            secondary_goals: phpData.fitness_goals?.secondary_goals || [],
            goal_priority: phpData.fitness_goals?.goal_priority || {},
            training_split: phpData.fitness_goals?.training_split || null,
            target_weight: phpData.fitness_goals?.target_weight || null,
          },
          training_preferences: {
            training_split: phpData.fitness_goals?.training_split || null,
            available_equipment: phpData.training_preferences?.available_equipment || [],
            training_location: phpData.training_preferences?.training_location || null,
            exercise_preferences: phpData.training_preferences?.exercise_preferences || null,
            disliked_exercises: phpData.training_preferences?.disliked_exercises || null,
            training_intensity: phpData.training_preferences?.training_intensity || null,
          },
          preferred_rest_pattern: phpData.preferred_rest_pattern || null,
          strength_data: phpData.strength_data || undefined,
          health_status: {
            chronic_diseases: phpData.health_status?.chronic_diseases || [],
            injury_history: phpData.health_status?.injury_history || [],
            medications: phpData.health_status?.medications || [],
            other_notes: phpData.health_status?.other_notes || null,
          },
          nutrition_profile: {
            user_settings: phpData.nutrition_profile?.user_settings || {
              population_type: null,
              dietary_preferences: [],
              allergies: [],
              supplements: [],
              budget: null,
            },
            auto_calculated: phpData.nutrition_profile?.auto_calculated || null,
          },
          ffmi_assessment: phpData.ffmi_assessment || null,
          created_at: phpData.created_at || new Date().toISOString(),
          updated_at: phpData.updated_at || new Date().toISOString(),
          version: phpData.version || 1,
        }

        userProfile.value = mappedProfile
        if (mappedProfile.ffmi_assessment) {
          ffmiData.value = mappedProfile.ffmi_assessment
        }
        syncedToServer.value = true
        await saveToLocal()
        return userProfile.value
      }
      return null
    } catch (err: any) {
      if (err.response?.status === 401) return null
      error.value = err.message || '从服务器加载失败'
      return null
    } finally {
      loading.value = false
    }
  }

  async function calculateUserFFMI(): Promise<FFMIAssessment> {
    if (!userProfile.value) throw new Error('没有用户档案数据')

    const { height, weight, body_fat_percentage, gender } = userProfile.value.basic_info
    if (!height || !weight || !gender) throw new Error('缺少必需的身体数据')

    const result = calculateFFMI({ height, weight, bodyFat: body_fat_percentage, gender })
    ffmiData.value = result
    userProfile.value.ffmi_assessment = result
    await saveToLocal()
    return result
  }

  function setFFMIData(data: FFMIAssessment): void {
    ffmiData.value = data
    if (userProfile.value) {
      userProfile.value.ffmi_assessment = data
    }
  }

  function updateBasicInfo(info: BasicInfo): void {
    if (!userProfile.value) createEmptyProfile()
    if (userProfile.value) {
      userProfile.value.basic_info = info
      userProfile.value.updated_at = new Date().toISOString()
      saveToLocal()
      // 注意：预热只在syncToServer时触发，本地编辑不触发
    }
  }

  function updateFitnessGoals(goals: FitnessGoals): void {
    if (!userProfile.value) createEmptyProfile()
    if (userProfile.value) {
      userProfile.value.fitness_goals = goals
      userProfile.value.updated_at = new Date().toISOString()
      saveToLocal()
    }
  }

  function updateTrainingPreferences(preferences: TrainingPreferences): void {
    if (!userProfile.value) createEmptyProfile()
    if (userProfile.value) {
      userProfile.value.training_preferences = preferences
      userProfile.value.updated_at = new Date().toISOString()
      saveToLocal()
    }
  }

  function updateStrengthData(data: StrengthData): void {
    if (!userProfile.value) createEmptyProfile()
    if (userProfile.value) {
      userProfile.value.strength_data = data
      userProfile.value.updated_at = new Date().toISOString()
      saveToLocal()
    }
  }

  function updateHealthStatus(status: HealthStatus): void {
    if (!userProfile.value) createEmptyProfile()
    if (userProfile.value) {
      userProfile.value.health_status = status
      userProfile.value.updated_at = new Date().toISOString()
      saveToLocal()
    }
  }

  function updateNutritionProfile(profile: NutritionProfile): void {
    if (!userProfile.value) createEmptyProfile()
    if (userProfile.value) {
      userProfile.value.nutrition_profile = profile
      userProfile.value.updated_at = new Date().toISOString()
      saveToLocal()
    }
  }

  function updateRestPattern(pattern: string | null): void {
    if (!userProfile.value) createEmptyProfile()
    if (userProfile.value) {
      userProfile.value.preferred_rest_pattern = pattern as any
      userProfile.value.updated_at = new Date().toISOString()
      saveToLocal()
    }
  }

  function createEmptyProfile(): void {
    const userIdFromStorage = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)
    const currentUserId = userIdFromStorage ? parseInt(userIdFromStorage) : 1

    userProfile.value = {
      user_id: currentUserId,
      basic_info: {
        nickname: '',
        age: null as any,
        gender: null as any,  // 新用户不预设性别
        height: null as any,
        weight: null as any,
        fitness_level: null as any,  // 新用户不预设健身水平
      },
      fitness_goals: {
        primary_goals: [],
        goal_priority: {},
        training_split: null,
      },
      training_preferences: {
        training_split: null,
        available_equipment: [],
        training_location: null,
        preferred_intensity: null as any,  // 新用户不预设训练强度
      },
      health_status: {
        chronic_diseases: [],
        injury_history: [],
        medications: [],
      },
      nutrition_profile: {
        user_settings: {
          population_type: null as any,  // 新用户不预设人群类型
          dietary_preferences: [],
          allergies: [],
          supplements: [],
          budget: null as any,  // 新用户不预设预算
        },
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: 1,
    }
  }

  function resetProfile(): void {
    userProfile.value = null
    ffmiData.value = null
    syncedToServer.value = false
    lastSyncAt.value = null
    error.value = ''
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
  }

  function clearError(): void {
    error.value = ''
  }

  /**
   * 触发DAML-RAG预热
   * 在用户档案更新后调用，刷新AI服务缓存中的用户档案
   * @param forceRefresh 是否强制刷新缓存（默认true，因为档案已更新）
   */
  function triggerWarmup(forceRefresh: boolean = true): void {
    const userIdFromStorage = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)
    if (!userIdFromStorage) return
    
    // 异步预热，不阻塞主流程
    warmupUser(userIdFromStorage, forceRefresh)
      .then(result => {
        if (result.success) {
          console.log('[UserStore] DAML-RAG预热成功:', result.preload_status)
        } else {
          console.warn('[UserStore] DAML-RAG预热部分失败:', result.message)
        }
      })
      .catch(err => {
        // 预热失败不影响主流程
        console.warn('[UserStore] DAML-RAG预热失败（不影响保存）:', err)
      })
  }

  async function loadFFMIHistory(limit = 10): Promise<FFMIHistory[]> {
    if (userProfile.value?.ffmi_assessment) {
      const mockHistory: FFMIHistory = {
        id: 1,
        user_id: userProfile.value.user_id,
        height: userProfile.value.basic_info.height || 0,
        weight: userProfile.value.basic_info.weight || 0,
        body_fat_percentage: userProfile.value.basic_info.body_fat_percentage,
        ffmi_data: userProfile.value.ffmi_assessment,
        recorded_at: userProfile.value.updated_at || new Date().toISOString(),
      }
      ffmiHistory.value = [mockHistory]
      return [mockHistory]
    }
    return []
  }

  return {
    // State
    userProfile, ffmiData, loading, lastSyncAt, syncedToServer, error, ffmiHistory,
    // Getters
    isComplete, completionRate, isBeginner, userId, userName,
    // Actions
    init, saveToLocal, loadFromLocal, uploadToServer, loadFromServer,
    calculateUserFFMI, setFFMIData, updateBasicInfo, updateFitnessGoals,
    updateTrainingPreferences, updateStrengthData, updateHealthStatus,
    updateNutritionProfile, updateRestPattern, createEmptyProfile, resetProfile, clearError, loadFFMIHistory,
  }
})
