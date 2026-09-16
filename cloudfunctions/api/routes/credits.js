const { Router } = require('express')
const { db } = require('../db.js')
const { authRequired } = require('../middleware/auth.js')

const router = Router()

// 获取积分余额
router.get('/balance', authRequired, (req, res) => {
  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id)
  res.json({ balance: user.credits })
})

// 积分流水
router.get('/logs', authRequired, (req, res) => {
  const logs = db
    .prepare('SELECT * FROM credit_logs WHERE user_id = ? ORDER BY id DESC LIMIT 100')
    .all(req.user.id)
  res.json({ logs })
})

// 充值（模拟，实际应接支付宝）
router.post('/recharge', authRequired, (req, res) => {
  const { amount } = req.body // 金额（元）
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: '充值金额无效' })
  }

  const credits = amount * 10 // 1 元 = 10 积分
  const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(req.user.id)

  db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(credits, req.user.id)
  db.prepare(
    'INSERT INTO credit_logs (user_id, amount, type, description) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, credits, 'recharge', `充值 ¥${amount}`)

  res.json({ success: true, credits_added: credits, new_balance: user.credits + credits })
})

module.exports = router
