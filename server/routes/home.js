const router = require('express').Router()
const Stat = require('../models/Stat')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const PageConfig = require('../models/PageConfig')

// GET /api/home/live-data
router.get('/live-data', async (req, res) => {
  try {
    let stat = await Stat.findOne({ key: 'global' })
    if (!stat) {
      stat = await Stat.create({ key: 'global', todayDelivered: 0, totalOrders: 0 })
    }
    res.json({ code: 0, data: stat })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/home/latest-orders
router.get('/latest-orders', async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10
    const [expressPending, expressOther, errandPending, errandOther] = await Promise.all([
      ExpressOrder.find({ status: 0 }).sort({ tip: -1, createTime: -1 }).limit(limit),
      ExpressOrder.find({ status: { $nin: [0, 4] } }).sort({ createTime: -1 }).limit(limit),
      ErrandTask.find({ status: 0 }).sort({ tip: -1, createTime: -1 }).limit(limit),
      ErrandTask.find({ status: { $nin: [0, 3] } }).sort({ createTime: -1 }).limit(limit)
    ])
    const expressList = [...expressPending, ...expressOther].map(o => {
      const obj = o.toObject(); obj.orderType = 'express'; return obj
    })
    const errandList = [...errandPending, ...errandOther].map(o => {
      const obj = o.toObject()
      obj.orderType = 'errand'; obj.sizeText = '跑腿'; obj.sizeClass = 'errand'
      obj.pickupPoint = obj.title || obj.fromAddr || '跑腿任务'
      obj.building = obj.toAddr || ''; obj.room = ''
      return obj
    })
    // 去重
    const seen = {}; const all = []
    for (const item of [...expressList, ...errandList]) {
      const id = item._id.toString()
      if (!seen[id]) { seen[id] = true; all.push(item) }
    }
    // 排序
    const ep = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
    const rp = { 0: 0, 1: 1, 2: 3, 3: 4 }
    all.sort((a, b) => {
      const pm = a.orderType === 'errand' ? rp : ep
      const pm2 = b.orderType === 'errand' ? rp : ep
      const ap = pm[a.status] !== undefined ? pm[a.status] : 5
      const bp = pm2[b.status] !== undefined ? pm2[b.status] : 5
      if (ap !== bp) return ap - bp
      const tipDiff = (b.tip || 0) - (a.tip || 0)
      if (tipDiff !== 0) return tipDiff
      return new Date(b.createTime) - new Date(a.createTime)
    })
    res.json({ code: 0, data: all.slice(0, limit) })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/home/page-config
router.get('/page-config', async (req, res) => {
  try {
    let config = await PageConfig.findOne({ page: 'home' })
    if (!config) config = { page: 'home', sections: [] }
    res.json({ code: 0, data: config })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
