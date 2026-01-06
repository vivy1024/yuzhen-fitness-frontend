/**
 * 图片优化工具
 * 提供图片压缩、格式转换、尺寸调整等功能
 */

/**
 * 图片压缩选项
 */
interface CompressOptions {
  /** 最大宽度 */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
  /** 压缩质量 (0-1) */
  quality?: number
  /** 输出格式 */
  format?: 'jpeg' | 'png' | 'webp'
  /** 是否保持宽高比 */
  maintainAspectRatio?: boolean
}

/**
 * 压缩图片
 * @param file 原始图片文件
 * @param options 压缩选项
 * @returns 压缩后的Blob
 */
export async function compressImage(
  file: File | Blob,
  options: CompressOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maintainAspectRatio = true,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // 计算目标尺寸
      let { width, height } = img
      
      if (maintainAspectRatio) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      } else {
        width = Math.min(width, maxWidth)
        height = Math.min(height, maxHeight)
      }

      // 创建Canvas
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      // 绘制图片
      ctx.drawImage(img, 0, 0, width, height)

      // 转换为Blob
      const mimeType = `image/${format}`
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('图片压缩失败'))
          }
        },
        mimeType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

/**
 * 将图片转换为Base64
 * @param file 图片文件
 * @returns Base64字符串
 */
export function imageToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = () => {
      reject(new Error('读取文件失败'))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * 从Base64创建Blob
 * @param base64 Base64字符串
 * @returns Blob对象
 */
export function base64ToBlob(base64: string): Blob {
  const parts = base64.split(';base64,')
  const contentType = parts[0].split(':')[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }

  return new Blob([uInt8Array], { type: contentType })
}

/**
 * 获取图片尺寸
 * @param file 图片文件
 * @returns 图片尺寸
 */
export function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

/**
 * 检查浏览器是否支持WebP格式
 * @returns 是否支持WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * 生成缩略图
 * @param file 原始图片文件
 * @param size 缩略图尺寸
 * @returns 缩略图Blob
 */
export async function generateThumbnail(
  file: File | Blob,
  size: number = 200
): Promise<Blob> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg',
    maintainAspectRatio: true,
  })
}

/**
 * 预加载图片
 * @param urls 图片URL列表
 * @returns 加载完成的Promise
 */
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => reject(new Error(`Failed to load: ${url}`))
          img.src = url
        })
    )
  )
}

/**
 * 获取图片的主色调
 * @param file 图片文件
 * @returns RGB颜色值
 */
export async function getDominantColor(
  file: File | Blob
): Promise<{ r: number; g: number; b: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // 创建小尺寸Canvas以提高性能
      const canvas = document.createElement('canvas')
      const size = 10
      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      ctx.drawImage(img, 0, 0, size, size)
      const imageData = ctx.getImageData(0, 0, size, size)
      const data = imageData.data

      let r = 0, g = 0, b = 0
      const pixelCount = size * size

      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
      }

      resolve({
        r: Math.round(r / pixelCount),
        g: Math.round(g / pixelCount),
        b: Math.round(b / pixelCount),
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 验证图片文件
 * @param file 文件
 * @param options 验证选项
 * @returns 验证结果
 */
export function validateImage(
  file: File,
  options: {
    maxSize?: number // 最大文件大小（字节）
    allowedTypes?: string[] // 允许的MIME类型
    minWidth?: number
    minHeight?: number
    maxWidth?: number
    maxHeight?: number
  } = {}
): Promise<{ valid: boolean; error?: string }> {
  const {
    maxSize = 10 * 1024 * 1024, // 默认10MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    minWidth = 0,
    minHeight = 0,
    maxWidth = Infinity,
    maxHeight = Infinity,
  } = options

  return new Promise(async (resolve) => {
    // 检查文件类型
    if (!allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: `不支持的图片格式，请上传 ${allowedTypes.map(t => t.split('/')[1]).join('、')} 格式`,
      })
      return
    }

    // 检查文件大小
    if (file.size > maxSize) {
      resolve({
        valid: false,
        error: `图片大小不能超过 ${formatFileSize(maxSize)}`,
      })
      return
    }

    // 检查图片尺寸
    try {
      const { width, height } = await getImageDimensions(file)
      
      if (width < minWidth || height < minHeight) {
        resolve({
          valid: false,
          error: `图片尺寸不能小于 ${minWidth}x${minHeight}`,
        })
        return
      }

      if (width > maxWidth || height > maxHeight) {
        resolve({
          valid: false,
          error: `图片尺寸不能大于 ${maxWidth}x${maxHeight}`,
        })
        return
      }

      resolve({ valid: true })
    } catch (error) {
      resolve({
        valid: false,
        error: '无法读取图片信息',
      })
    }
  })
}
