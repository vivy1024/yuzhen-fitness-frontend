import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@/stores/notification'

// Mock API
vi.mock('@/api/notification', () => ({
  getNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}))

import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification as deleteNotificationApi,
  markAllNotificationsAsRead,
} from '@/api/notification'

const mockNotifications = [
  { id: '1', type: 'system', title: '系统通知', content: '欢迎', read: false, read_at: null, created_at: '2026-02-21' },
  { id: '2', type: 'training', title: '训练提醒', content: '今天该练腿了', read: false, read_at: null, created_at: '2026-02-21' },
  { id: '3', type: 'membership', title: '会员到期', content: '即将到期', read: true, read_at: '2026-02-20', created_at: '2026-02-20' },
  { id: '4', type: 'system', title: '更新通知', content: '新版本', read: true, read_at: '2026-02-19', created_at: '2026-02-19' },
]

describe('Notification Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('notifications 为空数组', () => {
      const store = useNotificationStore()
      expect(store.notifications).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.unreadCount).toBe(0)
    })
  })

  describe('computed getters', () => {
    it('unreadCount 正确计算未读数', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any
      expect(store.unreadCount).toBe(2) // id 1, 2
    })

    it('unreadNotifications 过滤未读', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any
      expect(store.unreadNotifications).toHaveLength(2)
    })

    it('systemNotifications 过滤系统通知', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any
      expect(store.systemNotifications).toHaveLength(2) // id 1, 4
    })

    it('trainingNotifications 过滤训练通知', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any
      expect(store.trainingNotifications).toHaveLength(1)
    })

    it('membershipNotifications 过滤会员通知', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any
      expect(store.membershipNotifications).toHaveLength(1)
    })
  })

  describe('fetchNotifications', () => {
    it('成功获取通知列表', async () => {
      vi.mocked(getNotifications).mockResolvedValue({ code: 200, data: mockNotifications, msg: 'ok' })
      const store = useNotificationStore()

      await store.fetchNotifications()

      expect(store.notifications).toEqual(mockNotifications)
      expect(store.loading).toBe(false)
    })

    it('API 失败时抛出错误', async () => {
      vi.mocked(getNotifications).mockRejectedValue(new Error('Network Error'))
      const store = useNotificationStore()

      await expect(store.fetchNotifications()).rejects.toThrow('Network Error')
      expect(store.loading).toBe(false)
    })
  })

  describe('markAsRead', () => {
    it('成功标记单条为已读', async () => {
      vi.mocked(markNotificationAsRead).mockResolvedValue({ code: 200, data: null, msg: 'ok' })
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any

      await store.markAsRead('1')

      const n = store.notifications.find(n => n.id === '1')
      expect(n!.read).toBe(true)
      expect(n!.read_at).toBeTruthy()
    })

    it('API 失败时抛出错误', async () => {
      vi.mocked(markNotificationAsRead).mockRejectedValue(new Error('Fail'))
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any

      await expect(store.markAsRead('1')).rejects.toThrow('Fail')
    })
  })

  describe('markAllAsRead', () => {
    it('成功标记所有为已读', async () => {
      vi.mocked(markAllNotificationsAsRead).mockResolvedValue({ code: 200, data: null, msg: 'ok' })
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any

      await store.markAllAsRead()

      expect(store.unreadCount).toBe(0)
      store.notifications.forEach(n => {
        expect(n.read).toBe(true)
        expect(n.read_at).toBeTruthy()
      })
    })
  })

  describe('deleteNotification', () => {
    it('成功删除通知', async () => {
      vi.mocked(deleteNotificationApi).mockResolvedValue({ code: 200, data: null, msg: 'ok' })
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any

      await store.deleteNotification('2')

      expect(store.notifications).toHaveLength(3)
      expect(store.notifications.find(n => n.id === '2')).toBeUndefined()
    })
  })

  describe('addNotification', () => {
    it('添加新通知到头部', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any

      const newNotif = { id: '5', type: 'system', title: '新通知', content: '内容', read: false, read_at: null, created_at: '2026-02-22' }
      store.addNotification(newNotif as any)

      expect(store.notifications[0].id).toBe('5')
      expect(store.notifications).toHaveLength(5)
    })

    it('重复 id 不会重复添加', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any

      store.addNotification(mockNotifications[0] as any)

      expect(store.notifications).toHaveLength(4)
    })
  })

  describe('clearNotifications', () => {
    it('清空所有通知', () => {
      const store = useNotificationStore()
      store.notifications = [...mockNotifications] as any

      store.clearNotifications()

      expect(store.notifications).toEqual([])
      expect(store.unreadCount).toBe(0)
    })
  })
})
