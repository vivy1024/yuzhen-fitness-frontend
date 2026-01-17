# 部署文档（已整合）

**版本**: v1.0.0  
**最后更新**: 2026-01-07  
**维护者**: 薛小川  
**状态**: 🗂️ 已整合到 `zeabur-deployment-guide.md`

---

## ⚠️ 文档状态说明

本文档的内容已整合到 `zeabur-deployment-guide.md` 中。

**原因**：
- 当前生产环境使用Zeabur平台
- 通用部署方案（Nginx/Apache/Docker）已不适用
- 避免文档重复和维护成本

**请使用**：
- 主要文档：`zeabur-deployment-guide.md`
- 辅助文档：`deployment-implementation-plan.md`（详细步骤）

---

## 📋 原文档内容保留（仅供参考）

- [环境要求](#环境要求)
- [构建配置](#构建配置)
- [本地构建](#本地构建)
- [生产部署](#生产部署)
- [Docker 部署](#docker-部署)
- [环境变量配置](#环境变量配置)
- [性能优化](#性能优化)
- [故障排查](#故障排查)

---

## 环境要求

### 开发环境
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **操作系统**: Windows / macOS / Linux

### 生产环境
- **Web 服务器**: Nginx / Apache / Caddy
- **HTTPS**: 必须（推荐使用 Let's Encrypt）
- **域名**: 已备案域名（中国大陆）

---

## 构建配置

### Vite 配置 (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 9000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 生产环境关闭 sourcemap
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除 console
        drop_debugger: true // 移除 debugger
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'ui-vendor': ['@radix-ui/vue', 'lucide-vue-next'],
          'chart-vendor': ['echarts']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // 提高警告阈值到 1MB
  }
})
```

### TypeScript 配置 (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 本地构建

### 1. 安装依赖

```bash
cd yuzhen_fitness
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# API 地址
VITE_API_BASE_URL=http://localhost:8000
VITE_DAML_RAG_API_URL=http://localhost:8001

# 应用配置
VITE_APP_TITLE=玉珍健身
VITE_APP_VERSION=1.52.0
```

### 3. 开发模式

```bash
npm run dev
```

访问 `http://localhost:9000`

### 4. 生产构建

```bash
npm run build
```

构建产物位于 `dist/` 目录。

### 5. 预览构建

```bash
npm run preview
```

---

## 生产部署

### 方案一：Nginx 部署

#### 1. 构建项目

```bash
npm run build
```

#### 2. 上传构建产物

将 `dist/` 目录上传到服务器：

```bash
scp -r dist/* user@server:/var/www/yuzhen-fitness/
```

#### 3. 配置 Nginx

创建 Nginx 配置文件 `/etc/nginx/sites-available/yuzhen-fitness`：

```nginx
server {
    listen 80;
    server_name yuzhen-fitness.cn www.yuzhen-fitness.cn;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yuzhen-fitness.cn www.yuzhen-fitness.cn;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/yuzhen-fitness.cn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yuzhen-fitness.cn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 网站根目录
    root /var/www/yuzhen-fitness;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # DAML-RAG API 代理
    location /v1/ {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE 流式响应配置
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        chunked_transfer_encoding on;
    }
    
    # Vue Router History 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 4. 启用配置并重启 Nginx

```bash
sudo ln -s /etc/nginx/sites-available/yuzhen-fitness /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. 配置 SSL 证书（Let's Encrypt）

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yuzhen-fitness.cn -d www.yuzhen-fitness.cn
```

### 方案二：Apache 部署

#### 1. 配置 Apache

创建配置文件 `/etc/apache2/sites-available/yuzhen-fitness.conf`：

```apache
<VirtualHost *:80>
    ServerName yuzhen-fitness.cn
    ServerAlias www.yuzhen-fitness.cn
    
    # 重定向到 HTTPS
    Redirect permanent / https://yuzhen-fitness.cn/
</VirtualHost>

<VirtualHost *:443>
    ServerName yuzhen-fitness.cn
    ServerAlias www.yuzhen-fitness.cn
    
    DocumentRoot /var/www/yuzhen-fitness
    
    # SSL 配置
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yuzhen-fitness.cn/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yuzhen-fitness.cn/privkey.pem
    
    # 启用 Gzip
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>
    
    # 静态资源缓存
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=31536000, public, immutable"
    </FilesMatch>
    
    # API 代理
    ProxyPass /api/ http://localhost:8000/api/
    ProxyPassReverse /api/ http://localhost:8000/api/
    
    # DAML-RAG API 代理
    ProxyPass /v1/ http://localhost:8001/v1/
    ProxyPassReverse /v1/ http://localhost:8001/v1/
    
    # Vue Router History 模式支持
    <Directory /var/www/yuzhen-fitness>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

#### 2. 启用模块和配置

```bash
sudo a2enmod rewrite ssl proxy proxy_http headers deflate
sudo a2ensite yuzhen-fitness
sudo systemctl restart apache2
```

---

## Docker 部署

### Dockerfile

创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

创建 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Vue Router History 模式支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### docker-compose.yml

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  frontend:
    build: .
    ports:
      - "9000:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - yuzhen-network

networks:
  yuzhen-network:
    external: true
```

### 构建和运行

```bash
# 构建镜像
docker build -t yuzhen-fitness-frontend .

# 运行容器
docker run -d -p 9000:80 --name yuzhen-fitness-frontend yuzhen-fitness-frontend

# 或使用 docker-compose
docker-compose up -d
```

---

## 环境变量配置

### 开发环境 (`.env.development`)

```env
# API 地址
VITE_API_BASE_URL=http://localhost:8000
VITE_DAML_RAG_API_URL=http://localhost:8001

# 应用配置
VITE_APP_TITLE=玉珍健身（开发）
VITE_APP_VERSION=1.52.0

# 调试模式
VITE_DEBUG=true
```

### 生产环境 (`.env.production`)

```env
# API 地址
VITE_API_BASE_URL=https://api.yuzhen-fitness.cn
VITE_DAML_RAG_API_URL=https://ai.yuzhen-fitness.cn

# 应用配置
VITE_APP_TITLE=玉珍健身
VITE_APP_VERSION=1.52.0

# 调试模式
VITE_DEBUG=false
```

### 环境变量说明

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `VITE_API_BASE_URL` | Laravel 后端 API 地址 | `https://api.yuzhen-fitness.cn` |
| `VITE_DAML_RAG_API_URL` | DAML-RAG AI 服务地址 | `https://ai.yuzhen-fitness.cn` |
| `VITE_APP_TITLE` | 应用标题 | `玉珍健身` |
| `VITE_APP_VERSION` | 应用版本号 | `1.52.0` |
| `VITE_DEBUG` | 调试模式 | `true` / `false` |

---

## 性能优化

### 1. 代码分割

已在 `vite.config.ts` 中配置：

```typescript
rollupOptions: {
  output: {
    manualChunks: {
      'vue-vendor': ['vue', 'vue-router', 'pinia'],
      'ui-vendor': ['@radix-ui/vue', 'lucide-vue-next'],
      'chart-vendor': ['echarts']
    }
  }
}
```

### 2. 图片优化

- 使用 WebP 格式
- 实现懒加载（LazyImage 组件）
- 压缩图片大小

### 3. 缓存策略

#### 浏览器缓存

```nginx
# 静态资源缓存 1 年
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### Service Worker

考虑使用 Workbox 实现 PWA 离线缓存。

### 4. CDN 加速

将静态资源上传到 CDN：

```bash
# 上传到阿里云 OSS
ossutil cp -r dist/assets/ oss://yuzhen-fitness-cdn/assets/
```

更新 `vite.config.ts`：

```typescript
build: {
  assetsDir: 'assets',
  rollupOptions: {
    output: {
      assetFileNames: 'assets/[name]-[hash][extname]'
    }
  }
}
```

### 5. Gzip 压缩

Nginx 已配置 Gzip，也可以预压缩：

```bash
npm install vite-plugin-compression --save-dev
```

```typescript
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz'
    })
  ]
})
```

---

## 故障排查

### 1. 白屏问题

**症状**: 部署后页面白屏，控制台报错 404

**原因**: Vue Router History 模式未正确配置

**解决方案**:
- 检查 Nginx/Apache 配置中的 `try_files` 或 `RewriteRule`
- 确保所有路由都回退到 `index.html`

### 2. API 请求失败

**症状**: 前端无法访问后端 API

**原因**: CORS 配置或代理配置错误

**解决方案**:
- 检查后端 CORS 配置
- 检查 Nginx 代理配置
- 确认 API 地址正确

### 3. 静态资源 404

**症状**: CSS/JS 文件加载失败

**原因**: 资源路径配置错误

**解决方案**:
- 检查 `vite.config.ts` 中的 `base` 配置
- 确认 `assetsDir` 配置正确
- 检查 Nginx 静态资源路径

### 4. SSE 流式响应中断

**症状**: AI 对话流式响应中断

**原因**: Nginx 缓冲配置问题

**解决方案**:
```nginx
location /v1/ {
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 300s;
    chunked_transfer_encoding on;
}
```

### 5. 构建失败

**症状**: `npm run build` 报错

**原因**: 依赖版本冲突或内存不足

**解决方案**:
```bash
# 清除缓存
rm -rf node_modules package-lock.json
npm install

# 增加 Node.js 内存
export NODE_OPTIONS=--max_old_space_size=4096
npm run build
```

---

## 监控和日志

### 1. 错误监控

推荐使用 Sentry：

```bash
npm install @sentry/vue
```

```typescript
import * as Sentry from '@sentry/vue'

Sentry.init({
  app,
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0
})
```

### 2. 性能监控

使用 Lighthouse CI：

```bash
npm install -g @lhci/cli
lhci autorun
```

### 3. 访问日志

Nginx 访问日志：

```nginx
access_log /var/log/nginx/yuzhen-fitness-access.log;
error_log /var/log/nginx/yuzhen-fitness-error.log;
```

---

## 回滚策略

### 1. 保留历史版本

```bash
# 备份当前版本
cp -r /var/www/yuzhen-fitness /var/www/yuzhen-fitness-backup-$(date +%Y%m%d)

# 部署新版本
cp -r dist/* /var/www/yuzhen-fitness/
```

### 2. 快速回滚

```bash
# 回滚到备份版本
rm -rf /var/www/yuzhen-fitness
cp -r /var/www/yuzhen-fitness-backup-20260107 /var/www/yuzhen-fitness
sudo systemctl reload nginx
```

---

## 安全建议

### 1. HTTPS 强制

```nginx
# 强制 HTTPS
if ($scheme != "https") {
    return 301 https://$server_name$request_uri;
}
```

### 2. 安全头

```nginx
# 安全头
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

### 3. 隐藏服务器信息

```nginx
# 隐藏 Nginx 版本号
server_tokens off;
```

---

## 联系方式

如有部署问题，请联系：

- **维护者**: 薛小川
- **邮箱**: support@yuzhen-fitness.cn

---

**版本**: v1.0.0  
**最后更新**: 2026-01-07
