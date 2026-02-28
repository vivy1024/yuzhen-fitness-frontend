# User Store

> 自动生成 | 对应源文件: stores/user.ts

## 概述

User Store 负责管理用户档案的完整生命周期，包括本地存储、服务器同步、FFMI计算和加密存储。支持优先服务器、本地缓存、空档案的加载策略。

## State

| 状态 | 类型 | 说明 |
|------|------|------|
| `userProfile` | `ref<UserProfile \| null>` | 用户档案数据 |
| `ffmiData` | `ref<FFMIAssessment \| null>` | FFMI评估数据 |
| `loading` | `ref<boolean>` | 加载状态 |
| `lastSyncAt` | `ref<string \| null>` | 最后同步时间 |
| `syncedToServer` | `ref<boolean>` | 是否已同步到服务器 |
| `error` | `ref<string>` | 错误信息 |
| `ffmiHistory` | `ref<FFMIHistory[]>` | FFMI历史记录 |

## Getters

| Getter | 说明 |
|--------|------|
| `isComplete` | 档案是否完整（必填字段都已填写） |
| `completionRate` | 档案完整度百分比 |
| `isBeginner` | 是否为初学者 |
| `userId` | 用户ID |
| `userName` | 用户昵称 |

## Actions

### 初始化与加载

```typescript
// 初始化档案（优先服务器 -> 本地 -> 空档案）
async function init(): Promise<void>

// 从本地加载
async function loadFromLocal(): Promise<UserProfile | null>

// 从服务器加载
async function loadFromServer(): Promise<UserProfile | null>
```

### 保存与同步

```typescript
// 保存到本地（加密健康数据）
async function saveToLocal(): Promise<{ success: boolean; message: string }>

// 上传到服务器
async function uploadToServer(): Promise<{ success: boolean; message: string }>
```

### 档案更新

```typescript
// 更新基础信息
async function updateBasicInfo(info: BasicInfo): Promise<void>

// 更新健身目标
async function updateFitnessGoals(goals: FitnessGoals): Promise<void>

// 更新训练偏好
async function updateTrainingPreferences(preferences: TrainingPreferences): Promise<void>

// 更新力量数据
async function updateStrengthData(data: StrengthData): Promise<void>

// 更新健康状况
async function updateHealthStatus(status: HealthStatus): Promise<void>

// 更新营养档案
async function updateNutritionProfile(profile: NutritionProfile): Promise<void>

// 更新休息模式
async function updateRestPattern(pattern: string | null): Promise<void>
```

### FFMI计算

```typescript
// 计算用户FFMI
async function calculateUserFFMI(): Promise<FFMIAssessment>

// 设置FFMI数据
function setFFMIData(data: FFMIAssessment): void

// 加载FFMI历史
async function loadFFMIHistory(limit?: number): Promise<FFMIHistory[]>
```

### 档案管理

```typescript
// 创建空档案
function createEmptyProfile(): void

// 重置档案
function resetProfile(): void

// 清除错误
function clearError(): void

// 触发DAML-RAG预热
function triggerWarmup(forceRefresh?: boolean): void
```

## 使用示例

### 1. 初始化用户档案

```typescript
const userStore = useUserStore()

// 初始化（自动选择最佳数据源）
await userStore.init()

// 检查档案状态
console.log('完整度:', userStore.completionRate, '%')
console.log('是否完成:', userStore.isComplete)
```

### 2. 更新用户信息

```typescript
// 更新基础信息
await userStore.updateBasicInfo({
  nickname: '健身达人',
  age: 28,
  gender: 'male',
  height: 175,
  weight: 70,
  fitness_level: 'intermediate'
})

// 更新健身目标
await userStore.updateFitnessGoals({
  primary_goal: '增肌',
  secondary_goals: ['提高力量'],
  training_split: 'push_pull_legs'
})
```

### 3. 计算FFMI

```typescript
// 确保有足够的身体数据
if (userStore.userProfile?.basic_info.height &&
    userStore.userProfile?.basic_info.weight) {

  // 计算FFMI
  const ffmi = await userStore.calculateUserFFMI()

  console.log('FFMI:', ffmi.ffmi)
  console.log('评估:', ffmi.assessment)
  console.log('训练建议:', ffmi.training_recommendation)
}
```

### 4. 同步到服务器

```typescript
// 保存到本地
await userStore.saveToLocal()

// 上传到服务器（会触发DAML-RAG预热）
const result = await userStore.uploadToServer()

if (result.success) {
  console.log('档案已同步到服务器')
}
```

### 5. 检查登录状态和数据一致性

```typescript
// 检查是否已同步
console.log('已同步到服务器:', userStore.syncedToServer)
console.log('最后同步:', userStore.lastSyncAt)

// 如果未同步，可能有本地更改未上传
if (!userStore.syncedToServer && userStore.userProfile) {
  // 提示用户同步
}
```

---

**维护者**: 薛小川
**最后更新**: 2025-01-02