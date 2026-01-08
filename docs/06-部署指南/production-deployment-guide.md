# 生产环境部署指南

**版本**: v1.0.0  
**更新日期**: 2026-01-07  
**状态**: ✅ 已完成  
**维护者**: 薛小川

---

## 📋 概述

本文档提供玉珍健身前端应用的生产环境部署完整指南，包括环境配置、构建优化、PWA配置和部署流程。

### 服务器信息

- **服务器IP**: 182.92.78.183
- **区域**: 阿里云北京（华北2）
- **配置**: 4核16GB内存 80GB SSD
- **主域名**: yuzhen-fitness.cn（已备案）
- **备用域名**: 
  - yuzhen-fitness.fun（国际用户）
  - yuzhen-fitness.shop（会员商城）
  - yuzhen-fitness.online（测试环境）

---

## 🚀 快速部署

### 前置要求

1. **Node.js环境**: v18.0.0+
2. **npm或pnpm**: 最新版本
3. **服务器访问权限**: SSH密钥或密码
4. **域名DNS配置**: A记录指向182.92.78.183

### 一键部署脚本

```bash
# 1. 克隆代码
git clone <repository-url>
cd yuzhen_fitness

# 2. 安装依赖
npm install

# 3. 生成PWA图标（可选，使用占位符）
python scripts/generate_placeholder_icons.py

# 4. 构建生产版本
npm run build

# 5. 部署到服务器
scp -r dist/* root@182.92.78.183:/usr/share/nginx/html/

# 6. 重启Nginx
ssh root@182.92.78.183 "docker exec fitness_nginx_v2 nginx -s reload"
```

---

## ⚙️ 环境配置

### 1. 生产环境变量

文件位置：`yuzhen_fitness/.env.production`

```bash
# 后端API地址
VITE_API_BASE_URL=https://yuzhen-fitness.cn/api

# DAML-RAG AI服务地址
VITE_DAML_RAG_API_URL=https://yuzhen-fitness.cn/ai

# 应用配置
VITE_APP_NAME=玉珍健身
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_APP_DOMAIN=yuzhen-fitness.cn

# 功能开关
VITE_ENABLE_PWA=true
VITE_ENABLE_SW=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true

# 超时配置
VITE_REQUEST_TIMEOUT=30000
VITE_MAX_UPLOAD_SIZE=10
VITE_DEBUG=false
```

### 2. 构建配置优化

文件位置：`yuzhen_fitness/vite.config.ts`

**已实现的优化**：
- ✅ 代码分割（Vue核心、UI组件、工具库分离）
- ✅ gzip压缩（10KB以上文件）
- ✅ brotli压缩（更高压缩率）
- ✅ Tree Shaking（移除未使用代码）
- ✅ Source Map（hidden模式，用于错误追踪）
- ✅ 移除console和debugger（生产环境）
- ✅ 资源内联（4KB以下base64内联）

**构建命令**：
```bash
# 开发构建
npm run build

# 生产构建（使用.env.production）
npm run build -- --mode production

# 预览构建结果
npm run preview
```

### 3. PWA配置

#### manifest.json配置

文件位置：`yuzhen_fitness/public/manifest.json`

**核心配置**：
```json
{
  "name": "玉珍健身 - 智能健身助手",
  "short_name": "玉珍健身",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0ea5e9",
  "orientation": "portrait-primary"
}
```

#### 图标资源

**必需图标尺寸**：
- 72x72, 96x96, 128x128, 144x144, 152x152
- 192x192（最小推荐）
- 384x384, 512x512（最大推荐）

**生成占位符图标**：
```bash
python scripts/generate_placeholder_icons.py
```

**正式图标要求**：
- 使用品牌主色调（#0ea5e9）
- 支持maskable（安全区域内设计）
- 文件大小<50KB
- PNG格式，透明背景

#### Service Worker

文件位置：`yuzhen_fitness/public/sw.js`

**缓存策略**：
- 静态资源：Cache First
- API请求：Network First
- 图片资源：Cache First with Network Fallback

---

## 📦 构建优化详解

### 1. 代码分割策略

```typescript
manualChunks: {
  'vue-vendor': ['vue', 'vue-router', 'pinia'],
  'ui-vendor': ['reka-ui', 'radix-vue', ...],
  'utils-vendor': ['axios', 'date-fns', 'zod', ...],
  'form-vendor': ['vee-validate', '@vee-validate/zod'],
  'icons-vendor': ['lucide-vue-next'],
}
```

**优势**：
- 减少首屏加载时间
- 提高缓存命中率
- 按需加载，减少带宽消耗

### 2. 压缩配置

**gzip压缩**：
- 阈值：10KB
- 压缩率：约60-70%
- 浏览器支持：99%+

**brotli压缩**：
- 阈值：10KB
- 压缩率：约70-80%
- 浏览器支持：95%+

**Nginx配置**：
```nginx
# 启用gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# 启用brotli（需要安装模块）
brotli on;
brotli_types text/plain text/css application/json application/javascript;
```

### 3. 性能指标

**目标指标**：
- FCP (First Contentful Paint): < 1.5s
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- TTI (Time to Interactive): < 3.5s

**测试工具**：
```bash
# Lighthouse CI
npm run lighthouse

# 手动测试
npm run build
npm run preview
# 打开Chrome DevTools > Lighthouse
```

---

## 🌐 多域名部署

### 域名配置

| 域名 | 用途 | SSL证书 | 备案状态 |
|------|------|---------|----------|
| yuzhen-fitness.cn | 主站（生产） | 阿里云SSL | ✅ 已备案 |
| yuzhen-fitness.fun | 国际用户 | Let's Encrypt | ❌ 未备案 |
| yuzhen-fitness.shop | 会员商城 | Let's Encrypt | ❌ 未备案 |
| yuzhen-fitness.online | 测试环境 | Let's Encrypt | ❌ 未备案 |

### Nginx配置示例

```nginx
# 主站 - yuzhen-fitness.cn
server {
    listen 443 ssl http2;
    server_name yuzhen-fitness.cn www.yuzhen-fitness.cn;
    
    ssl_certificate /etc/nginx/ssl/cn/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/cn/privkey.pem;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # 后端API代理
    location /api {
        proxy_pass http://fitness_php_v2:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # AI服务代理
    location /ai {
        proxy_pass http://fitness_daml_rag:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }
}

# HTTP到HTTPS重定向
server {
    listen 80;
    server_name yuzhen-fitness.cn www.yuzhen-fitness.cn;
    return 301 https://$server_name$request_uri;
}
```

---

## 📱 移动端优化

### 1. 响应式设计

**断点配置**（Tailwind CSS）：
```javascript
screens: {
  'sm': '640px',   // 手机横屏
  'md': '768px',   // 平板
  'lg': '1024px',  // 小屏笔记本
  'xl': '1280px',  // 桌面
  '2xl': '1536px', // 大屏
}
```

### 2. 触摸优化

- 按钮最小尺寸：44x44px
- 触摸目标间距：8px
- 滑动手势支持
- 长按菜单

### 3. 性能优化

- 图片懒加载
- 虚拟滚动（长列表）
- 防抖和节流
- 离线缓存

---

## 🔒 安全配置

### 1. HTTPS配置

**SSL证书申请**（Let's Encrypt）：
```bash
# 安装Certbot
apt-get install certbot python3-certbot-nginx

# 申请证书
certbot certonly --nginx \
  -d yuzhen-fitness.fun \
  -d www.yuzhen-fitness.fun

# 自动续期
crontab -e
# 添加：0 2 1 * * certbot renew --quiet
```

### 2. 安全头配置

```nginx
# Nginx安全头
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 3. CSP配置

```html
<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline' https://fonts.loli.net; 
               font-src 'self' https://fonts.loli.net; 
               img-src 'self' data: https:; 
               connect-src 'self' https://yuzhen-fitness.cn;">
```

---

## 📊 监控和日志

### 1. 性能监控

**Web Vitals监控**：
```typescript
// src/utils/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function initPerformanceMonitoring() {
  getCLS(console.log)
  getFID(console.log)
  getFCP(console.log)
  getLCP(console.log)
  getTTFB(console.log)
}
```

### 2. 错误追踪

**Sentry集成**（可选）：
```typescript
// src/main.ts
import * as Sentry from '@sentry/vue'

if (import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true') {
  Sentry.init({
    app,
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENV,
  })
}
```

### 3. 访问日志

**Nginx日志配置**：
```nginx
# 访问日志
access_log /var/log/nginx/yuzhen-fitness-access.log combined;

# 错误日志
error_log /var/log/nginx/yuzhen-fitness-error.log warn;
```

---

## ✅ 部署检查清单

### 部署前检查

- [ ] 环境变量配置正确（.env.production）
- [ ] 构建配置优化完成（vite.config.ts）
- [ ] PWA配置完整（manifest.json）
- [ ] 图标资源准备完成（至少占位符）
- [ ] Service Worker配置正确
- [ ] 代码通过所有测试
- [ ] 性能指标达标（Lighthouse > 90）

### 服务器检查

- [ ] 域名DNS解析正确
- [ ] SSL证书配置完成
- [ ] Nginx配置正确
- [ ] 防火墙规则配置（80/443端口开放）
- [ ] 后端API服务正常
- [ ] DAML-RAG服务正常

### 部署后验证

- [ ] 主域名访问正常（https://yuzhen-fitness.cn）
- [ ] 备用域名访问正常
- [ ] PWA安装功能正常
- [ ] API请求正常
- [ ] AI对话功能正常
- [ ] 移动端显示正常
- [ ] 性能指标达标

---

## 🔄 持续部署

### CI/CD流程

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build -- --mode production
      
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          source: "dist/*"
          target: "/usr/share/nginx/html"
      
      - name: Reload Nginx
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_KEY }}
          script: docker exec fitness_nginx_v2 nginx -s reload
```

---

## 📚 相关文档

- [生产环境部署与运营规划](../../../docs/06-部署运维/04-生产环境部署与运营规划.md)
- [性能测试指南](./performance-testing.md)
- [可访问性指南](./accessibility-guide.md)
- [部署文档](./deployment.md)

---

## 🆘 故障排查

### 常见问题

**1. 构建失败**
```bash
# 清除缓存重新构建
rm -rf node_modules dist
npm install
npm run build
```

**2. PWA不能安装**
- 检查manifest.json路径
- 检查HTTPS配置
- 检查Service Worker注册

**3. API请求失败**
- 检查环境变量配置
- 检查Nginx代理配置
- 检查后端服务状态

**4. 性能问题**
- 检查资源压缩
- 检查CDN配置
- 检查代码分割

---

**维护者**: 薛小川  
**最后更新**: 2026-01-07  
**文档版本**: v1.0.0

<div align="center">
<strong>🚀 生产部署 · 📱 PWA配置 · ⚡ 性能优化</strong>
</div>
