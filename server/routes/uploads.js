import { Router } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const uploadDir = join(__dirname, '..', 'uploads')

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

export default router
