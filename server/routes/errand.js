const router = require('express').Router()
const auth = require('../middleware/auth')
const ErrandTask = require('../models/ErrandTask')
const User = require('../models/User')
const Message = require('../models/Message')
const UserWallet = require('../models/UserWallet')
const WalletRecord = require('../models/WalletRecord')

// 订单完成时更新骑手钱包
async function creditRiderWallet(riderId, amount, orderId, orderType) {
  if (!riderId || !amount || amount <= 0) return
  await UserWallet.updateOne(
    { openid: riderId },
    { $inc: { balance: amount, totalIncome: amount }, $set: { updateTime: new Date() } },
    { upsert: true }
  )
  await WalletRecord.create({
    openid: riderId, type: 'income', amount, title: orderType === 'express' ? '快递代拿收入' : '跑腿任务收入',
    orderId: orderId || '', orderType: orderType || '', status: 1, statusText: '已到账', createTime: new Date()
  })
}

// GET /api/errand/list
router.get('/list', async (req, res) => {
  try {
    const { status, page = 1, pageSize = 10 } = req.query
    const where = { reviewStatus: { $in: ['approved', undefined] } }
    if (status !== undefined && status !== '-1') where.status = Number(status)
    const total = await ErrandTask.countDocuments(where)
    const data = await ErrandTask.find(where).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/errand/reportLocation — 骑手上报位置
router.post('/reportLocation', auth, async (req, res) => {
  try {
    const { taskId, latitude, longitude } = req.body
    if (!taskId || !latitude || !longitude) return res.json({ code: -1, msg: '参数不完整' })
    const task = await ErrandTask.findById(taskId)
    if (!task) return res.json({ code: -1, msg: '任务不存在' })
    if (task.riderId !== req.user.openid) return res.json({ code: -1, msg: '仅接单人可上报位置' })
    await ErrandTask.updateOne({ _id: taskId }, {
      $set: { riderLat: latitude, riderLng: longitude, riderLocationTime: new Date() }
    })
    res.json({ code: 0 })
  } catch (err) {
    console.error('reportLocation error:', err)
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/errand/getRiderLocation — 发布者查询骑手位置
router.post('/getRiderLocation', auth, async (req, res) => {
  try {
    const { taskId } = req.body
    if (!taskId) return res.json({ code: -1, msg: '参数不完整' })
    const task = await ErrandTask.findById(taskId)
    if (!task) return res.json({ code: -1, msg: '任务不存在' })
    res.json({
      code: 0,
      data: {
        riderLat: task.riderLat || 0,
        riderLng: task.riderLng || 0,
        riderLocationTime: task.riderLocationTime || null
      }
    })
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
        // 更新骑手钱包
        const earnAmount = (detailData.price || 0) + (detailData.tip || 0)
        await creditRiderWallet(detailData.riderId, earnAmount, req.params.id, 'errand')
        detailData.status = 2; detailData.statusText = '已完成'; detailData.autoConfirmed = true
      }
    }
    if (detailData.riderId) {
      const riderUser = await User.findOne({ openid: detailData.riderId })
      if (riderUser) { detailData.riderName = riderUser.name || '接单人'; detailData.riderPhone = riderUser.phone || '' }
    }
    // 兼容老数据: contact -> phone
    if (!detailData.phone && detailData.contact) detailData.phone = detailData.contact
    res.json({ code: 0, data: detailData })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/errand
router.post('/', auth, async (req, res) => {
  try {
    const { title, desc, fromAddr, toAddr, price, tip, phone, payType } = req.body
    if (!title || !title.trim()) return res.json({ code: -1, msg: '请填写任务标题' })
    if (!desc || !desc.trim()) return res.json({ code: -1, msg: '请填写任务描述' })
    if (title.length > 50) return res.json({ code: -1, msg: '标题过长，最多50字' })
    if (desc.length > 500) return res.json({ code: -1, msg: '描述过长，最多500字' })
    if (price !== undefined && (isNaN(price) || price <= 0 || price > 999)) return res.json({ code: -1, msg: '价格不合法' })
    if (tip !== undefined && (isNaN(tip) || tip < 0 || tip > 100)) return res.json({ code: -1, msg: '加急费金额不合法' })
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) return res.json({ code: -1, msg: '手机号格式不正确' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'

    const outTradeNo = 'errand_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    const totalPrice = (price || 5) + (tip || 0)

    // 钱包支付
    if (payType === 'wallet') {
      let wallet = await UserWallet.findOne({ openid: req.user.openid })
      if (!wallet) wallet = await UserWallet.create({ openid: req.user.openid, balance: 0, totalIncome: 0 })
      if (wallet.balance < totalPrice) return res.json({ code: -1, msg: '钱包余额不足，需要 ¥' + totalPrice })
      await UserWallet.updateOne({ openid: req.user.openid }, { $inc: { balance: -totalPrice }, $set: { updateTime: new Date() } })
      await WalletRecord.create({
        openid: req.user.openid, type: 'income', amount: -totalPrice,
        title: '跑腿任务订单支付', orderId: '', orderType: 'errand_pay',
        status: 1, statusText: '已扣款', createTime: new Date()
      })
      const task = await ErrandTask.create({
        openid: req.user.openid, title, desc, fromAddr: fromAddr || '', toAddr: toAddr || '',
        price: price || 5, tip: tip || 0, contact: phone || '', publisher: userName,
        status: 0, statusText: '待接单', statusColor: '#DD6B20', createTime: new Date(),
        outTradeNo, payType: 'wallet', reviewStatus: 'pending'
      })
      return res.json({ code: 0, id: task._id, walletPaid: true })
    }

    // 微信支付
    const task = await ErrandTask.create({
      openid: req.user.openid, title, desc, fromAddr: fromAddr || '', toAddr: toAddr || '',
      price: price || 5, tip: tip || 0, contact: phone || '', publisher: userName,
      status: -1, statusText: '待支付', statusColor: '#A0AEC0', createTime: new Date(),
      outTradeNo, reviewStatus: 'pending'
    })

    const { createJSAPIOrder } = require('../services/wxpay')
    const payment = await createJSAPIOrder(
      req.user.openid,
      outTradeNo,
      Math.round(totalPrice * 100),
      '万能跑腿服务'
    )

    res.json({ code: 0, id: task._id, payment })
  } catch (err) {
    console.error('errand post error:', err)
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
    const task = await ErrandTask.findById(req.params.id)
    if (!task) return res.json({ code: -1, msg: '记录不存在' })
    if (task.openid !== req.user.openid && task.riderId !== req.user.openid) {
      return res.json({ code: -1, msg: '无权操作该任务' })
    }
    const validStatuses = [0, 1, 2, 3, 4]
    if (!validStatuses.includes(Number(status))) return res.json({ code: -1, msg: '无效的状态值' })
    const statusMap = {
      0: { text: '待接单', color: '#DD6B20' }, 1: { text: '进行中', color: '#38A169' },
      2: { text: '已完成', color: '#A0AEC0' }, 3: { text: '已取消', color: '#E53E3E' },
      4: { text: '待确认', color: '#2B6CB0' }
    }
    const s = statusMap[status] || statusMap[0]
    const updateData = { status: Number(status), statusText: s.text, statusColor: s.color }
    if (Number(status) === 4) updateData.submitTime = new Date()
    if (Number(status) === 2) {
      updateData.completeTime = new Date()
      // 更新骑手钱包
      const earnAmount = (task.price || 0) + (task.tip || 0)
      await creditRiderWallet(task.riderId, earnAmount, req.params.id, 'errand')
    }
    await ErrandTask.updateOne({ _id: req.params.id }, { $set: updateData })
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

    // 执行退款 (如果之前已经支付)
    if (task.status >= 0 && task.outTradeNo && task.openid === req.user.openid) {
      const { refundOrder } = require('../services/wxpay')
      try {
        const outRefundNo = 'ref_' + task.outTradeNo + '_' + Date.now()
        const totalAmount = Math.round(((task.price || 0) + (task.tip || 0)) * 100)
        await refundOrder(task.outTradeNo, outRefundNo, totalAmount, totalAmount)
        console.log(`[wxpay refund] 退款成功: ${task.outTradeNo}`)
      } catch (refundErr) {
        console.error(`[wxpay refund] 退款失败: ${task.outTradeNo}`, refundErr.message)
      }
    }
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
    const task = await ErrandTask.findById(req.params.id)
    if (!task) return res.json({ code: -1, msg: '记录不存在' })
    if (task.riderId !== req.user.openid) return res.json({ code: -1, msg: '仅接单骑手可上传照片' })
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

