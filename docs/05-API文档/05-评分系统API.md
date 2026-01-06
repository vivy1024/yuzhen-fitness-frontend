# 评分系统API文档

**版本**: v1.0.0  
**更新日期**: 2025-01-02  
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

**维护者**: 薛小川  
**最后更新**: 2025-01-02
