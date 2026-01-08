# 玉珍健身生产环境部署实施方案

**版本**: v1.0.0  
**更新日期**: 2026-01-07  
**状态**: 📋 待实施  
**服务器**: 182.92.78.183（阿里云北京）  
**维护者**: 薛小川

---

## 📋 部署概述

### 目标

1. ✅ 部署前端PWA应用到生产服务器
2. ✅ 配置多域名访问（cn/fun/shop/online）
3. ✅ 展示产品文档和官网内容
4. ✅ 配置SSL证书和HTTPS
5. ✅ 使用Chrome DevTools进行测试验证

### 服务器信息

- **IP地址**: 182.92.78.183
- **区域**: 阿里云北京（华北2）
- **配置**: 4核16GB内存 80GB SSD
- **操作系统**: Linux（推测Ubuntu/CentOS）
- **已有服务**: Docker容器化环境

### 域名配置

| 域名 | 用途 | 备案状态 | SSL证书 |
|------|------|----------|---------|
| yuzhen-fitness.cn | 主站（生产） | ✅ 已备案 | 阿里云SSL |
| yuzhen-fitness.fun | 国际用户 | ❌ 未备案 | Let's Encrypt |
| yuzhen-fitness.shop | 会员商城 | ❌ 未备案 | Let's Encrypt |
| yuzhen-fitness.online | 测试环境 | ❌ 未备案 | Let's Encrypt |

---

## 🚀 部署步骤（分阶段实施）

### 阶段1：本地构建准备（10分钟）

#### 步骤1.1：安装依赖并生成图标

```bash
# 进入前端项目目录
cd yuzhen_fitness

# 安装依赖（如果还没有）
npm install

# 生成PWA占位符图标
python scripts/generate_placeholder_icons.py

# 验证图标生成
dir public\icons
```

**预期结果**：
- 生成8种尺寸的图标文件
- 生成4个快捷方式图标
- 图标位于 `public/icons/` 目录

#### 步骤1.2：构建生产版本

```bash
# 构建生产版本（使用.env.production配置）
npm run build

# 验证构建结果
dir dist
```

**预期结果**：
- `dist/` 目录包含所有构建文件
- 文件已压缩（gzip/brotli）
- manifest.json和Service Worker已包含

#### 步骤1.3：本地预览测试

```bash
# 启动预览服务器
npm run preview
```

**预期结果**：
- 访问 http://localhost:4173
- 页面正常显示
- PWA功能可用

---

### 阶段2：服务器环境检查（15分钟）

#### 步骤2.1：SSH连接服务器

```bash
# 使用SSH连接服务器
ssh root@182.92.78.183

# 或使用密钥
ssh -i your-key.pem root@182.92.78.183
```

#### 步骤2.2：检查Docker环境

```bash
# 检查Docker版本
docker --version

# 检查Docker Compose版本
docker-compose --version

# 查看运行中的容器
docker ps

# 查看Nginx容器
docker ps | findstr nginx
```

**预期结果**：
- Docker版本 >= 20.10
- Docker Compose版本 >= 2.0
- 看到 `fitness_nginx_v2` 容器运行中

#### 步骤2.3：检查目录结构

```bash
# 检查Nginx HTML目录
ls -la /usr/share/nginx/html/

# 检查SSL证书目录
ls -la /etc/nginx/ssl/

# 检查Nginx配置目录
ls -la /etc/nginx/conf.d/
```

**预期结果**：
- 目录存在且有写入权限
- 如果目录不存在，需要创建

---

### 阶段3：DNS和SSL配置（30分钟）

#### 步骤3.1：配置DNS解析

**在阿里云DNS控制台操作**：

1. 登录阿里云控制台
2. 进入"云解析DNS"服务
3. 添加以下A记录：

```
记录类型: A
主机记录: @
记录值: 182.92.78.183
TTL: 10分钟

记录类型: A
主机记录: www
记录值: 182.92.78.183
TTL: 10分钟
```

4. 对所有4个域名重复以上操作

#### 步骤3.2：验证DNS解析

```bash
# 在本地Windows PowerShell执行
nslookup yuzhen-fitness.cn
nslookup yuzhen-fitness.fun
nslookup yuzhen-fitness.shop
nslookup yuzhen-fitness.online

# 或使用ping测试
ping yuzhen-fitness.cn
```

**预期结果**：
- 所有域名解析到 182.92.78.183
- ping通（如果服务器允许ICMP）

#### 步骤3.3：申请SSL证书

**方案A：阿里云SSL证书（推荐用于.cn域名）**

1. 登录阿里云控制台
2. 进入"SSL证书"服务
3. 申请免费SSL证书（DV单域名）
4. 选择域名：yuzhen-fitness.cn
5. 验证域名所有权（DNS验证）
6. 下载证书（Nginx格式）

**方案B：Let's Encrypt证书（用于其他域名）**

```bash
# SSH到服务器
ssh root@182.92.78.183

# 安装Certbot
apt-get update
apt-get install -y certbot python3-certbot-nginx

# 申请证书（交互式）
certbot certonly --nginx -d yuzhen-fitness.fun -d www.yuzhen-fitness.fun
certbot certonly --nginx -d yuzhen-fitness.shop -d www.yuzhen-fitness.shop
certbot certonly --nginx -d yuzhen-fitness.online -d www.yuzhen-fitness.online

# 查看证书位置
ls -la /etc/letsencrypt/live/
```

**预期结果**：
- 证书文件生成成功
- 证书位于 `/etc/letsencrypt/live/域名/` 目录

---

### 阶段4：Nginx配置（20分钟）

#### 步骤4.1：创建Nginx配置文件

```bash
# SSH到服务器
ssh root@182.92.78.183

# 创建配置文件
nano /etc/nginx/conf.d/yuzhen-fitness.conf
```

**配置内容**（见下方完整配置）

#### 步骤4.2：测试Nginx配置

```bash
# 测试配置文件语法
docker exec fitness_nginx_v2 nginx -t

# 如果测试通过，重新加载配置
docker exec fitness_nginx_v2 nginx -s reload
```

**预期结果**：
- 配置测试通过：`syntax is ok`
- Nginx重新加载成功

---

### 阶段5：部署前端应用（15分钟）

#### 步骤5.1：上传构建文件

**方案A：使用SCP上传（推荐）**

```bash
# 在本地Windows PowerShell执行
# 进入前端项目目录
cd yuzhen_fitness

# 上传dist目录到服务器
scp -r dist/* root@182.92.78.183:/usr/share/nginx/html/
```

**方案B：使用Git拉取**

```bash
# SSH到服务器
ssh root@182.92.78.183

# 克隆或拉取代码
cd /opt
git clone <repository-url> yuzhen_fitness
cd yuzhen_fitness

# 安装依赖并构建
npm install
npm run build

# 复制到Nginx目录
cp -r dist/* /usr/share/nginx/html/
```

#### 步骤5.2：设置文件权限

```bash
# SSH到服务器
ssh root@182.92.78.183

# 设置目录权限
chown -R nginx:nginx /usr/share/nginx/html/
chmod -R 755 /usr/share/nginx/html/
```

#### 步骤5.3：重启Nginx

```bash
# 重新加载Nginx配置
docker exec fitness_nginx_v2 nginx -s reload

# 或重启Nginx容器
docker restart fitness_nginx_v2
```

---

### 阶段6：使用Chrome DevTools验证（20分钟）

#### 步骤6.1：启动Chrome DevTools MCP服务

```bash
# 在本地Windows PowerShell执行
# 确保Chrome DevTools MCP服务已启动
# 如果没有启动，参考MCP配置文档启动服务
```

#### 步骤6.2：访问主域名

使用Chrome DevTools MCP工具访问网站：

```
1. 打开新页面
2. 导航到 https://yuzhen-fitness.cn
3. 等待页面加载
4. 截图验证
```

#### 步骤6.3：检查PWA功能

```
1. 打开Chrome DevTools
2. 切换到Application标签
3. 检查Manifest
4. 检查Service Worker
5. 测试"添加到主屏幕"
```

#### 步骤6.4：性能测试

```
1. 打开Chrome DevTools
2. 切换到Lighthouse标签
3. 运行性能测试
4. 检查各项指标
```

#### 步骤6.5：移动端测试

```
1. 打开Chrome DevTools
2. 切换到设备模拟模式
3. 选择iPhone/Android设备
4. 测试响应式布局
5. 测试触摸交互
```

---

## 📝 完整Nginx配置文件

```nginx
# /etc/nginx/conf.d/yuzhen-fitness.conf
# 玉珍健身多域名配置
# 更新日期：2026-01-07

# ==================== 主站 - yuzhen-fitness.cn ====================
server {
    listen 443 ssl http2;
    server_name yuzhen-fitness.cn www.yuzhen-fitness.cn;
    
    # SSL证书配置（阿里云证书）
    ssl_certificate /etc/nginx/ssl/cn/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/cn/privkey.pem;
    
    # SSL优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # 前端静态资源
    root /usr/share/nginx/html;
    index index.html;
    
    # 前端路由支持（Vue Router history模式）
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
        
        # 支持PWA
        add_header Service-Worker-Allowed "/";
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
    
    # 后端API代理
    location /api {
        proxy_pass http://fitness_php_v2:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # DAML-RAG AI服务代理
    location /ai {
        proxy_pass http://fitness_daml_rag:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 流式响应支持
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
    
    # 健康检查
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# HTTP到HTTPS重定向 - yuzhen-fitness.cn
server {
    listen 80;
    server_name yuzhen-fitness.cn www.yuzhen-fitness.cn;
    return 301 https://$server_name$request_uri;
}

# ==================== 国际域名 - yuzhen-fitness.fun ====================
server {
    listen 443 ssl http2;
    server_name yuzhen-fitness.fun www.yuzhen-fitness.fun;
    
    # SSL证书配置（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/yuzhen-fitness.fun/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yuzhen-fitness.fun/privkey.pem;
    
    # SSL优化配置（同上）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 安全头（同上）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # 前端静态资源（同上）
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }
    
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    location /api {
        proxy_pass http://fitness_php_v2:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /ai {
        proxy_pass http://fitness_daml_rag:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffering off;
    }
}

server {
    listen 80;
    server_name yuzhen-fitness.fun www.yuzhen-fitness.fun;
    return 301 https://$server_name$request_uri;
}

# ==================== 商城域名 - yuzhen-fitness.shop ====================
server {
    listen 443 ssl http2;
    server_name yuzhen-fitness.shop www.yuzhen-fitness.shop;
    
    ssl_certificate /etc/letsencrypt/live/yuzhen-fitness.shop/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yuzhen-fitness.shop/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 商城专用安全头（更严格）
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://fitness_php_v2:9000;
        proxy_set_header Host $host;
    }
}

server {
    listen 80;
    server_name yuzhen-fitness.shop www.yuzhen-fitness.shop;
    return 301 https://$server_name$request_uri;
}

# ==================== 测试域名 - yuzhen-fitness.online ====================
server {
    listen 443 ssl http2;
    server_name yuzhen-fitness.online www.yuzhen-fitness.online;
    
    ssl_certificate /etc/letsencrypt/live/yuzhen-fitness.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yuzhen-fitness.online/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    root /usr/share/nginx/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://fitness_php_v2:9000;
        proxy_set_header Host $host;
    }
    
    location /ai {
        proxy_pass http://fitness_daml_rag:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name yuzhen-fitness.online www.yuzhen-fitness.online;
    return 301 https://$server_name$request_uri;
}

# ==================== 默认服务器（拒绝未知域名） ====================
server {
    listen 80 default_server;
    listen 443 ssl default_server;
    server_name _;
    
    # 使用自签名证书（避免SSL错误）
    ssl_certificate /etc/nginx/ssl/default/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/default/key.pem;
    
    return 444;  # 关闭连接
}
```

---

## ✅ 部署验证清单

### 基础功能验证

- [ ] **主域名访问**
  - [ ] https://yuzhen-fitness.cn 正常访问
  - [ ] HTTPS证书有效
  - [ ] 页面加载正常
  - [ ] 无控制台错误

- [ ] **备用域名访问**
  - [ ] https://yuzhen-fitness.fun 正常访问
  - [ ] https://yuzhen-fitness.shop 正常访问
  - [ ] https://yuzhen-fitness.online 正常访问

- [ ] **PWA功能**
  - [ ] manifest.json加载成功
  - [ ] Service Worker注册成功
  - [ ] "添加到主屏幕"功能可用
  - [ ] 离线缓存工作正常

### API功能验证

- [ ] **后端API**
  - [ ] 登录功能正常
  - [ ] 用户档案获取正常
  - [ ] 训练计划列表正常

- [ ] **AI服务**
  - [ ] AI对话功能正常
  - [ ] 流式响应正常
  - [ ] 工具调用正常

### 性能验证

- [ ] **Lighthouse测试**
  - [ ] Performance > 90
  - [ ] Accessibility > 90
  - [ ] Best Practices > 90
  - [ ] SEO > 90
  - [ ] PWA > 90

- [ ] **移动端测试**
  - [ ] iPhone显示正常
  - [ ] Android显示正常
  - [ ] 触摸交互正常
  - [ ] 响应式布局正常

### 安全验证

- [ ] **SSL证书**
  - [ ] 证书有效期 > 30天
  - [ ] 证书链完整
  - [ ] 无混合内容警告

- [ ] **安全头**
  - [ ] HSTS启用
  - [ ] X-Frame-Options设置
  - [ ] X-Content-Type-Options设置
  - [ ] CSP配置正确

---

## 🔧 故障排查

### 问题1：域名无法访问

**可能原因**：
- DNS解析未生效
- 防火墙阻止80/443端口
- Nginx配置错误

**解决方案**：
```bash
# 检查DNS解析
nslookup yuzhen-fitness.cn

# 检查端口开放
telnet 182.92.78.183 80
telnet 182.92.78.183 443

# 检查Nginx配置
docker exec fitness_nginx_v2 nginx -t

# 查看Nginx日志
docker logs fitness_nginx_v2
```

### 问题2：SSL证书错误

**可能原因**：
- 证书文件路径错误
- 证书过期
- 证书链不完整

**解决方案**：
```bash
# 检查证书文件
ls -la /etc/letsencrypt/live/yuzhen-fitness.fun/

# 检查证书有效期
openssl x509 -in /etc/letsencrypt/live/yuzhen-fitness.fun/fullchain.pem -noout -dates

# 重新申请证书
certbot renew --force-renewal
```

### 问题3：PWA无法安装

**可能原因**：
- manifest.json路径错误
- Service Worker注册失败
- HTTPS未启用

**解决方案**：
```bash
# 检查manifest.json
curl https://yuzhen-fitness.cn/manifest.json

# 检查Service Worker
curl https://yuzhen-fitness.cn/sw.js

# 查看浏览器控制台错误
# 使用Chrome DevTools查看详细错误信息
```

### 问题4：API请求失败

**可能原因**：
- 后端服务未启动
- Nginx代理配置错误
- CORS配置问题

**解决方案**：
```bash
# 检查后端服务
docker ps | findstr php

# 检查后端日志
docker logs fitness_php_v2

# 测试API直接访问
curl http://localhost:9000/api/health
```

---

## 📞 技术支持

**维护者**: 薛小川  
**服务器**: 182.92.78.183  
**主域名**: https://yuzhen-fitness.cn  
**文档位置**: `yuzhen_fitness/docs/06-部署指南/`

---

## 📚 相关文档

- [生产部署指南](./production-deployment-guide.md)
- [部署检查清单](../../DEPLOYMENT_CHECKLIST.md)
- [生产环境部署与运营规划](../../../docs/06-部署运维/04-生产环境部署与运营规划.md)
- [性能测试指南](./performance-testing.md)
- [移动端测试指南](./mobile-testing-guide.md)

---

**最后更新**: 2026-01-07  
**文档版本**: v1.0.0

<div align="center">
<strong>🚀 准备就绪 · 开始部署！</strong>
</div>
