const { Router } = require('express')
const multer = require('multer')
const { nanoid } = require('nanoid')
const { fileURLToPath } = require('node:url')
const { dirname, join, extname } = require('node:path')

// __dirname is available in CommonJS
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production'
const uploadDir = isVercel ? '/tmp/uploads' : join(__dirname, '..', 'uploads')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = extname(file.originalname) || '.png'
    cb(null, `${nanoid(10)}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 9 * 1024 * 1024 } // 9MB
})

const router = Router()

// 上传参考素材
router.post('/uploads', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传文件' })
  }
  const url = `/files/${req.file.filename}`
  res.json({ url })
})

module.exports = router
