# 评分系统API文档

**版本**: v2.0.0  
**更新日期**: 2026-01-17  
**状态**: ✅ 已完成

---

## 概述

评分系统实现了三轨评分体系，用于评估AI回复质量和个性化程度。

### 三轨评分体系

1. **用户体验评分** (5维度，用户填写)
   - 易懂性 (clarity)
   - 实用性 (practicality)
   - 详细程度 (detail)
   - 友好度 (friendliness)
   - 整体满意度 (satisfaction)

2. **个性化感知评分** (4维度，后端自动计算)
   - 档案利用率 (profile_utilization_rate)
   - 目标对齐度 (goal_alignment)
   - 独特性 (uniqueness)
   - 动态调整 (dynamic_adjustment)

3. **专家专业评分** (6维度，可选)
   - 专业准确性
   - 科学合理性
   - 安全性
   - 完整性
   - 实用性
   - 个性化适配度

---

## API端点

### 1. 提交评分

**端点**: `POST /api/v2/quality/rating`  
**认证**: 需要JWT Token  
**说明**: 提交用户体验评分，后端自动计算个性化感知评分

#### 请求参数

```typescript
{
  session_id: string          // 会话ID（必填）
  user_experience: {          // 用户体验评分（必填）
    clarity: number           // 易懂性 (1-5)
    practicality: number      // 实用性 (1-5)
    detail: number            // 详细程度 (1-5)
    friendliness: number      // 友好度 (1-5)
    satisfaction: number      // 整体满意度 (1-5)
  }
  feedback_text?: string      // 文本反馈（可选，最多1000字）
}
```

#### 响应数据

```typescript
{
  code: 200,
  msg: "评分成功",
  data: {
    session_id: string
    user_experience: {
      clarity: number
      practicality: number
      detail: number
      friendliness: number
      satisfaction: number
    }
    personalization: {
      profile_utilization_rate: number  // 档案利用率 (0-100)
      goal_alignment: number            // 目标对齐度 (0-100)
      uniqueness: number                // 独特性 (0-100)
      dynamic_adjustment: number        // 动态调整 (0-100)
    }
    personalization_grade: string       // 个性化等级 (S/A/B/C/D)
    overall_score: number               // 综合评分 (0-5)
    fewshot_eligible: boolean           // Few-Shot资格
  }
}
```

#### 示例

**请求**:
```bash
curl -X POST http://localhost:8000/api/v2/quality/rating \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "sess_123456",
    "user_experience": {
      "clarity": 5,
      "practicality": 4,
      "detail": 5,
      "friendliness": 5,
      "satisfaction": 5
    },
    "feedback_text": "回复很专业，训练计划很实用！"
  }'
```

**响应**:
```json
{
  "code": 200,
  "msg": "评分成功",
  "data": {
    "session_id": "sess_123456",
    "user_experience": {
      "clarity": 5,
      "practicality": 4,
      "detail": 5,
      "friendliness": 5,
      "satisfaction": 5
    },
    "personalization": {
      "profile_utilization_rate": 85,
      "goal_alignment": 90,
      "uniqueness": 80,
      "dynamic_adjustment": 85
    },
    "personalization_grade": "A",
    "overall_score": 4.8,
    "fewshot_eligible": true
  }
}
```

---

### 2. 获取会话评分

**端点**: `GET /api/v2/quality/rating/:sessionId`  
**认证**: 需要JWT Token  
**说明**: 获取指定会话的评分详情

#### 路径参数

- `sessionId`: 会话ID

#### 响应数据

与提交评分的响应格式相同。

#### 示例

**请求**:
```bash
curl -X GET http://localhost:8000/api/v2/quality/rating/sess_123456 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 3. 检查Few-Shot资格

**端点**: `GET /api/v2/quality/rating/:sessionId/eligibility`  
**认证**: 需要JWT Token  
**说明**: 检查会话是否符合Few-Shot学习池准入条件

#### 路径参数

- `sessionId`: 会话ID

#### 响应数据

```typescript
{
  code: 200,
  msg: "获取成功",
  data: {
    session_id: string
    eligible: boolean           // 是否符合资格
    reason: string              // 资格判断原因
    personalization_grade: string
    overall_score: number
  }
}
```

#### Few-Shot准入规则

1. **三轨高分**: 综合评分 ≥ 4.0
2. **档案利用**: 档案利用率 ≥ 60%
3. **安全性**: 安全评分 ≥ 3（一票否决）
4. **冷启动保护**: 前3条对话不计入Few-Shot池

---

## 前端集成

### API调用示例

```typescript
import { submitRating } from '@/api/rating'
import type { Rating } from '@/components/chat/RatingDialog.vue'

// 提交评分
const handleSubmitRating = async (rating: Rating) => {
  try {
    const response = await submitRating(rating)
    
    if (response.code === 200) {
      console.log('评分成功:', response.data)
      // 更新本地消息状态
      message.rating = rating
      message.personalizationScore = response.data.personalization.profile_utilization_rate / 100
    }
  } catch (error) {
    console.error('评分失败:', error)
  }
}
```

### 数据格式转换

前端使用camelCase，后端使用snake_case，API层自动转换：

| 前端字段 | 后端字段 | 说明 |
|---------|---------|------|
| `messageId` | `session_id` | 会话ID |
| `userExperience.usefulness` | `user_experience.practicality` | 实用性 |
| `userExperience.overall` | `user_experience.satisfaction` | 整体满意度 |
| `feedback` | `feedback_text` | 文本反馈 |

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 400 | 参数验证失败 | 检查请求参数格式 |
| 401 | 未认证 | 重新登录获取Token |
| 403 | 无权限 | 只能评价自己的会话 |
| 404 | 会话不存在 | 检查session_id是否正确 |
| 500 | 服务器错误 | 联系后端开发人员 |

### 错误响应示例

```json
{
  "code": 400,
  "msg": "参数验证失败",
  "data": {
    "user_experience.clarity": ["clarity字段必须在1-5之间"]
  }
}
```

---

## 数据库表结构

### chat_sessions表（相关字段）

```sql
-- 用户体验评分
ux_clarity TINYINT          -- 易懂性 (1-5)
ux_practicality TINYINT     -- 实用性 (1-5)
ux_detail TINYINT           -- 详细程度 (1-5)
ux_friendliness TINYINT     -- 友好度 (1-5)
ux_satisfaction TINYINT     -- 整体满意度 (1-5)

-- 个性化感知评分
profile_utilization_rate DECIMAL(5,2)  -- 档案利用率 (0-100)
goal_alignment DECIMAL(5,2)            -- 目标对齐度 (0-100)
uniqueness DECIMAL(5,2)                -- 独特性 (0-100)
dynamic_adjustment DECIMAL(5,2)        -- 动态调整 (0-100)

-- 综合评分
personalization_grade VARCHAR(1)       -- 个性化等级 (S/A/B/C/D)
overall_score DECIMAL(3,2)             -- 综合评分 (0-5)
fewshot_eligible BOOLEAN               -- Few-Shot资格

-- 用户反馈
user_feedback TEXT                     -- 文本反馈
user_rating TINYINT                    -- 用户评分 (1-5，用户体验平均分)
```

---

## 相关服务

### PersonalizationScoreService

负责计算个性化感知评分：

```php
class PersonalizationScoreService
{
    // 计算所有个性化评分
    public function calculateAllScores(ChatSession $session): array
    
    // 计算个性化等级
    public function calculateGrade(float $utilizationRate): string
}
```

### FewShotEligibilityService

负责判断Few-Shot资格：

```php
class FewShotEligibilityService
{
    // 检查资格
    public function checkEligibility(ChatSession $session): array
}
```

---

## 测试建议

### 单元测试

```typescript
describe('Rating API', () => {
  it('应该成功提交评分', async () => {
    const rating: Rating = {
      messageId: 'sess_123',
      userExperience: {
        clarity: 5,
        usefulness: 4,
        detail: 5,
        friendliness: 5,
        overall: 5
      },
      feedback: '很好',
      timestamp: Date.now()
    }
    
    const response = await submitRating(rating)
    expect(response.code).toBe(200)
    expect(response.data.fewshot_eligible).toBeDefined()
  })
})
```

### 集成测试

1. 测试完整评分流程
2. 测试数据格式转换
3. 测试错误处理
4. 测试JWT认证

---

## 注意事项

1. **认证要求**: 所有API都需要JWT Token认证
2. **权限控制**: 用户只能评价自己的会话
3. **自动计算**: 个性化感知评分由后端自动计算，前端只需提交用户体验评分
4. **Few-Shot资格**: 由后端根据三轨评分自动判断
5. **冷启动保护**: 前3条对话不计入Few-Shot池
6. **数据持久化**: 评分数据存储在chat_sessions表中

---

### 4. 提交专家评审

**端点**: `POST /api/v2/quality/rating/:sessionId/expert`  
**认证**: 需要JWT Token（需要专家权限）  
**说明**: 专家对AI回复进行专业评审

#### 路径参数

- `sessionId`: 会话ID

#### 请求参数

```typescript
{
  expert_review: {
    professional_accuracy: number    // 专业准确性 (1-5)
    scientific_rationality: number   // 科学合理性 (1-5)
    safety: number                   // 安全性 (1-5)
    completeness: number             // 完整性 (1-5)
    practicality: number             // 实用性 (1-5)
    personalization_fit: number      // 个性化适配度 (1-5)
  }
  expert_feedback?: string           // 专家反馈（可选）
}
```

#### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| professional_accuracy | number | 是 | 专业准确性 (1-5) |
| scientific_rationality | number | 是 | 科学合理性 (1-5) |
| safety | number | 是 | 安全性 (1-5，一票否决) |
| completeness | number | 是 | 完整性 (1-5) |
| practicality | number | 是 | 实用性 (1-5) |
| personalization_fit | number | 是 | 个性化适配度 (1-5) |
| expert_feedback | string | 否 | 专家反馈文本 |

#### 响应数据

```typescript
{
  code: 200,
  msg: "专家评审提交成功",
  data: {
    session_id: string
    expert_review: {
      professional_accuracy: number
      scientific_rationality: number
      safety: number
      completeness: number
      practicality: number
      personalization_fit: number
    }
    expert_score: number             // 专家评分平均值 (1-5)
    expert_feedback: string
    reviewed_at: string
    reviewer_id: number
  }
}
```

#### 示例

**请求**:
```bash
curl -X POST http://localhost:8000/api/v2/quality/rating/sess_123456/expert \
  -H "Authorization: Bearer EXPERT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expert_review": {
      "professional_accuracy": 5,
      "scientific_rationality": 4,
      "safety": 5,
      "completeness": 4,
      "practicality": 5,
      "personalization_fit": 4
    },
    "expert_feedback": "训练计划科学合理，动作选择恰当，建议增加拉伸环节。"
  }'
```

**响应**:
```json
{
  "code": 200,
  "msg": "专家评审提交成功",
  "data": {
    "session_id": "sess_123456",
    "expert_review": {
      "professional_accuracy": 5,
      "scientific_rationality": 4,
      "safety": 5,
      "completeness": 4,
      "practicality": 5,
      "personalization_fit": 4
    },
    "expert_score": 4.5,
    "expert_feedback": "训练计划科学合理，动作选择恰当，建议增加拉伸环节。",
    "reviewed_at": "2026-01-17T10:00:00.000Z",
    "reviewer_id": 10
  }
}
```

---

### 5. 获取用户冷启动状态

**端点**: `GET /api/v2/quality/cold-start-status`  
**认证**: 需要JWT Token  
**说明**: 获取用户的冷启动状态，判断是否处于冷启动保护期

#### 响应数据

```typescript
{
  code: 200,
  msg: "获取成功",
  data: {
    user_id: number
    total_conversations: number      // 总对话数
    rated_conversations: number      // 已评分对话数
    is_cold_start: boolean           // 是否处于冷启动期
    cold_start_threshold: number     // 冷启动阈值（默认3）
    remaining_cold_start: number     // 剩余冷启动对话数
    fewshot_eligible_count: number   // 符合Few-Shot资格的对话数
  }
}
```

#### 冷启动规则

1. **冷启动期定义**: 前3条对话
2. **保护机制**: 冷启动期的对话不计入Few-Shot学习池
3. **目的**: 避免初期低质量对话影响Few-Shot学习

#### 示例

**请求**:
```bash
curl -X GET http://localhost:8000/api/v2/quality/cold-start-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应（冷启动期）**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "user_id": 1,
    "total_conversations": 2,
    "rated_conversations": 1,
    "is_cold_start": true,
    "cold_start_threshold": 3,
    "remaining_cold_start": 1,
    "fewshot_eligible_count": 0
  }
}
```

**响应（非冷启动期）**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "user_id": 1,
    "total_conversations": 10,
    "rated_conversations": 8,
    "is_cold_start": false,
    "cold_start_threshold": 3,
    "remaining_cold_start": 0,
    "fewshot_eligible_count": 5
  }
}
```

---

## 🎯 前端集成示例

### 提交专家评审

```typescript
import api from '@/api/rating'

async function submitExpertReview(sessionId: string, review: any) {
  try {
    const response = await api.post(
      `/v2/quality/rating/${sessionId}/expert`,
      {
        expert_review: review,
        expert_feedback: '训练计划科学合理，动作选择恰当。'
      }
    )
    
    if (response.code === 200) {
      showSuccess('专家评审提交成功')
      console.log('专家评分:', response.data.expert_score)
    }
  } catch (error) {
    showError('提交失败')
  }
}
```

### 检查冷启动状态

```typescript
async function checkColdStartStatus() {
  try {
    const response = await api.get('/v2/quality/cold-start-status')
    
    if (response.code === 200) {
      const status = response.data
      
      if (status.is_cold_start) {
        showInfo(`您还有 ${status.remaining_cold_start} 次冷启动对话`)
      } else {
        console.log('已完成冷启动，符合Few-Shot资格的对话:', status.fewshot_eligible_count)
      }
    }
  } catch (error) {
    console.error('获取失败:', error)
  }
}
```

### 完整评分流程（含冷启动检查）

```typescript
async function handleRatingFlow(sessionId: string, rating: any) {
  // 1. 检查冷启动状态
  const coldStartStatus = await checkColdStartStatus()
  
  // 2. 提交用户评分
  const response = await submitRating(sessionId, rating)
  
  // 3. 显示评分结果
  if (response.code === 200) {
    const data = response.data
    
    // 显示个性化等级
    showPersonalizationGrade(data.personalization_grade)
    
    // 显示Few-Shot资格
    if (data.fewshot_eligible) {
      if (!coldStartStatus.is_cold_start) {
        showSuccess('此对话已加入Few-Shot学习池')
      } else {
        showInfo('冷启动期对话不计入Few-Shot学习池')
      }
    }
  }
}
```

---

## 📊 数据结构

### ExpertReview（专家评审）

```typescript
interface ExpertReview {
  professional_accuracy: number    // 专业准确性 (1-5)
  scientific_rationality: number   // 科学合理性 (1-5)
  safety: number                   // 安全性 (1-5)
  completeness: number             // 完整性 (1-5)
  practicality: number             // 实用性 (1-5)
  personalization_fit: number      // 个性化适配度 (1-5)
}
```

### ColdStartStatus（冷启动状态）

```typescript
interface ColdStartStatus {
  user_id: number
  total_conversations: number      // 总对话数
  rated_conversations: number      // 已评分对话数
  is_cold_start: boolean           // 是否处于冷启动期
  cold_start_threshold: number     // 冷启动阈值
  remaining_cold_start: number     // 剩余冷启动对话数
  fewshot_eligible_count: number   // 符合Few-Shot资格的对话数
}
```

---

## 📝 相关服务

### ExpertReviewService

负责处理专家评审：

```php
class ExpertReviewService
{
    // 提交专家评审
    public function submitReview(ChatSession $session, array $review): array
    
    // 计算专家评分
    public function calculateExpertScore(array $review): float
    
    // 验证专家权限
    public function validateExpertPermission(User $user): bool
}
```

### ColdStartService

负责管理冷启动状态：

```php
class ColdStartService
{
    // 检查是否处于冷启动期
    public function isColdStart(User $user): bool
    
    // 获取冷启动状态
    public function getStatus(User $user): array
    
    // 更新冷启动计数
    public function updateCount(User $user): void
}
```

---

## 🔧 错误处理

### 专家评审错误

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 403 | 无专家权限 | 检查用户角色 |
| 404 | 会话不存在 | 检查session_id |
| 400 | 评分参数错误 | 检查评分范围(1-5) |

### 冷启动状态错误

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 401 | 未认证 | 重新登录 |
| 500 | 服务器错误 | 稍后重试 |

---

## 📈 版本历史

### v2.0.0 (2026-01-17) - 专家评审和冷启动

**变更内容**:
- ✅ 添加专家评审API
- ✅ 添加冷启动状态API
- ✅ 提供完整的前端集成示例
- ✅ 说明冷启动保护机制

### v1.0.0 (2025-01-02) - 初始版本

**变更内容**:
- ✅ 三轨评分系统
- ✅ Few-Shot资格检查
- ✅ 用户体验评分
- ✅ 个性化感知评分

---

**维护者**: 薛小川  
**最后更新**: 2026-01-17
