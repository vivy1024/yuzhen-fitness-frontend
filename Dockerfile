# 玉珍健身前端 - Dockerfile
# 多阶段构建：构建阶段 + 运行阶段

# ============================================
# 阶段1：构建阶段
# ============================================
FROM node:22-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production=false

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# ============================================
# 阶段2：运行阶段
# ============================================
FROM zeabur/caddy-static:latest

# 从构建阶段复制dist目录
COPY --from=build /app/dist /var/www/html

# 暴露端口
EXPOSE 80

# Caddy会自动服务/var/www/html目录
