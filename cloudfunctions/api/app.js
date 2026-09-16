const express = require('express')
const cors = require('cors')
const path = require('node:path')
const fs = require('node:fs')

const authRoutes = require('./routes/auth.js')
const creditRoutes = require('./routes/credits.js')
const modelRoutes = require('./routes/models.js')
const taskRoutes = require('./routes/tasks.js')
const uploadRoutes = require('./routes/uploads.js')
const workRoutes = require('./routes/works.js')
const apiKeyRoutes = require('./routes/api-keys.js')
const { initDb } = require('./db.js')

// 上传目录：云函数用 /tmp，本地用 ./uploads
const uploadDir = process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.TENCENTCLOUD_REGION
  ? '/tmp/uploads'
  : path.join(__dirname, 'uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

async function createApp() {
  await initDb()

  const app = express()

  // CORS 配置
  const corsOptions = process.env.CORS_ORIGIN
    ? { origin: process.env.CORS_ORIGIN.split(','), credentials: true }
    : {}
  app.use(cors(corsOptions))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // 静态文件：上传的素材
  app.use('/files', express.static(uploadDir))

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

  return app
}

module.exports = createApp
module.exports.createApp = createApp
