# yuzhen_fitness 构建日志

> 内部构建号，不对外发布。产品版本见根仓库 `CHANGELOG.md`。
> 历史版本（[1.103.0] 及之前）已归档至 `CHANGELOG-legacy.md`。

---

## #58 (fix) 安全加固 — 内存泄漏 + 防重复提交 — 2026-05-10

- **SEC-9**: `views/training/stats.vue` resize 监听器改为命名函数引用，onUnmounted 正确移除
- **SEC-10**: `stores/chat.ts` sendMessage 添加 `if (streaming.value || loading.value) return` 防重复提交

---

## #57 (feat) Agent v2 前端适配 — Skills 进度 + HITL 弹窗 + 旧组件清理 — 2026-05-09

**删除**:
- `components/chat/DAGTemplateSelector.vue`
- `components/chat/StrategySwitch.vue`
- `config/dag-templates.ts`

**新增**:
- `components/chat/SkillProgress.vue`: 4 阶段进度指示器（分析→安全→执行→生成）
- `components/chat/ApprovalDialog.vue`: HITL 安全确认弹窗

**重构**:
- `stores/chat.ts`: 新增 threadId + createThread/setThread/clearThread；移除 strategy/templateId
- `stores/streaming.ts`: 新增 SSE 事件解析（skill_started/tool_executing/tool_completed/approval_required/phase_change）
- `stores/useChatStream.ts` + `sse-worker.ts`: threadId 替代 strategy/templateId
- `views/ai/chat.vue`: 集成 SkillProgress + ApprovalDialog，移除旧组件引用

---

## #28 (feat) 训练完成汇总页 + 打卡日历 — 2026-03-06

- 新增 `views/training/session-summary.vue`：训练完成汇总页
  - 核心数据：时长/组数/容量/平均RPE/完成率
  - 动作列表：每个动作的组数×次数和重量
  - 完成率颜色指示（≥80%绿/≥50%黄/<50%红）
- 路由：添加 `/training/session/:id/summary` → `training-summary`
- `session.vue`：完成训练→分享卡片关闭后跳转汇总页（原跳历史记录）
- `history.vue`：已完成记录添加"查看汇总"入口按钮
- `index.vue`：onMounted 调用 stats API 替换硬编码 0（今日/本周/连续天数）
- 新增 `components/training/MiniCalendarWidget.vue`：小日历预览组件
  - 当月 7×5 方格日历，绿色=已打卡，蓝框=今天
  - 底部"本月 X/Y 天 · 连续 N 天"统计
  - streak ≥ 3 时火焰脉冲 CSS 动画

---

## #27 (security) XSS 修复 — knowledge/detail.vue DOMPurify 消毒 — 2026-03-05

对应产品版本：v1.6.8

- knowledge/detail.vue: `renderedContent` 添加 DOMPurify 消毒
  - 导入 `DOMPurify` + 配置 `purifyConfig`（扩展白名单含 h1-h6/code/pre/img/table 等 Markdown 输出标签）
  - `marked()` 输出传入 `DOMPurify.sanitize(rawHtml, purifyConfig)` 后再渲染
  - 严格禁止 script/style/iframe/form/input/object/embed 标签
  - 参考 help/detail.vue 已有实现

---

## #26 (feat) 法律合规增强 — 2026-03-01

- chat.vue: AI 免责声明从"仅供参考"增强为"不能替代专业医疗诊断"，空状态添加医疗免责提示
- privacy.vue: 新增第三方数据共享说明（硅基流动/Moonshot/Qwen/GLM）+ 未成年人保护条款，更新日期至 2026-03-01
- terms.vue: 更新日期至 2026-03-01，agreeAndContinue 调用后端 consent API 记录同意
- settings/index.vue: "删除账号"改为"注销账号"，添加 30 天冷静期说明
- 新增 api/consent.ts：协议同意记录 API（recordConsent + getLatestConsent）
- register.vue: 注册成功后静默记录协议同意

## #25 (fix) 前端功能校验修复 — 2026-03-01

- 计算器组件: 修复 5 个组件 vue-tsc 类型错误（`number | null` → `number | undefined`）
- CarbCyclingCalculator: 删除未使用的 Checkbox import
- chat.vue: 实现 handleViewPlanDetail — 导入计划后跳转到计划列表
- settings: 通知设置变更保存到后端（乐观更新+回滚）
- settings: 修复 3 个手机号倒计时定时器泄漏（添加 onBeforeUnmount 清理）
- ai-monitor: 移除硬编码 localhost:8001，改为环境变量
- admin/settings.vue: 删除无路由死页面
- email.ts: 删除死代码 checkEmailExists，返回类型改为 `ApiResponse<EmailData>`
- useChatStream.ts: 消除全部 any 类型（10处），引入 StructuredDataItem 接口
- chat.ts: 修复 structuredData.tools 类型安全访问
- 删除 exercise/library.vue、progress/dashboard.vue 调试 console.log

## #24 (fix) 上线前安全加固 + 默认手机号注册 — 2026-02-28

对应产品版本：v1.6.4

- login.vue: 默认登录方式从邮箱切换为手机号
- register.vue: 默认注册方式从邮箱切换为手机号
- PWAUpdatePrompt.vue: 修复 setInterval 内存泄漏（添加 onBeforeUnmount 清理）

## #23 (fix) 核心功能审计修复 — SSE+导出+降级模式 — 2026-02-28

对应产品版本：v1.6.2

- useChatStream.ts: SSE fallback URL 从 localhost:8001 改为基于 VITE_API_BASE_URL 推导
- useChatStream.ts: sendNonStreamMessage() 添加 Authorization header
- useChatStream.ts: connectWithFetch() 添加 Authorization header
- plan-detail.vue: 导出改为 Blob + URL.createObjectURL 客户端下载

## #22 (fix) 认证系统审计修复 — 2026-02-28

对应产品版本：v1.6.1

- stores/auth.ts: 新增 handleAuthSuccess() 统一认证成功流程
- stores/auth.ts: 新增 registerByPhone()/loginByPhone() actions（REQ-C2）
- views/auth/register.vue: 手机号注册改用authStore（REQ-C2）
- views/auth/login.vue: 手机号登录改用authStore（REQ-C2）
- api/auth.ts: 移除拦截器独立刷新机制，统一委托TokenManager（REQ-C4）
- views/auth/forgot-password.vue: 统一API响应格式检查 code===200（REQ-C5）
- views/auth/forgot-password.vue: 移除checkEmailExists()调用（REQ-H6）
- utils/auth.ts: validatePasswordStrength()最低要求统一为6位（REQ-H2）
- register.vue/login.vue/forgot-password.vue: 定时器onBeforeUnmount清理（REQ-H3）

## #21 (fix) AI对话全栈审计修复 — 积分API类型+SSE user_id+计算器类型 — 2026-02-26

对应产品版本：v1.5.0

- api/credit.ts: CreditBalance.last_reset_date → last_reset（匹配后端字段名）
- api/credit.ts: PaginatedResponse<T> → CreditHistoryResponse（匹配后端 transactions/pagination/summary 结构）
- api/credit.ts: CreditStats 重写（匹配后端 summary/by_mode/by_template/daily_trend）
- api/credit.ts: CreditTransaction 添加 mode_label 字段
- stores/credit.ts: fetchHistory 字段映射修复（data.data→data.transactions, page→pagination.current_page 等）
- stores/credit.ts: lastResetDate computed 改为读取 last_reset
- composables/useChatStream.ts: Worker模式 user_id 从 String() → Number()（修复PHP integer验证失败）
- workers/sse-worker.ts: WorkerMessage body.user_id 类型 string → number
- stores/user.ts: FFMIAssessment 映射添加 BMIStatus 类型断言
- types/user-profile.ts: FFMIAssessment.natural_potential 改为对象类型，calculated_at 改为可选

---

## #20 (feat) 计算器卡片前端 — 7个Vue计算器组件 + API模块 + 路由 — 2026-02-25

对应产品版本：v1.5.0

- 新增 `api/calculators.ts`: 7个API调用函数 + 完整TypeScript类型定义
- 新增 `views/tools/CalculatorsPage.vue`: 计算器卡片列表页
- 新增 `views/tools/CalculatorDetail.vue`: 计算器详情页（动态组件加载）
- 新增7个计算器Vue组件（`components/calculators/`）：
  - TDEECalculator / FFMICalculator / OneRMCalculator
  - IntensityConverter / WeightRecommender
  - CarbCyclingCalculator / MacroCalculator
- 路由: `/tools/calculators` + `/tools/calculators/:id`
- 删除前端 `utils/ffmi-calculator.ts`，FFMI计算统一走后端API
- stores/user.ts FFMI相关调用改为API

---

## #19 (fix) 前端数据一致性+体验优化 — 时间戳/去重/状态/字段/工具动态化/开始训练 — 2026-02-25

对应产品版本：v1.5.0

- utils/timestamp.ts（新建）: normalizeTimestamp() 统一处理 ISO字符串/毫秒/秒级时间戳
- stores/chat.ts: IndexedDB 和 API 两条消息加载路径统一使用 normalizeTimestamp
- stores/chat.ts: 三级消息去重（client_id → 后端id → role+内容前50字+时间±2秒模糊匹配）
- api/training-session.ts: 状态类型补全 pending | in_progress | completed | skipped
- views/training/history.vue: 新增 pending（待开始）和 skipped（已跳过）状态标签样式
- api/training-plan.ts: TrainingPlanImportData 字段名统一 weeks→duration_weeks, frequency→workouts_per_week
- views/ai/chat.vue: 工具名称动态化，启动时从 /api/ai/health 获取工具列表缓存到 localStorage
- views/training/plan-detail.vue: "开始训练"按钮跳转到 /training/session?planId=xxx 创建训练会话

---

## #18 (feat) 前端 API 缺口修复 — 降级处理 — 2026-02-24

对应产品版本：v1.4.0

- notification.ts: 移除 404 的 /notifications API 调用，保留 /push 订阅 API
- stores/notification.ts: 从通知列表管理改为推送设置管理（togglePush/setReminderTime）
- notifications/index.vue: 从通知列表页改为推送设置页（订阅开关 + 提醒时间）
- membership.ts: cancelAutoRenew/enableAutoRenew 改为 no-op（当前手动付费模式）
- membership/center.vue: 隐藏自动续费 Card + 移除相关 import 和函数
- settings.ts: getCacheInfo/clearCache 改为本地 localStorage 操作

---

## #17 (chore) 三端枚举统一 — 前端同步 — 2026-02-24

对应产品版本：v1.4.0

- training-plan.ts: `CreatePlanData.goal` 类型改为 `hypertrophy | fat_loss | strength | endurance | body_shaping | general_fitness`
- plan-create.vue: SelectItem 值从旧枚举（gain_muscle/lose_weight/maintain/improve_fitness）更新为统一枚举
- templates.vue: 模板筛选 SelectItem 同步更新
- TemplateCard.vue: goalLabel 映射更新为统一枚举中英文对照

---

## #16 (feat) 统一可观测性仪表盘前端 — 2026-02-24

对应产品版本：v1.3.0

- 新增 src/api/admin/metrics.ts: 6 个聚合 API 封装 + TypeScript 类型定义
- 新增 src/views/admin/metrics.vue: 7 个 Tab（系统总览/模型对比/模式对比/工具使用/用户消费/质量趋势/数据库）
- ai-monitor.vue: 统一仪表盘入口（NEW 标记）+ 旧 Dashboard 标记（旧）
- router/index.ts: /admin/metrics 路由 + 旧 dashboard 路由 deprecated meta
- npm run build 零错误通过

---

## #15 (fix) SSE Worker 心跳识别 — 2026-02-23

- SSE Worker 识别服务端 `: ping` 注释行，重置 60 秒超时计时器
- 防止 LLM 生成期间（30-60秒）前端主动断开连接
- 对应产品版本：v1.2.0

---

## #14 (chore) TypeScript strict 类型错误全量修复 — 2026-02-22

- vue-tsc --noEmit 从 114 个错误降至 0 个
- 清理 34 个未使用导入/变量（18 个文件）
- 修复 AcceptableValue 泛型适配（shadcn-vue Select/Tabs 回调）
- 修复 null vs undefined 类型不兼容（stores 层 error.value）
- 补全接口缺失属性（ExerciseDetail/WorkerMessage/MembershipTier 等）
- 修复隐式 any 类型注解（RatingDialog/settings/session）
- 扩展 RestPattern 联合类型、修复 @tanstack/vue-table 缺失导入
- 对应产品版本：v1.1.0

---

## #13 (feat) PWA 推送提醒前端基础设施 — 2026-02-22

- 新增 `usePushNotification.ts` composable：Push 订阅/取消/提醒时间管理
- 更新 `sw.ts`：添加 push + notificationclick 事件监听
- 更新 `settings/index.vue`：推送开关 + 提醒时间选择器
- 更新 `notification.ts` API：新增 subscribe/unsubscribe/reminder-time 端点
- 更新 `training-plan.ts`：TrainingPlanDetail 添加 nutritionPlans 类型
- 后端部分（web-push 库 + 迁移）待 Docker 环境补充
- 对应产品版本：v1.1.0

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
