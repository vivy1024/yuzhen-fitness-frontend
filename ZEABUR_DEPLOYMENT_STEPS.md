# 🚀 Zeabur部署步骤（快速上手）

**服务器**: 182.92.78.183（阿里云北京，Zeabur托管）  
**更新日期**: 2026-01-07

---

## 📋 前提条件

- ✅ 已有Zeabur账号（如果没有，访问 https://zeabur.com 注册）
- ✅ 代码已构建完成（`dist`目录存在）
- ✅ 域名已准备好（yuzhen-fitness.cn等）

---

## 🎯 部署步骤（5步完成）

### 步骤1：登录Zeabur控制台

1. 访问 https://zeabur.com
2. 使用GitHub/GitLab/Google账号登录
3. 进入控制台

### 步骤2：创建新项目

1. 点击右上角"New Project"按钮
2. 输入项目名称：`yuzhen-fitness`
3. 选择区域：`Asia Pacific (Hong Kong)` 或 `Asia Pacific (Tokyo)`
   - 注意：虽然服务器在北京，但Zeabur会自动路由到最近的节点
4. 点击"Create"创建项目

### 步骤3：部署服务

#### 方式A：从Git仓库部署（推荐）

1. 点击"Add Service"
2. 选择"Git"
3. 授权GitHub/GitLab账号
4. 选择`yuzhen_fitness`仓库
5. 选择分支：`main`
6. Zeabur会自动检测为Vue项目并开始构建

#### 方式B：手动上传（如果没有Git仓库）

1. 点击"Add Service"
2. 选择"Upload Files"
3. 上传整个`yuzhen_fitness`目录
4. Zeabur会自动检测并构建

### 步骤4：配置环境变量

1. 在项目页面，点击你的服务
2. 点击"Variables"标签
3. 添加以下环境变量：

```
VITE_API_BASE_URL=https://yuzhen-fitness.cn/api
VITE_DAML_RAG_API_URL=https://yuzhen-fitness.cn/ai
VITE_APP_NAME=玉珍健身
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
VITE_APP_DOMAIN=yuzhen-fitness.cn
VITE_ENABLE_PWA=true
VITE_ENABLE_SW=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=false
VITE_REQUEST_TIMEOUT=30000
VITE_MAX_UPLOAD_SIZE=10
VITE_DEBUG=false
```

4. 点击"Save"保存
5. Zeabur会自动重新部署

### 步骤5：绑定域名

1. 在服务页面，点击"Networking"标签
2. 点击"Add Domain"
3. 输入域名：`yuzhen-fitness.cn`
4. 点击"Add"
5. Zeabur会显示CNAME记录值（类似：`xxx.zeabur.app`）
6. 重复以上步骤添加其他域名：
   - `www.yuzhen-fitness.cn`
   - `yuzhen-fitness.fun`
   - `www.yuzhen-fitness.fun`
   - `yuzhen-fitness.shop`
   - `www.yuzhen-fitness.shop`
   - `yuzhen-fitness.online`
   - `www.yuzhen-fitness.online`

---

## 🌐 DNS配置

### 在阿里云DNS控制台配置

1. 登录阿里云控制台
2. 进入"云解析DNS"
3. 选择对应域名
4. 添加CNAME记录：

#### 主域名（yuzhen-fitness.cn）

```
记录类型: CNAME
主机记录: @
记录值: <Zeabur提供的域名>.zeabur.app
TTL: 10分钟
```

```
记录类型: CNAME
主机记录: www
记录值: <Zeabur提供的域名>.zeabur.app
TTL: 10分钟
```

#### 其他域名

对`yuzhen-fitness.fun`、`yuzhen-fitness.shop`、`yuzhen-fitness.online`重复以上配置。

### 验证DNS生效

```powershell
# 在PowerShell中执行
nslookup yuzhen-fitness.cn
nslookup www.yuzhen-fitness.cn
```

预期结果：应该看到CNAME记录指向Zeabur域名。

---

## 🔒 SSL证书配置

**好消息**：Zeabur会自动配置SSL证书！

1. 域名绑定后，Zeabur会自动申请Let's Encrypt证书
2. 等待5-10分钟，证书会自动配置完成
3. 访问 `https://yuzhen-fitness.cn` 验证

---

## ✅ 部署验证

### 1. 访问网站

在浏览器访问：
- https://yuzhen-fitness.cn
- https://yuzhen-fitness.fun
- https://yuzhen-fitness.shop
- https://yuzhen-fitness.online

### 2. 检查PWA功能

1. 按F12打开Chrome DevTools
2. 切换到"Application"标签
3. 检查：
   - Manifest: 应该加载成功
   - Service Workers: 应该注册成功
   - 图标: 应该显示正确

### 3. 测试移动端

1. 用手机浏览器访问网站
2. 点击"添加到主屏幕"
3. 确认图标和名称正确

---

## 🔄 后续更新

### 自动部署（如果使用Git）

```bash
# 修改代码后
git add .
git commit -m "feat: 添加新功能"
git push origin main

# Zeabur会自动：
# 1. 检测到推送
# 2. 拉取最新代码
# 3. 运行 npm run build
# 4. 部署新版本
```

### 手动部署（如果手动上传）

1. 本地构建：`npm run build`
2. 在Zeabur控制台点击"Redeploy"
3. 上传新的`dist`目录

---

## 🆘 常见问题

### Q1: 域名无法访问

**A**: 
1. 检查DNS是否生效（可能需要等待10分钟到24小时）
2. 确认CNAME记录配置正确
3. 清除浏览器缓存

### Q2: SSL证书错误

**A**: 
1. 等待5-10分钟让Zeabur自动配置证书
2. 如果超过1小时还未配置，联系Zeabur支持

### Q3: 构建失败

**A**: 
1. 检查Zeabur构建日志
2. 确认`package.json`中的构建命令正确
3. 确认所有依赖都在`package.json`中

### Q4: API请求失败

**A**: 
1. 检查环境变量配置
2. 确认后端服务正常运行
3. 检查CORS配置

---

## 📞 获取帮助

- **Zeabur文档**: https://zeabur.com/docs
- **Zeabur Discord**: https://discord.gg/zeabur
- **项目文档**: `docs/06-部署指南/zeabur-deployment-guide.md`

---

## 🎉 完成！

恭喜！你的玉珍健身应用已经成功部署到Zeabur！

**访问地址**: https://yuzhen-fitness.cn

---

**最后更新**: 2026-01-07  
**维护者**: 薛小川
