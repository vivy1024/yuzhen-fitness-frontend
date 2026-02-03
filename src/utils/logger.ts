/**
 * 环境感知日志工具
 * 生产环境自动禁用敏感日志输出，防止信息泄露
 * 
 * @module utils/logger
 * @version 1.0.0
 */

const isProduction = import.meta.env.PROD

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SENSITIVE = 'sensitive'
}

/**
 * 环境感知日志工具
 * - debug/info/sensitive: 仅开发环境输出
 * - warn/error: 所有环境输出
 */
export const logger = {
  /**
   * 调试日志 - 仅开发环境
   */
  debug: (...args: unknown[]) => {
    if (!isProduction) {
      console.log('[DEBUG]', ...args)
    }
  },
  
  /**
   * 信息日志 - 仅开发环境
   */
  info: (...args: unknown[]) => {
    if (!isProduction) {
      console.log('[INFO]', ...args)
    }
  },
  
  /**
   * 警告日志 - 所有环境
   */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args)
  },
  
  /**
   * 错误日志 - 所有环境
   */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args)
  },
  
  /**
   * 敏感信息日志 - 仅开发环境
   * 用于Token、用户信息等敏感数据的日志
   */
  sensitive: (...args: unknown[]) => {
    if (!isProduction) {
      console.log('[SENSITIVE]', ...args)
    }
  }
}

export default logger
