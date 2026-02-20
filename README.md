# 玉珍健身 - 智能健身应用前端

> 基于 shadcn-vue 的现代化健身应用，集成 DAML-RAG AI 系统，提供个性化训练计划和智能健身指导。

[![Vue 3](https://img.shields.io/badge/Vue-3.4-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📖 项目简介

玉珍健身是一款智能健身应用，通过 AI 驱动的训练计划生成、动作库、食物库和进度追踪功能，为用户提供个性化的健身指导。

### 核心特性

- 🤖 **AI 智能顾问**: 基于 DAML-RAG 系统的智能对话，提供个性化健身建议
- 📋 **训练计划管理**: AI 生成训练计划，支持导入、编辑和执行
- 💪 **动作库**: 1,790+ 专业健身动作，支持搜索、筛选和收藏
- 🍎 **食物库**: 1,880+ 食物营养数据，支持饮食记录和营养分析
- 📊 **进度追踪**: 体重趋势、训练日历、目标管理
- 👤 **用户档案**: 完整的个人健身档案，包含身体数据、训练目标、健康状况
- 💎 **会员系统**: 分级会员权益，支持在线支付
- 🎨 **现代化 UI**: 基于 shadcn-vue 的精美界面，支持亮色/暗色主题

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 启动开发服务器 (http://localhost:9000)
npm run dev
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 测试

```bash
# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行组件测试
npm run test:component

# 运行集成测试
npm run test:integration

# 生成测试覆盖率报告
npm run test:coverage
```

## 📁 项目结构

```
yuzhen_fitness/
├── src/
│   ├── api/              # API 接口层
│   │   ├── auth.ts       # 认证 API
│   │   ├── chat.ts       # AI 聊天 API
│   │   ├── exercise.ts   # 动作库 API
│   │   ├── food.ts       # 食物库 API
│   │   ├── training-plan.ts  # 训练计划 API
│   │   └── user.ts       # 用户档案 API
│   ├── assets/           # 静态资源
│   │   └── styles/       # 全局样式
│   ├── components/       # 组件
│   │   ├── ui/           # shadcn-vue 基础组件
│   │   ├── chat/         # AI 聊天组件
│   │   ├── training/     # 训练相关组件
│   │   ├── exercise/     # 动作库组件
│   │   ├── food/         # 食物库组件
│   │   └── user/         # 用户档案组件
│   ├── composables/      # 组合式函数
│   │   ├── useChatStream.ts  # 流式响应
│   │   ├── useTheme.ts   # 主题管理
│   │   └── useAccessibility.ts  # 可访问性
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   │   ├── auth.ts       # 认证状态
│   │   ├── chat.ts       # AI 聊天状态
│   │   ├── training.ts   # 训练计划状态
│   │   ├── user.ts       # 用户档案状态
│   │   └── theme.ts      # 主题状态
│   ├── utils/            # 工具函数
│   │   ├── token.ts      # Token 管理
│   │   ├── trainingPlanParser.ts  # 训练计划解析
│   │   └── accessibility.ts  # 可访问性工具
│   ├── views/            # 页面组件
│   │   ├── auth/         # 登录注册
│   │   ├── ai/           # AI 聊天
│   │   ├── training/     # 训练管理
│   │   ├── exercise/     # 动作库
│   │   ├── food/         # 食物库
│   │   ├── user/         # 用户档案
│   │   ├── membership/   # 会员中心
│   │   └── settings/     # 设置
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── tests/                # 测试文件
│   ├── unit/             # 单元测试
│   ├── component/        # 组件测试
│   └── integration/      # 集成测试
├── docs/                 # 文档
│   ├── 02-核心架构/      # 架构文档
│   ├── 05-API文档/       # API 文档
│   └── 06-部署运维/            # 部署与运维文档
├── public/               # 公共资源
├── .env.example          # 环境变量示例
├── vite.config.ts        # Vite 配置
├── tailwind.config.js    # TailwindCSS 配置
├── tsconfig.json         # TypeScript 配置
└── package.json          # 项目配置
```

## 🛠️ 技术栈

### 核心框架
- **Vue 3.4**: 渐进式 JavaScript 框架
- **TypeScript 5.3**: 类型安全的 JavaScript 超集
- **Vite 5.0**: 下一代前端构建工具

### UI 组件
- **shadcn-vue**: 基于 Radix Vue 的高质量组件库
- **TailwindCSS 3.4**: 原子化 CSS 框架
- **Lucide Icons**: 现代化图标库

### 状态管理
- **Pinia 2.1**: Vue 官方推荐的状态管理库
- **Vue Router 4.2**: Vue 官方路由管理器

### 数据可视化
- **ECharts 5.5**: 强大的数据可视化库

### 测试工具
- **Vitest**: 快速的单元测试框架
- **@vue/test-utils**: Vue 组件测试工具
- **MSW**: API 模拟工具

### 其他工具
- **Axios**: HTTP 客户端
- **Dexie**: IndexedDB 封装库
- **date-fns**: 日期处理库
- **Zod**: TypeScript 优先的模式验证

## 🌟 功能列表

### 已完成功能 (v1.103.0)

#### 认证系统
- ✅ 邮箱密码登录
- ✅ 手机号验证码登录
- ✅ 用户注册（邮箱验证码）
- ✅ JWT Token 管理
- ✅ 自动刷新 Token

#### AI 智能顾问
- ✅ 实时流式对话
- ✅ 话题管理（创建、切换、删除）
- ✅ 工具调用可视化
- ✅ 训练计划卡片展示
- ✅ 训练计划一键导入
- ✅ 三轨评分系统
- ✅ 个性化指标展示

#### 用户档案
- ✅ 基础信息管理
- ✅ 身体数据记录
- ✅ 健身目标设置
- ✅ 健康状况记录
- ✅ 力量数据档案
- ✅ 营养档案管理
- ✅ FFMI 历史追踪

#### 训练管理
- ✅ 训练计划列表
- ✅ 训练计划详情
- ✅ 训练会话记录
- ✅ 训练历史查看
- ✅ 训练统计分析
- ✅ 训练模板管理

#### 动作库
- ✅ 1,790+ 动作数据
- ✅ 关键词搜索
- ✅ 多维度筛选（肌群、器械、难度等）
- ✅ 动作详情展示
- ✅ 动作收藏功能
- ✅ 分页加载

#### 食物库
- ✅ 1,880+ 食物数据
- ✅ 关键词搜索
- ✅ 分类筛选
- ✅ 营养成分展示
- ✅ 饮食记录功能
- ✅ 营养统计分析

#### 进度追踪
- ✅ 体重趋势图表
- ✅ 训练日历
- ✅ 目标管理
- ✅ 关键指标展示
- ✅ 进度记录添加

#### 会员系统
- ✅ 会员等级展示
- ✅ 权益对比
- ✅ 在线支付（打赏模式）
- ✅ 账单记录
- ✅ 订单审核（管理员）

#### 系统设置
- ✅ 主题切换（亮色/暗色）
- ✅ 通知设置
- ✅ 离线数据管理
- ✅ 修改密码
- ✅ 账号注销

#### 可访问性
- ✅ 键盘导航支持
- ✅ ARIA 标签完整性
- ✅ 屏幕阅读器支持
- ✅ 颜色对比度优化
- ✅ 跳过导航链接
- ✅ 符合 WCAG 2.1 AA 标准

#### 测试覆盖
- ✅ 单元测试 (160个测试用例)
- ✅ 组件测试 (42个测试用例)
- ✅ Store测试 (43个测试用例)
- ✅ 集成测试 (92个测试用例)

## 🔗 后端集成

本项目与以下后端服务集成：

- **Laravel 后端**: `http://localhost:8000` - 用户认证、数据持久化
- **DAML-RAG 服务**: `http://localhost:8001` - AI 对话、训练计划生成

详细的 API 文档请参考 `docs/05-API文档/`

## 📝 开发规范

### 代码风格
- 遵循 Vue 3 Composition API
- 使用 TypeScript 类型检查
- 遵循 TailwindCSS 原子化 CSS
- 使用 shadcn-vue 组件库

### Git 提交规范
```
type(scope): description

类型：
- feat: 新功能
- fix: Bug 修复
- docs: 文档更新
- refactor: 代码重构
- perf: 性能优化
- test: 测试相关
- chore: 构建/工具链更新
```

### 组件开发规范
- 组件名使用 PascalCase
- Props 使用 camelCase
- 事件名使用 kebab-case
- 使用 TypeScript 定义 Props 和 Emits
- 添加必要的注释和文档

## 📚 文档

- [系统架构](docs/02-核心架构/01-系统架构/)
- [API 文档](docs/05-API文档/)
- [部署运维](docs/06-部署运维/)
- [CHANGELOG](CHANGELOG.md)

## 近期变更（2025-12 ~ 2026-02）

- Persona 风格系统 + 多模态图片支持
- 跨对话记忆 + WebSearch 集成
- Token 预算控制
- 安全加固：凭证清理、认证流程修复
- 积分部署准备 + 权限系统重构集成
- 代码库清理：删除死代码（HelloWorld.vue、test-components.vue）

---

**开发者**: 薛小川 · **版本**: v1.103.0 · **更新**: 2026-02-20
