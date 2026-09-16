import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'zeling-ai-secret-key-2026'

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, nickname: user.nickname },
    JWT_SECRET,
    { expiresIn: '30d' }
  )
}

export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: '未登录，请先登录' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET)
    } catch (err) {
      // 忽略无效 token
    }
  }
  next()
}
