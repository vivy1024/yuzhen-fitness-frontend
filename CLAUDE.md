# yuzhen_fitness 开发规则

> 本文件为前端子项目专属规则，通用规则见根仓库 `CLAUDE.md`。

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **UI 库**: shadcn-vue（基于 Radix Vue）
- **状态管理**: Pinia
- **构建工具**: Vite
- **测试**: Vitest + happy-dom
- **移动端**: Capacitor（Android/iOS 混合）

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

## 代码规范

- 组件使用 `<script setup lang="ts">` + Composition API
- 状态管理统一用 Pinia store，禁止组件间直接 props 穿透超过 2 层
- API 调用统一放 `src/api/` 目录，返回类型 `{ code, data, msg }`
- UI 组件优先使用 shadcn-vue，自定义组件放 `src/components/`
- 路由守卫处理认证，token 存 localStorage

## 部署

- 本地开发：`npm run dev`（用户手动运行，不在 Docker 中）
- 生产构建：`npm run build` → Zeabur 自动部署
- 移动端：Capacitor `npx cap sync` → Android Studio 构建

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
