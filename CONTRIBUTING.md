# 贡献指南

感谢你对玉珍健身前端项目的关注！我们欢迎任何形式的贡献。

## 📋 项目说明

本项目是玉珍健身的前端PWA应用，采用Vue 3 + TypeScript + shadcn-vue技术栈。

**注意**：本仓库只包含前端代码，后端服务（Laravel API和DAML-RAG AI服务）不开源。

## 🤝 如何贡献

### 报告Bug

如果你发现了Bug，请通过GitHub Issues报告：

1. 使用清晰的标题描述问题
2. 提供详细的复现步骤
3. 说明预期行为和实际行为
4. 提供环境信息（浏览器、操作系统等）
5. 如果可能，提供截图或错误日志

### 提出功能建议

我们欢迎新功能建议：

1. 在Issues中描述你的想法
2. 说明为什么这个功能有用
3. 如果可能，提供设计草图或示例

### 提交代码

#### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/vivy1024/yuzhen-fitness-frontend.git
cd yuzhen-fitness-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 代码规范

- 遵循Vue 3 Composition API
- 使用TypeScript类型检查
- 遵循TailwindCSS原子化CSS
- 使用shadcn-vue组件库
- 组件名使用PascalCase
- Props使用camelCase
- 事件名使用kebab-case

#### Git提交规范

使用语义化提交信息：

```
type(scope): description

类型：
- feat: 新功能
- fix: Bug修复
- docs: 文档更新
- style: 代码格式（不影响功能）
- refactor: 代码重构
- perf: 性能优化
- test: 测试相关
- chore: 构建/工具链更新
```

示例：
```bash
git commit -m "feat(exercise): 添加动作收藏功能"
git commit -m "fix(auth): 修复Token刷新问题"
```

#### Pull Request流程

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

**PR要求**：
- 清晰的标题和描述
- 关联相关的Issue
- 确保所有测试通过
- 更新相关文档
- 保持代码风格一致

### 测试

提交代码前请运行测试：

```bash
# 运行所有测试
npm run test

# 运行单元测试
npm run test:unit

# 运行组件测试
npm run test:component

# 生成测试覆盖率报告
npm run test:coverage
```

## 📝 代码审查

所有PR都需要经过代码审查：

- 代码质量和可读性
- 是否符合项目规范
- 测试覆盖率
- 文档完整性
- 性能影响

## 🎨 UI/UX贡献

如果你想改进UI/UX：

- 保持与shadcn-vue设计系统一致
- 确保响应式设计（移动端优先）
- 遵循可访问性标准（WCAG 2.1 AA）
- 提供设计说明或截图

## 📚 文档贡献

文档改进同样重要：

- 修正错别字和语法错误
- 改进说明的清晰度
- 添加示例和教程
- 翻译文档（如果适用）

## ❓ 问题和讨论

- 使用GitHub Issues报告问题
- 使用GitHub Discussions进行讨论
- 加入我们的社区（如果有）

## 📄 许可证

通过贡献代码，你同意你的贡献将在MIT许可证下发布。

## 🙏 致谢

感谢所有贡献者！你们的帮助让玉珍健身变得更好。

---

**维护者**: 薛小川  
**项目地址**: https://github.com/vivy1024/yuzhen-fitness-frontend
