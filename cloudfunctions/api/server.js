import 'dotenv/config'
import { createApp } from './app.js'

const PORT = process.env.PORT || 3000

async function start() {
  const app = await createApp()
  app.listen(PORT, () => {
    console.log(`则灵 AI 服务器已启动: http://localhost:${PORT}`)
    console.log(`健康检查: http://localhost:${PORT}/api/health`)
  })
}

start()
