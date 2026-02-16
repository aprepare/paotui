const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../config')
const adminAuth = require('../middleware/adminAuth')
const AdminUser = require('../models/AdminUser')
const User = require('../models/User')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const ForumPost = require('../models/ForumPost')
const ForumComment = require('../models/ForumComment')
const MarketGoods = require('../models/MarketGoods')
const Carpool = require('../models/Carpool')
const TeamActivity = require('../models/TeamActivity')
const TeamMember = require('../models/TeamMember')
const Skill = require('../models/Skill')
const Message = require('../models/Message')
const UserFavorite = require('../models/UserFavorite')
const PageConfig = require('../models/PageConfig')
const Stat = require('../models/Stat')

// POST /api/admin/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.json({ code: -1, msg: '请输入用户名和密码' })
    const admin = await AdminUser.findOne({ username })
    if (!admin) return res.json({ code: -1, msg: '用户名或密码错误' })
    const valid = await bcrypt.compare(password, admin.passwordHash)
    if (!valid) return res.json({ code: -1, msg: '用户名或密码错误' })
    const token = jwt.sign(
      { adminId: admin._id.toString(), username: admin.username, role: 'admin' },
      config.jwtSecret,
      { expiresIn: '24h' }
    )
    res.json({ code: 0, data: { token, username: admin.username } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/admin/dashboard
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalExpress, totalErrand, todayExpress] = await Promise.all([
      User.countDocuments(),
      ExpressOrder.countDocuments(),
      ErrandTask.countDocuments(),
      ExpressOrder.countDocuments({ status: 3, completeTime: { $gte: new Date(new Date().toDateString()) } })
    ])
    const completedExpress = await ExpressOrder.find({ status: 3 }, 'price tip')
    let totalRevenue = 0
    completedExpress.forEach(o => { totalRevenue += (o.price || 0) + (o.tip || 0) })
    res.json({ code: 0, data: { totalUsers, totalOrders: totalExpress + totalErrand, todayDelivered: todayExpress, totalRevenue } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 用户管理 =====
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, isRider } = req.query
    const query = {}
    if (keyword) query.$or = [
      { name: { $regex: keyword, $options: 'i' } },
      { phone: { $regex: keyword, $options: 'i' } },
      { openid: { $regex: keyword, $options: 'i' } }
    ]
    if (isRider !== undefined) query.isRider = isRider === 'true'
    const total = await User.countDocuments(query)
    const data = await User.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.json({ code: -1, msg: '用户不存在' })
    await Promise.all([
      User.deleteOne({ _id: req.params.id }),
      UserFavorite.deleteMany({ openid: user.openid }),
      Message.deleteMany({ $or: [{ toOpenid: user.openid }, { fromOpenid: user.openid }] })
    ])
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 快递订单管理 =====
router.get('/express-orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const query = {}
    if (status !== undefined && status !== '') query.status = Number(status)
    const total = await ExpressOrder.countDocuments(query)
    const data = await ExpressOrder.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/express-orders', adminAuth, async (req, res) => {
  try {
    const order = await ExpressOrder.create({ ...req.body, createTime: new Date() })
    res.json({ code: 0, data: order })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/express-orders/:id', adminAuth, async (req, res) => {
  try {
    await ExpressOrder.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/express-orders/:id', adminAuth, async (req, res) => {
  try {
    await ExpressOrder.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 跑腿任务管理 =====
router.get('/errand-tasks', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const query = {}
    if (status !== undefined && status !== '') query.status = Number(status)
    const total = await ErrandTask.countDocuments(query)
    const data = await ErrandTask.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/errand-tasks/:id', adminAuth, async (req, res) => {
  try {
    await ErrandTask.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/errand-tasks/:id', adminAuth, async (req, res) => {
  try {
    await ErrandTask.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 论坛管理 =====
router.get('/forum-posts', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const total = await ForumPost.countDocuments()
    const data = await ForumPost.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/forum-posts/:id', adminAuth, async (req, res) => {
  try {
    await ForumPost.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/forum-posts/:id', adminAuth, async (req, res) => {
  try {
    await ForumPost.deleteOne({ _id: req.params.id })
    await ForumComment.deleteMany({ postId: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 二手市场管理 =====
router.get('/market-goods', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const total = await MarketGoods.countDocuments()
    const data = await MarketGoods.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/market-goods/:id', adminAuth, async (req, res) => {
  try {
    await MarketGoods.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/market-goods/:id', adminAuth, async (req, res) => {
  try {
    await MarketGoods.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 拼车管理 =====
router.get('/carpool', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const total = await Carpool.countDocuments()
    const data = await Carpool.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/carpool/:id', adminAuth, async (req, res) => {
  try {
    await Carpool.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/carpool/:id', adminAuth, async (req, res) => {
  try {
    await Carpool.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 组队管理 =====
router.get('/team-activities', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const total = await TeamActivity.countDocuments()
    const data = await TeamActivity.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/team-activities/:id', adminAuth, async (req, res) => {
  try {
    await TeamActivity.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/team-activities/:id', adminAuth, async (req, res) => {
  try {
    await TeamActivity.deleteOne({ _id: req.params.id })
    await TeamMember.deleteMany({ activityId: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 技能管理 =====
router.get('/skills', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const total = await Skill.countDocuments()
    const data = await Skill.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/skills/:id', adminAuth, async (req, res) => {
  try {
    await Skill.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/skills/:id', adminAuth, async (req, res) => {
  try {
    await Skill.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 消息管理 =====
router.get('/messages', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const total = await Message.countDocuments()
    const data = await Message.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/messages', adminAuth, async (req, res) => {
  try {
    const { toOpenid, title, content } = req.body
    if (!toOpenid) return res.json({ code: -1, msg: 'missing toOpenid' })
    await Message.create({
      toOpenid, fromOpenid: '', fromName: '系统管理员',
      type: 'system', title: title || '系统通知', content: content || '',
      read: false, createTime: new Date()
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/messages/:id', adminAuth, async (req, res) => {
  try {
    await Message.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 页面配置 =====
router.get('/page-config', adminAuth, async (req, res) => {
  try {
    let config = await PageConfig.findOne({ page: 'home' })
    if (!config) config = { page: 'home', sections: [], updateTime: new Date() }
    res.json({ code: 0, data: config })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/page-config', adminAuth, async (req, res) => {
  try {
    const { sections } = req.body
    await PageConfig.updateOne({ page: 'home' }, { $set: { sections, updateTime: new Date() } }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 统计 =====
router.get('/stats', adminAuth, async (req, res) => {
  try {
    let stat = await Stat.findOne({ key: 'global' })
    if (!stat) stat = { key: 'global', todayDelivered: 0, totalOrders: 0 }
    res.json({ code: 0, data: stat })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/stats', adminAuth, async (req, res) => {
  try {
    await Stat.updateOne({ key: 'global' }, { $set: req.body }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
