/**
 * User Profile API集成测试
 * 
 * 测试用户档案相关API的调用和数据流转
 * 
 * @module tests/integration/api/user
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server, mockUserProfile, addHandler, resetHandlers } from './setup'
import { userProfileApi } from '@/api/user'

// Mock token工具
vi.mock('@/utils/token', () => ({
  getToken: vi.fn(() => 'mock-token'),
  setToken: vi.fn(),
  clearToken: vi.fn()
}))

// localStorage mock数据存储
let localStorageMock: Record<string, string> = {}

describe('User Profile API集成测试', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' })
  })

  beforeEach(() => {
    // 设置localStorage mock
    localStorageMock = {}
    const localStorageStub = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => { localStorageMock[key] = value }),
      removeItem: vi.fn((key: string) => { delete localStorageMock[key] }),
      clear: vi.fn(() => { localStorageMock = {} }),
      length: 0,
      key: vi.fn()
    }
    vi.stubGlobal('localStorage', localStorageStub)
  })

  afterEach(() => {
    resetHandlers()
    vi.clearAllMocks()
    localStorageMock = {}
    vi.unstubAllGlobals()
  })

  afterAll(() => {
    server.close()
  })

  describe('get - 获取用户档案', () => {
    it('应该成功获取用户档案', async () => {
      const response = await userProfileApi.get()

      expect(response.code).toBe(200)
      expect(response.msg).toBe('成功')
      expect(response.data).toBeDefined()
      expect(response.data?.user_id).toBe(1)
      expect(response.data?.nickname).toBe('测试用户')
      expect(response.data?.height).toBe(175)
      expect(response.data?.weight).toBe(70)
    })

    it('应该处理未认证的请求', async () => {
      addHandler(
        http.get('http://localhost:8000/api/users/profile', () => {
          return HttpResponse.json({
            code: 401,
            msg: '未认证',
            data: null
          }, { status: 401 })
        })
      )

      const response = await userProfileApi.get()

      expect(response.code).toBe(401)
      expect(response.data).toBeNull()
    })

    it('应该处理服务器错误', async () => {
      addHandler(
        http.get('http://localhost:8000/api/users/profile', () => {
          return HttpResponse.json({
            code: 500,
            msg: '服务器错误',
            data: null
          }, { status: 500 })
        })
      )

      const response = await userProfileApi.get()

      expect(response.code).toBe(500)
      expect(response.data).toBeNull()
    })
  })

  describe('update - 更新用户档案', () => {
    it('应该成功更新用户档案', async () => {
      const updateData = {
        height: 180,
        weight: 75,
        training_goal: 'fat_loss' as const
      }

      const response = await userProfileApi.update(updateData)

      expect(response.code).toBe(200)
      expect(response.msg).toBe('更新成功')
      expect(response.data?.height).toBe(180)
      expect(response.data?.weight).toBe(75)
    })

    it('应该同步更新到localStorage', async () => {
      const updateData = {
        nickname: '更新后的昵称'
      }

      await userProfileApi.update(updateData)

      const storedProfile = localStorage.getItem('user_profile_v2')
      expect(storedProfile).toBeDefined()
      
      const parsed = JSON.parse(storedProfile!)
      expect(parsed.nickname).toBe('更新后的昵称')
    })

    it('应该处理验证错误', async () => {
      addHandler(
        http.post('http://localhost:8000/api/users/profile', () => {
          return HttpResponse.json({
            code: 422,
            msg: '身高必须在100-250cm之间',
            data: null
          }, { status: 422 })
        })
      )

      const updateData = {
        height: 50 // 无效值
      }

      const response = await userProfileApi.update(updateData)

      expect(response.code).toBe(422)
      expect(response.msg).toContain('身高')
    })

    it('应该处理部分更新', async () => {
      const updateData = {
        weight: 72
      }

      const response = await userProfileApi.update(updateData)

      expect(response.code).toBe(200)
      // 其他字段应该保持不变
      expect(response.data?.height).toBe(mockUserProfile.height)
      expect(response.data?.weight).toBe(72)
    })
  })

  describe('getFFMIHistory - 获取FFMI历史', () => {
    it('应该成功获取FFMI历史记录', async () => {
      addHandler(
        http.get('http://localhost:8000/api/users/profile/ffmi-history', ({ request }) => {
          const url = new URL(request.url)
          const limit = url.searchParams.get('limit') || '10'
          
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: [
              {
                id: 1,
                user_id: 1,
                height: 175,
                weight: 70,
                body_fat_percentage: 15,
                ffmi_data: { ffmi: 21.5, category: '中级' },
                recorded_at: '2026-01-01T00:00:00Z'
              },
              {
                id: 2,
                user_id: 1,
                height: 175,
                weight: 72,
                body_fat_percentage: 14,
                ffmi_data: { ffmi: 22.0, category: '中级' },
                recorded_at: '2026-01-07T00:00:00Z'
              }
            ].slice(0, parseInt(limit))
          })
        })
      )

      const response = await userProfileApi.getFFMIHistory(10)

      expect(response.code).toBe(200)
      expect(response.data).toHaveLength(2)
      expect(response.data?.[0].ffmi_data.ffmi).toBe(21.5)
    })

    it('应该支持limit参数', async () => {
      addHandler(
        http.get('http://localhost:8000/api/users/profile/ffmi-history', ({ request }) => {
          const url = new URL(request.url)
          const limit = parseInt(url.searchParams.get('limit') || '10')
          
          const allRecords = [
            { id: 1, ffmi_data: { ffmi: 21.5 } },
            { id: 2, ffmi_data: { ffmi: 22.0 } },
            { id: 3, ffmi_data: { ffmi: 22.5 } }
          ]
          
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: allRecords.slice(0, limit)
          })
        })
      )

      const response = await userProfileApi.getFFMIHistory(2)

      expect(response.code).toBe(200)
      expect(response.data).toHaveLength(2)
    })

    it('应该处理空历史记录', async () => {
      addHandler(
        http.get('http://localhost:8000/api/users/profile/ffmi-history', () => {
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: []
          })
        })
      )

      const response = await userProfileApi.getFFMIHistory()

      expect(response.code).toBe(200)
      expect(response.data).toHaveLength(0)
    })
  })
})
