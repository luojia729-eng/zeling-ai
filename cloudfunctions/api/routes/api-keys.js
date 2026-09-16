const { Router } = require('express')
const { nanoid } = require('nanoid')
const { db } = require('../db.js')
const { authRequired } = require('../middleware/auth.js')

const router = Router()

// 获取我的 API Key 列表
router.get('/api-keys', authRequired, (req, res) => {
  const keys = db
    .prepare('SELECT id, name, api_key, status, created_at FROM api_keys WHERE user_id = ? ORDER BY id DESC')
    .all(req.user.id)
  res.json({ keys })
})

// 创建 API Key
router.post('/api-keys', authRequired, (req, res) => {
  const { name } = req.body
  const apiKey = `zk-${nanoid(32)}`

  const result = db
    .prepare('INSERT INTO api_keys (user_id, api_key, name) VALUES (?, ?, ?)')
    .run(req.user.id, apiKey, name || '默认密钥')

  res.json({
    id: result.lastInsertRowid,
    api_key: apiKey,
    name: name || '默认密钥',
    status: 'active'
  })
})

// 停用 API Key
router.put('/api-keys/:id/disable', authRequired, (req, res) => {
  db.prepare("UPDATE api_keys SET status = 'disabled' WHERE id = ? AND user_id = ?").run(
    req.params.id,
    req.user.id
  )
  res.json({ success: true })
})

// 删除 API Key
router.delete('/api-keys/:id', authRequired, (req, res) => {
  db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ success: true })
})

module.exports = router
