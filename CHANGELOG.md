# yuzhen_fitness 构建日志

> 内部构建号，不对外发布。产品版本见根仓库 `CHANGELOG.md`。
> 历史版本（[1.103.0] 及之前）已归档至 `CHANGELOG-legacy.md`。

---

## #7 (chore) radix-vue → reka-ui 统一 — 2026-02-22

- 4 个 tooltip 组件从 `radix-vue` 迁移到 `reka-ui`（Tooltip/TooltipContent/TooltipProvider/TooltipTrigger）
- 从 `package.json` devDependencies 移除 `radix-vue`（shadcn-vue 已全面迁移到 reka-ui）
- Vite 构建验证通过，无新增错误
- 对应产品版本：v1.1.0

## #6 (feat) AI引用展示 + 知识搜索参数支持 — 2026-02-21

- `components/chat/MessageItem.vue`：AI回答中的知识引用渲染
  - `extractedReferences` computed：解析 `[N] 标题 — 来源` 格式的引用区块
  - `contentWithoutReferences`：从正文中剥离引用区块，避免重复展示
  - 内联 `[1]` 标记渲染为上标样式（`.citation-marker`）
  - 引用列表：BookOpen 图标 + 编号 badge + 可点击标题（跳转知识搜索）
- `views/knowledge/index.vue`：支持 URL `?search=` 参数
  - `onMounted` 读取 `route.query.search`，自动触发搜索
  - 从 AI 引用点击跳转后直接展示搜索结果
- 对应产品版本：v1.1.0

- 新增 `views/knowledge/cards.vue`：CSS scroll-snap 卡片浏览（零依赖替代 Swiper）
- 新增 `components/knowledge/KnowledgeCard.vue`：卡片组件（标题/摘要/标签/来源/难度）
- `api/knowledge.ts`：新增 `getKnowledgeCards` API + KnowledgeArticle 类型扩展（difficulty/view_count/source_book）
- 路由注册 `/knowledge/cards`（静态路由置于 `/:id` 动态路由之前）
- `index.vue` 顶部添加"卡片"入口按钮
- 对应产品版本：v1.1.0

## #4 (feat) 知识库前端页面 — 2026-02-21

- 新增 `views/knowledge/index.vue`：分类导航 + 搜索 + 无限滚动文章列表
- 新增 `views/knowledge/detail.vue`：Markdown 正文渲染 + 引用来源 + 相关推荐
- 新增 `api/knowledge.ts`：4 个 API 函数 + TypeScript 类型定义
- 路由注册：`/knowledge` + `/knowledge/:id`
- 使用 shadcn-vue 组件：Card/Badge/Skeleton/Separator/Button/Input
- IntersectionObserver 实现无限滚动加载
- 对应产品版本：v1.1.0

## #3 (test) useChatStream composable 测试 — 2026-02-21

- 创建 `tests/composables/useChatStream.test.ts`：45 个测试用例
- 覆盖：初始状态、兼容性检测、resetState、stopStream、startStream 参数构建
- Worker 消息处理：CHUNK/STEP/STRUCTURED_DATA/DONE/ERROR/RECONNECTING/TIMEOUT/RATE_LIMIT
- subscribe 订阅、cleanup 资源清理、renderedContent/hasError/isDone 计算属性
- 全量测试：20 个文件 358 个用例全部通过
- 对应产品版本：v1.1.0

## #2 (test) 测试修复 — 2026-02-21

- 修复 user store 测试：`primary_goals`(数组) → `primary_goal`(字符串) 匹配实际代码
- 修复 auth 集成测试 3 个失败：添加 localStorage/toast/token-manager mock
- 测试结果：280/280 全部通过（18 个测试文件）
- 对应产品版本：v1.1.0

## #1 (chore) MVP 基线 — 2026-02-21

- 从 legacy [1.103.0] 冻结归档后的新起点
- Vue 3 + shadcn-vue 前端，含会员中心、积分面板、AI 对话
- 对应产品版本：v1.0.0
