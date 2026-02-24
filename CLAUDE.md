# yuzhen_fitness 开发规则

> 本文件为前端子项目专属规则，通用规则见根仓库 `CLAUDE.md`。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **UI 库**: shadcn-vue（基于 Radix Vue）
- **状态管理**: Pinia
- **构建工具**: Vite
- **测试**: Vitest + happy-dom
- **移动端**: Capacitor（Android/iOS 混合）
- **认证**: Bearer Token（localStorage + Pinia 双存储）

## 测试命令

```bash
# 本地运行（前端是唯一不在 Docker 中的项目）
cd yuzhen_fitness

# 单个测试文件
npx vitest run tests/unit/stores/credit.test.ts

# 全量测试
npx vitest run

# 带覆盖率
npx vitest run --coverage
```

## API 调用规范

统一响应格式：`{ code: number, data: any, msg: string }`

```typescript
// ✅ 正确：检查 code 后处理
const response = await api.post('/api/endpoint', data)
if (response.data.code === 200) {
  showSuccess(response.data.msg)
} else {
  showError(response.data.msg || '操作失败')
}

// ❌ 错误：不检查 code 直接使用
const response = await api.post('/api/endpoint', data)
showSuccess('操作成功')  // 可能实际失败了
```

Axios 拦截器处理：401→清除认证跳转登录 | 422→显示字段错误 | 429→限流提示 | 500→通用错误

## 代码规范

- 组件使用 `<script setup lang="ts">` + Composition API
- 状态管理统一用 Pinia store，禁止组件间 props 穿透超过 2 层
- API 调用统一放 `src/api/` 目录
- UI 组件优先使用 shadcn-vue，自定义组件放 `src/components/`
- 路由守卫处理认证，token 存 localStorage
- 命名：变量/函数 camelCase | 常量 UPPER_SNAKE_CASE | 组件 PascalCase | 文件 kebab-case
- 删除调试代码（console.log/debugger）后再提交

## 部署

- **本地开发**: `npm run dev`（用户手动运行，不在 Docker 中）
- **生产构建**: `npm run build` → Zeabur 自动部署
- **域名**: app.yuzhen-fitness.cn
- **移动端**: Capacitor `npx cap sync` → Android Studio 构建

## 关键目录

```
src/views/               # 页面组件
src/components/          # 通用组件
src/components/ui/       # shadcn-vue 组件（不修改）
src/stores/              # Pinia 状态管理
src/api/                 # API 调用层
src/router/              # 路由配置
src/composables/         # 组合式函数
tests/unit/              # 单元测试
```

## 按需加载参考

| 场景 | 参考文件 |
|------|---------|
| API 响应标准详细版 | `.kiro/steering/api-design.md` |
| Zeabur 生产环境 | `.kiro/steering/zeabur-production.md` |
| 跨端枚举/字段变更 | `.kiro/steering/cross-stack-data-contract.md` |
