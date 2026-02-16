const router = require('express').Router()
const auth = require('../middleware/auth')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const Carpool = require('../models/Carpool')

function sortOrders(list) {
  const ep = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
  const rp = { 0: 0, 1: 1, 2: 3, 3: 4 }
  list.sort((a, b) => {
    const pm = a.type === '万能跑腿' ? rp : ep
    const pm2 = b.type === '万能跑腿' ? rp : ep
    const ap = pm[a.status] !== undefined ? pm[a.status] : 5
    const bp = pm2[b.status] !== undefined ? pm2[b.status] : 5
    if (ap !== bp) return ap - bp
    const tipDiff = (b.tip || 0) - (a.tip || 0)
    if (tipDiff !== 0) return tipDiff
    return new Date(b.createTime) - new Date(a.createTime)
  })
  return list
}

// GET /api/order/my-published
router.get('/my-published', auth, async (req, res) => {
  try {
    const { pageSize = 10 } = req.query
    const openid = req.user.openid
    const [express, errand] = await Promise.all([
      ExpressOrder.find({ openid }).sort({ createTime: -1 }).limit(Number(pageSize)),
      ErrandTask.find({ openid }).sort({ createTime: -1 }).limit(Number(pageSize))
    ])
    const list = [
      ...express.map(o => ({ ...o.toObject(), type: '代取快递', typeEmoji: '📦' })),
      ...errand.map(o => ({ ...o.toObject(), type: '万能跑腿', typeEmoji: '🏃' }))
    ]
    res.json({ code: 0, data: sortOrders(list).slice(0, Number(pageSize)) })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/order/my-accepted
router.get('/my-accepted', auth, async (req, res) => {
  try {
    const { pageSize = 10 } = req.query
    const openid = req.user.openid
    const [express, errand] = await Promise.all([
      ExpressOrder.find({ riderId: openid }).sort({ createTime: -1 }).limit(Number(pageSize)),
      ErrandTask.find({ riderId: openid }).sort({ createTime: -1 }).limit(Number(pageSize))
    ])
    const list = [
      ...express.map(o => ({ ...o.toObject(), type: '代取快递', typeEmoji: '📦' })),
      ...errand.map(o => ({ ...o.toObject(), type: '万能跑腿', typeEmoji: '🏃' }))
    ]
    res.json({ code: 0, data: sortOrders(list).slice(0, Number(pageSize)) })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/order/my-carpool
router.get('/my-carpool', auth, async (req, res) => {
  try {
    const openid = req.user.openid
    const carpools = await Carpool.find({ members: openid }).sort({ createTime: -1 }).limit(20)
    res.json({ code: 0, data: carpools })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
