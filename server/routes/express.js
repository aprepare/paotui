const router = require('express').Router()
const auth = require('../middleware/auth')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const User = require('../models/User')
const Message = require('../models/Message')
const Stat = require('../models/Stat')
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

// GET /api/express/list
router.get('/list', async (req, res) => {
  try {
    const { status, building, page = 1, pageSize = 10 } = req.query
    const where = { reviewStatus: { $in: ['approved', undefined] } }
    if (status !== undefined && status !== '-1') where.status = Number(status)
    if (building && building !== '全部') where.building = building
    const total = await ExpressOrder.countDocuments(where)
    const data = await ExpressOrder.find(where)
      .sort({ tip: -1, createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/express/building-stats（必须在 /:id 之前）
router.get('/building-stats', async (req, res) => {
  try {
    const allExpress = await ExpressOrder.find({ status: { $ne: 4 } })
    const allErrand = await ErrandTask.find({ status: { $ne: 3 } })
    const map = {}
    let totalEarnings = 0
    allExpress.forEach(o => {
      if (!o.building) return
      if (!map[o.building]) map[o.building] = { total: 0, pending: 0, delivering: 0, completed: 0 }
      map[o.building].total++
      if (o.status === 0) map[o.building].pending++
      else if (o.status === 1 || o.status === 2) map[o.building].delivering++
      else if (o.status === 3) { map[o.building].completed++; totalEarnings += (o.price || 0) + (o.tip || 0) }
    })
    allErrand.forEach(o => {
      const bName = o.toAddr || ''
      if (!bName) return
      if (!map[bName]) map[bName] = { total: 0, pending: 0, delivering: 0, completed: 0 }
      map[bName].total++
      if (o.status === 0) map[bName].pending++
      else if (o.status === 1) map[bName].delivering++
      else if (o.status === 2) { map[bName].completed++; totalEarnings += (o.price || 0) + (o.tip || 0) }
    })
    const result = Object.keys(map).map(name => ({ name, count: map[name].total, pending: map[name].pending, delivering: map[name].delivering, completed: map[name].completed }))
    result.sort((a, b) => b.count - a.count)
    const totalCount = result.reduce((s, r) => s + r.count, 0)
    result.unshift({ name: '全部', count: totalCount, pending: 0, delivering: 0, completed: 0 })
    res.json({ code: 0, data: result, totalEarnings })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/express/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await ExpressOrder.findById(req.params.id)
    if (!order) return res.json({ code: -1, msg: '记录不存在' })
    const detailData = order.toObject()
    // 24小时自动确认
    if (detailData.status === 2 && detailData.deliverPhotoTime) {
      const photoTime = new Date(detailData.deliverPhotoTime).getTime()
      if (Date.now() - photoTime >= 24 * 60 * 60 * 1000) {
        await ExpressOrder.updateOne({ _id: req.params.id }, {
          $set: { status: 3, statusText: '已完成', statusColor: '#A0AEC0', completeTime: new Date(), autoConfirmed: true }
        })
        // 更新骑手钱包
        const earnAmount = (detailData.price || 0) + (detailData.tip || 0)
        await creditRiderWallet(detailData.riderId, earnAmount, req.params.id, 'express')
        detailData.status = 3
        detailData.statusText = '已完成'
        detailData.autoConfirmed = true
      }
    }
    // 查询骑手信息
    if (detailData.riderId) {
      const riderUser = await User.findOne({ openid: detailData.riderId })
      if (riderUser) {
        detailData.riderName = riderUser.name || '骑手'
        detailData.riderPhone = riderUser.phone || ''
        detailData.riderAvatar = riderUser.avatar || ''
      }
    }
    res.json({ code: 0, data: detailData })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/express
router.post('/', auth, async (req, res) => {
  try {
    const { pickupPoint, pickupCode, expressCompany, sizeType, building, room, price, tip, remark, destLat, destLng, payType } = req.body
    if (!pickupPoint || !pickupPoint.trim()) return res.json({ code: -1, msg: '请选择取件点' })
    if (!building || !building.trim()) return res.json({ code: -1, msg: '请填写楼栋号' })
    if (!room || !room.trim()) return res.json({ code: -1, msg: '请填写房间号' })
    if (price !== undefined && (isNaN(price) || price <= 0 || price > 999)) return res.json({ code: -1, msg: '价格不合法' })
    if (tip !== undefined && (isNaN(tip) || tip < 0 || tip > 100)) return res.json({ code: -1, msg: '加急费金额不合法' })
    const sizeMap = { 0: { text: '小件', class: 'small' }, 1: { text: '大件', class: 'large' }, 2: { text: '超大件', class: 'xlarge' } }
    const size = sizeMap[sizeType] || sizeMap[0]

    const outTradeNo = 'express_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
    const totalPrice = (price || 2) + (tip || 0)

    // 钱包支付
    if (payType === 'wallet') {
      let wallet = await UserWallet.findOne({ openid: req.user.openid })
      if (!wallet) wallet = await UserWallet.create({ openid: req.user.openid, balance: 0, totalIncome: 0 })
      if (wallet.balance < totalPrice) return res.json({ code: -1, msg: '钱包余额不足，需要 ¥' + totalPrice })
      // 扣款
      await UserWallet.updateOne({ openid: req.user.openid }, { $inc: { balance: -totalPrice }, $set: { updateTime: new Date() } })
      await WalletRecord.create({
        openid: req.user.openid, type: 'income', amount: -totalPrice,
        title: '快递代拿订单支付', orderId: '', orderType: 'express_pay',
        status: 1, statusText: '已扣款', createTime: new Date()
      })
      const order = await ExpressOrder.create({
        openid: req.user.openid, pickupPoint, pickupCode: pickupCode || '', expressCompany: expressCompany || '',
        sizeType: sizeType || 0, sizeText: size.text, sizeClass: size.class, building, room,
        price: price || 2, tip: tip || 0, totalPrice, remark: remark || '',
        status: 0, statusText: '待接单', statusColor: '#DD6B20',
        destLat: destLat || 0, destLng: destLng || 0, createTime: new Date(),
        outTradeNo, payType: 'wallet', reviewStatus: 'pending'
      })
      await Stat.updateOne({ key: 'global' }, { $inc: { totalOrders: 1 } }).catch(() => { })
      return res.json({ code: 0, id: order._id, walletPaid: true })
    }

    // 微信支付
    const order = await ExpressOrder.create({
      openid: req.user.openid, pickupPoint, pickupCode: pickupCode || '', expressCompany: expressCompany || '',
      sizeType: sizeType || 0, sizeText: size.text, sizeClass: size.class, building, room,
      price: price || 2, tip: tip || 0, totalPrice: totalPrice, remark: remark || '',
      status: -1, statusText: '待支付', statusColor: '#A0AEC0',
      destLat: destLat || 0, destLng: destLng || 0, createTime: new Date(),
      outTradeNo, reviewStatus: 'pending'
    })
    await Stat.updateOne({ key: 'global' }, { $inc: { totalOrders: 1 } }).catch(() => { })

    const { createJSAPIOrder } = require('../services/wxpay')
    const payment = await createJSAPIOrder(
      req.user.openid,
      outTradeNo,
      Math.round(totalPrice * 100),
      '跑腿代拿快递服务'
    )

    res.json({ code: 0, id: order._id, payment })
  } catch (err) {
    console.error('express post error:', err)
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/express/:id/accept
router.post('/:id/accept', auth, async (req, res) => {
  try {
    const order = await ExpressOrder.findById(req.params.id)
    if (!order) return res.json({ code: -1, msg: '记录不存在' })
    if (order.status !== 0) return res.json({ code: -1, msg: '订单已被接' })
    if (order.openid === req.user.openid) return res.json({ code: -1, msg: '不能接自己发布的单' })
    const acceptUser = await User.findOne({ openid: req.user.openid })
    const acceptName = acceptUser ? acceptUser.name || '骑手' : '骑手'
    await ExpressOrder.updateOne({ _id: req.params.id }, {
      $set: { status: 1, statusText: '已接单', statusColor: '#2B6CB0', riderId: req.user.openid, acceptTime: new Date() }
    })
    if (order.openid !== req.user.openid) {
      await Message.create({
        toOpenid: order.openid, fromOpenid: req.user.openid, fromName: acceptName,
        type: 'order_accept', title: '快递单已被接',
        content: acceptName + ' 已接您的快递单，正在为您取件',
        targetId: req.params.id, targetType: 'express', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// PUT /api/express/:id/status
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    const order = await ExpressOrder.findById(req.params.id)
    if (!order) return res.json({ code: -1, msg: '记录不存在' })
    if (order.openid !== req.user.openid && order.riderId !== req.user.openid) {
      return res.json({ code: -1, msg: '无权操作该订单' })
    }
    const validStatuses = [0, 1, 2, 3, 4]
    if (!validStatuses.includes(Number(status))) return res.json({ code: -1, msg: '无效的状态值' })
    const statusMap = {
      0: { text: '待接单', color: '#DD6B20' }, 1: { text: '已接单', color: '#2B6CB0' },
      2: { text: '配送中', color: '#38A169' }, 3: { text: '已完成', color: '#A0AEC0' },
      4: { text: '已取消', color: '#E53E3E' }
    }
    const s = statusMap[status] || statusMap[0]
    const updateData = { status: Number(status), statusText: s.text, statusColor: s.color }
    if (Number(status) === 3) {
      updateData.completeTime = new Date()
      const randomInc = Math.floor(Math.random() * 5) + 1
      await Stat.updateOne({ key: 'global' }, { $inc: { todayDelivered: randomInc } }).catch(() => { })
      // 更新骑手钱包
      const earnAmount = (order.price || 0) + (order.tip || 0)
      await creditRiderWallet(order.riderId, earnAmount, req.params.id, 'express')
    }
    await ExpressOrder.updateOne({ _id: req.params.id }, { $set: updateData })
    const statusUser = await User.findOne({ openid: req.user.openid })
    const statusName = statusUser ? statusUser.name || '骑手' : '骑手'
    const notifyTarget = order.openid === req.user.openid ? order.riderId : order.openid
    if (notifyTarget && notifyTarget !== req.user.openid) {
      await Message.create({
        toOpenid: notifyTarget, fromOpenid: req.user.openid, fromName: statusName,
        type: 'order_status', title: '快递单状态更新', content: '快递单状态已更新为: ' + s.text,
        targetId: req.params.id, targetType: 'express', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/express/:id/cancel
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await ExpressOrder.findById(req.params.id)
    if (!order) return res.json({ code: -1, msg: '记录不存在' })
    if (order.status === 2 && order.openid === req.user.openid) {
      return res.json({ code: -1, msg: '骑手正在配送中，无法取消订单' })
    }
    if (order.openid !== req.user.openid && order.riderId !== req.user.openid) {
      return res.json({ code: -1, msg: '无权取消该订单' })
    }
    await ExpressOrder.updateOne({ _id: req.params.id }, {
      $set: { status: 4, statusText: '已取消', statusColor: '#E53E3E' }
    })

    // 执行退款
    if (order.status >= 0 && order.openid === req.user.openid) {
      const refundAmount = (order.price || 0) + (order.tip || 0)
      if (order.payType === 'wallet') {
        // 钱包支付退款：退回余额
        await UserWallet.updateOne({ openid: order.openid }, {
          $inc: { balance: refundAmount },
          $set: { updateTime: new Date() }
        }, { upsert: true })
        await WalletRecord.create({
          openid: order.openid, type: 'income', amount: refundAmount,
          title: '快递订单取消退款', orderId: req.params.id, orderType: 'express_refund',
          status: 1, statusText: '已退款', createTime: new Date()
        })
        console.log(`[wallet refund] 钱包退款成功: ${order.outTradeNo}, ¥${refundAmount}`)
      } else if (order.outTradeNo) {
        // 微信支付退款
        const { refundOrder } = require('../services/wxpay')
        try {
          const outRefundNo = 'ref_' + order.outTradeNo + '_' + Date.now()
          const totalAmount = Math.round(refundAmount * 100)
          await refundOrder(order.outTradeNo, outRefundNo, totalAmount, totalAmount)
          console.log(`[wxpay refund] 退款成功: ${order.outTradeNo}`)
        } catch (refundErr) {
          console.error(`[wxpay refund] 退款失败: ${order.outTradeNo}`, refundErr.message)
        }
      }
    }
    const cancelUser = await User.findOne({ openid: req.user.openid })
    const cancelName = cancelUser ? cancelUser.name || '用户' : '用户'
    const cancelTarget = order.openid === req.user.openid ? order.riderId : order.openid
    if (cancelTarget && cancelTarget !== req.user.openid) {
      await Message.create({
        toOpenid: cancelTarget, fromOpenid: req.user.openid, fromName: cancelName,
        type: 'order_cancel', title: '快递单已取消', content: cancelName + ' 取消了快递单',
        targetId: req.params.id, targetType: 'express', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/express/:id/photo
router.post('/:id/photo', auth, async (req, res) => {
  try {
    const order = await ExpressOrder.findById(req.params.id)
    if (!order) return res.json({ code: -1, msg: '记录不存在' })
    if (order.riderId !== req.user.openid) return res.json({ code: -1, msg: '仅接单骑手可上传照片' })
    const { type, fileID } = req.body
    if (!type || !fileID) return res.json({ code: -1, msg: 'missing fields' })
    const updateData = {}
    if (type === 'pickup') { updateData.pickupPhoto = fileID; updateData.pickupPhotoTime = new Date() }
    else if (type === 'deliver') { updateData.deliverPhoto = fileID; updateData.deliverPhotoTime = new Date() }
    await ExpressOrder.updateOne({ _id: req.params.id }, { $set: updateData })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// PUT /api/express/:id/location
router.put('/:id/location', auth, async (req, res) => {
  try {
    const order = await ExpressOrder.findById(req.params.id)
    if (!order) return res.json({ code: -1, msg: '记录不存在' })
    if (order.riderId !== req.user.openid) return res.json({ code: -1, msg: '仅接单骑手可更新位置' })
    const { latitude, longitude } = req.body
    if (!latitude || !longitude) return res.json({ code: -1, msg: 'missing fields' })
    await ExpressOrder.updateOne({ _id: req.params.id }, {
      $set: { riderLat: latitude, riderLng: longitude, riderLocationTime: new Date() }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
