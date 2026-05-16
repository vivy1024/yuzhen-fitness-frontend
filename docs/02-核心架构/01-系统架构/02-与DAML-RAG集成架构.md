# 与 YuzhenFork 集成架构

**版本**: v3.0.0
**更新日期**: 2026-05-16
**状态**: ✅ 已验证

---

## 概述

玉珍健身前端通过 WebSocket 连接 YuzhenFork Studio，YuzhenFork 作为 AI Agent 编排层，通过 MCP 协议调用 DAML-RAG 的 25 个工具。

### 架构图

```
Vue 前端 (localhost:9000)
  │
  │ WebSocket ws://localhost:4600/api/sessions/:id/chat
  ▼
YuzhenFork Studio (localhost:4600)
  │ - 健身教练 System Prompt (fitness-plugin)
  │ - 14 个 Skill 定义
  │ - DeepSeek LLM (function calling)
  │
  │ MCP stdio (docker exec -i fitness_daml_rag python -m src_v2.server)
  ▼
DAML-RAG (Docker 容器)
  │ - 25 个 MCP 工具
  │ - 浪潮引擎（向量检索 + 图谱推理 + 安全过滤）
  │ - 5,780 知识 chunks
  │ - 1,790 动作 + 1,880 食物 + 65,147 图谱关系
  │
  │ HTTP (容器间)
  ▼
Laravel 后端 (Docker 容器)
  - 用户档案 / 训练记录 / 训练计划
  - 内部 API: /api/internal/users/{id}/profile
```

---

## 通信协议

### WebSocket 事件（服务端 → 前端）

| 事件 | 说明 | 前端处理 |
|------|------|---------|
| `session:snapshot` | 连接时初始状态（历史消息 + session info） | 初始化 messages 列表 |
| `session:state` | session 状态变化（working/idle） | 更新 isWorking |
| `session:stream` | 流式文本 delta | streamingContent += delta |
| `session:message` | 完整消息（user/assistant/tool_use/tool_result） | 追加到 messages |
| `session:error` | 错误 | 显示错误提示 |

### WebSocket 事件（前端 → 服务端）

| 事件 | 说明 |
|------|------|
| `session:message` | 发送用户消息 `{type, content, ack}` |
| `session:abort` | 中止当前生成 |
| `session:ack` | 确认收到消息序号 |

### REST API（前端 → YuzhenFork）

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/sessions` | GET | 获取会话列表 |
| `/api/sessions` | POST | 创建新会话 |
| `/api/sessions/:id` | DELETE | 删除会话 |
| `/api/sessions/:id/chat/history` | GET | 获取历史消息 |

---

## 前端核心文件

| 文件 | 职责 |
|------|------|
| `composables/useYuzhenChat.ts` | WebSocket 连接管理 + 事件处理 |
| `api/yuzhenfork.ts` | Session REST API 客户端 |
| `views/ai/chat.vue` | 对话页面（会话管理 + 消息流 + 输入） |
| `components/chat/MessageItemNew.vue` | 消息渲染（Markdown + 工具卡片 + 训练计划） |
| `components/chat/ToolCallCardNew.vue` | 工具调用卡片（折叠/展开 + 结构化渲染） |
| `components/chat/tool-renderers/` | 工具结果专用渲染器 |
| `components/training/TrainingPlanCard.vue` | 训练计划卡片 |
| `utils/adapters/trainingPlanAdapter.ts` | 训练计划数据格式转换 |
| `utils/adapters/toolCallAdapter.ts` | 工具调用数据提取 |

---

## MCP 工具列表（25 个）

### 检索工具
- `search_exercises` — 智能动作搜索（向量+图谱+安全过滤）
- `get_exercise_detail` — 动作详情
- `search_knowledge` — 知识库检索
- `search_foods` — 食物搜索
- `get_food_detail` — 食物详情
- `get_strength_standards` — 力量标准查询

### 图谱工具
- `graph_query` — 通用图谱查询
- `find_alternatives` — 替代动作
- `check_exercise_safety` — 安全检查
- `get_contraindications` — 禁忌症查询
- `get_posture_corrections` — 体态矫正
- `get_rehabilitation_protocol` — 康复方案
- `get_muscle_exercise_map` — 肌群动作映射

### 计算工具
- `calculate_tdee` — TDEE 计算
- `calculate_training_volume` — 训练容量（MEV/MAV/MRV）
- `calculate_1rm` — 1RM 估算
- `assess_strength_level` — 力量水平评估
- `design_training_split` — 训练分化设计

### 用户数据工具
- `get_user_profile` — 用户档案
- `get_training_history` — 训练记录
- `get_progress_data` — 进度数据
- `save_training_plan` — 保存训练计划

### 智能推理工具
- `generate_training_cycle` — 训练周期生成
- `analyze_training_balance` — 训练平衡分析
- `calculate_progressive_overload` — 渐进超负荷建议

---

## 废弃的旧版组件（待清理）

| 文件 | 原用途 | 替代方案 |
|------|--------|---------|
| `composables/useChatStream.ts` | SSE 流式对话 | useYuzhenChat.ts (WebSocket) |
| `workers/sse-worker.ts` | 后台 SSE 连接 | WebSocket 本身持久 |
| `stores/chat.ts` | 聊天状态管理 | useYuzhenChat 内部管理 |
| `api/topic.ts` | 话题 CRUD | YuzhenFork session API |
| `api/warmup.ts` | DAML-RAG 缓存预热 | MCP 自动连接 |
| `components/chat/MessageItem.vue` | 旧版消息组件 | MessageItemNew.vue |
| `components/chat/ToolCallCard.vue` | 旧版工具卡片 | ToolCallCardNew.vue |
| `utils/streaming-cache.ts` | 流式内容缓存 | 不再需要 |
| `utils/trainingPlanParser.ts` | 文本标记解析 | Adapter 层直接从工具结果获取 |
