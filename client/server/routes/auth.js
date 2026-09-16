import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { signToken, authRequired } from '../middleware/auth.js'

const router = Router()

// 注册
router.post('/register', (req, res) => {
  const { email, password, nickname } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' })
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  if (existing) {
    return res.status(400).json({ error: '该邮箱已注册' })
  }

  const hash = bcrypt.hashSync(password, 10)
  const name = nickname || email.split('@')[0]

  const result = db
    .prepare('INSERT INTO users (email, password_hash, nickname, credits) VALUES (?, ?, ?, ?)')
    .run(email, hash, name, 100) // 新用户赠送 100 积分

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid)

  // 记录积分流水
  db.prepare(
    'INSERT INTO credit_logs (user_id, amount, type, description) VALUES (?, ?, ?, ?)'
  ).run(user.id, 100, 'bonus', '新用户注册赠送')

  const token = signToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      credits: user.credits
    }
  })
})

// 登录
router.post('/login', (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
  if (!user) {
    return res.status(400).json({ error: '邮箱或密码错误' })
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return res.status(400).json({ error: '邮箱或密码错误' })
  }

  const token = signToken(user)
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      credits: user.credits
    }
  })
})

// 获取当前用户信息
router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }
  res.json({
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    credits: user.credits,
    watermark_enabled: user.watermark_enabled,
    notify_system: user.notify_system,
    notify_task: user.notify_task,
    notify_marketing: user.notify_marketing,
    created_at: user.created_at
  })
})

// 更新个人资料
router.put('/profile', authRequired, (req, res) => {
  const { nickname, avatar, watermark_enabled } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ error: '用户不存在' })

  db.prepare(
    'UPDATE users SET nickname = ?, avatar = ?, watermark_enabled = ? WHERE id = ?'
  ).run(
    nickname || user.nickname,
    avatar !== undefined ? avatar : user.avatar,
    watermark_enabled !== undefined ? (watermark_enabled ? 1 : 0) : user.watermark_enabled,
    req.user.id
  )

  res.json({ success: true })
})

// 更新通知偏好
router.put('/notifications', authRequired, (req, res) => {
  const { notify_system, notify_task, notify_marketing } = req.body
  db.prepare(
    'UPDATE users SET notify_system = ?, notify_task = ?, notify_marketing = ? WHERE id = ?'
  ).run(
    notify_system ? 1 : 0,
    notify_task ? 1 : 0,
    notify_marketing ? 1 : 0,
    req.user.id
  )
  res.json({ success: true })
})

// 修改密码
router.put('/password', authRequired, (req, res) => {
  const { old_password, new_password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)

  if (!bcrypt.compareSync(old_password, user.password_hash)) {
    return res.status(400).json({ error: '原密码错误' })
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: '新密码至少 6 位' })
  }

  const hash = bcrypt.hashSync(new_password, 10)
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.user.id)
  res.json({ success: true })
})

export default router
