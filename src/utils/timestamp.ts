/**
 * 统一时间戳处理
 *
 * 支持三种输入格式：
 * - ISO 8601 字符串 (如 "2026-02-25T10:30:00Z")
 * - 毫秒时间戳 (如 1740000000000)
 * - 秒级时间戳 (如 1740000000)
 *
 * 统一输出毫秒时间戳
 */
export function normalizeTimestamp(value: unknown): number {
  if (typeof value === 'number') {
    // 秒级时间戳 → 毫秒（小于 1e12 认为是秒级）
    return value < 1e12 ? value * 1000 : value
  }
  if (typeof value === 'string') {
    const parsed = new Date(value).getTime()
    return isNaN(parsed) ? Date.now() : parsed
  }
  return Date.now()
}
