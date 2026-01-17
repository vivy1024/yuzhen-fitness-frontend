# 食物库API

**状态**: ✅ 已完成  
**版本**: v1.0.0  
**更新日期**: 2026-01-17  
**后端模块**: `app/Modules/Food/Controllers/FoodController.php`

---

## 📋 概述

食物库API提供1,880个食物的营养数据查询和筛选功能，支持按分类、营养特征筛选，为饮食计划和营养分析提供数据支持。

**核心功能**：
- 食物列表查询（支持分页）
- 食物详情查询
- 食物搜索（关键词匹配）
- 分类列表查询
- 筛选选项查询
- 高蛋白/低卡路里快速筛选

**数据规模**：1,880个食物

---

## 🔌 API端点

### 1. 获取食物列表

```http
GET /api/foods
```

**请求参数**（Query）：
```typescript
{
  category?: string;        // 分类（如"肉类"）
  subcategory?: string;     // 子分类（如"猪肉"）
  search?: string;          // 搜索关键词
  query?: string;           // 搜索关键词（兼容参数）
  high_protein?: boolean;   // 高蛋白筛选（蛋白质≥20g/100g）
  low_calorie?: boolean;    // 低卡路里筛选（热量≤100kcal/100g）
  sort_by?: string;         // 排序字段，默认"id"
  sort_order?: string;      // 排序方向，默认"asc"（asc/desc）
  page?: number;            // 页码，默认1
  per_page?: number;        // 每页数量，默认20
}
```

**排序字段选项**：
- `id`: 按ID排序
- `name`: 按名称排序
- `calories`: 按热量排序
- `protein`: 按蛋白质含量排序
- `carbs`: 按碳水化合物含量排序
- `fat`: 按脂肪含量排序

**请求示例**：
```
GET /api/foods?category=肉类&high_protein=true&sort_by=protein&sort_order=desc&per_page=10
```

**响应示例**：
```json
{
  "code": 200,
  "message": "获取食物列表成功",
  "data": {
    "rows": [
      {
        "id": 1,
        "name": "鸡胸肉",
        "category": "肉类",
        "subcategory": "鸡肉",
        "calories": 165,
        "protein": 31.0,
        "carbs": 0.0,
        "fat": 3.6,
        "fiber": 0.0,
        "serving_size": "100g"
      },
      {
        "id": 2,
        "name": "牛里脊",
        "category": "肉类",
        "subcategory": "牛肉",
        "calories": 250,
        "protein": 26.0,
        "carbs": 0.0,
        "fat": 17.0,
        "fiber": 0.0,
        "serving_size": "100g"
      }
    ],
    "total": 150,
    "page": 1,
    "per_page": 10,
    "total_pages": 15
  }
}
```

---

### 2. 获取食物详情

```http
GET /api/foods/{id}
```

**路径参数**：
- `id`: 食物ID

**响应示例**：
```json
{
  "code": 200,
  "message": "获取食物详情成功",
  "data": {
    "id": 1,
    "name": "鸡胸肉",
    "category": "肉类",
    "subcategory": "鸡肉",
    "calories": 165,
    "protein": 31.0,
    "carbs": 0.0,
    "fat": 3.6,
    "fiber": 0.0,
    "serving_size": "100g",
    "description": "去皮鸡胸肉，高蛋白低脂肪，健身人群首选",
    "nutritional_info": {
      "vitamins": {
        "vitamin_a": "0.02mg",
        "vitamin_b6": "0.6mg",
        "vitamin_b12": "0.3μg"
      },
      "minerals": {
        "iron": "1.0mg",
        "zinc": "1.3mg",
        "selenium": "11.75μg"
      }
    },
    "tags": ["高蛋白", "低脂肪", "健身推荐"],
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-01-01T00:00:00Z"
  }
}
```

---

### 3. 搜索食物

```http
GET /api/foods/search
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
GET /api/foods/search?q=鸡肉&per_page=10
```

**响应示例**：
```json
{
  "code": 200,
  "message": "搜索完成",
  "data": {
    "keyword": "鸡肉",
    "results": [
      {
        "id": 1,
        "name": "鸡胸肉",
        "category": "肉类",
        "subcategory": "鸡肉",
        "calories": 165,
        "protein": 31.0,
        "carbs": 0.0,
        "fat": 3.6,
        "fiber": 0.0,
        "serving_size": "100g"
      },
      {
        "id": 5,
        "name": "鸡腿肉",
        "category": "肉类",
        "subcategory": "鸡肉",
        "calories": 190,
        "protein": 26.0,
        "carbs": 0.0,
        "fat": 9.0,
        "fiber": 0.0,
        "serving_size": "100g"
      }
    ],
    "total": 8
  }
}
```

---

### 4. 获取分类列表

```http
GET /api/foods/categories
```

**说明**：返回所有食物分类和子分类，带HTTP缓存（24小时）

**响应示例**：
```json
{
  "code": 200,
  "message": "获取分类列表成功",
  "data": [
    {
      "category": "肉类",
      "subcategories": ["鸡肉", "猪肉", "牛肉", "羊肉", "鱼肉"],
      "count": 250
    },
    {
      "category": "蔬菜",
      "subcategories": ["叶菜类", "根茎类", "瓜果类", "菌菇类"],
      "count": 300
    },
    {
      "category": "水果",
      "subcategories": ["浆果类", "柑橘类", "核果类", "热带水果"],
      "count": 200
    },
    {
      "category": "谷物",
      "subcategories": ["米类", "面类", "杂粮"],
      "count": 150
    },
    {
      "category": "豆类",
      "subcategories": ["大豆", "杂豆", "豆制品"],
      "count": 100
    },
    {
      "category": "奶制品",
      "subcategories": ["牛奶", "酸奶", "奶酪"],
      "count": 80
    }
  ]
}
```

**HTTP缓存头**：
```
Cache-Control: public, max-age=86400
Expires: <24小时后的时间>
```

---

### 5. 获取筛选选项

```http
GET /api/foods/filter-options
```

**说明**：返回所有可用的筛选选项，带HTTP缓存（24小时）

**响应示例**：
```json
{
  "code": 200,
  "message": "获取筛选选项成功",
  "data": {
    "categories": [
      "肉类",
      "蔬菜",
      "水果",
      "谷物",
      "豆类",
      "奶制品"
    ],
    "sort_options": [
      { "value": "id", "label": "默认排序" },
      { "value": "name", "label": "名称排序" },
      { "value": "calories", "label": "热量排序" },
      { "value": "protein", "label": "蛋白质排序" },
      { "value": "carbs", "label": "碳水排序" },
      { "value": "fat", "label": "脂肪排序" }
    ],
    "quick_filters": [
      { "key": "high_protein", "label": "高蛋白", "description": "蛋白质≥20g/100g" },
      { "key": "low_calorie", "label": "低卡路里", "description": "热量≤100kcal/100g" }
    ]
  }
}
```

---

### 6. 清除缓存

```http
GET /api/foods/clear-cache
```

**说明**：清除分类和筛选选项的缓存，用于数据更新后刷新

**响应示例**：
```json
{
  "code": 200,
  "message": "缓存已清除并重新加载",
  "data": {
    "cleared": true,
    "categories_count": 6
  }
}
```

---

## 🔄 工作流程

### 食物列表查询流程

```
1. 前端调用 GET /api/foods
   - 传递筛选参数（分类、营养特征等）
   ↓
2. FoodService::getList()
   - 构建查询条件
   - 应用筛选器
   - 应用排序
   - 分页
   ↓
3. 返回食物列表
   - 使用FoodResource格式化数据
   - 返回分页信息
```

### 食物搜索流程

```
1. 前端调用 GET /api/foods/search?q=关键词
   ↓
2. FoodService::search()
   - 在name字段中模糊匹配
   - 在category和subcategory中匹配
   - 分页
   ↓
3. 返回搜索结果
   - 包含匹配的食物列表
   - 返回总数
```

---

## 📊 数据结构

### Food模型

```typescript
interface Food {
  id: number;
  name: string;                // 食物名称
  category: string;            // 分类
  subcategory: string;         // 子分类
  calories: number;            // 热量（kcal/100g）
  protein: number;             // 蛋白质（g/100g）
  carbs: number;               // 碳水化合物（g/100g）
  fat: number;                 // 脂肪（g/100g）
  fiber: number;               // 膳食纤维（g/100g）
  serving_size: string;        // 份量（通常为"100g"）
  description?: string;        // 描述
  nutritional_info?: {         // 详细营养信息
    vitamins?: Record<string, string>;
    minerals?: Record<string, string>;
  };
  tags?: string[];             // 标签
  created_at: string;
  updated_at: string;
}
```

### 营养特征定义

| 特征 | 定义 |
|------|------|
| 高蛋白 | 蛋白质 ≥ 20g/100g |
| 低卡路里 | 热量 ≤ 100kcal/100g |
| 高纤维 | 膳食纤维 ≥ 5g/100g |
| 低脂肪 | 脂肪 ≤ 3g/100g |

---

## 💻 前端集成示例

### Composable

```typescript
// composables/useFood.ts
import { ref } from 'vue';
import { apiClient } from '@/lib/api-client';

export function useFood() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const getFoods = async (params?: {
    category?: string;
    subcategory?: string;
    search?: string;
    high_protein?: boolean;
    low_calorie?: boolean;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/foods', { params });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取食物列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getFoodDetail = async (id: number) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get(`/foods/${id}`);
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取食物详情失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const searchFoods = async (keyword: string, params?: {
    page?: number;
    per_page?: number;
  }) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/foods/search', {
        params: { q: keyword, ...params },
      });
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '搜索食物失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getCategories = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/foods/categories');
      return response.data;
    } catch (err: any) {
      error.value = err.response?.data?.message || '获取分类列表失败';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getFilterOptions = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await apiClient.get('/foods/filter-options');
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
    getFoods,
    getFoodDetail,
    searchFoods,
    getCategories,
    getFilterOptions,
  };
}
```

### Vue组件示例

```vue
<template>
  <div class="food-library">
    <h2>食物库</h2>

    <!-- 搜索框 -->
    <div class="search-box">
      <input 
        v-model="searchKeyword" 
        @keyup.enter="handleSearch"
        placeholder="搜索食物..." 
      />
      <button @click="handleSearch">搜索</button>
    </div>

    <!-- 筛选器 -->
    <div class="filters">
      <select v-model="filters.category" @change="handleFilter">
        <option value="">全部分类</option>
        <option v-for="cat in categories" :key="cat.category" :value="cat.category">
          {{ cat.category }} ({{ cat.count }})
        </option>
      </select>

      <label>
        <input type="checkbox" v-model="filters.high_protein" @change="handleFilter" />
        高蛋白
      </label>

      <label>
        <input type="checkbox" v-model="filters.low_calorie" @change="handleFilter" />
        低卡路里
      </label>

      <select v-model="filters.sort_by" @change="handleFilter">
        <option value="id">默认排序</option>
        <option value="name">名称排序</option>
        <option value="calories">热量排序</option>
        <option value="protein">蛋白质排序</option>
      </select>
    </div>

    <!-- 食物列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="foods.length === 0" class="empty">暂无食物</div>
    <div v-else class="food-list">
      <div v-for="food in foods" :key="food.id" class="food-item" @click="viewDetail(food.id)">
        <h3>{{ food.name }}</h3>
        <div class="category">{{ food.category }} - {{ food.subcategory }}</div>
        <div class="nutrition">
          <span>热量: {{ food.calories }}kcal</span>
          <span>蛋白质: {{ food.protein }}g</span>
          <span>碳水: {{ food.carbs }}g</span>
          <span>脂肪: {{ food.fat }}g</span>
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
import { useFood } from '@/composables/useFood';
import { useRouter } from 'vue-router';

const { loading, error, getFoods, searchFoods, getCategories } = useFood();
const router = useRouter();

const searchKeyword = ref('');
const foods = ref([]);
const categories = ref([]);
const currentPage = ref(1);
const totalPages = ref(1);

const filters = ref({
  category: '',
  high_protein: false,
  low_calorie: false,
  sort_by: 'id',
  sort_order: 'asc',
});

const loadFoods = async () => {
  try {
    const result = await getFoods({
      ...filters.value,
      page: currentPage.value,
      per_page: 20,
    });
    foods.value = result.data.rows;
    totalPages.value = result.data.total_pages;
  } catch (err) {
    // 错误已在composable中处理
  }
};

const loadCategories = async () => {
  try {
    const result = await getCategories();
    categories.value = result.data;
  } catch (err) {
    // 错误已在composable中处理
  }
};

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    await loadFoods();
    return;
  }

  try {
    const result = await searchFoods(searchKeyword.value, {
      page: currentPage.value,
      per_page: 20,
    });
    foods.value = result.data.results;
    totalPages.value = Math.ceil(result.data.total / 20);
  } catch (err) {
    // 错误已在composable中处理
  }
};

const handleFilter = () => {
  currentPage.value = 1;
  loadFoods();
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    loadFoods();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadFoods();
  }
};

const viewDetail = (id: number) => {
  router.push(`/foods/${id}`);
};

onMounted(() => {
  loadCategories();
  loadFoods();
});
</script>

<style scoped>
.food-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.food-item {
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.food-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.nutrition {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}
</style>
```

---

## 🔗 相关文档

- [动作库API](./09-动作库API.md) - 动作数据查询
- [AI聊天API](./04-AI聊天API.md) - AI饮食建议
- [后端MySQL数据库结构](../../yuzhen-backend/docs/02-核心架构/02-数据层/03-MySQL数据库完整结构文档.md)

---

## 📝 版本历史

### v1.0.0 (2026-01-17)
- ✅ 初始版本
- ✅ 文档化6个食物库API端点
- ✅ 说明筛选和排序功能
- ✅ 说明HTTP缓存机制（24小时）
- ✅ 提供完整的前端集成示例
- ✅ 说明营养特征定义
