const router = require('express').Router()
const auth = require('../middleware/auth')
const Message = require('../models/Message')

// GET /api/message/list
router.get('/list', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const data = await Message.find({ toOpenid: req.user.openid }).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/message/unread-count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({ toOpenid: req.user.openid, read: false })
    res.json({ code: 0, count })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// PUT /api/message/:id/read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const result = await Message.updateOne(
      { _id: req.params.id, toOpenid: req.user.openid },
      { $set: { read: true } }
    )
    if (result.matchedCount === 0) return res.json({ code: -1, msg: '消息不存在或无权操作' })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// PUT /api/message/read-all
router.put('/read-all', auth, async (req, res) => {
  try {
    await Message.updateMany({ toOpenid: req.user.openid, read: false }, { $set: { read: true } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/message
router.post('/', auth, async (req, res) => {
  try {
    const { toOpenid, type, title, content, targetId, targetType } = req.body
    if (!toOpenid || !type) return res.json({ code: -1, msg: 'missing fields' })
    if (toOpenid === req.user.openid) return res.json({ code: 0, msg: 'skip self' })
    const sender = await require('../models/User').findOne({ openid: req.user.openid })
    const fromName = sender ? (sender.name || '用户') : '用户'
    const validTypes = ['order_accept', 'order_status', 'order_cancel', 'comment', 'reply', 'system']
    if (!validTypes.includes(type)) return res.json({ code: -1, msg: '无效的消息类型' })
    await Message.create({
      toOpenid, fromOpenid: req.user.openid, fromName,
      type, title: (title || '').slice(0, 100), content: (content || '').slice(0, 500),
      targetId: targetId || '', targetType: targetType || '',
      read: false, createTime: new Date()
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// DELETE /api/message/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Message.deleteOne({ _id: req.params.id, toOpenid: req.user.openid })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// DELETE /api/message/all
router.delete('/all', auth, async (req, res) => {
  try {
    await Message.deleteMany({ toOpenid: req.user.openid })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
