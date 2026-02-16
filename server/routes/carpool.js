const router = require('express').Router()
const auth = require('../middleware/auth')
const Carpool = require('../models/Carpool')
const User = require('../models/User')

// GET /api/carpool/list
router.get('/list', async (req, res) => {
  try {
    const { filter, page = 1, pageSize = 10 } = req.query
    let data = await Carpool.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    if (filter === '1') data = data.filter(c => c.currentPeople < c.maxPeople)
    if (filter === '2') data = data.filter(c => c.currentPeople >= c.maxPeople)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/carpool/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await Carpool.findById(req.params.id)
    if (!item) return res.json({ code: -1, msg: '记录不存在' })
    res.json({ code: 0, data: item })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/carpool
router.post('/', auth, async (req, res) => {
  try {
    const { from, to, departTime, pickupLocation, maxPeople, deadline, contact, remark } = req.body
    if (!from || !to || !departTime) return res.json({ code: -1, msg: 'missing fields' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    const item = await Carpool.create({
      openid: req.user.openid, from, to, departTime, pickupLocation: pickupLocation || '',
      maxPeople: maxPeople || 4, currentPeople: 1, deadline: deadline || '',
      contact: contact || '', remark: remark || '', publisher: userName,
      members: [req.user.openid], createTime: new Date()
    })
    res.json({ code: 0, id: item._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/carpool/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const item = await Carpool.findById(req.params.id)
    if (!item) return res.json({ code: -1, msg: '记录不存在' })
    if (item.currentPeople >= item.maxPeople) return res.json({ code: -1, msg: '已满员' })
    if (item.members && item.members.includes(req.user.openid)) return res.json({ code: -1, msg: '已加入' })
    await Carpool.updateOne({ _id: req.params.id }, { $inc: { currentPeople: 1 }, $push: { members: req.user.openid } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/carpool/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const item = await Carpool.findById(req.params.id)
    if (!item) return res.json({ code: -1, msg: '记录不存在' })
    if (item.openid === req.user.openid) return res.json({ code: -1, msg: '发起人不能退出' })
    if (!item.members || !item.members.includes(req.user.openid)) return res.json({ code: -1, msg: '未加入该拼车' })
    await Carpool.updateOne({ _id: req.params.id }, { $inc: { currentPeople: -1 }, $pull: { members: req.user.openid } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
