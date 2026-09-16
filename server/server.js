import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import authRoutes from './routes/auth.js'
import creditRoutes from './routes/credits.js'
import modelRoutes from './routes/models.js'
import taskRoutes from './routes/tasks.js'
import uploadRoutes from './routes/uploads.js'
import workRoutes from './routes/works.js'
import apiKeyRoutes from './routes/api-keys.js'
import { initDb } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

// CORS 配置：生产环境通过 CORS_ORIGIN 环境变量限制前端域名
const corsOptions = process.env.CORS_ORIGIN
  ? { origin: process.env.CORS_ORIGIN.split(','), credentials: true }
  : {}
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 静态文件：上传的素材
app.use('/files', express.static(join(__dirname, 'uploads')))

// API 路由
app.use('/api', authRoutes)
app.use('/api/credits', creditRoutes)
app.use('/api', modelRoutes)
app.use('/api', taskRoutes)
app.use('/api', uploadRoutes)
app.use('/api', workRoutes)
app.use('/api', apiKeyRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'zeling-ai-server', time: new Date().toISOString() })
})

// 404
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: '文件超过 9MB 上限' })
  }
  res.status(500).json({ error: '服务器内部错误' })
})

// 启动服务器（先初始化数据库）
async function start() {
  await initDb()
  app.listen(PORT, () => {
    console.log(`则灵 AI 服务器已启动: http://localhost:${PORT}`)
    console.log(`健康检查: http://localhost:${PORT}/api/health`)
  })
}

start()
