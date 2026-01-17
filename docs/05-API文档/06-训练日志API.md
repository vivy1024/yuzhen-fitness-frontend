# 训练日志API

**状态**: ✅ 已完成  
**版本**: v1.0.0  
**更新日期**: 2026-01-17  
**后端模块**: `app/Modules/Training/Controllers/TrainingLogController.php`

---

## 📋 概述

训练日志API实现闭环学习系统的核心数据采集功能，记录用户的训练会话、动作执行、RPE评分等关键数据，为AI训练计划优化提供真实反馈。

**核心功能**：
- 记录训练会话（计划动作 vs 实际完成）
- 记录单组训练（支持RPE评分）
- 自动更新个人最佳记录
- 自动更新训练计划进度
- 训练统计分析

**Requirements**: 6.1, 6.2, 6.3, 5.2

---

## 🔌 API端点

### 1. 获取训练日志列表

```http
GET /api/training-logs
```

**请求参数**（Query）：
```typescript
{
  start_date?: string;      // 开始日期 YYYY-MM-DD
  end_date?: string;        // 结束日期 YYYY-MM-DD
  mesocycle_id?: string;    // 中周期ID
  per_page?: number;        // 每页数量，默认20
  page?: number;            // 页码
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取训练日志列表成功",
  "data": {
    "rows": [
      {
        "id": 1,
        "user_id": 1,
        "training_plan_id": 5,
        "plan_week": 1,
        "plan_day": 1,
        "session_date": "2026-01-15",
        "planned_exercises": [
          {
            "exercise_id": "ex_001",
            "exercise_name": "杠铃深蹲",
            "sets": 4,
            "reps": 8,
            "weight": 100
          }
        ],
        "actual_exercises": [
          {
            "exercise_id": "ex_001",
            "completed_sets": 4,
            "rpe": 8.5,
            "weight": 100,
            "reps_per_set": [8, 8, 7, 6]
          }
        ],
        "completion_rate": 100,
        "avg_rpe": 8.5,
        "week_number": 1,
        "mesocycle_id": "meso_2026_01",
        "notes": "状态良好",
        "created_at": "2026-01-15T10:30:00Z",
        "updated_at": "2026-01-15T11:00:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "per_page": 20,
    "total_pages": 3
  }
}
```

---

### 2. 获取训练日志详情

```http
GET /api/training-logs/{id}
```

**路径参数**：
- `id`: 训练日志ID

**响应示例**：同上单条记录格式

---

### 3. 记录训练会话 ⭐

```http
POST /api/training-logs/session
```

**请求体**：
```typescript
{
  session_date: string;              // 训练日期 YYYY-MM-DD（必填）
  training_plan_id?: number;         // 训练计划ID
  plan_week?: number;                // 计划周数 1-52
  plan_day?: number;                 // 计划天数 1-7
  planned_exercises: Array<{         // 计划动作列表（必填）
    exercise_id: string;             // 动作ID（必填）
    exercise_name: string;           // 动作名称（必填）
    sets: number;                    // 计划组数 1-20（必填）
    reps: number;                    // 计划次数 1-100（必填）
    weight?: number;                 // 计划重量 0-1000kg
  }>;
  actual_exercises?: Array<{         // 实际完成动作列表
    exercise_id: string;             // 动作ID（必填）
    completed_sets: number;          // 完成组数 0-20（必填）
    rpe?: number;                    // RPE评分 1-10
    weight?: number;                 // 实际重量 0-1000kg
    reps_per_set?: number[];         // 每组次数
  }>;
  week_number?: number;              // 周数 1-52
  mesocycle_id?: string;             // 中周期ID
  notes?: string;                    // 备注 最多1000字
}
```

**请求示例**：
```json
{
  "session_date": "2026-01-17",
  "training_plan_id": 5,
  "plan_week": 2,
  "plan_day": 3,
  "planned_exercises": [
    {
      "exercise_id": "ex_001",
      "exercise_name": "杠铃深蹲",
      "sets": 4,
      "reps": 8,
      "weight": 100
    },
    {
      "exercise_id": "ex_015",
      "exercise_name": "杠铃卧推",
      "sets": 3,
      "reps": 10,
      "weight": 80
    }
  ],
  "actual_exercises": [
    {
      "exercise_id": "ex_001",
      "completed_sets": 4,
      "rpe": 8.5,
      "weight": 100,
      "reps_per_set": [8, 8, 7, 6]
    },
    {
      "exercise_id": "ex_015",
      "completed_sets": 3,
      "rpe": 7.0,
      "weight": 80,
      "reps_per_set": [10, 10, 9]
    }
  ],
  "mesocycle_id": "meso_2026_01",
  "notes": "状态良好，深蹲最后一组力竭"
}
```

**响应示例**：
```json
{
  "code": 201,
  "message": "训练会话记录成功",
  "data": {
    "id": 123,
    "user_id": 1,
    "training_plan_id": 5,
    "session_date": "2026-01-17",
    "completion_rate": 100,
    "avg_rpe": 7.75,
    // ... 完整训练日志数据
  }
}
```

**自动触发**：
- ✅ 更新个人最佳记录（如果打破记录）
- ✅ 更新训练计划进度（如果关联计划）

---

### 4. 记录单组训练 ⭐

```http
POST /api/training-logs/{id}/set
```

**路径参数**：
- `id`: 训练日志ID

**请求体**：
```typescript
{
  exercise_id: string;      // 动作ID（必填）
  set_number: number;       // 组数 1-20（必填）
  reps: number;             // 次数 1-100（必填）
  weight?: number;          // 重量 0-1000kg
  rpe?: number;             // RPE评分 1-10
  notes?: string;           // 备注 最多500字
}
```

**请求示例**：
```json
{
  "exercise_id": "ex_001",
  "set_number": 1,
  "reps": 8,
  "weight": 100,
  "rpe": 8.0,
  "notes": "感觉良好"
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "训练组记录成功",
  "data": {
    "id": 123,
    "actual_exercises": [
      {
        "exercise_id": "ex_001",
        "completed_sets": 1,
        "rpe": 8.0,
        "sets_detail": [
          {
            "set_number": 1,
            "reps": 8,
            "weight": 100,
            "rpe": 8.0,
            "notes": "感觉良好"
          }
        ]
      }
    ],
    "completion_rate": 25,
    "avg_rpe": 8.0
  }
}
```

**自动触发**：
- ✅ 更新该动作的平均RPE
- ✅ 更新完成率
- ✅ 更新个人最佳记录（如果打破记录）

---

### 5. 更新训练日志

```http
PUT /api/training-logs/{id}
```

**路径参数**：
- `id`: 训练日志ID

**请求体**：同"记录训练会话"，所有字段可选

**响应示例**：
```json
{
  "code": 200,
  "message": "训练日志更新成功",
  "data": {
    // 更新后的训练日志数据
  }
}
```

---

### 6. 删除训练日志

```http
DELETE /api/training-logs/{id}
```

**路径参数**：
- `id`: 训练日志ID

**响应示例**：
```json
{
  "code": 200,
  "message": "训练日志删除成功",
  "data": null
}
```

---

### 7. 获取训练统计

```http
GET /api/training-logs/stats
```

**请求参数**（Query）：
```typescript
{
  start_date?: string;      // 开始日期，默认30天前
  end_date?: string;        // 结束日期，默认今天
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取训练统计成功",
  "data": {
    "total_sessions": 15,
    "avg_completion_rate": 95.5,
    "avg_rpe": 7.8,
    "total_exercises": 45,
    "total_sets": 180
  }
}
```

---

## 🔄 工作流程

### 训练会话记录流程

```
1. 用户开始训练
   ↓
2. 前端调用 POST /api/training-logs/session
   - 提交计划动作（planned_exercises）
   - 可选提交实际完成（actual_exercises）
   ↓
3. 后端创建训练日志
   - 计算完成率
   - 计算平均RPE
   ↓
4. 自动更新个人最佳记录
   - 遍历actual_exercises
   - 调用PersonalBest::updateBest()
   ↓
5. 自动更新训练计划进度（如果关联计划）
   - 更新completed_sessions
   - 更新completion_rate
   - 更新current_week_index和current_day_index
   ↓
6. 返回训练日志数据
```

### 单组训练记录流程

```
1. 用户完成一组训练
   ↓
2. 前端调用 POST /api/training-logs/{id}/set
   - 提交动作ID、组数、次数、重量、RPE
   ↓
3. 后端更新actual_exercises
   - 添加sets_detail
   - 更新completed_sets
   - 重新计算该动作的平均RPE
   ↓
4. 重新计算整体完成率和平均RPE
   ↓
5. 自动更新个人最佳记录（如果打破记录）
   ↓
6. 返回更新后的训练日志
```

---

## 📊 数据结构

### TrainingLog模型

```typescript
interface TrainingLog {
  id: number;
  user_id: number;
  training_plan_id?: number;
  plan_week?: number;              // 计划周数
  plan_day?: number;               // 计划天数
  session_date: string;            // 训练日期
  planned_exercises: PlannedExercise[];
  actual_exercises: ActualExercise[];
  completion_rate: number;         // 完成率 0-100
  avg_rpe?: number;                // 平均RPE 1-10
  week_number?: number;            // 周数
  mesocycle_id?: string;           // 中周期ID
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface PlannedExercise {
  exercise_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight?: number;
}

interface ActualExercise {
  exercise_id: string;
  completed_sets: number;
  rpe?: number;
  weight?: number;
  reps_per_set?: number[];
  sets_detail?: SetDetail[];       // 详细组数据
}

interface SetDetail {
  set_number: number;
  reps: number;
  weight?: number;
  rpe?: number;
  notes?: string;
}
```

### RPE评分说明

RPE（Rate of Perceived Exertion）自觉疲劳度评分：

| RPE | 描述 | 储备次数 |
|-----|------|---------|
| 10 | 力竭 | 0 |
| 9.5 | 还能做0.5次 | 0.5 |
| 9 | 还能做1次 | 1 |
| 8.5 | 还能做1-2次 | 1.5 |
| 8 | 还能做2次 | 2 |
| 7.5 | 还能做2-3次 | 2.5 |
| 7 | 还能做3次 | 3 |
| 6 | 还能做4次 | 4 |
| 5 | 还能做5次 | 5 |

---

## 💻 前端集成示例

### 记录训练会话

```typescript
// composables/useTrainingLog.ts
import { ref } from 'vue';
import { apiClient } from '@/lib/api-client';

export function useTrainingLog() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const recordSession = async (sessionData: {
    session_date: string;
    training_plan_id?: number;
    plan_week?: number;
    plan_day?: number;
    planned_exercises: Array<{
      exercise_id: string;
      exercise_name: string;
      sets: number;
      reps: number;
      weight?: number;
    }>;
    actual_exercises?: Array<{
      exercise_id: string;
      completed_sets: number;
      rpe?: number;
      weight?: number;
      reps_per_set?: number[];
    }>;
    mesocycle_id?: string;
    notes?: string;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.post('/training-logs/session', sessionData);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '记录训练会话失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const recordSet = async (logId: number, setData: {
    exercise_id: string;
    set_number: number;
    reps: number;
    weight?: number;
    rpe?: number;
    notes?: string;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.post(`/training-logs/${logId}/set`, setData);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '记录训练组失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getTrainingLogs = async (params?: {
    start_date?: string;
    end_date?: string;
    mesocycle_id?: string;
    per_page?: number;
    page?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/training-logs', { params });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取训练日志失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getTrainingStats = async (params?: {
    start_date?: string;
    end_date?: string;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/training-logs/stats', { params });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取训练统计失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    recordSession,
    recordSet,
    getTrainingLogs,
    getTrainingStats,
  };
}
```

### Vue组件示例

```vue
<template>
  <div class="training-session">
    <h2>记录训练会话</h2>
    
    <!-- 训练日期 -->
    <div class="form-group">
      <label>训练日期</label>
      <input type="date" v-model="sessionData.session_date" />
    </div>

    <!-- 计划动作列表 -->
    <div class="exercises-list">
      <h3>计划动作</h3>
      <div v-for="(exercise, index) in sessionData.planned_exercises" :key="index">
        <input v-model="exercise.exercise_name" placeholder="动作名称" />
        <input type="number" v-model.number="exercise.sets" placeholder="组数" />
        <input type="number" v-model.number="exercise.reps" placeholder="次数" />
        <input type="number" v-model.number="exercise.weight" placeholder="重量(kg)" />
      </div>
    </div>

    <!-- 实际完成 -->
    <div class="actual-exercises">
      <h3>实际完成</h3>
      <div v-for="(exercise, index) in sessionData.actual_exercises" :key="index">
        <span>{{ exercise.exercise_name }}</span>
        <input type="number" v-model.number="exercise.completed_sets" placeholder="完成组数" />
        <input type="number" v-model.number="exercise.rpe" placeholder="RPE (1-10)" step="0.5" />
      </div>
    </div>

    <!-- 备注 -->
    <div class="form-group">
      <label>备注</label>
      <textarea v-model="sessionData.notes" placeholder="训练感受、注意事项等"></textarea>
    </div>

    <button @click="handleSubmit" :disabled="loading">
      {{ loading ? '提交中...' : '提交训练记录' }}
    </button>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTrainingLog } from '@/composables/useTrainingLog';
import { useToast } from '@/composables/useToast';

const { recordSession, loading, error } = useTrainingLog();
const { showSuccess } = useToast();

const sessionData = ref({
  session_date: new Date().toISOString().split('T')[0],
  training_plan_id: undefined,
  planned_exercises: [
    {
      exercise_id: '',
      exercise_name: '',
      sets: 3,
      reps: 10,
      weight: 0,
    },
  ],
  actual_exercises: [],
  notes: '',
});

const handleSubmit = async () => {
  try {
    const result = await recordSession(sessionData.value);
    showSuccess('训练记录提交成功！');
    // 重置表单或跳转
  } catch (err) {
    // 错误已在composable中处理
  }
};
</script>
```

---

## 🔗 相关文档

- [训练计划API](./03-训练计划API.md) - 训练计划CRUD和AI导入
- [个人最佳记录API](./07-个人最佳记录API.md) - 个人最佳记录管理
- [AI聊天API](./04-AI聊天API.md) - AI训练建议
- [后端MySQL数据库结构](../../yuzhen-backend/docs/02-核心架构/02-数据层/03-MySQL数据库完整结构文档.md)

---

## 📝 版本历史

### v1.0.0 (2026-01-17)
- ✅ 初始版本
- ✅ 文档化7个训练日志API端点
- ✅ 说明闭环学习系统的数据采集流程
- ✅ 提供完整的前端集成示例
- ✅ 说明RPE评分系统
- ✅ 说明自动更新个人最佳记录和训练计划进度的机制
