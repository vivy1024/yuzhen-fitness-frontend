# 训练计划API文档

**状态**: ✅ 已完成
**版本**: v1.0.0
**更新日期**: 2026-01-17

---

## 📋 概述

训练计划API提供完整的训练计划管理功能，支持手动创建、AI导入、进度追踪等功能。

### 核心特性

- ✅ **训练计划CRUD** - 创建、查询、更新、删除训练计划
- ✅ **AI导入功能** - 从AI对话中导入训练计划
- ✅ **进度统计** - 获取训练计划的完成进度
- ✅ **训练日志关联** - 查看训练计划关联的训练记录
- ✅ **计划激活** - 设置当前使用的训练计划
- ✅ **计划完成** - 标记训练计划为已完成

---

## 📡 API端点

### 1. 获取训练计划列表

**端点**: `GET /api/training-plans`

**认证**: 需要JWT Token

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| is_active | boolean | 否 | 筛选激活状态 |
| goal | string | 否 | 筛选目标类型 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取训练计划列表成功",
  "data": [
    {
      "id": 1,
      "name": "8周增肌计划",
      "description": "针对初学者的增肌训练计划",
      "goal": "gain_muscle",
      "frequency": 4,
      "duration": 8,
      "difficulty_level": "beginner",
      "is_active": true,
      "source": "ai_generated",
      "created_at": "2026-01-15T10:00:00.000Z",
      "updated_at": "2026-01-15T10:00:00.000Z",
      "exercises_count": 12
    }
  ]
}
```

---

### 2. 获取训练计划详情

**端点**: `GET /api/training-plans/:id`

**认证**: 需要JWT Token

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 训练计划ID |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取训练计划详情成功",
  "data": {
    "id": 1,
    "name": "8周增肌计划",
    "description": "针对初学者的增肌训练计划",
    "goal": "gain_muscle",
    "frequency": 4,
    "duration": 8,
    "difficulty_level": "beginner",
    "is_active": true,
    "source": "ai_generated",
    "created_at": "2026-01-15T10:00:00.000Z",
    "updated_at": "2026-01-15T10:00:00.000Z",
    "exercises": [
      {
        "id": 1,
        "exercise_id": 123,
        "exercise_name": "杠铃深蹲",
        "sets": 4,
        "reps": "8-12",
        "weight": "60kg",
        "rest_time": "90s",
        "notes": "注意膝盖不要超过脚尖",
        "order_index": 0
      }
    ]
  }
}
```

---

### 3. 创建训练计划

**端点**: `POST /api/training-plans`

**认证**: 需要JWT Token

**请求参数**:
```json
{
  "name": "8周增肌计划",
  "description": "针对初学者的增肌训练计划",
  "goal": "gain_muscle",
  "frequency": 4,
  "duration": 8,
  "difficulty_level": "beginner",
  "source": "manual",
  "exercises": [
    {
      "exercise_id": 123,
      "exercise_name": "杠铃深蹲",
      "sets": 4,
      "reps": "8-12",
      "weight": "60kg",
      "rest_time": "90s",
      "notes": "注意膝盖不要超过脚尖",
      "order_index": 0
    }
  ]
}
```

**参数说明**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 计划名称（最长255字符） |
| description | string | 否 | 计划描述（最长1000字符） |
| goal | string | 否 | 目标类型：lose_weight, gain_muscle, maintain, improve_fitness |
| frequency | integer | 否 | 每周训练次数（1-7） |
| duration | integer | 否 | 计划周数（1-52） |
| difficulty_level | string | 否 | 难度：beginner, intermediate, advanced |
| source | string | 否 | 来源：manual, ai_generated |
| exercises | array | 否 | 训练动作列表 |

**响应示例**:
```json
{
  "code": 201,
  "msg": "创建训练计划成功",
  "data": {
    "id": 1,
    "name": "8周增肌计划",
    "...": "..."
  }
}
```

---

### 4. 从AI对话导入训练计划

**端点**: `POST /api/training-plans/ai-import`

**认证**: 需要JWT Token

**说明**: 从AI对话中提取的训练计划数据导入到系统

**请求参数**: 与创建训练计划相同，但 `source` 自动设置为 `ai_generated`

**响应示例**:
```json
{
  "code": 201,
  "msg": "AI训练计划导入成功",
  "data": {
    "id": 1,
    "name": "8周增肌计划",
    "source": "ai_generated",
    "...": "..."
  }
}
```

---

### 5. 更新训练计划

**端点**: `PUT /api/training-plans/:id`

**认证**: 需要JWT Token

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 训练计划ID |

**请求参数**: 与创建训练计划相同（所有字段可选）

**响应示例**:
```json
{
  "code": 200,
  "msg": "更新训练计划成功",
  "data": {
    "id": 1,
    "name": "8周增肌计划（修改版）",
    "...": "..."
  }
}
```

---

### 6. 删除训练计划

**端点**: `DELETE /api/training-plans/:id`

**认证**: 需要JWT Token

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 训练计划ID |

**说明**: 软删除，不会真正删除数据

**响应示例**:
```json
{
  "code": 200,
  "msg": "删除训练计划成功",
  "data": null
}
```

---

### 7. 激活训练计划

**端点**: `PUT /api/training-plans/:id/activate`

**认证**: 需要JWT Token

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 训练计划ID |

**说明**: 设置为当前使用的训练计划，其他计划自动设为非激活状态

**响应示例**:
```json
{
  "code": 200,
  "msg": "激活训练计划成功",
  "data": {
    "id": 1,
    "is_active": true,
    "...": "..."
  }
}
```

---

### 8. 完成训练计划

**端点**: `POST /api/training-plans/:id/complete`

**认证**: 需要JWT Token

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 训练计划ID |

**说明**: 标记训练计划为已完成

**响应示例**:
```json
{
  "code": 200,
  "msg": "完成训练计划成功",
  "data": {
    "id": 1,
    "is_completed": true,
    "completed_at": "2026-01-17T10:00:00.000Z",
    "...": "..."
  }
}
```

---

### 9. 获取训练计划进度统计

**端点**: `GET /api/training-plans/:id/progress-stats`

**认证**: 需要JWT Token

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 训练计划ID |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取进度统计成功",
  "data": {
    "plan_id": 1,
    "total_exercises": 12,
    "completed_exercises": 8,
    "completion_rate": 66.67,
    "total_sessions": 20,
    "completed_sessions": 15,
    "current_week": 5,
    "total_weeks": 8
  }
}
```

---

### 10. 获取训练计划关联的训练日志

**端点**: `GET /api/training-plans/:id/training-logs`

**认证**: 需要JWT Token

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | integer | 训练计划ID |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取训练日志成功",
  "data": [
    {
      "id": 1,
      "plan_id": 1,
      "exercise_name": "杠铃深蹲",
      "sets_completed": 4,
      "total_volume": 960,
      "training_date": "2026-01-15",
      "notes": "感觉良好"
    }
  ]
}
```

---

## 🔄 工作流程

### 创建训练计划流程

```
用户填写训练计划信息
    ↓
调用 POST /api/training-plans
    ↓
后端验证数据
    ↓
创建训练计划记录
    ↓
创建关联的训练动作
    ↓
返回完整的训练计划数据
```

### AI导入训练计划流程

```
用户与AI对话生成训练计划
    ↓
前端提取训练计划数据
    ↓
调用 POST /api/training-plans/ai-import
    ↓
后端验证并创建训练计划
    ↓
标记来源为 ai_generated
    ↓
返回训练计划数据
```

### 激活训练计划流程

```
用户选择要激活的训练计划
    ↓
调用 PUT /api/training-plans/:id/activate
    ↓
后端将其他计划设为非激活
    ↓
将选中计划设为激活
    ↓
返回更新后的计划数据
```

---

## 📊 数据结构

### TrainingPlan（训练计划）

```typescript
interface TrainingPlan {
  id: number
  user_id: number
  name: string
  description?: string
  goal?: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_fitness'
  frequency?: number          // 每周训练次数
  duration?: number           // 计划周数
  difficulty_level?: 'beginner' | 'intermediate' | 'advanced'
  is_active: boolean          // 是否为当前使用的计划
  is_completed: boolean       // 是否已完成
  source: 'manual' | 'ai_generated'
  completed_at?: string
  created_at: string
  updated_at: string
  exercises?: TrainingExercise[]
}
```

### TrainingExercise（训练动作）

```typescript
interface TrainingExercise {
  id: number
  plan_id: number
  exercise_id?: number        // 关联动作库ID
  exercise_name: string
  sets?: number
  reps?: string               // 如 "8-12"
  weight?: string             // 如 "60kg"
  rest_time?: string          // 如 "90s"
  notes?: string
  order_index: number         // 排序索引
}
```

---

## 🎯 前端集成示例

### 获取训练计划列表

```typescript
import api from '@/api/training'

async function getTrainingPlans() {
  try {
    const response = await api.get('/training-plans', {
      params: {
        is_active: true,
        goal: 'gain_muscle'
      }
    })
    
    if (response.code === 200) {
      const plans = response.data
      console.log('训练计划列表:', plans)
    }
  } catch (error) {
    console.error('获取失败:', error)
  }
}
```

### 从AI对话导入训练计划

```typescript
async function importAIPlan(planData: any) {
  try {
    const response = await api.post('/training-plans/ai-import', {
      name: planData.name,
      description: planData.description,
      goal: 'gain_muscle',
      frequency: 4,
      duration: 8,
      difficulty_level: 'beginner',
      exercises: planData.exercises
    })
    
    if (response.code === 201) {
      showSuccess('AI训练计划导入成功')
      router.push(`/training-plans/${response.data.id}`)
    }
  } catch (error) {
    showError('导入失败')
  }
}
```

### 激活训练计划

```typescript
async function activatePlan(planId: number) {
  try {
    const response = await api.put(`/training-plans/${planId}/activate`)
    
    if (response.code === 200) {
      showSuccess('训练计划已激活')
      // 刷新计划列表
      await getTrainingPlans()
    }
  } catch (error) {
    showError('激活失败')
  }
}
```

---

## 🔧 错误处理

### 常见错误码

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 400 | 参数验证失败 | 检查请求参数格式 |
| 401 | 未认证 | 重新登录获取Token |
| 403 | 无权限 | 只能操作自己的训练计划 |
| 404 | 训练计划不存在 | 检查计划ID是否正确 |
| 500 | 服务器错误 | 联系后端开发人员 |

### 错误响应示例

```json
{
  "code": 400,
  "msg": "参数验证失败",
  "data": null,
  "errors": {
    "name": ["训练计划名称不能为空"],
    "frequency": ["每周训练次数必须在1-7之间"]
  }
}
```

---

## 📝 使用场景

### 场景1：用户手动创建训练计划

1. 用户在前端填写训练计划信息
2. 添加训练动作（从动作库选择）
3. 调用创建API保存训练计划
4. 激活该训练计划

### 场景2：从AI对话导入训练计划

1. 用户与AI对话："帮我制定一个8周增肌计划"
2. AI生成训练计划（包含动作、组数、次数等）
3. 前端提取训练计划数据
4. 调用AI导入API保存训练计划
5. 自动激活该训练计划

### 场景3：查看训练计划进度

1. 用户打开训练计划详情页
2. 调用进度统计API获取完成情况
3. 显示完成率、当前周数等信息
4. 调用训练日志API查看历史记录

---

## 🔗 相关文档

- [训练日志API](./06-训练日志API.md) - 训练记录管理
- [个人最佳记录API](./07-个人最佳记录API.md) - 力量进步追踪
- [动作库API](./08-动作库API.md) - 动作查询

---

## 📈 版本历史

### v1.0.0 (2026-01-17) - 初始版本

**变更内容**:
- ✅ 创建训练计划API文档
- ✅ 文档化所有训练计划相关API
- ✅ 包含AI导入功能说明
- ✅ 添加进度统计和训练日志关联
- ✅ 提供前端集成示例

---

**维护者**: 薛小川
**最后更新**: 2026-01-17
