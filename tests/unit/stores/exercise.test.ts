import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useExerciseStore } from '@/stores/exercise'

// Mock API
vi.mock('@/api/exercise', () => ({
  exerciseApi: {
    getList: vi.fn(),
    getDetail: vi.fn(),
    getFilterOptions: vi.fn(),
  },
}))

import { exerciseApi } from '@/api/exercise'

const mockListResponse = {
  code: 200,
  msg: 'ok',
  data: {
    items: [
      { id: 1, name: '深蹲', muscle_group: '腿部' },
      { id: 2, name: '卧推', muscle_group: '胸部' },
    ],
    pagination: { current: 1, pageSize: 20, total: 50, totalPages: 3 },
  },
}

const mockDetailResponse = {
  code: 200,
  msg: 'ok',
  data: {
    id: 1,
    name: '深蹲',
    muscle_group: '腿部',
    description: '经典下肢训练动作',
    difficulty: 'intermediate',
  },
}

describe('Exercise Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  describe('初始状态', () => {
    it('exercises 为空数组', () => {
      const store = useExerciseStore()
      expect(store.exercises).toEqual([])
      expect(store.currentExercise).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('pagination 默认值正确', () => {
      const store = useExerciseStore()
      expect(store.pagination.current).toBe(1)
      expect(store.pagination.pageSize).toBe(20)
      expect(store.pagination.total).toBe(0)
    })

    it('computed 默认值', () => {
      const store = useExerciseStore()
      expect(store.totalCount).toBe(0)
      expect(store.hasMore).toBe(false)
    })
  })

  describe('fetchList', () => {
    it('成功获取动作列表', async () => {
      vi.mocked(exerciseApi.getList).mockResolvedValue(mockListResponse)
      const store = useExerciseStore()

      await store.fetchList()

      expect(store.exercises).toHaveLength(2)
      expect(store.pagination.total).toBe(50)
      expect(store.totalCount).toBe(50)
      expect(store.hasMore).toBe(true) // page 1 of 3
      expect(store.loading).toBe(false)
    })

    it('reset=true 从第1页开始', async () => {
      vi.mocked(exerciseApi.getList).mockResolvedValue(mockListResponse)
      const store = useExerciseStore()
      store.pagination.current = 3

      await store.fetchList({ reset: true })

      expect(vi.mocked(exerciseApi.getList)).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 })
      )
    })

    it('API 返回错误码', async () => {
      vi.mocked(exerciseApi.getList).mockResolvedValue({ code: 500, msg: '服务器错误', data: null })
      const store = useExerciseStore()

      await store.fetchList()

      expect(store.error).toBe('服务器错误')
      expect(store.exercises).toEqual([])
    })

    it('网络异常', async () => {
      vi.mocked(exerciseApi.getList).mockRejectedValue(new Error('Network Error'))
      const store = useExerciseStore()

      await store.fetchList()

      expect(store.error).toBe('Network Error')
      expect(store.loading).toBe(false)
    })
  })

  describe('fetchDetail', () => {
    it('成功获取动作详情', async () => {
      vi.mocked(exerciseApi.getDetail).mockResolvedValue(mockDetailResponse)
      const store = useExerciseStore()

      await store.fetchDetail(1)

      expect(store.currentExercise).toEqual(mockDetailResponse.data)
    })

    it('API 返回错误', async () => {
      vi.mocked(exerciseApi.getDetail).mockResolvedValue({ code: 404, msg: '动作不存在', data: null })
      const store = useExerciseStore()

      await store.fetchDetail(999)

      expect(store.error).toBe('动作不存在')
      expect(store.currentExercise).toBeNull()
    })
  })

  describe('fetchFilterOptions', () => {
    it('从 API 获取并缓存', async () => {
      const mockOptions = { muscles: ['胸部', '背部'], equipment: ['哑铃'] }
      vi.mocked(exerciseApi.getFilterOptions).mockResolvedValue({ code: 200, data: mockOptions, msg: 'ok' })
      const mockSetItem = vi.fn()
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => null),
        setItem: mockSetItem,
        removeItem: vi.fn(),
      })

      const store = useExerciseStore()
      await store.fetchFilterOptions()

      expect(store.filterOptions).toEqual(mockOptions)
      expect(mockSetItem).toHaveBeenCalledWith('exercise_filter_options', expect.any(String))
    })

    it('使用未过期的缓存', async () => {
      const mockOptions = { muscles: ['胸部'], equipment: [] }
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'exercise_filter_options') {
            return JSON.stringify({ data: mockOptions, timestamp: Date.now() })
          }
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })

      const store = useExerciseStore()
      await store.fetchFilterOptions()

      expect(store.filterOptions).toEqual(mockOptions)
      expect(exerciseApi.getFilterOptions).not.toHaveBeenCalled()
    })

    it('缓存过期时重新请求', async () => {
      const oldOptions = { muscles: ['旧数据'], equipment: [] }
      const newOptions = { muscles: ['新数据'], equipment: ['杠铃'] }
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'exercise_filter_options') {
            return JSON.stringify({ data: oldOptions, timestamp: Date.now() - 25 * 60 * 60 * 1000 }) // 25h ago
          }
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })
      vi.mocked(exerciseApi.getFilterOptions).mockResolvedValue({ code: 200, data: newOptions, msg: 'ok' })

      const store = useExerciseStore()
      await store.fetchFilterOptions()

      expect(store.filterOptions).toEqual(newOptions)
      expect(exerciseApi.getFilterOptions).toHaveBeenCalled()
    })

    it('API 失败时使用过期缓存', async () => {
      const oldOptions = { muscles: ['兜底数据'], equipment: [] }
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key: string) => {
          if (key === 'exercise_filter_options') {
            return JSON.stringify({ data: oldOptions, timestamp: Date.now() - 48 * 60 * 60 * 1000 })
          }
          return null
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      })
      vi.mocked(exerciseApi.getFilterOptions).mockRejectedValue(new Error('API down'))

      const store = useExerciseStore()
      await store.fetchFilterOptions()

      expect(store.filterOptions).toEqual(oldOptions)
    })
  })

  describe('search', () => {
    it('设置关键词并重新获取列表', async () => {
      vi.mocked(exerciseApi.getList).mockResolvedValue(mockListResponse)
      const store = useExerciseStore()

      await store.search('深蹲')

      expect(store.searchKeyword).toBe('深蹲')
      expect(exerciseApi.getList).toHaveBeenCalledWith(
        expect.objectContaining({ search: '深蹲', page: 1 })
      )
    })
  })

  describe('favorites', () => {
    it('toggleFavorite 添加和移除', () => {
      const store = useExerciseStore()

      store.toggleFavorite(1)
      expect(store.isFavorite(1)).toBe(true)

      store.toggleFavorite(1)
      expect(store.isFavorite(1)).toBe(false)
    })

    it('isFavorite 检查收藏状态', () => {
      const store = useExerciseStore()
      expect(store.isFavorite(99)).toBe(false)

      store.toggleFavorite(99)
      expect(store.isFavorite(99)).toBe(true)
    })
  })

  describe('reset', () => {
    it('重置所有状态', async () => {
      vi.mocked(exerciseApi.getList).mockResolvedValue(mockListResponse)
      const store = useExerciseStore()
      await store.fetchList()
      store.searchKeyword = '测试'
      store.selectedMuscle = '胸部'

      store.reset()

      expect(store.exercises).toEqual([])
      expect(store.searchKeyword).toBe('')
      expect(store.selectedMuscle).toBeUndefined()
      expect(store.pagination.current).toBe(1)
      expect(store.error).toBeNull()
    })
  })

  describe('clearFilterCache', () => {
    it('清除 localStorage 缓存', () => {
      const mockRemoveItem = vi.fn()
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: mockRemoveItem,
      })

      const store = useExerciseStore()
      store.clearFilterCache()

      expect(mockRemoveItem).toHaveBeenCalledWith('exercise_filter_options')
    })
  })
})
