# yuzhen_fitness 构建日志

> 内部构建号，不对外发布。产品版本见根仓库 `CHANGELOG.md`。
> 历史版本（[1.103.0] 及之前）已归档至 `CHANGELOG-legacy.md`。

---

## #12 (feat) 饮食计划 + 模板浏览页 — 2026-02-22

- 新增 `FoodSelector.vue`：食物搜索选择器（Sheet弹出，搜索+分类筛选+多选+营养预览）
- 新增 `NutritionPlanTab.vue`：饮食计划 Tab（早/午/晚/加餐四餐次，份量配置，营养汇总面板）
- 新增 `TemplateCard.vue`：模板卡片组件（目标/难度/周期展示+一键使用）
- 新增 `templates.vue`：模板浏览页（目标+难度筛选，12个官方模板）
- 更新 `plan-create.vue`：集成饮食计划 Tab，保存/编辑时同步 nutrition 数据
- 更新 `plans.vue`：空状态添加"模板库"入口按钮
- 更新 `training-plan.ts` API：新增 nutrition 字段 + getTemplates/useTemplate 接口
- 更新 `router/index.ts`：注册 `/training/templates` 路由
- 对应产品版本：v1.1.0

---

## #11 (refactor) TypeScript 类型修复 — 2026-02-22

- 新增 `AchievementBadge` 接口到 user-profile.ts
- `UserProfile` 接口添加 streak_days/total_training_days/last_training_date/achievements 字段
- 修复 `session.vue`：setNumber→set_number API 映射（新增 mapExercisesForApi 辅助函数）
- 修复 `profile.vue`：unlockedCount 使用 AchievementBadge 类型替代 any
- vue-tsc 类型错误从 154 降至 145
- 全量测试 447 用例零回归
- 对应产品版本：v1.1.0

---

## #10 (feat) 训练分享卡片 + 成就徽章 — 2026-02-22

- 新增 `TrainingShareCard.vue`：Canvas 绘制品牌化分享图片（训练数据+Logo+网址）
- 支持保存图片到本地 + 复制到剪贴板
- 更新 `session.vue`：训练完成后弹出分享卡片 Dialog，关闭后跳转历史
- 更新 `profile.vue`：个人中心展示连续训练天数 + 累计天数 + 成就徽章
- 成就徽章：连续7/30/100/365天 + 累计10/50/200/500天（8枚）
- 全量测试 447 用例零回归
- 对应产品版本：v1.1.0

---

## #9 (feat) 用户自建训练计划创建器 — 2026-02-22

- 新增 `ExerciseSelector.vue`：动作搜索弹窗（肌群筛选 + 多选 + 分页加载）
- 新增 `ExerciseConfig.vue`：动作参数配置（组数/次数/重量/休息/备注）
- 新增 `plan-create.vue`：计划创建/编辑页（基本信息 + 周视图 Tabs 排列动作）
- 更新 `plans.vue`：类型筛选 + 编辑/复制按钮 + 手动创建入口
- 更新 `training-plan.ts` API：createTrainingPlan/updateTrainingPlan/copyTrainingPlan
- 更新 `training.ts` store：TrainingPlanFilters 添加 type 筛选
- 路由注册：`/training/plans/create` + `/training/plans/:id/edit`
- 全量测试 447 用例零回归
- 对应产品版本：v1.1.0

---

## #8 (test) composable + store 测试补充 — 2026-02-22

- 新增 3 个 composable 测试：useTheme(9)、useNetworkStatus(6)、usePWAInstall(10)
- 新增 4 个 store 测试：streaming(17)、theme(14)、notification(15)、exercise(18)
- 全量测试：27 文件 447 用例全部通过（+167 新用例）
- composables 覆盖率 4/6=66.7%，stores 覆盖率 10/15=66.7%
- 对应产品版本：v1.1.0

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
