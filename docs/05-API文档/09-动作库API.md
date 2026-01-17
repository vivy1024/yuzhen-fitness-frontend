# 动作库API

**状态**: ✅ 已完成  
**版本**: v1.0.0  
**更新日期**: 2026-01-17  
**后端模块**: `app/Modules/Exercise/Controllers/ExerciseController.php`

---

## 📋 概述

动作库API提供1,790个健身动作的完整数据查询和筛选功能，包含34个字段的详细信息，为训练计划生成和动作推荐提供数据支持。

**核心功能**：
- 动作列表查询（支持多维度筛选）
- 动作详情查询（34字段完整数据）
- 动作搜索（关键词匹配）
- 筛选选项查询（肌肉群、器械、难度等）
- 缓存管理

**数据规模**：1,790个动作，34字段完整

---

## 🔌 API端点

### 1. 获取动作列表

```http
GET /api/exercises
GET /api/exercises-v2
```

**说明**：两个路由功能相同，`/api/exercises-v2` 为前端v2使用

**请求参数**（Query）：
```typescript
{
  // 基础筛选
  primary_muscle?: string;      // 主要肌肉（如"胸肌"）
  secondary_muscles?: string;   // 次要肌肉（如"三角肌前束"）
  equipment?: string;           // 器械（如"杠铃"）
  difficulty?: string;          // 难度（beginner/intermediate/advanced）
  force_type?: string;          // 发力类型（push/pull/static）
  mechanics?: string;           // 力学类型（compound/isolation）
  
  // 搜索
  search?: string;              // 搜索关键词
  query?: string;               // 搜索关键词（兼容参数）
  
  // 排序
  sort_by?: string;             // 排序字段，默认"id"
  sort_order?: string;          // 排序方向，默认"asc"（asc/desc）
  
  // 分页
  page?: number;                // 页码，默认1
  per_page?: number;            // 每页数量，默认20
}
```

**排序字段选项**：
- `id`: 按ID排序
- `name`: 按名称排序
- `difficulty`: 按难度排序
- `popularity`: 按热度排序

**请求示例**：
```
GET /api/exercises-v2?primary_muscle=胸肌&equipment=杠铃&difficulty=intermediate&per_page=10
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取动作列表成功",
  "data": {
    "rows": [
      {
        "id": 15,
        "name": "杠铃卧推",
        "name_en": "Barbell Bench Press",
        "primary_muscle": "胸肌",
        "primary_muscle_en": "Chest",
        "secondary_muscles": ["三角肌前束", "肱三头肌"],
        "equipment": "杠铃",
        "equipment_en": "Barbell",
        "difficulty": "intermediate",
        "force_type": "push",
        "mechanics": "compound",
        "category": "力量训练",
        "instructions_zh": "1. 仰卧在平板卧推凳上...",
        "instructions_en": "1. Lie back on a flat bench...",
        "tips": ["保持肩胛骨后缩", "控制下放速度"],
        "image_url": "/images/exercises/barbell-bench-press.jpg",
        "video_url": "/videos/exercises/barbell-bench-press.mp4"
      }
    ],
    "total": 85,
    "page": 1,
    "per_page": 10,
    "total_pages": 9
  }
}
```

---

### 2. 获取动作详情

```http
GET /api/exercises/{id}
GET /api/exercises-v2/{id}
```

**路径参数**：
- `id`: 动作ID

**响应示例**：
```json
{
  "code": 200,
  "message": "获取动作详情成功",
  "data": {
    "id": 15,
    "name": "杠铃卧推",
    "name_en": "Barbell Bench Press",
    "primary_muscle": "胸肌",
    "primary_muscle_en": "Chest",
    "secondary_muscles": ["三角肌前束", "肱三头肌"],
    "secondary_muscles_en": ["Anterior Deltoid", "Triceps"],
    "equipment": "杠铃",
    "equipment_en": "Barbell",
    "difficulty": "intermediate",
    "force_type": "push",
    "mechanics": "compound",
    "category": "力量训练",
    "category_en": "Strength",
    "instructions_zh": [
      "1. 仰卧在平板卧推凳上，双脚平放在地面",
      "2. 双手握住杠铃，握距略宽于肩宽",
      "3. 将杠铃从架上取下，手臂伸直",
      "4. 缓慢下放杠铃至胸部中部",
      "5. 用力推起杠铃至起始位置"
    ],
    "instructions_en": [
      "1. Lie back on a flat bench with feet flat on the floor",
      "2. Grip the barbell with hands slightly wider than shoulder width",
      "3. Unrack the bar with arms extended",
      "4. Lower the bar slowly to mid-chest",
      "5. Press the bar back to starting position"
    ],
    "tips": [
      "保持肩胛骨后缩和下沉",
      "控制下放速度，避免弹震",
      "呼吸：下放时吸气，推起时呼气",
      "保持核心收紧"
    ],
    "common_mistakes": [
      "肩胛骨未后缩，导致肩部受力过大",
      "下放速度过快，失去控制",
      "臀部离开凳面",
      "握距过宽或过窄"
    ],
    "variations": [
      "上斜杠铃卧推",
      "下斜杠铃卧推",
      "窄握杠铃卧推"
    ],
    "image_url": "/images/exercises/barbell-bench-press.jpg",
    "video_url": "/videos/exercises/barbell-bench-press.mp4",
    "gif_url": "/gifs/exercises/barbell-bench-press.gif",
    "muscle_diagram_url": "/images/muscle-diagrams/barbell-bench-press.png",
    "tags": ["复合动作", "上肢推", "胸部训练"],
    "popularity_score": 95,
    "safety_rating": 4,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 3. 搜索动作

```http
GET /api/exercises/search
GET /api/exercises-v2/search
```

**请求参数**（Query）：
```typescript
{
  q: string;                // 搜索关键词（必填）
  page?: number;            // 页码，默认1
  per_page?: number;        // 每页数量，默认20
}
```

**请求示例**：
```
GET /api/exercises-v2/search?q=卧推&per_page=10
```

**响应示例**：
```json
{
  "code": 200,
  "message": "搜索完成",
  "data": {
    "keyword": "卧推",
    "results": [
      {
        "id": 15,
        "name": "杠铃卧推",
        "name_en": "Barbell Bench Press",
        "primary_muscle": "胸肌",
        "equipment": "杠铃",
        "difficulty": "intermediate"
      },
      {
        "id": 16,
        "name": "哑铃卧推",
        "name_en": "Dumbbell Bench Press",
        "primary_muscle": "胸肌",
        "equipment": "哑铃",
        "difficulty": "intermediate"
      }
    ],
    "total": 5
  }
}
```

---

### 4. 获取筛选选项

```http
GET /api/exercises/filter-options
GET /api/exercises-v2/filter-options
```

**说明**：返回所有可用的筛选选项，带HTTP缓存（24小时）

**响应示例**：
```json
{
  "code": 200,
  "message": "获取筛选选项成功",
  "data": {
    "primary_muscles": [
      { "value": "胸肌", "label": "胸肌", "count": 120 },
      { "value": "背部", "label": "背部", "count": 150 },
      { "value": "腿部", "label": "腿部", "count": 180 },
      { "value": "肩部", "label": "肩部", "count": 100 },
      { "value": "手臂", "label": "手臂", "count": 90 },
      { "value": "核心", "label": "核心", "count": 80 }
    ],
    "equipment": [
      { "value": "杠铃", "label": "杠铃", "count": 200 },
      { "value": "哑铃", "label": "哑铃", "count": 250 },
      { "value": "器械", "label": "器械", "count": 180 },
      { "value": "自重", "label": "自重", "count": 150 },
      { "value": "弹力带", "label": "弹力带", "count": 80 },
      { "value": "壶铃", "label": "壶铃", "count": 60 }
    ],
    "difficulty": [
      { "value": "beginner", "label": "初级", "count": 400 },
      { "value": "intermediate", "label": "中级", "count": 800 },
      { "value": "advanced", "label": "高级", "count": 590 }
    ],
    "force_type": [
      { "value": "push", "label": "推", "count": 600 },
      { "value": "pull", "label": "拉", "count": 550 },
      { "value": "static", "label": "静态", "count": 100 }
    ],
    "mechanics": [
      { "value": "compound", "label": "复合动作", "count": 900 },
      { "value": "isolation", "label": "孤立动作", "count": 890 }
    ],
    "categories": [
      { "value": "力量训练", "label": "力量训练", "count": 1200 },
      { "value": "有氧训练", "label": "有氧训练", "count": 200 },
      { "value": "拉伸", "label": "拉伸", "count": 150 },
      { "value": "核心训练", "label": "核心训练", "count": 240 }
    ]
  }
}
```

**HTTP缓存头**：
```
Cache-Control: public, max-age=86400
Expires: <24小时后的时间>
```

---

### 5. 清除筛选选项缓存

```http
GET /api/exercises/filter-options/clear-cache
GET /api/exercises-v2/filter-options/clear-cache
```

**说明**：清除筛选选项的缓存，用于数据更新后刷新

**响应示例**：
```json
{
  "code": 200,
  "message": "缓存已清除并重新加载",
  "data": {
    "cleared": true,
    "options_count": 6
  }
}
```

---

## 🔄 工作流程

### 动作列表查询流程

```
1. 前端调用 GET /api/exercises-v2
   - 传递筛选参数（肌肉群、器械、难度等）
   ↓
2. ExerciseService::getList()
   - 构建查询条件
   - 应用多维度筛选器
   - 应用排序
   - 分页
   ↓
3. 返回动作列表
   - 使用ExerciseResource格式化数据
   - 返回分页信息
```

### 动作搜索流程

```
1. 前端调用 GET /api/exercises-v2/search?q=关键词
   ↓
2. ExerciseService::search()
   - 在name和name_en字段中模糊匹配
   - 在primary_muscle中匹配
   - 在equipment中匹配
   - 分页
   ↓
3. 返回搜索结果
   - 包含匹配的动作列表
   - 返回总数
```

---

## 📊 数据结构

### Exercise模型（34字段完整）

```typescript
interface Exercise {
  // 基础信息
  id: number;
  name: string;                    // 动作名称（中文）
  name_en: string;                 // 动作名称（英文）
  
  // 肌肉群
  primary_muscle: string;          // 主要肌肉（中文）
  primary_muscle_en: string;       // 主要肌肉（英文）
  secondary_muscles: string[];     // 次要肌肉（中文）
  secondary_muscles_en: string[];  // 次要肌肉（英文）
  
  // 器械和分类
  equipment: string;               // 器械（中文）
  equipment_en: string;            // 器械（英文）
  category: string;                // 分类（中文）
  category_en: string;             // 分类（英文）
  
  // 难度和类型
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  force_type: 'push' | 'pull' | 'static';
  mechanics: 'compound' | 'isolation';
  
  // 说明和指导
  instructions_zh: string[];       // 动作步骤（中文）
  instructions_en: string[];       // 动作步骤（英文）
  tips: string[];                  // 技巧提示
  common_mistakes: string[];       // 常见错误
  variations: string[];            // 变式动作
  
  // 媒体资源
  image_url: string;               // 图片URL
  video_url: string;               // 视频URL
  gif_url: string;                 // GIF动图URL
  muscle_diagram_url: string;      // 肌肉图URL
  
  // 其他
  tags: string[];                  // 标签
  popularity_score: number;        // 热度评分 0-100
  safety_rating: number;           // 安全评级 1-5
  
  // 时间戳
  created_at: string;
  updated_at: string;
}
```

### 筛选维度说明

| 维度 | 说明 | 示例值 |
|------|------|--------|
| primary_muscle | 主要肌肉群 | 胸肌、背部、腿部、肩部、手臂、核心 |
| equipment | 器械类型 | 杠铃、哑铃、器械、自重、弹力带、壶铃 |
| difficulty | 难度等级 | beginner（初级）、intermediate（中级）、advanced（高级） |
| force_type | 发力类型 | push（推）、pull（拉）、static（静态） |
| mechanics | 力学类型 | compound（复合动作）、isolation（孤立动作） |
| category | 训练分类 | 力量训练、有氧训练、拉伸、核心训练 |

---

## 💻 前端集成示例

### Composable

```typescript
// composables/useExercise.ts
import { ref } from 'vue';
import { apiClient } from '@/lib/api-client';

export function useExercise() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getExercises = async (params?: {
    primary_muscle?: string;
    secondary_muscles?: string;
    equipment?: string;
    difficulty?: string;
    force_type?: string;
    mechanics?: string;
    search?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/exercises-v2', { params });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取动作列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getExerciseDetail = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get(`/exercises-v2/${id}`);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取动作详情失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const searchExercises = async (keyword: string, params?: {
    page?: number;
    per_page?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/exercises-v2/search', {
        params: { q: keyword, ...params },
      });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '搜索动作失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getFilterOptions = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/exercises-v2/filter-options');
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取筛选选项失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    getExercises,
    getExerciseDetail,
    searchExercises,
    getFilterOptions,
  };
}
```

### Vue组件示例

```vue
<template>
  <div class="exercise-library">
    <h2>动作库</h2>

    <!-- 搜索框 -->
    <div class="search-box">
      <input 
        v-model="searchKeyword" 
        @keyup.enter="handleSearch"
        placeholder="搜索动作..." 
      />
      <button @click="handleSearch">搜索</button>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <select v-model="filters.primary_muscle" @change="handleFilter">
        <option value="">全部肌肉群</option>
        <option v-for="muscle in filterOptions.primary_muscles" :key="muscle.value" :value="muscle.value">
          {{ muscle.label }} ({{ muscle.count }})
        </option>
      </select>

      <select v-model="filters.equipment" @change="handleFilter">
        <option value="">全部器械</option>
        <option v-for="equip in filterOptions.equipment" :key="equip.value" :value="equip.value">
          {{ equip.label }} ({{ equip.count }})
        </option>
      </select>

      <select v-model="filters.difficulty" @change="handleFilter">
        <option value="">全部难度</option>
        <option v-for="diff in filterOptions.difficulty" :key="diff.value" :value="diff.value">
          {{ diff.label }} ({{ diff.count }})
        </option>
      </select>

      <select v-model="filters.mechanics" @change="handleFilter">
        <option value="">全部类型</option>
        <option v-for="mech in filterOptions.mechanics" :key="mech.value" :value="mech.value">
          {{ mech.label }} ({{ mech.count }})
        </option>
      </select>
    </div>

    <!-- 动作列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="exercises.length === 0" class="empty">暂无动作</div>
    <div v-else class="exercise-list">
      <div v-for="exercise in exercises" :key="exercise.id" class="exercise-item" @click="viewDetail(exercise.id)">
        <img v-if="exercise.image_url" :src="exercise.image_url" :alt="exercise.name" />
        <div class="info">
          <h3>{{ exercise.name }}</h3>
          <div class="meta">
            <span class="muscle">{{ exercise.primary_muscle }}</span>
            <span class="equipment">{{ exercise.equipment }}</span>
            <span class="difficulty" :class="exercise.difficulty">
              {{ getDifficultyLabel(exercise.difficulty) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useExercise } from '@/composables/useExercise';
import { useRouter } from 'vue-router';

const { loading, error, getExercises, searchExercises, getFilterOptions } = useExercise();
const router = useRouter();

const searchKeyword = ref('');
const exercises = ref([]);
const filterOptions = ref({
  primary_muscles: [],
  equipment: [],
  difficulty: [],
  mechanics: [],
});
const currentPage = ref(1);
const totalPages = ref(1);

const filters = ref({
  primary_muscle: '',
  equipment: '',
  difficulty: '',
  mechanics: '',
});

const getDifficultyLabel = (difficulty: string): string => {
  const labels = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级',
  };
  return labels[difficulty] || difficulty;
};

const loadExercises = async () => {
  try {
    const result = await getExercises({
      ...filters.value,
      page: currentPage.value,
      per_page: 20,
    });
    exercises.value = result.data.rows;
    totalPages.value = result.data.total_pages;
  } catch (err) {
    // 错误已在composable中处理
  }
};

const loadFilterOptions = async () => {
  try {
    const result = await getFilterOptions();
    filterOptions.value = result.data;
  } catch (err) {
    // 错误已在composable中处理
  }
};

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    await loadExercises();
    return;
  }

  try {
    const result = await searchExercises(searchKeyword.value, {
      page: currentPage.value,
      per_page: 20,
    });
    exercises.value = result.data.results;
    totalPages.value = Math.ceil(result.data.total / 20);
  } catch (err) {
    // 错误已在composable中处理
  }
};

const handleFilter = () => {
  currentPage.value = 1;
  loadExercises();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadExercises();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadExercises();
  }
};

const viewDetail = (id: number) => {
  router.push(`/exercises/${id}`);
};

onMounted(() => {
  loadFilterOptions();
  loadExercises();
});
</script>

<style scoped>
.exercise-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.exercise-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.exercise-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.exercise-item img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.meta {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
}

.difficulty.beginner { color: #4CAF50; }
.difficulty.intermediate { color: #FF9800; }
.difficulty.advanced { color: #F44336; }
</style>
```

---

## 🔗 相关文档

- [训练计划API](./03-训练计划API.md) - 训练计划生成（使用动作数据）
- [训练日志API](./06-训练日志API.md) - 训练日志记录（关联动作）
- [食物库API](./08-食物库API.md) - 食物数据查询
- [AI聊天API](./04-AI聊天API.md) - AI动作推荐
- [后端MySQL数据库结构](../../yuzhen-backend/docs/02-核心架构/02-数据层/03-MySQL数据库完整结构文档.md)
- [DAML-RAG Neo4j数据库](../../daml-rag-server/docs/02-核心架构/02-数据层/02-Neo4j数据库结构.md)

---

## 📝 版本历史

### v1.0.0 (2026-01-17)
- ✅ 初始版本
- ✅ 文档化5个动作库API端点
- ✅ 说明34字段完整数据结构
- ✅ 说明多维度筛选功能（肌肉群、器械、难度、力学类型等）
- ✅ 说明HTTP缓存机制（24小时）
- ✅ 提供完整的前端集成示例
- ✅ 说明两个路由版本的兼容性
