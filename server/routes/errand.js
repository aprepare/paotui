const router = require('express').Router()
const auth = require('../middleware/auth')
const ErrandTask = require('../models/ErrandTask')
const User = require('../models/User')
const Message = require('../models/Message')

// GET /api/errand/list
router.get('/list', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const where = {}
    if (status !== undefined && status !== '-1') where.status = Number(status)
    const total = await ErrandTask.countDocuments(where)
    const data = await ErrandTask.find(where).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/errand/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await ErrandTask.findById(req.params.id)
    if (!task) return res.json({ code: -1, msg: '记录不存在' })
    const detailData = task.toObject()
    // 24小时自动确认
    if (detailData.status === 4 && detailData.submitTime) {
      const submitTs = new Date(detailData.submitTime).getTime()
      if (Date.now() - submitTs >= 24 * 60 * 60 * 1000) {
        await ErrandTask.updateOne({ _id: req.params.id }, {
          $set: { status: 2, statusText: '已完成', statusColor: '#A0AEC0', completeTime: new Date(), autoConfirmed: true }
        })
        detailData.status = 2; detailData.statusText = '已完成'; detailData.autoConfirmed = true
      }
    }
    if (detailData.riderId) {
      const riderUser = await User.findOne({ openid: detailData.riderId })
      if (riderUser) { detailData.riderName = riderUser.name || '接单人'; detailData.riderPhone = riderUser.phone || '' }
    }
    res.json({ code: 0, data: detailData })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/errand
router.post('/', auth, async (req, res) => {
  try {
    const { title, desc, fromAddr, toAddr, price, tip, phone } = req.body
    if (!title || !desc) return res.json({ code: -1, msg: 'missing fields' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    const task = await ErrandTask.create({
      openid: req.user.openid, title, desc, fromAddr: fromAddr || '', toAddr: toAddr || '',
      price: price || 5, tip: tip || 0, contact: phone || '', publisher: userName,
      status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date()
    })
    res.json({ code: 0, id: task._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/errand/:id/accept
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const task = await ErrandTask.findById(req.params.id)
    if (!task) return res.json({ code: -1, msg: '记录不存在' })
    if (task.status !== 0) return res.json({ code: -1, msg: '任务已被接' })
    if (task.openid === req.user.openid) return res.json({ code: -1, msg: '不能接自己发布的单' })
    const acceptUser = await User.findOne({ openid: req.user.openid })
    const acceptName = acceptUser ? acceptUser.name || '骑手' : '骑手'
    await ErrandTask.updateOne({ _id: req.params.id }, {
      $set: { status: 1, statusText: '进行中', statusColor: '#38A169', riderId: req.user.openid, acceptTime: new Date() }
    })
    if (task.openid !== req.user.openid) {
      await Message.create({
        toOpenid: task.openid, fromOpenid: req.user.openid, fromName: acceptName,
        type: 'order_accept', title: '跑腿任务已被接',
        content: acceptName + ' 已接您的跑腿任务: ' + (task.title || ''),
        targetId: req.params.id, targetType: 'errand', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// PUT /api/errand/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    const statusMap = {
      0: { text: '待接单', color: '#DD6B20' }, 1: { text: '进行中', color: '#38A169' },
      2: { text: '已完成', color: '#A0AEC0' }, 3: { text: '已取消', color: '#E53E3E' },
      4: { text: '待确认', color: '#2B6CB0' }
    }
    const s = statusMap[status] || statusMap[0]
    const updateData = { status, statusText: s.text, statusColor: s.color }
    if (status === 4) updateData.submitTime = new Date()
    if (status === 2) updateData.completeTime = new Date()
    await ErrandTask.updateOne({ _id: req.params.id }, { $set: updateData })
    const task = await ErrandTask.findById(req.params.id)
    const statusUser = await User.findOne({ openid: req.user.openid })
    const statusName = statusUser ? statusUser.name || '用户' : '用户'
    const notifyTarget = task.openid === req.user.openid ? task.riderId : task.openid
    if (notifyTarget && notifyTarget !== req.user.openid) {
      await Message.create({
        toOpenid: notifyTarget, fromOpenid: req.user.openid, fromName: statusName,
        type: 'order_status', title: '跑腿任务状态更新', content: '跑腿任务状态已更新为: ' + s.text,
        targetId: req.params.id, targetType: 'errand', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/errand/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const task = await ErrandTask.findById(req.params.id)
    if (!task) return res.json({ code: -1, msg: '记录不存在' })
    if (task.status === 1 && task.openid === req.user.openid) return res.json({ code: -1, msg: '接单人正在执行任务，无法取消' })
    if (task.openid !== req.user.openid && task.riderId !== req.user.openid) return res.json({ code: -1, msg: '无权取消该任务' })
    await ErrandTask.updateOne({ _id: req.params.id }, { $set: { status: 3, statusText: '已取消', statusColor: '#E53E3E' } })
    if (task.riderId && task.riderId !== req.user.openid) {
      const cancelUser = await User.findOne({ openid: req.user.openid })
      const cancelName = cancelUser ? cancelUser.name || '用户' : '用户'
      await Message.create({
        toOpenid: task.riderId, fromOpenid: req.user.openid, fromName: cancelName,
        type: 'order_cancel', title: '跑腿任务已取消', content: cancelName + ' 取消了跑腿任务: ' + (task.title || ''),
        targetId: req.params.id, targetType: 'errand', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/errand/:id/photo
router.post('/:id/photo', auth, async (req, res) => {
  try {
    const { type, fileID } = req.body
    if (!type || !fileID) return res.json({ code: -1, msg: 'missing fields' })
    const updateData = {}
    if (type === 'pickup') { updateData.pickupPhoto = fileID; updateData.pickupPhotoTime = new Date() }
    else if (type === 'deliver') { updateData.deliverPhoto = fileID; updateData.deliverPhotoTime = new Date() }
    await ErrandTask.updateOne({ _id: req.params.id }, { $set: updateData })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
