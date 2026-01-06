# 05-API文档

本目录包含前端调用的所有后端API接口文档。

---

## 📚 文档列表

### [认证系统API](./01-认证系统API.md) ✅
- 邮箱密码登录
- 手机号验证码登录
- 用户注册
- Token刷新
- 登出

### [话题管理API](./02-话题管理API.md)
- 获取话题列表
- 创建话题
- 删除话题
- 获取话题消息

### [训练计划API](./03-训练计划API.md)
- 导入训练计划
- 获取训练计划列表
- 获取训练计划详情
- 更新训练计划
- 删除训练计划

### [AI聊天API](./04-AI聊天API.md)
- 流式聊天
- 会话管理

---

## 🔧 API基础信息

### 基础URL

```
Laravel API: http://localhost:8000/api
DAML-RAG API: http://localhost:8001/api/v1
```

### 认证方式

**JWT Bearer Token**

```http
Authorization: Bearer <token>
```

### 请求头

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
```

---

## 📊 响应格式

### 成功响应

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "msg": "错误信息",
  "data": null
}
```

---

## 🔢 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 422 | 验证失败 |
| 500 | 服务器错误 |

---

## 🔗 相关文档

- [认证系统API](./01-认证系统API.md) ✅
- [话题管理API](./02-话题管理API.md) ✅
- [训练计划API](./03-训练计划API.md)

---

**维护者**: 薛小川  
**最后更新**: 2026-01-02
