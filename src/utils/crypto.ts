/**
 * 敏感数据加密工具
 * 使用 AES-GCM 加密算法保护本地存储的敏感健康信息
 */

// 加密密钥（实际项目中应从环境变量或服务端获取）
// 这里使用设备指纹 + 固定盐值生成密钥
const SALT = 'yuzhen-fitness-2026'

/**
 * 生成设备相关的加密密钥
 * 结合用户代理和屏幕信息生成唯一密钥
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const deviceFingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    navigator.language,
    SALT
  ].join('|')
  
  // 将字符串转换为 ArrayBuffer
  const encoder = new TextEncoder()
  const data = encoder.encode(deviceFingerprint)
  
  // 使用 SHA-256 生成密钥材料
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // 导入为 AES-GCM 密钥
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
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
    console.error('[Crypto] 加密失败:', error)
    // 加密失败时返回原始 JSON（降级处理）
    return JSON.stringify(data)
  }
}

/**
 * 解密敏感数据
 * @param encryptedData 加密后的 Base64 字符串
 * @returns 解密后的数据对象
 */
export async function decryptData<T>(encryptedData: string): Promise<T | null> {
  try {
    // 尝试直接解析 JSON（兼容未加密的旧数据）
    try {
      const parsed = JSON.parse(encryptedData)
      // 如果能直接解析，说明是未加密的数据
      return parsed as T
    } catch {
      // 不是 JSON，继续解密流程
    }
    
    const key = await getEncryptionKey()
    
    // 从 Base64 解码
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    
    // 分离 IV 和密文
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)
    
    // 解密
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    
    // 解码为字符串并解析 JSON
    const decoder = new TextDecoder()
    const jsonString = decoder.decode(plaintext)
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.error('[Crypto] 解密失败:', error)
    return null
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
