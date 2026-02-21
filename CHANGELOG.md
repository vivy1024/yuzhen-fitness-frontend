# yuzhen_fitness 构建日志

> 内部构建号，不对外发布。产品版本见根仓库 `CHANGELOG.md`。
> 历史版本（[1.103.0] 及之前）已归档至 `CHANGELOG-legacy.md`。

---

## #3 (test) useChatStream composable 测试 — 2026-02-21

- 创建 `tests/composables/useChatStream.test.ts`：45 个测试用例
- 覆盖：初始状态、兼容性检测、resetState、stopStream、startStream 参数构建
- Worker 消息处理：CHUNK/STEP/STRUCTURED_DATA/DONE/ERROR/RECONNECTING/TIMEOUT/RATE_LIMIT
- subscribe 订阅、cleanup 资源清理、renderedContent/hasError/isDone 计算属性
- 全量测试：20 个文件 358 个用例全部通过
- 对应产品版本：v1.0.0

## #2 (test) 测试修复 — 2026-02-21

- 修复 user store 测试：`primary_goals`(数组) → `primary_goal`(字符串) 匹配实际代码
- 修复 auth 集成测试 3 个失败：添加 localStorage/toast/token-manager mock
- 测试结果：280/280 全部通过（18 个测试文件）
- 对应产品版本：v1.0.0

## #1 (chore) MVP 基线 — 2026-02-21

- 从 legacy [1.103.0] 冻结归档后的新起点
- Vue 3 + shadcn-vue 前端，含会员中心、积分面板、AI 对话
- 对应产品版本：v1.0.0
