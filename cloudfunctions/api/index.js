// CommonJS 入口，兼容微信云函数
const serverless = require('serverless-http')
const { createApp } = require('./app.js')

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
  return handler(event, context)
}
