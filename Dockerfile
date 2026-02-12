# 玉珍健身前端 - Dockerfile
# 多阶段构建：构建阶段 + 运行阶段

# ============================================
# 阶段1：构建阶段
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

# 第1层：依赖安装（仅package.json变化时重建）
COPY package*.json ./
RUN npm ci --only=production=false

# 第2层：源代码复制+构建（代码变化时重建）
COPY . .

# 设置生产环境变量（权限系统重构后，AI请求必须走PHP后端代理）
ENV VITE_API_BASE_URL=https://api.yuzhen-fitness.cn/api
ENV VITE_DAML_RAG_API_URL=https://api.yuzhen-fitness.cn/api/ai
ENV VITE_APP_ENV=production

RUN npm run build

# ============================================
# 阶段2：运行阶段
# ============================================
FROM zeabur/caddy-static:latest

COPY --from=build /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080
