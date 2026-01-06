/**
 * MSW测试设置
 * 
 * 配置Mock Service Worker用于API集成测试
 * 
 * @module tests/integration/api/setup
 */

import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// API基础URL
const API_BASE_URL = 'http://localhost:8000/api'

// 默认Mock数据
export const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  nickname: '测试用户',
  avatar: null
}

export const mockAuthResponse = {
  code: 200,
  msg: '登录成功',
  data: {
    user: mockUser,
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    token_type: 'Bearer',
    expires_in: 3600
  }
}

export const mockUserProfile = {
  user_id: 1,
  nickname: '测试用户',
  gender: 'male',
  age: 25,
  height: 175,
  weight: 70,
  body_fat_percentage: 15,
  training_goal: 'muscle_gain',
  experience_level: 'intermediate',
  training_frequency: 4,
  bmi: 22.9,
  ffmi: 21.5
}

export const mockExercises = [
  {
    id: 1,
    name_zh: '杠铃卧推',
    name_en: 'Barbell Bench Press',
    primary_muscle_zh: '胸大肌',
    equipment_zh: '杠铃',
    difficulty_zh: '中级'
  },
  {
    id: 2,
    name_zh: '哑铃飞鸟',
    name_en: 'Dumbbell Fly',
    primary_muscle_zh: '胸大肌',
    equipment_zh: '哑铃',
    difficulty_zh: '初级'
  }
]

export const mockTrainingPlans = [
  {
    id: 1,
    name: '增肌训练计划',
    description: '适合中级训练者的增肌计划',
    weeks: 8,
    frequency: 4,
    difficulty: 'intermediate',
    goal: 'muscle_gain',
    isActive: true,
    type: 'ai_generated',
    exerciseCount: 12,
    createdAt: '2026-01-01T00:00:00Z'
  }
]

// 默认handlers - 注意：更具体的路由要放在前面
export const handlers = [
  // 认证API
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json(mockAuthResponse)
  }),

  http.post(`${API_BASE_URL}/auth/register`, () => {
    return HttpResponse.json({
      code: 200,
      msg: '注册成功',
      data: mockAuthResponse.data
    })
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      code: 200,
      msg: '登出成功',
      data: null
    })
  }),

  http.post(`${API_BASE_URL}/auth/refresh`, () => {
    return HttpResponse.json({
      code: 200,
      msg: '刷新成功',
      data: {
        access_token: 'new-mock-access-token',
        refresh_token: 'new-mock-refresh-token',
        token_type: 'Bearer',
        expires_in: 3600
      }
    })
  }),

  // 用户档案API
  http.get(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      code: 200,
      msg: '成功',
      data: mockUserProfile
    })
  }),

  http.post(`${API_BASE_URL}/users/profile`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      code: 200,
      msg: '更新成功',
      data: { ...mockUserProfile, ...body }
    })
  }),

  // 动作库API - filter-options 必须在 :id 之前
  http.get(`${API_BASE_URL}/exercises-v2/filter-options`, () => {
    return HttpResponse.json({
      code: 200,
      msg: '成功',
      data: {
        muscle: ['胸大肌', '背阔肌', '股四头肌'],
        equipment: ['杠铃', '哑铃', '器械'],
        difficulty: ['初级', '中级', '高级'],
        grip: ['正握', '反握', '对握'],
        mechanic: ['复合', '孤立'],
        force: ['推', '拉'],
        kinetic_chain: ['开链', '闭链'],
        safety_level: ['安全', '中等', '高风险']
      }
    })
  }),

  http.get(`${API_BASE_URL}/exercises-v2`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '20')
    
    return HttpResponse.json({
      code: 200,
      msg: '成功',
      data: {
        rows: mockExercises,
        page,
        per_page: perPage,
        total: mockExercises.length,
        total_pages: 1
      }
    })
  }),

  http.get(`${API_BASE_URL}/exercises-v2/:id`, ({ params }) => {
    const id = parseInt(params.id as string)
    const exercise = mockExercises.find(e => e.id === id)
    
    if (exercise) {
      return HttpResponse.json({
        code: 200,
        msg: '成功',
        data: exercise
      })
    }
    
    return HttpResponse.json({
      code: 404,
      msg: '动作不存在',
      data: null
    }, { status: 404 })
  }),

  // 训练计划API
  http.get(`${API_BASE_URL}/training/plans`, () => {
    return HttpResponse.json({
      code: 200,
      msg: '成功',
      data: mockTrainingPlans
    })
  }),

  http.get(`${API_BASE_URL}/training/plans/:id`, ({ params }) => {
    const id = parseInt(params.id as string)
    const plan = mockTrainingPlans.find(p => p.id === id)
    
    if (plan) {
      return HttpResponse.json({
        code: 200,
        msg: '成功',
        data: {
          ...plan,
          exercises: mockExercises,
          targetMuscles: ['胸大肌', '三角肌前束'],
          safetyNotes: ['注意热身', '控制重量']
        }
      })
    }
    
    return HttpResponse.json({
      code: 404,
      msg: '计划不存在',
      data: null
    }, { status: 404 })
  }),

  http.post(`${API_BASE_URL}/training/plans/import`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      code: 200,
      msg: '导入成功',
      data: {
        id: 2,
        name: body.name,
        createdAt: new Date().toISOString()
      }
    })
  }),

  http.delete(`${API_BASE_URL}/training/plans/:id`, () => {
    return HttpResponse.json({
      code: 200,
      msg: '删除成功',
      data: null
    })
  })
]

// 创建MSW服务器
export const server = setupServer(...handlers)

// 测试辅助函数
export const resetHandlers = () => server.resetHandlers()

export const addHandler = (handler: ReturnType<typeof http.get | typeof http.post>) => {
  server.use(handler)
}
