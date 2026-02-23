const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const auth = require('../middleware/auth')

const uploadDir = path.join(__dirname, '../uploads/')
const upload = multer({ dest: uploadDir })

function moveFile(file, folder) {
  const ext = path.extname(file.originalname) || '.jpg'
  const fname = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext
  const destDir = path.join(uploadDir, folder)
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
  fs.renameSync(file.path, path.join(destDir, fname))
  return '/uploads/' + folder + '/' + fname
}

router.post('/image', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.json({ code: -1, msg: '未选择文件' })
    const folder = req.query.folder || 'images'
    const url = moveFile(req.file, folder)
    res.json({ code: 0, data: { url, key: url } })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ code: -1, msg: '文件上传失败' })
  }
})

router.post('/images', auth, upload.array('files', 9), (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.json({ code: -1, msg: '未选择文件' })
    const folder = req.query.folder || 'images'
    const urls = req.files.map(f => moveFile(f, folder))
    res.json({ code: 0, data: { urls, keys: urls } })
  } catch (err) {
    console.error('Batch upload error:', err)
    res.status(500).json({ code: -1, msg: '文件上传失败' })
  }
})

module.exports = router
