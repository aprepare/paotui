const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../config')
const adminAuth = require('../middleware/adminAuth')
const auth = require('../middleware/auth')
const AdminUser = require('../models/AdminUser')
const Admin = require('../models/Admin')
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
const WashProduct = require('../models/WashProduct')
const WalletWithdrawal = require('../models/WalletWithdrawal')

const DEFAULT_ADMIN_PHONES = ['19922240902']

// 检查是否为管理员（基于手机号）
async function checkAdminByOpenid(openid) {
  const user = await User.findOne({ openid })
  if (!user || !user.phone) return false
  if (DEFAULT_ADMIN_PHONES.includes(user.phone)) return true
  const admin = await Admin.findOne({ phone: user.phone, status: 'active' })
  return !!admin
}

// POST /api/admin/login (后台管理面板用)
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

// ===== 小程序端: 检查当前用户是否为管理员 =====
router.post('/check-admin', auth, async (req, res) => {
  try {
    const isAdmin = await checkAdminByOpenid(req.user.openid)
    res.json({ code: 0, isAdmin })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/admin/dashboard
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [uc, ec, erc, cc, fc, mc, tc, msgc, rc] = await Promise.all([
      User.countDocuments(),
      ExpressOrder.countDocuments(),
      ErrandTask.countDocuments(),
      Carpool.countDocuments(),
      ForumPost.countDocuments(),
      MarketGoods.countDocuments(),
      TeamActivity.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ isRider: true })
    ])
    const [pe, per] = await Promise.all([
      ExpressOrder.countDocuments({ status: 0 }),
      ErrandTask.countDocuments({ status: 0 })
    ])
    const stat = await Stat.findOne({ key: 'global' }) || { todayDelivered: 0, totalOrders: 0 }
    res.json({
      code: 0, data: {
        userCount: uc, expressCount: ec, errandCount: erc,
        carpoolCount: cc, forumCount: fc, marketCount: mc,
        teamCount: tc, msgCount: msgc, riderCount: rc,
        pendingExpress: pe, pendingErrand: per,
        todayDelivered: stat.todayDelivered || 0,
        totalOrders: stat.totalOrders || 0
      }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// 小程序端 dashboard（通过 auth 中间件）
router.post('/dashboard-mp', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const [uc, ec, erc, cc, fc, mc, tc, msgc, rc] = await Promise.all([
      User.countDocuments(),
      ExpressOrder.countDocuments(),
      ErrandTask.countDocuments(),
      Carpool.countDocuments(),
      ForumPost.countDocuments(),
      MarketGoods.countDocuments(),
      TeamActivity.countDocuments(),
      Message.countDocuments(),
      User.countDocuments({ isRider: true })
    ])
    const [pe, per] = await Promise.all([
      ExpressOrder.countDocuments({ status: 0 }),
      ErrandTask.countDocuments({ status: 0 })
    ])
    const stat = await Stat.findOne({ key: 'global' }) || { todayDelivered: 0, totalOrders: 0 }
    res.json({
      code: 0, data: {
        userCount: uc, expressCount: ec, errandCount: erc,
        carpoolCount: cc, forumCount: fc, marketCount: mc,
        teamCount: tc, msgCount: msgc, riderCount: rc,
        pendingExpress: pe, pendingErrand: per,
        todayDelivered: stat.todayDelivered || 0,
        totalOrders: stat.totalOrders || 0
      }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 修改首页统计数据 =====
router.post('/update-stats', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { todayDelivered, totalOrders } = req.body
    const upd = {}
    if (todayDelivered !== undefined) upd.todayDelivered = Number(todayDelivered)
    if (totalOrders !== undefined) upd.totalOrders = Number(totalOrders)
    await Stat.updateOne({ key: 'global' }, { $set: upd }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 用户管理 =====
router.post('/user-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20, keyword } = req.body
    const query = {}
    if (keyword) {
      const kw = keyword.toLowerCase()
      query.$or = [
        { name: { $regex: kw, $options: 'i' } },
        { phone: { $regex: kw, $options: 'i' } }
      ]
    }
    const total = await User.countDocuments(query)
    const data = await User.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/user-detail', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { userId } = req.body
    const u = await User.findById(userId)
    if (!u) return res.json({ code: -1, msg: '用户不存在' })
    const [ep, erp, fp] = await Promise.all([
      ExpressOrder.countDocuments({ openid: u.openid }),
      ErrandTask.countDocuments({ openid: u.openid }),
      ForumPost.countDocuments({ openid: u.openid })
    ])
    res.json({ code: 0, data: { ...u.toObject(), expressCount: ep, errandCount: erp, forumCount: fp } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/toggle-user-status', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { userId, disabled } = req.body
    await User.updateOne({ _id: userId }, { $set: { disabled: !!disabled } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/set-user-admin', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { userId } = req.body
    const u = await User.findById(userId)
    if (!u || !u.phone) return res.json({ code: -1, msg: '该用户未绑定手机号' })
    if (DEFAULT_ADMIN_PHONES.includes(u.phone)) return res.json({ code: -1, msg: '已是默认管理员' })
    const ex = await Admin.findOne({ phone: u.phone })
    if (ex) return res.json({ code: -1, msg: '已是管理员' })
    await Admin.create({ phone: u.phone, name: u.name || '', status: 'active', addedBy: req.user.openid })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 订单管理（小程序端）=====
router.post('/express-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20, status } = req.body
    const query = {}
    if (status !== undefined && status !== -1) query.status = status
    const total = await ExpressOrder.countDocuments(query)
    const data = await ExpressOrder.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/cancel-express', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await ExpressOrder.updateOne({ _id: req.body.orderId }, {
      $set: { status: 4, statusText: '已取消', statusColor: '#E53E3E' }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/errand-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20, status } = req.body
    const query = {}
    if (status !== undefined && status !== -1) query.status = status
    const total = await ErrandTask.countDocuments(query)
    const data = await ErrandTask.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/cancel-errand', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await ErrandTask.updateOne({ _id: req.body.taskId }, {
      $set: { status: 3, statusText: '已取消', statusColor: '#E53E3E' }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 内容管理（小程序端）=====
router.post('/forum-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20 } = req.body
    const total = await ForumPost.countDocuments()
    const data = await ForumPost.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/delete-post', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await ForumPost.deleteOne({ _id: req.body.postId })
    await ForumComment.deleteMany({ postId: req.body.postId })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/market-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20 } = req.body
    const total = await MarketGoods.countDocuments()
    const data = await MarketGoods.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/delete-goods', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await MarketGoods.deleteOne({ _id: req.body.goodsId })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/team-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20 } = req.body
    const total = await TeamActivity.countDocuments()
    const data = await TeamActivity.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/delete-team', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await TeamActivity.deleteOne({ _id: req.body.activityId })
    await TeamMember.deleteMany({ activityId: req.body.activityId })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/carpool-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20 } = req.body
    const total = await Carpool.countDocuments()
    const data = await Carpool.find().sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/delete-carpool', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await Carpool.deleteOne({ _id: req.body.carpoolId })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 页面配置 =====
router.post('/get-page-config', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const cfg = await PageConfig.findOne({ page: 'home' })
    if (!cfg) {
      return res.json({
        code: 0, data: {
          banners: [
            { emoji: '📦', title: '快递代取 极速送达', desc: '下单后最快30分钟送到宿舍', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
            { emoji: '🏃', title: '万能跑腿 有求必应', desc: '买饭、打印、取件 一键搞定', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
            { emoji: '🎉', title: '新用户首单立减', desc: '注册即享优惠 快来体验吧', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
          ],
          actions: [
            { emoji: '📦', text: '代取快递', link: '/pages/express/create', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
            { emoji: '🏃', text: '万能跑腿', link: '/pages/errand/create', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
            { emoji: '🏅', text: '骑手注册', link: '/pages/express/rider-register', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
          ]
        }
      })
    }
    res.json({ code: 0, data: cfg.config || {} })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/save-page-config', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { banners, actions } = req.body
    const config = {}
    if (banners) config.banners = banners
    if (actions) config.actions = actions
    await PageConfig.updateOne({ page: 'home' }, { $set: { page: 'home', config, updateTime: new Date() } }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 福利页配置 =====
router.post('/get-welfare-config', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const cfg = await PageConfig.findOne({ page: 'welfare' })
    if (!cfg) return res.json({ code: 0, data: { services: [], banners: [] } })
    res.json({ code: 0, data: cfg.config || {} })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/save-welfare-config', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { services, banners } = req.body
    const wConfig = {}
    if (services) wConfig.services = services
    if (banners) wConfig.banners = banners
    await PageConfig.updateOne({ page: 'welfare' }, { $set: { page: 'welfare', config: wConfig, updateTime: new Date() } }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// 福利页公共接口（无需管理员权限）
router.post('/get-welfare-public', auth, async (req, res) => {
  try {
    const cfg = await PageConfig.findOne({ page: 'welfare' })
    if (!cfg) return res.json({ code: 0, data: null })
    res.json({ code: 0, data: cfg.config || null })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== TabBar 配置 =====
router.post('/get-tabbar-config', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const cfg = await PageConfig.findOne({ page: 'tabbar' })
    if (!cfg) return res.json({ code: 0, data: { tabs: [] } })
    res.json({ code: 0, data: cfg.config || {} })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/save-tabbar-config', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { tabs } = req.body
    const tbConfig = { tabs: tabs || [] }
    await PageConfig.updateOne({ page: 'tabbar' }, { $set: { page: 'tabbar', config: tbConfig, updateTime: new Date() } }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// TabBar 公共接口
router.post('/get-tabbar-public', auth, async (req, res) => {
  try {
    const cfg = await PageConfig.findOne({ page: 'tabbar' })
    if (!cfg) return res.json({ code: 0, data: null })
    res.json({ code: 0, data: cfg.config || null })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 管理员管理 =====
router.post('/admin-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const admins = await Admin.find({ status: 'active' })
    const list = DEFAULT_ADMIN_PHONES.map(p => ({ phone: p, isDefault: true, status: 'active' }))
    admins.forEach(a => {
      if (!DEFAULT_ADMIN_PHONES.includes(a.phone)) {
        list.push({ _id: a._id, phone: a.phone, name: a.name || '', isDefault: false, status: a.status, createTime: a.createTime })
      }
    })
    res.json({ code: 0, data: list })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/add-admin', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { phone, name } = req.body
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return res.json({ code: -1, msg: '手机号格式不正确' })
    if (DEFAULT_ADMIN_PHONES.includes(phone)) return res.json({ code: -1, msg: '已是默认管理员' })
    const ex = await Admin.findOne({ phone })
    if (ex) return res.json({ code: -1, msg: '已是管理员' })
    await Admin.create({ phone, name: name || '', status: 'active', addedBy: req.user.openid })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/remove-admin', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await Admin.deleteOne({ _id: req.body.adminId })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 系统公告 =====
router.post('/send-notice', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { title, content } = req.body
    if (!title || !content) return res.json({ code: -1, msg: '标题和内容不能为空' })
    const allUsers = await User.find().limit(500)
    let count = 0
    for (const u of allUsers) {
      if (u.openid === req.user.openid) continue
      await Message.create({
        toOpenid: u.openid, fromOpenid: req.user.openid, fromName: '系统管理员',
        type: 'system', title, content, targetId: '', targetType: 'system',
        read: false, createTime: new Date()
      })
      count++
    }
    res.json({ code: 0, msg: '已发送给 ' + count + ' 位用户' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 提现审核 =====
router.post('/withdraw-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { page = 1, pageSize = 20, status } = req.body
    const query = {}
    if (status !== undefined && status !== '') query.status = parseInt(status)
    const total = await WalletWithdrawal.countDocuments(query)
    const data = await WalletWithdrawal.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/approve-withdraw', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await WalletWithdrawal.updateOne({ _id: req.body.withdrawId }, {
      $set: { status: 1, approveTime: new Date(), approvedBy: req.user.openid }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/reject-withdraw', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await WalletWithdrawal.updateOne({ _id: req.body.withdrawId }, {
      $set: { status: 2, rejectTime: new Date(), rejectReason: req.body.reason || '', rejectedBy: req.user.openid }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 洗护商品管理 =====
router.post('/wash-product-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const data = await WashProduct.find().sort({ sort: 1 })
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/add-wash-product', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { name, desc, image, originalPrice, groupPrice, groupSize } = req.body
    if (!name) return res.json({ code: -1, msg: '商品名称不能为空' })
    await WashProduct.create({
      name, desc: desc || '', image: image || '',
      originalPrice: parseFloat(originalPrice) || 0, groupPrice: parseFloat(groupPrice) || 0,
      groupSize: parseInt(groupSize) || 3, status: 1, sort: 0
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/update-wash-product', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { productId, ...update } = req.body
    if (!productId) return res.json({ code: -1, msg: '缺少商品ID' })
    if (update.originalPrice !== undefined) update.originalPrice = parseFloat(update.originalPrice) || 0
    if (update.groupPrice !== undefined) update.groupPrice = parseFloat(update.groupPrice) || 0
    if (update.groupSize !== undefined) update.groupSize = parseInt(update.groupSize) || 3
    await WashProduct.updateOne({ _id: productId }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/delete-wash-product', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await WashProduct.deleteOne({ _id: req.body.productId })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== RESTful 接口（后台管理面板用）=====
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

// RESTful: 页面配置
router.get('/page-config', adminAuth, async (req, res) => {
  try {
    let cfg = await PageConfig.findOne({ page: 'home' })
    if (!cfg) cfg = { page: 'home', sections: [], updateTime: new Date() }
    res.json({ code: 0, data: cfg })
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

// RESTful: 统计
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
