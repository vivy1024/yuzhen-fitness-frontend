# 个人最佳记录API

**状态**: ✅ 已完成  
**版本**: v1.0.0  
**更新日期**: 2026-01-17  
**后端模块**: `app/Modules/Training/Controllers/PersonalBestController.php`

---

## 📋 概述

个人最佳记录API管理用户在各个动作上的最佳表现，自动追踪力量进步，为训练计划优化提供数据支持。

**核心功能**：
- 自动更新个人最佳记录（训练日志触发）
- 手动更新个人最佳记录
- 批量更新个人最佳记录
- 力量排行榜（按估算1RM排序）
- 1RM估算（Epley公式）

**Requirements**: 6.4

---

## 🔌 API端点

### 1. 获取个人最佳记录列表

```http
GET /api/personal-bests
```

**请求参数**（Query）：
```typescript
{
  per_page?: number;        // 每页数量，默认50
  page?: number;            // 页码
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取个人最佳记录列表成功",
  "data": {
    "rows": [
      {
        "id": 1,
        "user_id": 1,
        "exercise_id": "ex_001",
        "exercise_name": "杠铃深蹲",
        "best_weight": 120,
        "best_reps": 5,
        "estimated_1rm": 135,
        "achieved_at": "2026-01-15T10:30:00Z",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-15T10:30:00Z"
      },
      {
        "id": 2,
        "user_id": 1,
        "exercise_id": "ex_015",
        "exercise_name": "杠铃卧推",
        "best_weight": 90,
        "best_reps": 8,
        "estimated_1rm": 112.5,
        "achieved_at": "2026-01-10T14:20:00Z",
        "created_at": "2026-01-01T00:00:00Z",
        "updated_at": "2026-01-10T14:20:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "per_page": 50,
    "total_pages": 1
  }
}
```

---

### 2. 获取特定动作的个人最佳记录

```http
GET /api/personal-bests/{exerciseId}
```

**路径参数**：
- `exerciseId`: 动作ID（如 `ex_001`）

**响应示例**：
```json
{
  "code": 200,
  "message": "获取个人最佳记录成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "exercise_id": "ex_001",
    "exercise_name": "杠铃深蹲",
    "best_weight": 120,
    "best_reps": 5,
    "estimated_1rm": 135,
    "achieved_at": "2026-01-15T10:30:00Z",
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-15T10:30:00Z"
  }
}
```

**错误响应**：
```json
{
  "code": 404,
  "message": "未找到该动作的个人最佳记录",
  "data": null
}
```

---

### 3. 更新个人最佳记录 ⭐

```http
POST /api/personal-bests/update
```

**请求体**：
```typescript
{
  exercise_id: string;      // 动作ID（必填）
  exercise_name?: string;   // 动作名称
  weight: number;           // 重量 0.1-1000kg（必填）
  reps: number;             // 次数 1-100（必填）
}
```

**请求示例**：
```json
{
  "exercise_id": "ex_001",
  "exercise_name": "杠铃深蹲",
  "weight": 125,
  "reps": 5
}
```

**响应示例**（打破记录）：
```json
{
  "code": 200,
  "message": "恭喜！打破个人最佳记录！",
  "data": {
    "personal_best": {
      "id": 1,
      "user_id": 1,
      "exercise_id": "ex_001",
      "exercise_name": "杠铃深蹲",
      "best_weight": 125,
      "best_reps": 5,
      "estimated_1rm": 140.625,
      "achieved_at": "2026-01-17T10:00:00Z",
      "updated_at": "2026-01-17T10:00:00Z"
    },
    "is_new_record": true,
    "previous_best": {
      "best_weight": 120,
      "best_reps": 5,
      "estimated_1rm": 135
    },
    "current_attempt": {
      "weight": 125,
      "reps": 5,
      "estimated_1rm": 140.625
    }
  }
}
```

**响应示例**（未打破记录）：
```json
{
  "code": 200,
  "message": "记录已更新",
  "data": {
    "personal_best": {
      // 保持原有最佳记录
    },
    "is_new_record": false,
    "previous_best": {
      "best_weight": 125,
      "best_reps": 5,
      "estimated_1rm": 140.625
    },
    "current_attempt": {
      "weight": 120,
      "reps": 5,
      "estimated_1rm": 135
    }
  }
}
```

**自动判断逻辑**：
- 比较估算1RM（Epley公式）
- 如果新的1RM > 旧的1RM，则更新记录
- 如果新的1RM ≤ 旧的1RM，则保持原记录

---

### 4. 批量更新个人最佳记录

```http
POST /api/personal-bests/batch-update
```

**请求体**：
```typescript
{
  records: Array<{          // 最多50条
    exercise_id: string;    // 动作ID（必填）
    exercise_name?: string; // 动作名称
    weight: number;         // 重量 0.1-1000kg（必填）
    reps: number;           // 次数 1-100（必填）
  }>;
}
```

**请求示例**：
```json
{
  "records": [
    {
      "exercise_id": "ex_001",
      "exercise_name": "杠铃深蹲",
      "weight": 125,
      "reps": 5
    },
    {
      "exercise_id": "ex_015",
      "exercise_name": "杠铃卧推",
      "weight": 95,
      "reps": 6
    },
    {
      "exercise_id": "ex_030",
      "exercise_name": "硬拉",
      "weight": 150,
      "reps": 3
    }
  ]
}
```

**响应示例**：
```json
{
  "code": 200,
  "message": "批量更新完成，2个新记录",
  "data": {
    "results": [
      {
        "exercise_id": "ex_001",
        "is_new_record": true,
        "current_best": {
          "weight": 125,
          "reps": 5,
          "estimated_1rm": 140.625
        }
      },
      {
        "exercise_id": "ex_015",
        "is_new_record": false,
        "current_best": {
          "weight": 90,
          "reps": 8,
          "estimated_1rm": 112.5
        }
      },
      {
        "exercise_id": "ex_030",
        "is_new_record": true,
        "current_best": {
          "weight": 150,
          "reps": 3,
          "estimated_1rm": 159
        }
      }
    ],
    "total_processed": 3,
    "new_records_count": 2
  }
}
```

---

### 5. 删除个人最佳记录

```http
DELETE /api/personal-bests/{exerciseId}
```

**路径参数**：
- `exerciseId`: 动作ID

**响应示例**：
```json
{
  "code": 200,
  "message": "个人最佳记录删除成功",
  "data": null
}
```

---

### 6. 获取力量排行榜

```http
GET /api/personal-bests/leaderboard
```

**说明**：返回用户的前20个最强动作（按估算1RM排序）

**响应示例**：
```json
{
  "code": 200,
  "message": "获取力量排行榜成功",
  "data": {
    "leaderboard": [
      {
        "id": 5,
        "exercise_id": "ex_030",
        "exercise_name": "硬拉",
        "best_weight": 150,
        "best_reps": 3,
        "estimated_1rm": 159,
        "achieved_at": "2026-01-17T10:00:00Z"
      },
      {
        "id": 1,
        "exercise_id": "ex_001",
        "exercise_name": "杠铃深蹲",
        "best_weight": 125,
        "best_reps": 5,
        "estimated_1rm": 140.625,
        "achieved_at": "2026-01-17T10:00:00Z"
      },
      {
        "id": 2,
        "exercise_id": "ex_015",
        "exercise_name": "杠铃卧推",
        "best_weight": 90,
        "best_reps": 8,
        "estimated_1rm": 112.5,
        "achieved_at": "2026-01-10T14:20:00Z"
      }
    ],
    "total": 3
  }
}
```

---

## 🔄 工作流程

### 自动更新流程（训练日志触发）

```
1. 用户记录训练日志
   ↓
2. TrainingLogController::recordSession()
   ↓
3. 遍历actual_exercises
   ↓
4. 调用updatePersonalBests()
   ↓
5. 对每个动作调用PersonalBest::updateBest()
   - 计算新的估算1RM
   - 比较新旧1RM
   - 如果新1RM > 旧1RM，更新记录
   ↓
6. 返回训练日志（包含是否打破记录的信息）
```

### 手动更新流程

```
1. 用户手动提交个人最佳记录
   ↓
2. 前端调用 POST /api/personal-bests/update
   ↓
3. PersonalBest::getOrCreate()
   - 如果记录不存在，创建新记录
   - 如果记录存在，获取现有记录
   ↓
4. PersonalBest::updateBest()
   - 计算新的估算1RM（Epley公式）
   - 比较新旧1RM
   - 如果新1RM > 旧1RM，更新记录
   ↓
5. 返回结果
   - is_new_record: true/false
   - previous_best: 旧记录
   - current_attempt: 本次尝试
```

---

## 📊 数据结构

### PersonalBest模型

```typescript
interface PersonalBest {
  id: number;
  user_id: number;
  exercise_id: string;         // 动作ID
  exercise_name: string;       // 动作名称
  best_weight: number;         // 最佳重量（kg）
  best_reps: number;           // 最佳次数
  estimated_1rm: number;       // 估算1RM（kg）
  achieved_at: string;         // 达成时间
  created_at: string;
  updated_at: string;
}
```

### 1RM估算公式（Epley公式）

```
1RM = weight × (1 + reps / 30)
```

**示例**：
- 100kg × 5次 = 100 × (1 + 5/30) = 116.67kg
- 80kg × 10次 = 80 × (1 + 10/30) = 106.67kg
- 120kg × 1次 = 120 × (1 + 1/30) = 124kg

**特殊情况**：
- 如果reps = 1，则1RM = weight × 1.033
- 如果reps > 12，估算准确度降低

---

## 💻 前端集成示例

### Composable

```typescript
// composables/usePersonalBest.ts
import { ref } from 'vue';
import { apiClient } from '@/lib/api-client';

export function usePersonalBest() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getPersonalBests = async (params?: {
    per_page?: number;
    page?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/personal-bests', { params });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取个人最佳记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getPersonalBest = async (exerciseId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get(`/personal-bests/${exerciseId}`);
      return response.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null; // 未找到记录
      }
      error.value = err.response?.data?.message || '获取个人最佳记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updatePersonalBest = async (data: {
    exercise_id: string;
    exercise_name?: string;
    weight: number;
    reps: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.post('/personal-bests/update', data);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '更新个人最佳记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const batchUpdatePersonalBests = async (records: Array<{
    exercise_id: string;
    exercise_name?: string;
    weight: number;
    reps: number;
  }>) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.post('/personal-bests/batch-update', { records });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '批量更新个人最佳记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getLeaderboard = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/personal-bests/leaderboard');
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取力量排行榜失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deletePersonalBest = async (exerciseId: string) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.delete(`/personal-bests/${exerciseId}`);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '删除个人最佳记录失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    getPersonalBests,
    getPersonalBest,
    updatePersonalBest,
    batchUpdatePersonalBests,
    getLeaderboard,
    deletePersonalBest,
  };
}
```

### Vue组件示例

```vue
<template>
  <div class="personal-bests">
    <h2>个人最佳记录</h2>

    <!-- 力量排行榜 -->
    <div class="leaderboard">
      <h3>力量排行榜（Top 20）</h3>
      <div v-if="loading">加载中...</div>
      <div v-else-if="leaderboard.length === 0">暂无记录</div>
      <div v-else class="leaderboard-list">
        <div v-for="(record, index) in leaderboard" :key="record.id" class="record-item">
          <span class="rank">{{ index + 1 }}</span>
          <span class="exercise-name">{{ record.exercise_name }}</span>
          <span class="weight">{{ record.best_weight }}kg × {{ record.best_reps }}次</span>
          <span class="estimated-1rm">估算1RM: {{ record.estimated_1rm.toFixed(1) }}kg</span>
          <span class="date">{{ formatDate(record.achieved_at) }}</span>
        </div>
      </div>
    </div>

    <!-- 更新个人最佳记录 -->
    <div class="update-form">
      <h3>更新个人最佳记录</h3>
      <form @submit.prevent="handleUpdate">
        <div class="form-group">
          <label>动作</label>
          <input v-model="formData.exercise_name" placeholder="动作名称" required />
        </div>
        <div class="form-group">
          <label>重量（kg）</label>
          <input type="number" v-model.number="formData.weight" step="0.5" min="0.1" required />
        </div>
        <div class="form-group">
          <label>次数</label>
          <input type="number" v-model.number="formData.reps" min="1" required />
        </div>
        <div class="estimated-1rm">
          估算1RM: {{ calculateEstimated1RM(formData.weight, formData.reps).toFixed(1) }}kg
        </div>
        <button type="submit" :disabled="loading">
          {{ loading ? '提交中...' : '提交' }}
        </button>
      </form>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { usePersonalBest } from '@/composables/usePersonalBest';
import { useToast } from '@/composables/useToast';

const { 
  loading, 
  error, 
  getLeaderboard, 
  updatePersonalBest 
} = usePersonalBest();
const { showSuccess, showError } = useToast();

const leaderboard = ref([]);
const formData = ref({
  exercise_id: '',
  exercise_name: '',
  weight: 0,
  reps: 1,
});

const calculateEstimated1RM = (weight: number, reps: number): number => {
  if (!weight || !reps) return 0;
  return weight * (1 + reps / 30);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('zh-CN');
};

const loadLeaderboard = async () => {
  try {
    const result = await getLeaderboard();
    leaderboard.value = result.data.leaderboard;
  } catch (err) {
    // 错误已在composable中处理
  }
};

const handleUpdate = async () => {
  try {
    const result = await updatePersonalBest(formData.value);
    
    if (result.data.is_new_record) {
      showSuccess('🎉 恭喜！打破个人最佳记录！');
    } else {
      showSuccess('记录已更新');
    }

    // 重新加载排行榜
    await loadLeaderboard();

    // 重置表单
    formData.value = {
      exercise_id: '',
      exercise_name: '',
      weight: 0,
      reps: 1,
    };
  } catch (err) {
    // 错误已在composable中处理
  }
};

onMounted(() => {
  loadLeaderboard();
});
</script>

<style scoped>
.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.rank {
  font-weight: bold;
  font-size: 1.2rem;
  color: #666;
  min-width: 2rem;
}

.exercise-name {
  flex: 1;
  font-weight: 500;
}

.estimated-1rm {
  font-weight: bold;
  color: #4CAF50;
}
</style>
```

---

## 🔗 相关文档

- [训练日志API](./06-训练日志API.md) - 训练日志记录（自动触发个人最佳记录更新）
- [训练计划API](./03-训练计划API.md) - 训练计划管理
- [后端MySQL数据库结构](../../yuzhen-backend/docs/02-核心架构/02-数据层/03-MySQL数据库完整结构文档.md)

---

## 📝 版本历史

### v1.0.0 (2026-01-17)
- ✅ 初始版本
- ✅ 文档化6个个人最佳记录API端点
- ✅ 说明自动更新逻辑（训练日志触发）
- ✅ 说明1RM估算公式（Epley公式）
- ✅ 提供完整的前端集成示例
- ✅ 提供力量排行榜功能
