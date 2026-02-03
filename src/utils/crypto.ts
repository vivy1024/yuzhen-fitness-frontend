/**
 * 敏感数据加密工具
 * 使用 AES-GCM 加密算法保护本地存储的敏感健康信息
 * 
 * @module utils/crypto
 * @version 2.0.0 - 增强密钥生成，结合用户ID
 */

import logger from './logger'

// 加密密钥盐值
const SALT = 'yuzhen-fitness-2026'

/**
 * 获取当前用户ID（如果已登录）
 */
function getCurrentUserId(): string | null {
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      return user.id?.toString() || null
    }
  } catch {
    // 忽略解析错误
  }
  return null
}

/**
 * 生成增强的加密密钥
 * 结合用户ID（如果已登录）和设备指纹
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const userId = getCurrentUserId()
  
  const deviceFingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    userId || 'anonymous', // 结合用户ID增强唯一性
    SALT
  ].join('|')
  
  const encoder = new TextEncoder()
  const data = encoder.encode(deviceFingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}


/**
 * 获取旧版加密密钥（不含用户ID，用于向后兼容）
 */
async function getLegacyEncryptionKey(): Promise<CryptoKey> {
  const deviceFingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    SALT
  ].join('|')
  
  const encoder = new TextEncoder()
  const data = encoder.encode(deviceFingerprint)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 使用指定密钥解密数据
 */
async function decryptWithKey<T>(encryptedData: string, key: CryptoKey): Promise<T> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)
  
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  
  const decoder = new TextDecoder()
  const jsonString = decoder.decode(plaintext)
  return JSON.parse(jsonString) as T
}

/**
 * 加密敏感数据
 * @param data 要加密的数据对象
 * @returns 加密后的 Base64 字符串，包含 IV
 */
export async function encryptData<T>(data: T): Promise<string> {
  try {
    const key = await getEncryptionKey()
    const encoder = new TextEncoder()
    const plaintext = encoder.encode(JSON.stringify(data))
    
    // 生成随机 IV（初始化向量）
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // 加密
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext
    )
    
    // 将 IV 和密文合并，然后转为 Base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(ciphertext), iv.length)
    
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    logger.error('[Crypto] 加密失败:', error)
    // 加密失败时返回原始 JSON（降级处理）
    return JSON.stringify(data)
  }
}

/**
 * 解密敏感数据（兼容旧格式）
 * 先尝试用新密钥解密，失败后尝试旧密钥
 * @param encryptedData 加密后的 Base64 字符串
 * @returns 解密后的数据对象
 */
export async function decryptData<T>(encryptedData: string): Promise<T | null> {
  // 尝试直接解析 JSON（兼容未加密的旧数据）
  try {
    const parsed = JSON.parse(encryptedData)
    return parsed as T
  } catch {
    // 不是 JSON，继续解密流程
  }
  
  // 尝试用当前密钥（含用户ID）解密
  try {
    return await decryptWithKey<T>(encryptedData, await getEncryptionKey())
  } catch {
    // 尝试用旧密钥（不含用户ID）解密，实现向后兼容
    try {
      logger.debug('[Crypto] 尝试使用旧密钥解密...')
      return await decryptWithKey<T>(encryptedData, await getLegacyEncryptionKey())
    } catch (error) {
      logger.error('[Crypto] 解密失败:', error)
      return null
    }
  }
}

/**
 * 检查 Web Crypto API 是否可用
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function'
}
