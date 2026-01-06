/**
 * Auth API集成测试
 * 
 * 测试认证相关API的调用和数据流转
 * 
 * @module tests/integration/api/auth
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server, mockAuthResponse, addHandler, resetHandlers } from './setup'
import { login, register, logout, refreshToken } from '@/api/auth'

// Mock token工具
vi.mock('@/utils/token', () => ({
  getToken: vi.fn(() => 'mock-token'),
  getRefreshToken: vi.fn(() => 'mock-refresh-token'),
  setToken: vi.fn(),
  clearToken: vi.fn()
}))

describe('Auth API集成测试', () => {
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

  describe('login - 登录接口', () => {
    it('应该成功登录并返回用户信息和token', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await login(credentials)

      expect(response.code).toBe(200)
      expect(response.msg).toBe('登录成功')
      expect(response.data.user).toBeDefined()
      expect(response.data.user.email).toBe('test@example.com')
      expect(response.data.access_token).toBe('mock-access-token')
      expect(response.data.refresh_token).toBe('mock-refresh-token')
    })

    it('应该处理登录失败的情况', async () => {
      // 添加失败handler
      addHandler(
        http.post('http://localhost:8000/api/auth/login', () => {
          return HttpResponse.json({
            code: 401,
            msg: '邮箱或密码错误',
            data: null
          }, { status: 401 })
        })
      )

      const credentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      }

      await expect(login(credentials)).rejects.toThrow('邮箱或密码错误')
    })

    it('应该处理网络错误', async () => {
      addHandler(
        http.post('http://localhost:8000/api/auth/login', () => {
          return HttpResponse.error()
        })
      )

      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      }

      await expect(login(credentials)).rejects.toThrow()
    })

    it('应该支持remember_me参数', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
        remember_me: true
      }

      const response = await login(credentials)

      expect(response.code).toBe(200)
    })
  })

  describe('register - 注册接口', () => {
    it('应该成功注册新用户', async () => {
      const registerData = {
        nickname: '新用户',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      }

      const response = await register(registerData)

      expect(response.code).toBe(200)
      expect(response.msg).toBe('注册成功')
      expect(response.data.user).toBeDefined()
      expect(response.data.access_token).toBeDefined()
    })

    it('应该处理邮箱已存在的情况', async () => {
      addHandler(
        http.post('http://localhost:8000/api/auth/register', () => {
          return HttpResponse.json({
            code: 422,
            msg: '该邮箱已被注册',
            data: null
          }, { status: 422 })
        })
      )

      const registerData = {
        nickname: '新用户',
        email: 'existing@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      }

      await expect(register(registerData)).rejects.toThrow('该邮箱已被注册')
    })

    it('应该处理密码不匹配的情况', async () => {
      addHandler(
        http.post('http://localhost:8000/api/auth/register', () => {
          return HttpResponse.json({
            code: 422,
            msg: '两次输入的密码不一致',
            data: null
          }, { status: 422 })
        })
      )

      const registerData = {
        nickname: '新用户',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'different'
      }

      await expect(register(registerData)).rejects.toThrow('两次输入的密码不一致')
    })
  })

  describe('logout - 登出接口', () => {
    it('应该成功登出', async () => {
      const response = await logout()

      expect(response.code).toBe(200)
      expect(response.msg).toBe('登出成功')
    })

    it('应该处理未认证的登出请求', async () => {
      addHandler(
        http.post('http://localhost:8000/api/auth/logout', () => {
          return HttpResponse.json({
            code: 401,
            msg: '未认证',
            data: null
          }, { status: 401 })
        })
      )

      await expect(logout()).rejects.toThrow('未认证')
    })
  })

  describe('refreshToken - Token刷新接口', () => {
    it('应该成功刷新token', async () => {
      const response = await refreshToken()

      expect(response.code).toBe(200)
      expect(response.msg).toBe('刷新成功')
      expect(response.data.access_token).toBe('new-mock-access-token')
      expect(response.data.refresh_token).toBe('new-mock-refresh-token')
    })

    it('应该处理refresh_token过期的情况', async () => {
      addHandler(
        http.post('http://localhost:8000/api/auth/refresh', () => {
          return HttpResponse.json({
            code: 401,
            msg: 'Refresh token已过期',
            data: null
          }, { status: 401 })
        })
      )

      await expect(refreshToken()).rejects.toThrow('Refresh token已过期')
    })
  })
})
