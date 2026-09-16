const { Router } = require('express')
const { getAllModels } = require('../models-data.js')

const router = Router()

// 获取模型列表（公开端点）
router.get('/models', (req, res) => {
  res.json(getAllModels())
})

module.exports = router
