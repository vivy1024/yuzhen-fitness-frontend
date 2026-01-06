/**
 * Training Plan API集成测试
 * 
 * 测试训练计划相关API的调用和数据流转
 * 
 * @module tests/integration/api/training-plan
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server, mockTrainingPlans, mockExercises, addHandler, resetHandlers } from './setup'
import {
  getTrainingPlans,
  getTrainingPlanDetail,
  importTrainingPlan,
  deleteTrainingPlan,
  activateTrainingPlan,
  startTrainingPlan
} from '@/api/training-plan'

// Mock token工具
vi.mock('@/utils/token', () => ({
  getToken: vi.fn(() => 'mock-token'),
  getRefreshToken: vi.fn(() => 'mock-refresh-token'),
  setToken: vi.fn(),
  clearToken: vi.fn()
}))

describe('Training Plan API集成测试', () => {
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

  describe('getTrainingPlans - 获取训练计划列表', () => {
    it('应该成功获取训练计划列表', async () => {
      const response = await getTrainingPlans()

      expect(response.code).toBe(200)
      expect(response.msg).toBe('成功')
      expect(response.data).toHaveLength(1)
      expect(response.data[0].name).toBe('增肌训练计划')
    })

    it('应该支持状态筛选', async () => {
      addHandler(
        http.get('http://localhost:8000/api/training/plans', ({ request }) => {
          const url = new URL(request.url)
          const status = url.searchParams.get('status')
          
          const filtered = mockTrainingPlans.filter(p => 
            !status || (status === 'active' ? p.isActive : !p.isActive)
          )
          
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: filtered
          })
        })
      )

      const response = await getTrainingPlans({ status: 'active' })

      expect(response.code).toBe(200)
      response.data.forEach(plan => {
        expect(plan.isActive).toBe(true)
      })
    })

    it('应该支持难度筛选', async () => {
      addHandler(
        http.get('http://localhost:8000/api/training/plans', ({ request }) => {
          const url = new URL(request.url)
          const difficulty = url.searchParams.get('difficulty')
          
          const filtered = mockTrainingPlans.filter(p => 
            !difficulty || p.difficulty === difficulty
          )
          
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: filtered
          })
        })
      )

      const response = await getTrainingPlans({ difficulty: 'intermediate' })

      expect(response.code).toBe(200)
    })

    it('应该处理空列表', async () => {
      addHandler(
        http.get('http://localhost:8000/api/training/plans', () => {
          return HttpResponse.json({
            code: 200,
            msg: '成功',
            data: []
          })
        })
      )

      const response = await getTrainingPlans()

      expect(response.code).toBe(200)
      expect(response.data).toHaveLength(0)
    })
  })

  describe('getTrainingPlanDetail - 获取训练计划详情', () => {
    it('应该成功获取训练计划详情', async () => {
      const response = await getTrainingPlanDetail(1)

      expect(response.code).toBe(200)
      expect(response.msg).toBe('成功')
      expect(response.data.id).toBe(1)
      expect(response.data.name).toBe('增肌训练计划')
      expect(response.data.exercises).toBeDefined()
      expect(response.data.targetMuscles).toContain('胸大肌')
    })

    it('应该处理不存在的计划', async () => {
      // API在HTTP 404时会抛出错误
      try {
        await getTrainingPlanDetail(999)
        // 如果没有抛出错误，测试失败
        expect.fail('应该抛出错误')
      } catch (error: any) {
        expect(error.message).toBe('计划不存在')
      }
    })

    it('应该包含安全提示', async () => {
      const response = await getTrainingPlanDetail(1)

      expect(response.code).toBe(200)
      expect(response.data.safetyNotes).toBeDefined()
      expect(response.data.safetyNotes).toContain('注意热身')
    })
  })

  describe('importTrainingPlan - 导入训练计划', () => {
    it('应该成功导入训练计划', async () => {
      const planData = {
        name: '新训练计划',
        description: '测试计划',
        weeks: 4,
        frequency: 3,
        exercises: mockExercises
      }

      const response = await importTrainingPlan(planData)

      expect(response.code).toBe(200)
      expect(response.msg).toBe('导入成功')
      expect(response.data.id).toBeDefined()
      expect(response.data.name).toBe('新训练计划')
    })

    it('应该处理验证错误', async () => {
      addHandler(
        http.post('http://localhost:8000/api/training/plans/import', () => {
          return HttpResponse.json({
            code: 422,
            msg: '计划名称不能为空',
            data: null
          }, { status: 422 })
        })
      )

      const planData = {
        name: '',
        weeks: 4,
        frequency: 3,
        exercises: []
      }

      await expect(importTrainingPlan(planData)).rejects.toThrow('计划名称不能为空')
    })

    it('应该支持可选字段', async () => {
      const planData = {
        name: '简单计划',
        weeks: 2,
        frequency: 2,
        exercises: [],
        target_muscles: ['胸大肌'],
        safety_notes: ['注意安全'],
        difficulty: 'beginner' as const
      }

      const response = await importTrainingPlan(planData)

      expect(response.code).toBe(200)
    })
  })

  describe('deleteTrainingPlan - 删除训练计划', () => {
    it('应该成功删除训练计划', async () => {
      const response = await deleteTrainingPlan(1)

      expect(response.code).toBe(200)
      expect(response.msg).toBe('删除成功')
    })

    it('应该处理不存在的计划', async () => {
      addHandler(
        http.delete('http://localhost:8000/api/training/plans/:id', () => {
          return HttpResponse.json({
            code: 404,
            msg: '计划不存在',
            data: null
          }, { status: 404 })
        })
      )

      await expect(deleteTrainingPlan(999)).rejects.toThrow('计划不存在')
    })

    it('应该处理正在使用的计划', async () => {
      addHandler(
        http.delete('http://localhost:8000/api/training/plans/:id', () => {
          return HttpResponse.json({
            code: 400,
            msg: '该计划正在使用中，无法删除',
            data: null
          }, { status: 400 })
        })
      )

      await expect(deleteTrainingPlan(1)).rejects.toThrow('该计划正在使用中')
    })
  })

  describe('activateTrainingPlan - 激活训练计划', () => {
    it('应该成功激活训练计划', async () => {
      addHandler(
        http.post('http://localhost:8000/api/training/plans/:id/activate', ({ params }) => {
          return HttpResponse.json({
            code: 200,
            msg: '激活成功',
            data: {
              id: parseInt(params.id as string),
              isActive: true
            }
          })
        })
      )

      const response = await activateTrainingPlan(1)

      expect(response.code).toBe(200)
      expect(response.data.isActive).toBe(true)
    })

    it('应该处理不存在的计划', async () => {
      addHandler(
        http.post('http://localhost:8000/api/training/plans/:id/activate', () => {
          return HttpResponse.json({
            code: 404,
            msg: '计划不存在',
            data: null
          }, { status: 404 })
        })
      )

      await expect(activateTrainingPlan(999)).rejects.toThrow('计划不存在')
    })
  })

  describe('startTrainingPlan - 开始训练计划', () => {
    it('应该成功开始训练计划', async () => {
      addHandler(
        http.post('http://localhost:8000/api/training/plans/:id/start', ({ params }) => {
          return HttpResponse.json({
            code: 200,
            msg: '开始成功',
            data: {
              id: parseInt(params.id as string),
              startedAt: new Date().toISOString()
            }
          })
        })
      )

      const response = await startTrainingPlan(1)

      expect(response.code).toBe(200)
      expect(response.data.startedAt).toBeDefined()
    })

    it('应该处理已开始的计划', async () => {
      addHandler(
        http.post('http://localhost:8000/api/training/plans/:id/start', () => {
          return HttpResponse.json({
            code: 400,
            msg: '该计划已经开始',
            data: null
          }, { status: 400 })
        })
      )

      await expect(startTrainingPlan(1)).rejects.toThrow('该计划已经开始')
    })
  })
})
