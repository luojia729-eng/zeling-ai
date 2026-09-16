import { Router } from 'express'
import { getAllModels } from '../models-data.js'

const router = Router()

// 获取模型列表（公开端点）
router.get('/models', (req, res) => {
  res.json(getAllModels())
})

export default router
