# Zeabur部署指南 - 玉珍健身前端PWA应用

**版本**: v2.0.0  
**更新日期**: 2026-01-17  
**状态**: ✅ 已部署  
**平台**: Zeabur  
**服务器**: 182.92.78.183（阿里云北京，4核16GB）

---

## 📋 概述

本文档提供在Zeabur平台上部署玉珍健身前端PWA应用的完整指南。Zeabur是一个现代化的部署平台，支持自动化部署、域名绑定和SSL证书配置。

### 当前生产环境

- **平台**: Zeabur托管
- **服务器IP**: 182.92.78.183
- **区域**: 阿里云北京
- **备案信息**: 陕ICP备2026000942号-1 ✅ 已完成
- **SSL证书**: Zeabur自动管理（Let's Encrypt）

### 域名配置（当前生产环境）

| 域名 | 用途 | Zeabur服务 | 状态 |
|------|------|-----------|------|
| `yuzhen-fitness.cn` | 官网（主域名） | yuzhen-website | ✅ Running |
| `www.yuzhen-fitness.cn` | 官网（www子域名） | yuzhen-website | ✅ Running |
| `app.yuzhen-fitness.cn` | 应用PWA | yuzhen-fitness | ✅ Running |
| `api.yuzhen-fitness.cn` | 后端API | fitness_php_v2 | ✅ Running |
| `ai.yuzhen-fitness.cn` | AI服务 | fitness_daml_rag | ✅ Running |

**设计理念**：
- ✅ 主域名作为官网（符合用户习惯和SEO最佳实践）
- ✅ 新用户先了解产品，再注册使用
- ✅ 老用户直接访问 `app.yuzhen-fitness.cn`

---

## 🚀 快速部署（Zeabur Git部署 - 推荐）

### 前置要求

1. **GitHub仓库**: `vivy1024/yuzhen-fitness-frontend`
2. **Zeabur账号**: 已登录并创建项目
3. **域名DNS配置**: 使用 A 记录绑定到服务器IP（182.92.78.183）

### 步骤1：准备Git仓库

```bash
# 确保代码已推送到GitHub
cd yuzhen_fitness
git status
git add .
git commit -m "feat: 更新前端应用"
git push origin main
```

### 步骤2：在Zeabur创建项目

1. 登录 [Zeabur控制台](https://zeabur.com)
2. 点击"New Project"创建新项目
3. 选择"Import from Git"
4. 授权并选择仓库：`vivy1024/yuzhen-fitness-frontend`
5. Zeabur会自动检测为Vue项目

### 步骤3：配置环境变量

在Zeabur控制台的"Environment Variables"中添加：

```env
# 后端API地址（生产环境）
VITE_API_BASE_URL=https://api.yuzhen-fitness.cn

# DAML-RAG AI服务地址（生产环境）
VITE_DAML_RAG_API_URL=https://ai.yuzhen-fitness.cn

# 应用配置
VITE_APP_NAME=玉珍健身
VITE_APP_VERSION=1.52.0
VITE_APP_ENV=production

# 功能开关
VITE_ENABLE_PWA=true
VITE_DEBUG=false
```

### 步骤4：绑定域名

1. 在Zeabur控制台点击"Domains"
2. 点击"Add Domain"
3. 输入域名：`app.yuzhen-fitness.cn`
4. Zeabur会自动配置SSL证书（Let's Encrypt）

### 步骤5：配置DNS

在阿里云DNS管理面板添加 A 记录：

```
类型: A
主机记录: app
记录值: 182.92.78.183
TTL: 10分钟
```

### 步骤6：验证部署

1. 等待DNS生效（通常5-10分钟）
2. 访问 `https://app.yuzhen-fitness.cn`
3. 验证PWA功能正常
4. 验证API连接正常

---

## ⚙️ 环境配置

### 本地开发环境 (`.env`)

```env
# 后端API地址（本地Docker）
VITE_API_BASE_URL=http://localhost:8000

# DAML-RAG AI服务地址（本地Docker）
VITE_DAML_RAG_API_URL=http://localhost:8001

# 应用配置
VITE_APP_NAME=玉珍健身（开发）
VITE_APP_VERSION=1.52.0
VITE_APP_ENV=development

# 调试模式
VITE_DEBUG=true
```

### 生产环境 (`.env.production`)

```env
# 后端API地址（Zeabur生产）
VITE_API_BASE_URL=https://api.yuzhen-fitness.cn

# DAML-RAG AI服务地址（Zeabur生产）
VITE_DAML_RAG_API_URL=https://ai.yuzhen-fitness.cn

# 应用配置
VITE_APP_NAME=玉珍健身
VITE_APP_VERSION=1.52.0
VITE_APP_ENV=production

# 功能开关
VITE_ENABLE_PWA=true
VITE_DEBUG=false
```

### 环境变量说明

| 变量名 | 说明 | 本地开发 | Zeabur生产 |
|--------|------|---------|-----------|
| `VITE_API_BASE_URL` | Laravel后端API地址 | `http://localhost:8000` | `https://api.yuzhen-fitness.cn` |
| `VITE_DAML_RAG_API_URL` | DAML-RAG AI服务地址 | `http://localhost:8001` | `https://ai.yuzhen-fitness.cn` |
| `VITE_APP_NAME` | 应用标题 | `玉珍健身（开发）` | `玉珍健身` |
| `VITE_APP_VERSION` | 应用版本号 | `1.52.0` | `1.52.0` |
| `VITE_DEBUG` | 调试模式 | `true` | `false` |

**⚠️ 重要规则**：
1. **禁止在 `.env` 中写生产配置** - `.env` 只用于本地开发
2. **生产配置必须写入 `.env.production`** - 并提交到Git
3. **敏感信息由Zeabur环境变量覆盖** - 不要硬编码密码
4. **修改配置后必须测试两个环境** - 本地Docker + Zeabur

---

## 📱 PWA配置验证

部署完成后，验证PWA功能：

### 使用Chrome DevTools验证

1. 打开部署的网站
2. 按F12打开DevTools
3. 切换到"Application"标签
4. 检查以下项目：
   - Manifest: 确认加载成功
   - Service Workers: 确认注册成功
   - Storage: 确认缓存工作正常

### 测试"添加到主屏幕"

1. 在手机浏览器访问网站
2. 点击浏览器菜单
3. 选择"添加到主屏幕"
4. 确认图标和名称正确

---

## 🌐 多域名配置

### 在Zeabur绑定多个域名

1. 主域名：yuzhen-fitness.cn
   - 在Zeabur添加域名
   - 配置DNS A 记录（当前采用 A 绑定）
   - 等待SSL证书自动配置

2. 备用域名：yuzhen-fitness.fun
   - 重复以上步骤

3. 商城域名：yuzhen-fitness.shop
   - 重复以上步骤

4. 测试域名：yuzhen-fitness.online
   - 重复以上步骤

### DNS配置示例

在阿里云DNS控制台（A 绑定）：

```
# 主域名
yuzhen-fitness.cn         A    182.92.78.183
www.yuzhen-fitness.cn     A    182.92.78.183

# 国际域名
yuzhen-fitness.fun        A    182.92.78.183
www.yuzhen-fitness.fun    A    182.92.78.183

# 商城域名
yuzhen-fitness.shop       A    182.92.78.183
www.yuzhen-fitness.shop   A    182.92.78.183

# 测试域名
yuzhen-fitness.online     A    182.92.78.183
www.yuzhen-fitness.online A    182.92.78.183
```

---

## 🔄 自动化部署

Zeabur支持Git推送自动部署：

```bash
# 修改代码后
git add .
git commit -m "feat: 添加新功能"
git push origin main

# Zeabur会自动：
# 1. 检测到推送
# 2. 拉取最新代码
# 3. 运行构建命令（npm run build）
# 4. 部署新版本
# 5. 更新域名
```

### 部署前测试清单

**在推送代码到生产环境前，必须在本地Docker环境完整测试以下功能**：

#### 认证模块测试
- [ ] 发送邮箱验证码
- [ ] 用户注册
- [ ] 用户登录
- [ ] Token刷新
- [ ] 密码重置

#### 核心功能测试
- [ ] 动作列表加载
- [ ] AI对话功能
- [ ] 用户档案保存
- [ ] PWA安装功能

---

## ✅ 部署检查清单

### 部署前检查

- [ ] 代码已推送到GitHub仓库：`vivy1024/yuzhen-fitness-frontend`
- [ ] 环境变量已配置（`.env.production`）
- [ ] PWA图标已生成
- [ ] 构建配置正确（`vite.config.ts`）
- [ ] 本地Docker环境测试通过

### Zeabur配置检查

- [ ] 项目已创建
- [ ] Git仓库已连接：`vivy1024/yuzhen-fitness-frontend`
- [ ] 构建命令正确：`npm run build`
- [ ] 输出目录正确：`dist`
- [ ] 环境变量已添加

### 域名配置检查

- [ ] 域名已在Zeabur添加：`app.yuzhen-fitness.cn`
- [ ] DNS A 记录已配置
- [ ] SSL证书已自动配置
- [ ] 域名可以访问

### 功能验证

- [ ] 网站可以正常访问：`https://app.yuzhen-fitness.cn`
- [ ] PWA功能正常
- [ ] API请求正常（后端：`api.yuzhen-fitness.cn`）
- [ ] AI对话正常（AI服务：`ai.yuzhen-fitness.cn`）
- [ ] 移动端显示正常
---

## 📊 监控和日志

### 在Zeabur查看日志

1. 进入项目控制台
2. 点击"Logs"标签
3. 查看构建日志和运行日志

### 查看部署状态

1. 进入项目控制台
2. 点击"Deployments"标签
3. 查看历史部署记录

---

## 🆘 故障排查

### 问题1：构建失败

**可能原因**：
- 依赖安装失败
- 构建命令错误
- 环境变量缺失

**解决方案**：
1. 检查Zeabur构建日志
2. 确认`package.json`中的构建命令
3. 检查环境变量配置

### 问题2：域名无法访问

**可能原因**：
- DNS未生效
- A 记录配置错误
- SSL证书未配置

**解决方案**：
1. 检查DNS解析：`nslookup app.yuzhen-fitness.cn`
2. 等待DNS生效（通常5-10分钟，最多24小时）
3. 在Zeabur检查SSL证书状态

### 问题3：PWA无法安装

**可能原因**：
- manifest.json路径错误
- Service Worker未注册
- HTTPS未启用

**解决方案**：
1. 检查浏览器控制台错误
2. 确认manifest.json可访问：`https://app.yuzhen-fitness.cn/manifest.json`
3. 确认HTTPS已启用

### 问题4：API请求失败

**可能原因**：
- 后端服务未启动
- 环境变量配置错误
- CORS配置问题

**解决方案**：
1. 检查后端服务状态（Zeabur控制台）
2. 验证环境变量：`VITE_API_BASE_URL=https://api.yuzhen-fitness.cn`
3. 检查后端CORS配置

---

## 💡 最佳实践

### 1. 使用环境变量

不要在代码中硬编码配置，使用环境变量：

```typescript
// ✅ 正确
const apiUrl = import.meta.env.VITE_API_BASE_URL

// ❌ 错误
const apiUrl = 'https://api.yuzhen-fitness.cn'
```

### 2. 本地测试后再部署

```bash
# 本地构建测试
npm run build
npm run preview

# 确认无误后推送
git push origin main
```

### 3. 监控部署状态

- 在Zeabur控制台查看部署日志
- 确认构建成功后再验证功能
- 如有问题及时回滚

---

## 📚 相关文档

- [Zeabur官方文档](https://zeabur.com/docs)
- [Zeabur生产环境规则](../../../.kiro/steering/zeabur-production.md)
- [完整部署指南](../../../docs/06-部署运维/06-Zeabur云端部署指南.md)

---

## 📞 技术支持

**维护者**: 薛小川  
**邮箱**: 1336495069@qq.com  
**平台**: Zeabur  
**服务器**: 182.92.78.183  
**应用域名**: https://app.yuzhen-fitness.cn

---

**最后更新**: 2026-01-17  
**文档版本**: v2.0.0

<div align="center">
<strong>🚀 Zeabur部署 · 📱 PWA应用 · ⚡ 自动化CI/CD</strong>
</div>
