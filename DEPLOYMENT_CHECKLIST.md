# 🚀 生产环境部署检查清单

**版本**: v1.0.0  
**更新日期**: 2026-01-07  
**服务器**: 182.92.78.183（阿里云北京）

---

## ✅ 部署前准备

### 1. 环境配置检查

- [ ] **环境变量配置**
  - 文件：`.env.production`
  - 检查API地址：`https://yuzhen-fitness.cn/api`
  - 检查AI服务地址：`https://yuzhen-fitness.cn/ai`
  - 确认功能开关配置正确

- [ ] **构建配置检查**
  - 文件：`vite.config.ts`
  - 确认压缩插件已安装：`vite-plugin-compression`
  - 确认代码分割配置正确
  - 确认Source Map配置为hidden模式

- [ ] **PWA配置检查**
  - 文件：`public/manifest.json`
  - 确认应用名称和描述
  - 确认主题色：`#0ea5e9`
  - 确认图标路径正确

### 2. 资源准备

- [ ] **图标资源**
  - 生成占位符图标：`python scripts/generate_placeholder_icons.py`
  - 或准备正式设计图标（8种尺寸）
  - 放置在 `public/icons/` 目录

- [ ] **启动画面**（可选）
  - 准备iOS启动画面（多种尺寸）
  - 放置在 `public/splash/` 目录

- [ ] **截图资源**（可选）
  - 准备应用截图（1080x1920）
  - 放置在 `public/screenshots/` 目录

### 3. 代码质量检查

- [ ] **测试通过**
  ```bash
  npm run test
  ```

- [ ] **构建成功**
  ```bash
  npm run build
  ```

- [ ] **性能测试**（可选）
  ```bash
  npm run lighthouse
  ```

---

## 🔧 服务器配置

### 1. 域名和DNS

- [ ] **DNS解析配置**
  - yuzhen-fitness.cn → 182.92.78.183
  - www.yuzhen-fitness.cn → 182.92.78.183
  - yuzhen-fitness.fun → 182.92.78.183
  - yuzhen-fitness.shop → 182.92.78.183
  - yuzhen-fitness.online → 182.92.78.183

- [ ] **DNS生效验证**
  ```bash
  nslookup yuzhen-fitness.cn
  ping yuzhen-fitness.cn
  ```

### 2. SSL证书

- [ ] **阿里云SSL证书**（yuzhen-fitness.cn）
  - 在阿里云控制台申请免费SSL证书
  - 下载Nginx格式证书
  - 上传到服务器：`/etc/nginx/ssl/cn/`

- [ ] **Let's Encrypt证书**（其他域名）
  ```bash
  # 安装Certbot
  apt-get install certbot python3-certbot-nginx
  
  # 申请证书
  certbot certonly --nginx -d yuzhen-fitness.fun -d www.yuzhen-fitness.fun
  certbot certonly --nginx -d yuzhen-fitness.shop -d www.yuzhen-fitness.shop
  certbot certonly --nginx -d yuzhen-fitness.online -d www.yuzhen-fitness.online
  
  # 配置自动续期
  crontab -e
  # 添加：0 2 1 * * certbot renew --quiet
  ```

### 3. Nginx配置

- [ ] **配置文件准备**
  - 参考：`docs/06-部署指南/production-deployment-guide.md`
  - 配置多域名虚拟主机
  - 配置SSL证书路径
  - 配置API和AI服务代理
  - 配置静态资源缓存

- [ ] **Nginx配置测试**
  ```bash
  docker exec fitness_nginx_v2 nginx -t
  ```

- [ ] **重启Nginx**
  ```bash
  docker exec fitness_nginx_v2 nginx -s reload
  ```

### 4. 防火墙配置

- [ ] **阿里云安全组规则**
  - 允许 80/TCP（HTTP）
  - 允许 443/TCP（HTTPS）
  - 允许 22/TCP（SSH，限制IP）

---

## 📦 构建和部署

### 1. 本地构建

```bash
# 1. 安装依赖
npm install

# 2. 生成PWA图标（如果还没有）
python scripts/generate_placeholder_icons.py

# 3. 构建生产版本
npm run build -- --mode production

# 4. 预览构建结果（可选）
npm run preview
```

### 2. 部署到服务器

**方法1：SCP上传**
```bash
# 上传构建文件
scp -r dist/* root@182.92.78.183:/usr/share/nginx/html/

# 重启Nginx
ssh root@182.92.78.183 "docker exec fitness_nginx_v2 nginx -s reload"
```

**方法2：Git拉取**
```bash
# SSH到服务器
ssh root@182.92.78.183

# 拉取最新代码
cd /path/to/yuzhen_fitness
git pull origin main

# 构建
npm install
npm run build

# 复制到Nginx目录
cp -r dist/* /usr/share/nginx/html/

# 重启Nginx
docker exec fitness_nginx_v2 nginx -s reload
```

**方法3：CI/CD自动部署**
- 配置GitHub Actions
- 推送tag触发自动部署
- 参考：`docs/06-部署指南/production-deployment-guide.md`

---

## 🧪 部署后验证

### 1. 基础功能验证

- [ ] **主域名访问**
  - 访问：https://yuzhen-fitness.cn
  - 检查页面加载正常
  - 检查HTTPS证书有效

- [ ] **备用域名访问**
  - 访问：https://yuzhen-fitness.fun
  - 访问：https://yuzhen-fitness.shop
  - 访问：https://yuzhen-fitness.online

- [ ] **PWA功能**
  - 检查manifest.json加载：https://yuzhen-fitness.cn/manifest.json
  - 检查Service Worker注册
  - 测试"添加到主屏幕"功能

### 2. API功能验证

- [ ] **后端API**
  - 测试登录功能
  - 测试用户档案获取
  - 测试训练计划列表

- [ ] **AI服务**
  - 测试AI对话功能
  - 测试流式响应
  - 测试工具调用

### 3. 性能验证

- [ ] **Lighthouse测试**
  - 打开Chrome DevTools
  - 运行Lighthouse测试
  - 确认各项指标 > 90分

- [ ] **移动端测试**
  - 使用手机浏览器访问
  - 测试响应式布局
  - 测试触摸交互

### 4. 资源加载验证

- [ ] **静态资源**
  - 检查CSS加载
  - 检查JS加载
  - 检查图片加载
  - 检查字体加载

- [ ] **压缩验证**
  - 检查Response Headers
  - 确认Content-Encoding: gzip 或 br
  - 确认文件大小减小

---

## 📊 监控配置

### 1. 性能监控

- [ ] **Web Vitals监控**
  - 配置性能监控代码
  - 设置数据上报

- [ ] **错误追踪**（可选）
  - 配置Sentry DSN
  - 测试错误上报

### 2. 访问日志

- [ ] **Nginx日志**
  - 检查访问日志：`/var/log/nginx/yuzhen-fitness-access.log`
  - 检查错误日志：`/var/log/nginx/yuzhen-fitness-error.log`

- [ ] **日志轮转**
  - 配置logrotate
  - 防止日志文件过大

---

## 🔄 回滚计划

### 如果部署出现问题

1. **立即回滚**
   ```bash
   # 恢复上一个版本的dist目录
   cp -r /backup/dist-previous/* /usr/share/nginx/html/
   docker exec fitness_nginx_v2 nginx -s reload
   ```

2. **检查日志**
   ```bash
   # Nginx错误日志
   docker exec fitness_nginx_v2 tail -f /var/log/nginx/error.log
   
   # 应用日志
   docker logs fitness_php_v2
   docker logs fitness_daml_rag
   ```

3. **修复问题**
   - 根据日志定位问题
   - 修复代码
   - 重新构建和部署

---

## 📞 联系方式

**技术支持**: 薛小川  
**服务器**: 182.92.78.183  
**主域名**: https://yuzhen-fitness.cn

---

## 📚 相关文档

- [生产部署指南](docs/06-部署指南/production-deployment-guide.md)
- [生产环境部署与运营规划](../docs/06-部署运维/04-生产环境部署与运营规划.md)
- [性能测试指南](docs/06-部署指南/performance-testing.md)
- [可访问性指南](docs/06-部署指南/accessibility-guide.md)

---

**最后更新**: 2026-01-07  
**检查清单版本**: v1.0.0

<div align="center">
<strong>✅ 完成所有检查项后即可上线！</strong>
</div>
