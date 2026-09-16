const { Router } = require('express')
const { db } = require('../db.js')
const { authRequired, optionalAuth } = require('../middleware/auth.js')

const router = Router()

// 作品广场（公开）
router.get('/works', optionalAuth, (req, res) => {
  const { type, page = 1, limit = 20 } = req.query
  let sql = "SELECT w.*, u.nickname, u.avatar FROM works w LEFT JOIN users u ON w.user_id = u.id WHERE w.is_public = 1 AND w.status = 'approved'"
  const params = []

  if (type && type !== 'all') {
    sql += ' AND w.type = ?'
    params.push(type)
  }

  sql += ' ORDER BY w.id DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const works = db.prepare(sql).all(...params)
  const total = db.prepare("SELECT COUNT(*) as count FROM works WHERE is_public = 1 AND status = 'approved'").get().count

  res.json({ works, total })
})

// 我的作品
router.get('/works/mine', authRequired, (req, res) => {
  const works = db
    .prepare('SELECT * FROM works WHERE user_id = ? ORDER BY id DESC LIMIT 100')
    .all(req.user.id)
  res.json({ works })
})

// 上传作品到广场
router.post('/works', authRequired, (req, res) => {
  const { type, media_url, prompt, is_public } = req.body
  if (!type || !media_url) {
    return res.status(400).json({ error: 'type 和 media_url 为必填' })
  }

  const result = db
    .prepare('INSERT INTO works (user_id, type, media_url, prompt, is_public) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, type, media_url, prompt || '', is_public !== false ? 1 : 0)

  res.json({ id: result.lastInsertRowid, success: true })
})

module.exports = router
