/**
 * Token Manager
 * Token安全管理器
 * 
 * 实现Token的安全存储、过期检测和自动刷新机制
 * 复刻自v2项目
 * 
 * @module utils/token-manager
 * @version 1.0.0
 */

import { parseJWTPayload, isTokenExpired, isTokenExpiringSoon } from './auth'

export interface TokenStorage {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
}

export type TokenRefreshCallback = (newToken: string) => void
export type TokenExpiredCallback = () => void

export interface TokenManagerConfig {
  expiringThreshold?: number
  autoRefreshInterval?: number
  enableAutoRefresh?: boolean
}

const DEFAULT_CONFIG: Required<TokenManagerConfig> = {
  expiringThreshold: 300, // 5分钟
  autoRefreshInterval: 60000, // 1分钟检查一次
  enableAutoRefresh: true,
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_EXPIRES_AT: 'token_expires_at',
} as const

/**
 * Token Manager 类 - 单例模式
 */
export class TokenManager {
  private static instance: TokenManager | null = null
  
  private tokenStorage: TokenStorage = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  }
  
  private config: Required<TokenManagerConfig>
  private refreshCallbacks: TokenRefreshCallback[] = []
  private expiredCallbacks: TokenExpiredCallback[] = []
  private autoRefreshTimer: ReturnType<typeof setInterval> | null = null
  private isRefreshing = false
  private refreshPromise: Promise<boolean> | null = null
  private refreshTokenApi: (() => Promise<{ token: string; expiresIn?: number } | null>) | null = null

  private constructor(config: TokenManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initFromStorage()
    
    if (this.config.enableAutoRefresh) {
      this.startAutoRefresh()
    }
  }

  public static getInstance(config?: TokenManagerConfig): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager(config)
    }
    return TokenManager.instance
  }

  public static resetInstance(): void {
    if (TokenManager.instance) {
      TokenManager.instance.stopAutoRefresh()
      TokenManager.instance = null
    }
  }

  private initFromStorage(): void {
    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
      const expiresAtStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT)
      const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null
      
      if (accessToken && !isTokenExpired(accessToken)) {
        this.tokenStorage.accessToken = accessToken
        this.tokenStorage.refreshToken = refreshToken
        this.tokenStorage.expiresAt = expiresAt
        console.log('🔄 TokenManager: 从localStorage恢复Token')
      }
    } catch (error) {
      console.error('❌ TokenManager: 初始化失败', error)
    }
  }

  public setRefreshTokenApi(
    refreshApi: () => Promise<{ token: string; expiresIn?: number } | null>
  ): void {
    this.refreshTokenApi = refreshApi
  }

  public getAccessToken(): string | null {
    return this.tokenStorage.accessToken
  }

  public getRefreshToken(): string | null {
    return this.tokenStorage.refreshToken
  }

  public setTokens(
    accessToken: string,
    refreshToken: string | null = null,
    expiresIn?: number
  ): void {
    this.tokenStorage.accessToken = accessToken
    
    if (refreshToken) {
      this.tokenStorage.refreshToken = refreshToken
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken)
    }
    
    if (expiresIn) {
      this.tokenStorage.expiresAt = Date.now() + expiresIn * 1000
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, this.tokenStorage.expiresAt.toString())
    } else {
      const payload = parseJWTPayload(accessToken)
      if (payload?.exp) {
        this.tokenStorage.expiresAt = payload.exp * 1000
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, this.tokenStorage.expiresAt.toString())
      }
    }
    
    // 同时存储到localStorage（兼容axios拦截器）
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken)
    
    console.log('✅ TokenManager: Token已设置', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      expiresAt: this.tokenStorage.expiresAt 
        ? new Date(this.tokenStorage.expiresAt).toISOString() 
        : null,
    })
    
    this.refreshCallbacks.forEach(callback => callback(accessToken))
  }

  public clearTokens(): void {
    this.tokenStorage = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    }
    
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT)
    localStorage.removeItem('user_info')
    localStorage.removeItem('current_user_id')
    
    console.log('🗑️ TokenManager: Token已清除')
  }

  public hasToken(): boolean {
    return !!this.tokenStorage.accessToken
  }

  public isTokenExpired(): boolean {
    if (!this.tokenStorage.accessToken) return true
    
    if (this.tokenStorage.expiresAt) {
      return Date.now() >= this.tokenStorage.expiresAt
    }
    
    return isTokenExpired(this.tokenStorage.accessToken)
  }

  public isTokenExpiring(threshold?: number): boolean {
    if (!this.tokenStorage.accessToken) return true
    
    const thresholdMs = (threshold ?? this.config.expiringThreshold) * 1000
    
    if (this.tokenStorage.expiresAt) {
      return this.tokenStorage.expiresAt - Date.now() < thresholdMs
    }
    
    return isTokenExpiringSoon(this.tokenStorage.accessToken, threshold ?? this.config.expiringThreshold)
  }

  public getTokenRemainingTime(): number {
    if (!this.tokenStorage.expiresAt) return 0
    const remaining = this.tokenStorage.expiresAt - Date.now()
    return Math.max(0, Math.floor(remaining / 1000))
  }

  public async refreshToken(): Promise<boolean> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }
    
    if (!this.refreshTokenApi) {
      console.error('❌ TokenManager: 未设置刷新Token的API函数')
      return false
    }
    
    if (!this.tokenStorage.refreshToken) {
      console.error('❌ TokenManager: 没有刷新令牌')
      this.handleTokenExpired()
      return false
    }
    
    this.isRefreshing = true
    
    this.refreshPromise = (async () => {
      try {
        console.log('🔄 TokenManager: 开始刷新Token...')
        
        const result = await this.refreshTokenApi!()
        
        if (result?.token) {
          this.setTokens(result.token, this.tokenStorage.refreshToken, result.expiresIn)
          console.log('✅ TokenManager: Token刷新成功')
          return true
        } else {
          throw new Error('刷新Token返回空结果')
        }
      } catch (error) {
        console.error('❌ TokenManager: Token刷新失败', error)
        this.handleTokenExpired()
        return false
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()
    
    return this.refreshPromise
  }

  private handleTokenExpired(): void {
    console.log('⚠️ TokenManager: Token已过期，触发过期回调')
    this.clearTokens()
    this.expiredCallbacks.forEach(callback => callback())
  }

  public onTokenRefresh(callback: TokenRefreshCallback): () => void {
    this.refreshCallbacks.push(callback)
    return () => {
      const index = this.refreshCallbacks.indexOf(callback)
      if (index > -1) this.refreshCallbacks.splice(index, 1)
    }
  }

  public onTokenExpired(callback: TokenExpiredCallback): () => void {
    this.expiredCallbacks.push(callback)
    return () => {
      const index = this.expiredCallbacks.indexOf(callback)
      if (index > -1) this.expiredCallbacks.splice(index, 1)
    }
  }

  public startAutoRefresh(): void {
    if (this.autoRefreshTimer) return
    
    this.autoRefreshTimer = setInterval(() => {
      this.checkAndRefresh()
    }, this.config.autoRefreshInterval)
    
    console.log('🔄 TokenManager: 自动刷新已启动')
  }

  public stopAutoRefresh(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer)
      this.autoRefreshTimer = null
      console.log('⏹️ TokenManager: 自动刷新已停止')
    }
  }

  private async checkAndRefresh(): Promise<void> {
    if (!this.hasToken()) return
    
    if (this.isTokenExpired()) {
      console.log('⚠️ TokenManager: Token已过期')
      this.handleTokenExpired()
      return
    }
    
    if (this.isTokenExpiring()) {
      console.log('⏰ TokenManager: Token即将过期，自动刷新...')
      await this.refreshToken()
    }
  }

  public getTokenStatus(): {
    hasAccessToken: boolean
    hasRefreshToken: boolean
    isExpired: boolean
    isExpiring: boolean
    remainingTime: number
    expiresAt: string | null
  } {
    return {
      hasAccessToken: !!this.tokenStorage.accessToken,
      hasRefreshToken: !!this.tokenStorage.refreshToken,
      isExpired: this.isTokenExpired(),
      isExpiring: this.isTokenExpiring(),
      remainingTime: this.getTokenRemainingTime(),
      expiresAt: this.tokenStorage.expiresAt 
        ? new Date(this.tokenStorage.expiresAt).toISOString() 
        : null,
    }
  }
}

export function getTokenManager(config?: TokenManagerConfig): TokenManager {
  return TokenManager.getInstance(config)
}

export default TokenManager
