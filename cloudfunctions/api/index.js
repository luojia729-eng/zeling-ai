// CommonJS 入口，兼容微信云函数
const serverless = require('serverless-http')
const { createApp } = require('./app.js')
const { waitForUpload } = require('./db.js')

let appPromise = null

async function getApp() {
  if (!appPromise) {
    const app = await createApp()
    appPromise = serverless(app)
  }
  return appPromise
}

exports.main = async (event, context) => {
  const handler = await getApp()
  const result = await handler(event, context)
  // 等待数据库同步到云存储后再返回
  await waitForUpload()
  return result
}
