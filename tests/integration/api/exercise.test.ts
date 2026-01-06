/**
 * Exercise API集成测试
 * 
 * 测试动作库相关API的调用和数据流转
 * 
 * @module tests/integration/api/exercise
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server, mockExercises, addHandler, resetHandlers } from './setup'
import { exerciseApi } from '@/api/exercise'

// Mock token工具
vi.mock('@/utils/token', () => ({
  getToken: vi.fn(() => 'mock-token'),
  setToken: vi.fn(),
  clearToken: vi.fn()
}))

describe('Exercise API集成测试', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  afterEach(() => {
    resetHandlers()
    vi.clearAllMocks()
  })

  afterAll(() => {
    server.close()
  })

  describe('getList - 获取动作列表', () => {
    it('应该成功获取动作列表', async () => {
      const response = await exerciseApi.getList()

      expect(response.code).toBe(200)
      expect(response.msg).toBe('成功')
      expect(response.data).toBeDefined()
      expect(response.data?.items).toHaveLength(2)
      expect(response.data?.pagination.total).toBe(2)
    })

    it('应该支持分页参数', async () => {
      const response = await exerciseApi.getList({
        page: 1,
        pageSize: 10
      })

      expect(response.code).toBe(200)
      expect(response.data?.pagination.current).toBe(1)
      expect(response.data?.pagination.pageSize).toBe(10)
    })

    it('应该支持搜索参数', async () => {
      addHandler(
        http.get('http://localhost:8000/api/exercises-v2', ({ request }) => {
          const url = new URL(request.url)
          const query = url.searchParams.get('query')
          
          const filtered = mockExercises.filter(e => 
            e.name_zh.includes(query || '') || e.name_en.toLowerCase().includes((query || '').toLowerCase())
          )
          
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: {
              rows: filtered,
              page: 1,
              per_page: 20,
              total: filtered.length,
              total_pages: 1
            }
          })
        })
      )

      const response = await exerciseApi.getList({
        search: '卧推'
      })

      expect(response.code).toBe(200)
      expect(response.data?.items.length).toBeGreaterThanOrEqual(1)
      expect(response.data?.items[0].name_zh).toContain('卧推')
    })

    it('应该支持肌肉群筛选', async () => {
      addHandler(
        http.get('http://localhost:8000/api/exercises-v2', ({ request }) => {
          const url = new URL(request.url)
          const muscle = url.searchParams.get('muscle')
          
          const filtered = mockExercises.filter(e => 
            !muscle || e.primary_muscle_zh === muscle
          )
          
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: {
              rows: filtered,
              page: 1,
              per_page: 20,
              total: filtered.length,
              total_pages: 1
            }
          })
        })
      )

      const response = await exerciseApi.getList({
        muscle: '胸大肌'
      })

      expect(response.code).toBe(200)
      response.data?.items.forEach(item => {
        expect(item.primary_muscle_zh).toBe('胸大肌')
      })
    })

    it('应该支持多条件筛选', async () => {
      addHandler(
        http.get('http://localhost:8000/api/exercises-v2', ({ request }) => {
          const url = new URL(request.url)
          const equipment = url.searchParams.get('equipment')
          const difficulty = url.searchParams.get('difficulty')
          
          let filtered = mockExercises
          if (equipment) {
            filtered = filtered.filter(e => equipment.split(',').includes(e.equipment_zh))
          }
          if (difficulty) {
            filtered = filtered.filter(e => difficulty.split(',').includes(e.difficulty_zh))
          }
          
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: {
              rows: filtered,
              page: 1,
              per_page: 20,
              total: filtered.length,
              total_pages: 1
            }
          })
        })
      )

      const response = await exerciseApi.getList({
        filters: {
          equipment: ['哑铃'],
          difficulty: ['初级']
        }
      })

      expect(response.code).toBe(200)
    })

    it('应该处理空结果', async () => {
      addHandler(
        http.get('http://localhost:8000/api/exercises-v2', () => {
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: {
              rows: [],
              page: 1,
              per_page: 20,
              total: 0,
              total_pages: 0
            }
          })
        })
      )

      const response = await exerciseApi.getList({
        search: '不存在的动作'
      })

      expect(response.code).toBe(200)
      expect(response.data?.items).toHaveLength(0)
      expect(response.data?.pagination.total).toBe(0)
    })
  })

  describe('getDetail - 获取动作详情', () => {
    it('应该成功获取动作详情', async () => {
      const response = await exerciseApi.getDetail(1)

      expect(response.code).toBe(200)
      expect(response.msg).toBe('成功')
      expect(response.data).toBeDefined()
      expect(response.data?.id).toBe(1)
      expect(response.data?.name_zh).toBe('杠铃卧推')
    })

    it('应该处理不存在的动作', async () => {
      // API实现在HTTP错误时返回code 500（catch块处理）
      const response = await exerciseApi.getDetail(999)

      // 由于axios在404时抛出错误，API返回500
      expect(response.code).toBe(500)
      expect(response.data).toBeNull()
    })

    it('应该处理服务器错误', async () => {
      addHandler(
        http.get('http://localhost:8000/api/exercises-v2/:id', () => {
          return HttpResponse.json({
            code: 500,
            msg: '服务器错误',
            data: null
          }, { status: 500 })
        })
      )

      const response = await exerciseApi.getDetail(1)

      expect(response.code).toBe(500)
      expect(response.data).toBeNull()
    })
  })

  describe('getFilterOptions - 获取筛选选项', () => {
    it('应该成功获取筛选选项', async () => {
      const response = await exerciseApi.getFilterOptions()

      expect(response.code).toBe(200)
      expect(response.msg).toBe('成功')
      expect(response.data).toBeDefined()
      expect(response.data?.muscle).toContain('胸大肌')
      expect(response.data?.equipment).toContain('杠铃')
      expect(response.data?.difficulty).toContain('初级')
    })

    it('应该返回所有筛选类型', async () => {
      const response = await exerciseApi.getFilterOptions()

      expect(response.code).toBe(200)
      expect(response.data).toHaveProperty('muscle')
      expect(response.data).toHaveProperty('equipment')
      expect(response.data).toHaveProperty('difficulty')
      expect(response.data).toHaveProperty('grip')
      expect(response.data).toHaveProperty('mechanic')
      expect(response.data).toHaveProperty('force')
      expect(response.data).toHaveProperty('kinetic_chain')
      expect(response.data).toHaveProperty('safety_level')
    })

    it('应该处理服务器错误', async () => {
      addHandler(
        http.get('http://localhost:8000/api/exercises-v2/filter-options', () => {
          return HttpResponse.json({
            code: 500,
            msg: '服务器错误',
            data: null
          }, { status: 500 })
        })
      )

      const response = await exerciseApi.getFilterOptions()

      expect(response.code).toBe(500)
      expect(response.data).toBeNull()
    })
  })
})
