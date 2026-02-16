const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const auth = require('../middleware/auth')
const qiniuService = require('../services/qiniu')

const upload = multer({ dest: path.join(__dirname, '../uploads/') })

/**
 * POST /api/upload/image
 * 单张图片上传
 * query: folder (avatars | images | team-photos)
 */
router.post('/image', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ code: -1, msg: '未选择文件' })
    }
    const folder = req.query.folder || 'images'
    const ext = path.extname(req.file.originalname) || '.jpg'
    const key = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`

    const result = await qiniuService.uploadFile(req.file.path, key)
    // Clean up temp file
    fs.unlink(req.file.path, () => {})

    res.json({ code: 0, data: { url: result.url, key: result.key } })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ code: -1, msg: '文件上传失败' })
  }
})

/**
 * POST /api/upload/images
 * 批量图片上传（最多9张）
 * query: folder
 */
router.post('/images', auth, upload.array('files', 9), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ code: -1, msg: '未选择文件' })
    }
    const folder = req.query.folder || 'images'
    const results = []

    for (const file of req.files) {
      const ext = path.extname(file.originalname) || '.jpg'
      const key = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`
      const result = await qiniuService.uploadFile(file.path, key)
      fs.unlink(file.path, () => {})
      results.push({ url: result.url, key: result.key })
    }

    res.json({ code: 0, data: { urls: results.map(r => r.url), keys: results.map(r => r.key) } })
  } catch (err) {
    console.error('Batch upload error:', err)
    res.status(500).json({ code: -1, msg: '文件上传失败' })
  }
})

module.exports = router
