# Zeabur部署指南 - 玉珍健身前端应用

**版本**: v1.0.0  
**更新日期**: 2026-01-07  
**状态**: ✅ 实施中  
**平台**: Zeabur  
**服务器**: 182.92.78.183（阿里云北京，4核16GB）

---

## 📋 概述

本文档提供在Zeabur平台上部署玉珍健身前端PWA应用的完整指南。Zeabur是一个现代化的部署平台，支持自动化部署、域名绑定和SSL证书配置。

### 服务器信息

- **平台**: Zeabur
- **服务器IP**: 182.92.78.183
- **区域**: 阿里云北京（华北2）
- **配置**: 4核16GB内存 80GB SSD
- **域名**: 
  - yuzhen-fitness.cn（主域名，已备案）
  - yuzhen-fitness.fun（国际用户）
  - yuzhen-fitness.shop（会员商城）
  - yuzhen-fitness.online（测试环境）

---

## 🚀 快速部署（3种方案）

### 方案1：Zeabur Git部署（推荐）

**优势**：自动化部署、自动SSL、零配置

#### 步骤1：准备Git仓库

```bash
# 如果还没有Git仓库，初始化一个
cd yuzhen_fitness
git init
git add .
git commit -m "feat: 初始化玉珍健身前端项目"

# 推送到GitHub/GitLab/Gitee
git remote add origin <your-repo-url>
git push -u origin main
```

#### 步骤2：在Zeabur创建项目

1. 登录 [Zeabur控制台](https://zeabur.com)
2. 点击"New Project"创建新项目
3. 选择"Import from Git"
4. 授权并选择你的仓库
5. Zeabur会自动检测为Vue项目

#### 步骤3：配置构建设置

Zeabur会自动检测`package.json`，但你可以自定义：

```yaml
# 在项目根目录创建 zeabur.yaml（可选）
name: yuzhen-fitness-frontend
build:
  buildCommand: npm run build
  outputDirectory: dist
  installCommand: npm install
```

#### 步骤4：配置环境变量

在Zeabur控制台的"Environment Variables"中添加：

```
VITE_API_BASE_URL=https://yuzhen-fitness.cn/api
VITE_DAML_RAG_API_URL=https://yuzhen-fitness.cn/ai
VITE_APP_NAME=玉珍健身
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_ENABLE_PWA=true
```

#### 步骤5：绑定域名

1. 在Zeabur控制台点击"Domains"
2. 点击"Add Domain"
3. 输入域名：`yuzhen-fitness.cn`
4. Zeabur会自动配置SSL证书（Let's Encrypt）
5. 重复以上步骤添加其他域名

#### 步骤6：配置DNS

在你的域名DNS管理面板（阿里云DNS）添加记录：

```
类型: CNAME
主机记录: @
记录值: <zeabur提供的域名>.zeabur.app
TTL: 10分钟

类型: CNAME
主机记录: www
记录值: <zeabur提供的域名>.zeabur.app
TTL: 10分钟
```

---

### 方案2：Zeabur Docker部署

如果你想更多控制，可以使用Docker部署。

#### 步骤1：创建Dockerfile

```dockerfile
# yuzhen_fitness/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境镜像
FROM nginx:alpine

# 复制构建文件到Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 步骤2：创建Nginx配置

```nginx
# yuzhen_fitness/nginx.conf
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2|woff|ttf|svg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # manifest.json和Service Worker不缓存
    location ~* \.(json|js)$ {
        if ($uri ~* "manifest\.json|sw\.js") {
            add_header Cache-Control "no-cache";
        }
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### 步骤3：在Zeabur部署

1. 推送代码到Git仓库
2. 在Zeabur选择"Deploy from Dockerfile"
3. Zeabur会自动构建并部署

---

### 方案3：静态文件托管（最简单）

如果只需要托管静态文件，可以使用Zeabur的静态托管功能。

#### 步骤1：构建应用

```bash
cd yuzhen_fitness
npm run build
```

#### 步骤2：上传到Zeabur

1. 在Zeabur创建新项目
2. 选择"Static Site"
3. 上传`dist`目录
4. Zeabur会自动部署

---

## 🔧 配置后端API代理

由于前端和后端分离，需要配置API代理。

### 选项1：在Zeabur配置反向代理

在Zeabur控制台的"Networking"中配置：

```
路径: /api/*
目标: http://fitness_php_v2:9000
重写: /api -> /api

路径: /ai/*
目标: http://fitness_daml_rag:8001
重写: /ai -> /ai
```

### 选项2：使用Nginx配置文件

如果使用Docker部署，在`nginx.conf`中添加：

```nginx
# 后端API代理
location /api {
    proxy_pass http://182.92.78.183:9000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# AI服务代理
location /ai {
    proxy_pass http://182.92.78.183:8001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_buffering off;
}
```

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
   - 配置DNS CNAME记录
   - 等待SSL证书自动配置

2. 备用域名：yuzhen-fitness.fun
   - 重复以上步骤

3. 商城域名：yuzhen-fitness.shop
   - 重复以上步骤

4. 测试域名：yuzhen-fitness.online
   - 重复以上步骤

### DNS配置示例

在阿里云DNS控制台：

```
# 主域名
yuzhen-fitness.cn        CNAME    your-project.zeabur.app
www.yuzhen-fitness.cn    CNAME    your-project.zeabur.app

# 国际域名
yuzhen-fitness.fun       CNAME    your-project.zeabur.app
www.yuzhen-fitness.fun   CNAME    your-project.zeabur.app

# 商城域名
yuzhen-fitness.shop      CNAME    your-project.zeabur.app
www.yuzhen-fitness.shop  CNAME    your-project.zeabur.app

# 测试域名
yuzhen-fitness.online    CNAME    your-project.zeabur.app
www.yuzhen-fitness.online CNAME   your-project.zeabur.app
```

---

## ✅ 部署检查清单

### 部署前检查

- [ ] 代码已推送到Git仓库
- [ ] 环境变量已配置
- [ ] PWA图标已生成
- [ ] 构建配置正确

### Zeabur配置检查

- [ ] 项目已创建
- [ ] Git仓库已连接
- [ ] 构建命令正确：`npm run build`
- [ ] 输出目录正确：`dist`
- [ ] 环境变量已添加

### 域名配置检查

- [ ] 域名已在Zeabur添加
- [ ] DNS CNAME记录已配置
- [ ] SSL证书已自动配置
- [ ] 域名可以访问

### 功能验证

- [ ] 网站可以正常访问
- [ ] PWA功能正常
- [ ] API请求正常
- [ ] 移动端显示正常

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
# 3. 运行构建命令
# 4. 部署新版本
# 5. 更新所有域名
```

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
- CNAME记录配置错误
- SSL证书未配置

**解决方案**：
1. 检查DNS解析：`nslookup yuzhen-fitness.cn`
2. 等待DNS生效（最多24小时）
3. 在Zeabur检查SSL证书状态

### 问题3：PWA无法安装

**可能原因**：
- manifest.json路径错误
- Service Worker未注册
- HTTPS未启用

**解决方案**：
1. 检查浏览器控制台错误
2. 确认manifest.json可访问
3. 确认HTTPS已启用

---

## 💡 最佳实践

### 1. 使用环境变量

不要在代码中硬编码配置，使用环境变量：

```typescript
// ✅ 正确
const apiUrl = import.meta.env.VITE_API_BASE_URL

// ❌ 错误
const apiUrl = 'https://yuzhen-fitness.cn/api'
```

### 2. 启用缓存

配置合理的缓存策略：

```nginx
# 静态资源长期缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# HTML文件不缓存
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}
```

### 3. 监控性能

使用Zeabur的监控功能：
- CPU使用率
- 内存使用率
- 网络流量
- 响应时间

---

## 📚 相关文档

- [Zeabur官方文档](https://zeabur.com/docs)
- [生产部署指南](./production-deployment-guide.md)
- [部署检查清单](../../DEPLOYMENT_CHECKLIST.md)
- [部署实施方案](./deployment-implementation-plan.md)

---

## 📞 技术支持

**维护者**: 薛小川  
**平台**: Zeabur  
**服务器**: 182.92.78.183  
**主域名**: https://yuzhen-fitness.cn

---

**最后更新**: 2026-01-07  
**文档版本**: v1.0.0

<div align="center">
<strong>🚀 Zeabur部署 · 📱 PWA应用 · ⚡ 自动化CI/CD</strong>
</div>
