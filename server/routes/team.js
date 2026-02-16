const router = require('express').Router()
const auth = require('../middleware/auth')
const TeamActivity = require('../models/TeamActivity')
const TeamMember = require('../models/TeamMember')
const User = require('../models/User')

// GET /api/team/list
router.get('/list', async (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query
    const query = {}
    if (type) query.type = type
    const data = await TeamActivity.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/team/:id
router.get('/:id', async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    const members = await TeamMember.find({ activityId: req.params.id })
    res.json({ code: 0, data: { ...activity.toObject(), members } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team
router.post('/', auth, async (req, res) => {
  try {
    const { title, type, place, time, max, desc, images } = req.body
    if (!title || !type) return res.json({ code: -1, msg: 'missing fields' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    const activity = await TeamActivity.create({
      openid: req.user.openid, title, type, place: place || '', time: time || '',
      max: Number(max) || 10, current: 1, desc: desc || '', images: images || [],
      photos: [], status: 'active', tag: '招募中', owner: userName, createTime: new Date()
    })
    await TeamMember.create({ activityId: activity._id.toString(), openid: req.user.openid, name: userName, joinTime: new Date() })
    res.json({ code: 0, id: activity._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.status === 'ended') return res.json({ code: -1, msg: '活动已结束' })
    if (activity.current >= activity.max) return res.json({ code: -1, msg: '已满员' })
    const existing = await TeamMember.countDocuments({ activityId: req.params.id, openid: req.user.openid })
    if (existing > 0) return res.json({ code: -1, msg: '已加入' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    await TeamMember.create({ activityId: req.params.id, openid: req.user.openid, name: userName, joinTime: new Date() })
    const newCurrent = activity.current + 1
    const updateData = { $inc: { current: 1 } }
    if (newCurrent >= activity.max) updateData.$set = { tag: '已满员' }
    await TeamActivity.updateOne({ _id: req.params.id }, updateData)
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.openid === req.user.openid) return res.json({ code: -1, msg: '发起人不能退出' })
    const member = await TeamMember.findOne({ activityId: req.params.id, openid: req.user.openid })
    if (!member) return res.json({ code: -1, msg: '未加入该活动' })
    await TeamMember.deleteOne({ _id: member._id })
    await TeamActivity.updateOne({ _id: req.params.id }, { $inc: { current: -1 } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/photo
router.post('/:id/photo', auth, async (req, res) => {
  try {
    const { fileIDs } = req.body
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.openid !== req.user.openid) return res.json({ code: -1, msg: '仅发起人可上传' })
    await TeamActivity.updateOne({ _id: req.params.id }, { $push: { photos: { $each: fileIDs } } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/end
router.post('/:id/end', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.openid !== req.user.openid) return res.json({ code: -1, msg: '仅发起人可结束' })
    await TeamActivity.updateOne({ _id: req.params.id }, { $set: { status: 'ended', tag: '已结束' } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
