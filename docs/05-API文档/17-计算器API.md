# 计算器API

**状态**: 建设中
**版本**: v1.0.0
**更新日期**: 2026-02-28
**对应源文件**: `src/api/calculators.ts`

---

## 概述

计算器API提供7个健身计算器的前端调用接口，帮助用户进行健身相关的计算。无需认证，登录用户可选择将计算结果保存到个人档案。

**核心功能**：
- TDEE（每日总能量消耗）计算
- FFMI（去脂体重指数）计算
- 1RM（单次最大重量）估算
- 训练强度转换（RPE/RIR/百分比）
- 训练重量推荐
- 碳水循环计划
- 宏量营养素计算

---

## 端点列表

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/calculators/tdee | 计算TDEE | 可选 |
| POST | /api/calculators/ffmi | 计算FFMI | 可选 |
| POST | /api/calculators/one-rm | 估算1RM | 否 |
| POST | /api/calculators/intensity | 转换训练强度 | 否 |
| POST | /api/calculators/weight | 推荐训练重量 | 否 |
| POST | /api/calculators/carb-cycling | 碳水循环计划 | 可选 |
| POST | /api/calculators/macros | 计算宏量营养素 | 可选 |

---

## 详细说明

### 1. 计算TDEE

计算每日总能量消耗和目标热量。

```http
POST /api/calculators/tdee
```

**请求参数**：
```typescript
{
  age: number;                    // 年龄
  gender: 'male' | 'female';     // 性别
  weight_kg: number;              // 体重(kg)
  height_cm: number;              // 身高(cm)
  activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';  // 活动水平
  fitness_goal: 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp';  // 健身目标
  save_to_profile?: boolean;     // 是否保存到档案
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "bmr": 1750,
    "tdee": 2625,
    "target_calories": 2100,
    "deficit_or_surplus": -525,
    "activity_level": "moderately_active",
    "fitness_goal": "fat_loss",
    "formula_used": "Mifflin-St Jeor",
    "macros": {
      "protein_g": 157,
      "protein_cal": 628,
      "fat_g": 70,
      "fat_cal": 630,
      "carbs_g": 210,
      "carbs_cal": 840,
      "protein_ratio": 0.30,
      "fat_ratio": 0.30,
      "carbs_ratio": 0.40
    }
  }
}
```

---

### 2. 计算FFMI

计算去脂体重指数，评估肌肉发展水平。

```http
POST /api/calculators/ffmi
```

**请求参数**：
```typescript
{
  height_cm: number;              // 身高(cm)
  weight_kg: number;              // 体重(kg)
  gender: 'male' | 'female';     // 性别
  body_fat?: number;             // 体脂率(%)
  save_to_profile?: boolean;     // 是否保存到档案
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "bmi": 24.5,
    "bmi_status": "正常",
    "body_fat": 15,
    "used_estimated_bf": false,
    "lean_body_mass": 70,
    "ffmi": 22.3,
    "normalized_ffmi": 23.1,
    "assessment": "优秀",
    "natural_potential": {
      "percentage": 85,
      "limit": 25,
      "description": "接近自然训练极限"
    },
    "training_recommendation": {
      "focus": "继续当前训练计划",
      "suggestions": ["保持训练量", "注意恢复", "保证睡眠"]
    }
  }
}
```

---

### 3. 估算1RM

根据重量和次数估算单次最大重量。

```http
POST /api/calculators/one-rm
```

**请求参数**：
```typescript
{
  weight_kg: number;              // 重量(kg)
  reps: number;                   // 次数
  formula?: 'epley' | 'brzycki' | 'average';  // 计算公式
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "estimated_1rm": 100,
    "epley_1rm": 100,
    "brzycki_1rm": 98,
    "input_reps": 8,
    "formula_used": "average",
    "percentage_table": [
      { "percentage": 100, "weight": 100, "reps": "1" },
      { "percentage": 95, "weight": 95, "reps": "2" },
      { "percentage": 90, "weight": 90, "reps": "4" },
      { "percentage": 85, "weight": 85, "reps": "6" },
      { "percentage": 80, "weight": 80, "reps": "8" },
      { "percentage": 75, "weight": 75, "reps": "10" },
      { "percentage": 70, "weight": 70, "reps": "12" }
    ]
  }
}
```

---

### 4. 训练强度转换

在不同训练强度指标间转换（RPE/RIR/百分比）。

```http
POST /api/calculators/intensity
```

**请求参数**：
```typescript
{
  input_type: 'rpe' | 'rir' | 'percentage';  // 输入类型
  value: number;                              // 输入值
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "rpe": 8,
    "rir": 2,
    "percentage_low": 80,
    "percentage_high": 85,
    "description": "接近力竭，还能完成2-3次",
    "input_percentage": 82.5
  }
}
```

---

### 5. 推荐训练重量

根据1RM和训练目标推荐训练重量。

```http
POST /api/calculators/weight
```

**请求参数**：
```typescript
{
  estimated_1rm: number;                     // 估算1RM
  training_goal: 'strength' | 'hypertrophy' | 'endurance' | 'power';  // 训练目标
  target_reps?: number;                      // 目标次数
  target_rpe?: number;                        // 目标RPE
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "recommended_weight": 80,
    "weight_range": { "min": 75, "max": 85 },
    "estimated_1rm": 100,
    "percentage_of_1rm": 80,
    "training_goal": "hypertrophy",
    "rep_range": [8, 12],
    "rest_seconds": [60, 90],
    "description": "肌肥大训练区间"
  }
}
```

---

### 6. 碳水循环计划

生成周期性碳水摄入计划。

```http
POST /api/calculators/carb-cycling
```

**请求参数**：
```typescript
{
  tdee: number;                               // TDEE值
  weight_kg: number;                          // 体重(kg)
  fitness_goal: 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp';  // 健身目标
  training_days: number[];                     // 训练日（1-7）
  save_to_profile?: boolean;                  // 是否保存到档案
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "weekly_plan": [
      { "day": 1, "day_name": "周一", "is_training": true, "carb_type": "high", "calories": 2625, "protein_g": 150, "carbs_g": 320, "fat_g": 65 },
      { "day": 2, "day_name": "周二", "is_training": false, "carb_type": "low", "calories": 2100, "protein_g": 150, "carbs_g": 150, "fat_g": 85 },
      { "day": 3, "day_name": "周三", "is_training": true, "carb_type": "high", "calories": 2625, "protein_g": 150, "carbs_g": 320, "fat_g": 65 }
    ],
    "weekly_average_calories": 2200,
    "weekly_total_calories": 15400,
    "high_carb_days": 3,
    "medium_carb_days": 2,
    "low_carb_days": 2,
    "constant_protein_g": 150,
    "tdee_reference": 2500
  }
}
```

---

### 7. 计算宏量营养素

根据目标热量计算每日宏量营养素摄入量。

```http
POST /api/calculators/macros
```

**请求参数**：
```typescript
{
  target_calories: number;                    // 目标热量
  weight_kg: number;                          // 体重(kg)
  fitness_goal: 'fat_loss' | 'mild_fat_loss' | 'maintenance' | 'lean_bulk' | 'hypertrophy' | 'recomp';  // 健身目标
  method?: 'balanced' | 'body_weight' | 'ratio';  // 计算方法
  save_to_profile?: boolean;                  // 是否保存到档案
}
```

**响应示例**：
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "macros": {
      "protein_g": 157,
      "protein_cal": 628,
      "carbs_g": 210,
      "carbs_cal": 840,
      "fat_g": 70,
      "fat_cal": 630
    },
    "ratios": { "protein": 0.30, "carbs": 0.40, "fat": 0.30 },
    "per_kg": { "protein": 2.0, "carbs": 2.7, "fat": 0.9 },
    "total_calories": 2098,
    "target_calories": 2100,
    "fitness_goal": "fat_loss",
    "method": "balanced"
  }
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 422 | 参数验证失败 |
| 500 | 服务器内部错误 |

---

## 前端集成示例

```typescript
// 使用计算器API
import { calculateTDEE, calculateFFMI, calculateOneRM } from '@/api/calculators'

// 计算TDEE
const tdeeResult = await calculateTDEE({
  age: 25,
  gender: 'male',
  weight_kg: 70,
  height_cm: 175,
  activity_level: 'moderately_active',
  fitness_goal: 'fat_loss'
})

// 计算1RM
const oneRmResult = await calculateOneRM({
  weight_kg: 80,
  reps: 8,
  formula: 'average'
})

// 获取百分比训练表
const percentageTable = oneRmResult.data.percentage_table
```

---

## 相关文档

- [会员系统API](./10-会员系统API.md) - 会员等级与积分配额
- [进度追踪API](./12-进度追踪API.md) - 训练进度记录
- [动作库API](./09-动作库API.md) - 动作数据查询

---

## 版本历史

### v1.0.0 (2026-02-28)
- 初始版本
- 文档化7个计算器API端点
- 说明请求参数和响应数据结构