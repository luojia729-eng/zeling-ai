const { Router } = require('express')
const { nanoid } = require('nanoid')
const { db } = require('../db.js')
const { authRequired } = require('../middleware/auth.js')
const { findModel } = require('../models-data.js')

const router = Router()

// 计算任务费用
function calculateCost(model, params) {
  if (model.type === 'image') {
    if (model.resolution_prices && params.resolution) {
      return model.resolution_prices[params.resolution] || Object.values(model.resolution_prices)[0]
    }
    return model.price || 2
  }
  if (model.type === 'video') {
    return model.price || 12
  }
  if (model.type === 'videoPerSec') {
    const perSec = model.resolution_prices
      ? (model.resolution_prices[params.resolution] || model.price || 2)
      : (model.price || 2)
    return perSec * 1.05 * (params.duration || 5)
  }
  return 2
}

// 模拟生成结果（占位图，后续可接入真实 AI API）
function generateMockResult(task) {
  const model = findModel(task.model)
  if (task.type === 'image') {
    // 使用 picsum 占位图
    const seed = encodeURIComponent(task.id)
    return `https://picsum.photos/seed/${seed}/1024/1024`
  }
  // 视频用一个示例视频
  return 'https://www.w3schools.com/html/mov_bbb.mp4'
}

// 提交任务
router.post('/tasks', authRequired, (req, res) => {
  const { type, model: modelId, prompt, aspect_ratio, resolution, duration, image_refs, count } = req.body

  if (!type || !modelId || !prompt) {
    return res.status(400).json({ error: 'type、model、prompt 为必填项' })
  }

  const model = findModel(modelId)
  if (!model) {
    return res.status(400).json({ error: '模型不存在' })
  }

  const params = {
    aspectRatio: aspect_ratio || model.aspect_ratios[0],
    resolution: resolution || (model.resolutions[0] || ''),
    duration: duration || (model.durations ? model.durations[0] : null),
    imageRefs: image_refs || []
  }

  const cost = calculateCost(model, params)
  const taskCount = count || 1

  // 检查积分
  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id)
  const totalCost = cost * taskCount
  if (user.credits < totalCost) {
    return res.status(409).json({ error: '积分余额不足，请先充值' })
  }

  const tasks = []
  for (let i = 0; i < taskCount; i++) {
    const taskId = nanoid(12)
    db.prepare(
      `INSERT INTO tasks (id, user_id, type, model, prompt, params, status, credits_charged)
       VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)`
    ).run(taskId, req.user.id, type, modelId, prompt, JSON.stringify(params), cost)

    // 扣积分
    db.prepare('UPDATE users SET credits = credits - ? WHERE id = ?').run(cost, req.user.id)
    db.prepare(
      'INSERT INTO credit_logs (user_id, amount, type, description) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, -cost, 'consume', `${model.name} 生成消耗`)

    tasks.push({ id: taskId, status: 'queued', cost })
  }

  // 启动模拟生成（异步）
  tasks.forEach(t => {
    simulateTask(t.id)
  })

  res.json({ tasks, refunded: 0, error: null })
})

// 模拟任务生成过程
function simulateTask(taskId) {
  const updateStatus = (status, progress) => {
    db.prepare('UPDATE tasks SET status = ?, progress = ? WHERE id = ?').run(status, progress, taskId)
  }

  // queued -> in_progress (1秒后)
  setTimeout(() => updateStatus('in_progress', 10), 1000)
  setTimeout(() => updateStatus('in_progress', 30), 2000)
  setTimeout(() => updateStatus('in_progress', 50), 3000)
  setTimeout(() => updateStatus('in_progress', 70), 4000)
  setTimeout(() => updateStatus('in_progress', 90), 5000)

  // completed (6秒后)
  setTimeout(() => {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId)
    if (!task) return
    const mediaUrl = generateMockResult(task)
    db.prepare(
      "UPDATE tasks SET status = 'completed', progress = 100, media_url = ?, completed_at = datetime('now','localtime') WHERE id = ?"
    ).run(mediaUrl, taskId)

    // 自动加入作品广场
    db.prepare(
      'INSERT INTO works (user_id, task_id, type, media_url, prompt, is_public) VALUES (?, ?, ?, ?, ?, 1)'
    ).run(task.user_id, taskId, task.type, mediaUrl, task.prompt)
  }, 6000)
}

// 查询任务列表
router.get('/tasks', authRequired, (req, res) => {
  const { type, status } = req.query
  let sql = 'SELECT * FROM tasks WHERE user_id = ?'
  const params = [req.user.id]

  if (type) {
    sql += ' AND type = ?'
    params.push(type)
  }
  if (status) {
    if (status === 'generating') {
      sql += " AND status IN ('queued', 'in_progress')"
    } else {
      sql += ' AND status = ?'
      params.push(status)
    }
  }

  sql += ' ORDER BY id DESC LIMIT 100'
  const tasks = db.prepare(sql).all(...params).map(t => ({
    ...t,
    params: JSON.parse(t.params)
  }))

  res.json({ tasks })
})

// 查询单个任务
router.get('/tasks/:id', authRequired, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!task) {
    return res.status(404).json({ error: '任务不存在' })
  }
  res.json({ ...task, params: JSON.parse(task.params) })
})

module.exports = router
