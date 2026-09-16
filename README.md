# 则灵 AI - 聚合多模型 AI 创作平台（复刻版）

基于 Vue 3 + Node.js + SQLite 的全栈 AI 创作平台，复刻自 zeling.online。

## 功能特性

### 5 个核心页面
- **首页（作品广场）**：视频/图片作品展示，分类筛选，上传作品
- **性价比创作**：图片/视频生成，10+ 图片模型、30+ 视频模型，参考图上传，参数设置，任务日志
- **无限画布**：节点式画布编辑器，支持图片生成节点、视频生成节点、上传素材，拖拽缩放
- **API 接入**：API Key 管理，可调用模型列表，完整接口文档
- **设置**：个人资料、创作偏好、通知偏好、账户安全

### 核心系统
- 用户注册/登录（JWT 认证，新用户赠送 100 积分）
- 积分系统（充值、扣减、退回，1 元 = 10 积分）
- 任务管理（提交、排队、生成中、完成，自动轮询）
- 作品广场（生成的作品自动展示）
- 明暗主题切换
- 响应式布局

## 技术栈

### 前端
- Vue 3 + Vite
- Vue Router（Hash 模式）
- Pinia（状态管理）
- Element Plus（UI 组件库）
- Axios（HTTP 请求）

### 后端
- Node.js + Express
- sql.js（纯 JavaScript SQLite，无需原生编译）
- JWT（身份认证）
- bcryptjs（密码加密）
- Multer（文件上传）

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 1. 克隆项目
cd zeling-clone

# 2. 安装后端依赖
cd server
npm install

# 3. 初始化数据库
node init-db.js

# 4. 启动后端服务（端口 3000）
node server.js
# 或开发模式（自动重启）
npm run dev

# 5. 新开终端，安装前端依赖
cd ../client
npm install

# 6. 启动前端开发服务器（端口 5173）
npm run dev
```

### 访问
- 前端：http://localhost:5173
- 后端 API：http://localhost:3000/api
- 健康检查：http://localhost:3000/api/health

### 测试账号
注册时自动创建，新用户赠送 100 积分。

## 项目结构

```
zeling-clone/
├── client/                    # 前端项目
│   ├── src/
│   │   ├── api/              # API 接口封装
│   │   ├── assets/           # 静态资源和全局样式
│   │   ├── components/       # 通用组件（登录弹窗、充值弹窗）
│   │   ├── layouts/          # 布局组件（主布局）
│   │   ├── router/           # 路由配置
│   │   ├── stores/           # Pinia 状态管理
│   │   ├── views/            # 页面组件
│   │   │   ├── Home.vue      # 首页/作品广场
│   │   │   ├── Create.vue    # 性价比创作
│   │   │   ├── Canvas.vue    # 无限画布
│   │   │   ├── ApiAccess.vue # API接入
│   │   │   └── Settings.vue  # 设置
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                    # 后端项目
│   ├── data/                  # SQLite 数据库文件
│   ├── uploads/               # 上传的文件
│   ├── middleware/
│   │   └── auth.js            # JWT 鉴权中间件
│   ├── routes/
│   │   ├── auth.js            # 用户认证（注册/登录/个人资料）
│   │   ├── credits.js         # 积分系统（余额/流水/充值）
│   │   ├── models.js          # 模型列表
│   │   ├── tasks.js           # 任务管理（提交/查询）
│   │   ├── uploads.js         # 文件上传
│   │   ├── works.js           # 作品管理
│   │   └── api-keys.js        # API Key 管理
│   ├── db.js                  # 数据库封装（sql.js 适配层）
│   ├── models-data.js         # 模型数据配置
│   ├── init-db.js             # 数据库初始化脚本
│   ├── server.js              # 服务器入口
│   ├── .env
│   └── package.json
│
└── README.md
```

## API 接口文档

### 认证相关
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | /api/register | 用户注册 | 否 |
| POST | /api/login | 用户登录 | 否 |
| GET | /api/me | 获取当前用户信息 | 是 |
| PUT | /api/profile | 更新个人资料 | 是 |
| PUT | /api/notifications | 更新通知偏好 | 是 |
| PUT | /api/password | 修改密码 | 是 |

### 积分相关
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/credits/balance | 获取积分余额 | 是 |
| GET | /api/credits/logs | 获取积分流水 | 是 |
| POST | /api/credits/recharge | 充值（模拟） | 是 |

### 创作相关
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/models | 获取模型列表 | 否 |
| POST | /api/tasks | 提交生成任务 | 是 |
| GET | /api/tasks | 查询任务列表 | 是 |
| GET | /api/tasks/:id | 查询单个任务 | 是 |
| POST | /api/uploads | 上传参考素材 | 否 |

### 作品相关
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/works | 获取作品广场 | 否 |
| GET | /api/works/mine | 获取我的作品 | 是 |
| POST | /api/works | 上传作品 | 是 |

### API Key 相关
| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | /api/api-keys | 获取 API Key 列表 | 是 |
| POST | /api/api-keys | 创建 API Key | 是 |
| PUT | /api/api-keys/:id/disable | 停用 API Key | 是 |
| DELETE | /api/api-keys/:id | 删除 API Key | 是 |

### 认证方式
在请求头中携带：
```
Authorization: Bearer <你的token>
```

### 错误码
- `400` 参数错误
- `401` 未登录或 token 过期
- `409` 积分余额不足
- `413` 文件超过 9MB
- `500` 服务器内部错误

## 数据库表结构

### users（用户表）
- id, email, password_hash, nickname, avatar, credits
- watermark_enabled, notify_system, notify_task, notify_marketing
- created_at

### credit_logs（积分流水表）
- id, user_id, amount, type, description, created_at

### tasks（任务表）
- id, user_id, type, model, prompt, params
- status, progress, media_url, credits_charged, error
- created_at, completed_at

### works（作品表）
- id, user_id, task_id, type, media_url, prompt
- is_public, status, created_at

### api_keys（API Key 表）
- id, user_id, api_key, name, status, created_at

## 接入真实 AI 模型

当前版本使用模拟生成（提交后 6 秒返回占位图）。如需接入真实 AI API：

1. 编辑 `server/routes/tasks.js` 中的 `generateMockResult()` 函数
2. 替换为真实的 AI API 调用（如 OpenAI、字节豆包、Midjourney 等）
3. 在任务状态更新逻辑中，将模拟的 setTimeout 替换为真实的异步任务处理
4. 建议使用任务队列（如 Bull）处理长时间运行的生成任务

## 生产部署建议

1. **数据库**：将 sql.js 替换为 PostgreSQL 或 MySQL，支持并发写入
2. **文件存储**：将上传文件存储到对象存储（如阿里云 OSS、AWS S3）
3. **支付**：接入支付宝/微信支付真实商户号
4. **AI 代理**：实现真实的 AI 模型 API 代理层，支持多家厂商
5. **任务队列**：使用 Redis + Bull 处理异步生成任务
6. **HTTPS**：配置 SSL 证书
7. **进程管理**：使用 PM2 管理 Node.js 进程
8. **反向代理**：使用 Nginx 反向代理前端和后端

## 许可证

MIT
