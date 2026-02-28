# Feedback Store

> 自动生成 | 对应源文件: stores/feedback.ts

## 概述

Feedback Store 负责管理用户反馈的提交、查询和历史记录功能。支持反馈类型分类（功能建议/BUG反馈/问题咨询/其他）、图片上传、联系信息记录，以及反馈状态的跟踪（待处理/处理中/已解决/已关闭）。

## State

```typescript
// 反馈历史列表
const history = ref<Feedback[]>([])

// 加载状态
const isLoading = ref(false)

// 错误信息
const error = ref<string | null>(null)
```

## Actions

### 提交反馈

```typescript
/**
 * 提交新反馈
 * @param params - 反馈参数（类型、内容、图片、联系方式）
 * @returns Promise<Feedback> - 返回创建的反馈对象
 */
const submitFeedback = async (params: SubmitFeedbackParams): Promise<Feedback>
```

### 获取历史

```typescript
/**
 * 获取用户反馈历史
 * @returns Promise<void>
 */
const fetchHistory = async (): Promise<void>
```

### 查询详情

```typescript
/**
 * 根据ID获取反馈详情
 * @param id - 反馈ID
 * @returns Feedback | undefined
 */
const getFeedbackById = (id: number): Feedback | undefined
```

### 状态管理

```typescript
// 清空错误信息
const clearError = () => void

// 重置Store状态（清空历史、加载状态、错误）
const reset = () => void
```

## Getters

无独立的 computed Getter，主要通过 history 数组和相关方法获取数据。

## 使用示例

### 1. 提交用户反馈

```typescript
import { useFeedbackStore } from '@/stores/feedback'

const feedbackStore = useFeedbackStore()

const handleSubmit = async () => {
  try {
    const feedback = await feedbackStore.submitFeedback({
      type: 'feature',
      content: '希望增加训练计划分享功能',
      images: ['https://cdn.example.com/img1.jpg'],
      contact: 'user@example.com'
    })
    console.log('反馈提交成功:', feedback.id)
  } catch (err) {
    console.error('提交失败:', feedbackStore.error)
  }
}
```

### 2. 查看反馈历史

```typescript
import { useFeedbackStore } from '@/stores/feedback'

const feedbackStore = useFeedbackStore()

// 页面加载时获取历史
onMounted(async () => {
  await feedbackStore.fetchHistory()

  // 渲染反馈列表
  feedbackStore.history.forEach(item => {
    console.log(`[${item.status}] ${item.type}: ${item.content}`)
  })
})
```

### 3. 查看单条反馈详情

```typescript
import { useFeedbackStore } from '@/stores/feedback'

const feedbackStore = useFeedbackStore()

const viewDetail = (feedbackId: number) => {
  const feedback = feedbackStore.getFeedbackById(feedbackId)

  if (feedback) {
    console.log('反馈详情:', feedback)
    console.log('回复内容:', feedback.reply)
    console.log('回复时间:', feedback.reply_at)
  }
}
```

---

**维护者**: 薛小川
**最后更新**: 2026-02-28