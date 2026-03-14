const router = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
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
const WashOrder = require('../models/WashOrder')
const WalletWithdrawal = require('../models/WalletWithdrawal')
const FoodShop = require('../models/FoodShop')
const FoodItem = require('../models/FoodItem')
const FoodOrder = require('../models/FoodOrder')
const JobPost = require('../models/JobPost')
const TutorPost = require('../models/TutorPost')
const GraduateResource = require('../models/GraduateResource')
const ConfigHistory = require('../models/ConfigHistory')

const DEFAULT_ADMIN_PHONES = []

// 页面配置名称映射
const PAGE_NAME_MAP = {
  home: '首页配置',
  welfare: '福利页配置',
  job: '兼职页配置',
  price: '价格配置',
  bannedWords: '屏蔽词',
  tabbar: 'TabBar配置'
}

// 根据配置类型生成变更摘要
function generateConfigSummary(page, config) {
  try {
    switch (page) {
      case 'home': {
        const parts = []
        if (config.heroImage) parts.push('顶部形象图')
        if (Array.isArray(config.banners)) parts.push(`${config.banners.length}个轮播图`)
        if (Array.isArray(config.actions)) parts.push(`${config.actions.length}个快捷操作`)
        return parts.length > 0 ? parts.join(', ') : '空配置'
      }
      case 'welfare': {
        const parts = []
        if (Array.isArray(config.services)) parts.push(`${config.services.length}个服务入口`)
        if (Array.isArray(config.banners)) parts.push(`${config.banners.length}个轮播图`)
        return parts.length > 0 ? parts.join(', ') : '空配置'
      }
      case 'job': {
        const parts = []
        if (Array.isArray(config.categories)) parts.push(`${config.categories.length}个分类`)
        if (config.seasonBanner) parts.push('寒暑假横幅')
        if (Array.isArray(config.hotJobs) && config.hotJobs.length > 0) parts.push(`${config.hotJobs.length}个热招岗位`)
        return parts.length > 0 ? parts.join(', ') : '空配置'
      }
      case 'price': {
        const parts = []
        if (config.expressSmallFee !== undefined) parts.push(`小件¥${config.expressSmallFee}`)
        if (config.expressMediumFee !== undefined) parts.push(`大件¥${config.expressMediumFee}`)
        if (config.expressLargeFee !== undefined) parts.push(`超大件¥${config.expressLargeFee}`)
        if (config.tutorViewFee !== undefined) parts.push(`家教查看¥${config.tutorViewFee}`)
        if (config.skillViewFee !== undefined) parts.push(`技能查看¥${config.skillViewFee}`)
        if (config.washDeliveryFee !== undefined) parts.push(`洗鞋跑腿¥${config.washDeliveryFee}`)
        if (config.foodDeliveryFee !== undefined) parts.push(`外卖配送¥${config.foodDeliveryFee}`)
        return parts.length > 0 ? parts.join(', ') : '空配置'
      }
      case 'bannedWords': {
        const words = config.words || []
        return `${words.length}个屏蔽词`
      }
      case 'tabbar': {
        const tabs = config.tabs || []
        return `${tabs.length}个Tab项`
      }
      default:
        return JSON.stringify(config).substring(0, 100)
    }
  } catch (e) {
    return '未知配置'
  }
}

// 保存配置变更之前，将旧配置存入历史记录
async function saveConfigHistory(page, operator) {
  try {
    const oldCfg = await PageConfig.findOne({ page })
    if (!oldCfg) return // 第一次保存，没有旧版本需要记录

    // 获取当前最大版本号
    const lastHistory = await ConfigHistory.findOne({ page }).sort({ version: -1 })
    const nextVersion = lastHistory ? lastHistory.version + 1 : 1

    const summary = generateConfigSummary(page, oldCfg.config || {})

    await ConfigHistory.create({
      page,
      version: nextVersion,
      config: oldCfg.config || {},
      sections: oldCfg.sections || [],
      summary: `${PAGE_NAME_MAP[page] || page} — ${summary}`,
      operator: operator || 'admin',
      createTime: new Date()
    })

    // 只保留最近 20 个版本，超出的自动清理
    const count = await ConfigHistory.countDocuments({ page })
    if (count > 20) {
      const oldest = await ConfigHistory.find({ page }).sort({ version: 1 }).limit(count - 20)
      const idsToDelete = oldest.map(h => h._id)
      await ConfigHistory.deleteMany({ _id: { $in: idsToDelete } })
    }
  } catch (err) {
    console.error('[saveConfigHistory] error:', err)
    // 历史记录保存失败不影响主流程
  }
}

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
    await saveConfigHistory('home', 'mp-admin')
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
    await saveConfigHistory('welfare', 'mp-admin')
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
    await saveConfigHistory('tabbar', 'mp-admin')
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

    // populate 用户信息
    const enriched = []
    for (const w of data) {
      const wObj = w.toObject()
      const u = await User.findOne({ openid: w.openid })
      wObj.userInfo = u ? { name: u.name || '', avatar: u.avatar || '', phone: u.phone || '' } : {}
      enriched.push(wObj)
    }
    res.json({ code: 0, data: enriched, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/approve-withdraw', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await WalletWithdrawal.updateOne({ _id: req.body.withdrawId }, {
      $set: { status: 3, paidTime: new Date(), paidBy: req.user.openid }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/reject-withdraw', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const w = await WalletWithdrawal.findById(req.body.withdrawId)
    if (w && w.status === 0) {
      // 拒绝时退还余额
      const UserWallet = require('../models/UserWallet')
      await UserWallet.updateOne({ openid: w.openid }, {
        $inc: { balance: w.amount },
        $set: { updateTime: new Date() }
      }, { upsert: true })
    }
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
    const { productId } = req.body
    if (!productId) return res.json({ code: -1, msg: '缺少商品ID' })
    const allowedFields = ['name', 'desc', 'image', 'originalPrice', 'groupPrice', 'groupSize', 'status', 'sort']
    const update = {}
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }
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

// ===== 考研资料管理 =====
router.post('/resource-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const data = await GraduateResource.find().sort({ sort: 1, createTime: -1 })
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/add-resource', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { title, desc, category, size, link, password, emoji, color } = req.body
    if (!title) return res.json({ code: -1, msg: '资料标题不能为空' })
    await GraduateResource.create({
      title, desc: desc || '', category: category || '综合',
      size: size || '', link: link || '', password: password || '',
      emoji: emoji || '📘', color: color || 'linear-gradient(135deg, #63B3ED, #2B6CB0)',
      status: 1, sort: 0
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/update-resource', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { resourceId } = req.body
    if (!resourceId) return res.json({ code: -1, msg: '缺少资料ID' })
    const allowedFields = ['title', 'desc', 'category', 'size', 'link', 'password', 'emoji', 'color', 'status', 'sort']
    const update = {}
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }
    await GraduateResource.updateOne({ _id: resourceId }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/delete-resource', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    await GraduateResource.deleteOne({ _id: req.body.resourceId })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// 考研资料公共接口（用户端获取已上架资料）
router.post('/resource-list-public', auth, async (req, res) => {
  try {
    const data = await GraduateResource.find({ status: 1 }).sort({ sort: 1, createTime: -1 })
    res.json({ code: 0, data })
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
    const allowedFields = ['name', 'phone', 'avatar', 'disabled', 'isRider', 'riderInfo']
    const update = {}
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) update[key] = req.body[key]
    }
    if (Object.keys(update).length === 0) return res.json({ code: -1, msg: '无有效更新字段' })
    await User.updateOne({ _id: req.params.id }, { $set: update })
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
    const allowedFields = ['todayDelivered', 'totalOrders']
    const update = {}
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) update[key] = Number(req.body[key])
    }
    if (Object.keys(update).length === 0) return res.json({ code: -1, msg: '无有效更新字段' })
    await Stat.updateOne({ key: 'global' }, { $set: update }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== Dashboard =====
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalExpress, totalErrand, totalFood, totalWash, pendingWithdrawals] = await Promise.all([
      User.countDocuments(),
      ExpressOrder.countDocuments(),
      ErrandTask.countDocuments(),
      FoodOrder.countDocuments(),
      WashOrder.countDocuments(),
      WalletWithdrawal.countDocuments({ status: 0 })
    ])
    const totalOrders = totalExpress + totalErrand + totalFood + totalWash
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const [todayExpress, todayErrand, todayFood, todayWash, todayUsers] = await Promise.all([
      ExpressOrder.countDocuments({ createTime: { $gte: todayStart } }),
      ErrandTask.countDocuments({ createTime: { $gte: todayStart } }),
      FoodOrder.countDocuments({ createTime: { $gte: todayStart } }),
      WashOrder.countDocuments({ createTime: { $gte: todayStart } }),
      User.countDocuments({ createTime: { $gte: todayStart } })
    ])
    const todayOrders = todayExpress + todayErrand + todayFood + todayWash
    const revenueAgg = await ExpressOrder.aggregate([
      { $match: { status: 3 } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
    const errandRevAgg = await ErrandTask.aggregate([
      { $match: { status: 2 } },
      { $group: { _id: null, total: { $sum: { $add: ['$price', { $ifNull: ['$tip', 0] }] } } } }
    ])
    const totalRevenue = ((revenueAgg[0]?.total || 0) + (errandRevAgg[0]?.total || 0)).toFixed(2)
    res.json({
      code: 0,
      data: { totalUsers, totalOrders, todayOrders, todayUsers, totalRevenue: Number(totalRevenue), pendingWithdrawals }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 快递订单 =====
router.get('/express-orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query
    const query = {}
    if (status !== undefined && status !== '') query.status = Number(status)
    if (keyword) query.$or = [
      { pickupPoint: { $regex: keyword, $options: 'i' } },
      { building: { $regex: keyword, $options: 'i' } },
      { openid: { $regex: keyword, $options: 'i' } }
    ]
    const total = await ExpressOrder.countDocuments(query)
    const data = await ExpressOrder.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/express-orders/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['pickupPoint', 'building', 'room', 'price', 'tip', 'status', 'statusText', 'riderId']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    const statusTextMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
    if (update.status !== undefined) update.statusText = statusTextMap[update.status] || ''
    await ExpressOrder.updateOne({ _id: req.params.id }, { $set: update })
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

// ===== 跑腿任务 =====
router.get('/errand-tasks', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query
    const query = {}
    if (status !== undefined && status !== '') query.status = Number(status)
    if (keyword) query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { desc: { $regex: keyword, $options: 'i' } },
      { publisher: { $regex: keyword, $options: 'i' } }
    ]
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
    const allowed = ['title', 'desc', 'price', 'tip', 'status', 'statusText', 'riderId']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    const statusTextMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消', 4: '待确认' }
    if (update.status !== undefined) update.statusText = statusTextMap[update.status] || ''
    await ErrandTask.updateOne({ _id: req.params.id }, { $set: update })
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

// ===== 论坛帖子 =====
router.get('/forum-posts', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query
    const query = {}
    if (keyword) query.content = { $regex: keyword, $options: 'i' }
    const total = await ForumPost.countDocuments(query)
    const data = await ForumPost.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/forum-posts/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['content']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await ForumPost.updateOne({ _id: req.params.id }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/forum-posts/:id', adminAuth, async (req, res) => {
  try {
    await Promise.all([
      ForumPost.deleteOne({ _id: req.params.id }),
      ForumComment.deleteMany({ postId: req.params.id })
    ])
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 二手商品 =====
router.get('/market-goods', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query
    const query = {}
    if (keyword) query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { publisher: { $regex: keyword, $options: 'i' } }
    ]
    const total = await MarketGoods.countDocuments(query)
    const data = await MarketGoods.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/market-goods/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['title', 'desc', 'price', 'category']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await MarketGoods.updateOne({ _id: req.params.id }, { $set: update })
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

// ===== 组队活动 =====
router.get('/team-activities', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query
    const query = {}
    if (keyword) query.title = { $regex: keyword, $options: 'i' }
    const total = await TeamActivity.countDocuments(query)
    const data = await TeamActivity.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/team-activities/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['title', 'type', 'place', 'time', 'max', 'status']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await TeamActivity.updateOne({ _id: req.params.id }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/team-activities/:id', adminAuth, async (req, res) => {
  try {
    await Promise.all([
      TeamActivity.deleteOne({ _id: req.params.id }),
      TeamMember.deleteMany({ activityId: req.params.id })
    ])
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 拼车 =====
router.get('/carpool', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query
    const query = {}
    if (keyword) query.$or = [
      { from: { $regex: keyword, $options: 'i' } },
      { to: { $regex: keyword, $options: 'i' } }
    ]
    const total = await Carpool.countDocuments(query)
    const data = await Carpool.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/carpool/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['from', 'to', 'departTime', 'maxPeople', 'remark']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await Carpool.updateOne({ _id: req.params.id }, { $set: update })
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

// ===== 技能 =====
router.get('/skills', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query
    const query = {}
    if (keyword) query.title = { $regex: keyword, $options: 'i' }
    const total = await Skill.countDocuments(query)
    const data = await Skill.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/skills/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['title', 'category', 'desc', 'price', 'priceUnit']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await Skill.updateOne({ _id: req.params.id }, { $set: update })
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
    const { page = 1, pageSize = 20, keyword } = req.query
    const query = {}
    if (keyword) query.$or = [
      { title: { $regex: keyword, $options: 'i' } },
      { content: { $regex: keyword, $options: 'i' } }
    ]
    const total = await Message.countDocuments(query)
    const data = await Message.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/messages', adminAuth, async (req, res) => {
  try {
    const { toOpenid, title, content } = req.body
    if (!title && !content) return res.json({ code: -1, msg: '标题或内容不能为空' })
    if (toOpenid) {
      await Message.create({ type: 'system', title, content, toOpenid, fromName: '系统管理员', fromOpenid: 'admin', createTime: new Date() })
    } else {
      const users = await User.find({}, 'openid')
      const msgs = users.map(u => ({
        type: 'system', title, content, toOpenid: u.openid,
        fromName: '系统管理员', fromOpenid: 'admin', createTime: new Date()
      }))
      if (msgs.length) await Message.insertMany(msgs)
    }
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

// ===== 提现管理 =====
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const query = {}
    if (status !== undefined && status !== '') query.status = Number(status)
    const total = await WalletWithdrawal.countDocuments(query)
    const data = await WalletWithdrawal.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))

    // populate 用户信息
    const enriched = []
    for (const w of data) {
      const wObj = w.toObject()
      const u = await User.findOne({ openid: w.openid })
      wObj.userInfo = u ? { name: u.name || '', avatar: u.avatar || '', phone: u.phone || '' } : {}
      enriched.push(wObj)
    }
    res.json({ code: 0, data: enriched, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/withdrawals/:id/approve', adminAuth, async (req, res) => {
  try {
    const w = await WalletWithdrawal.findById(req.params.id)
    if (!w) return res.json({ code: -1, msg: '记录不存在' })
    if (w.status !== 0) return res.json({ code: -1, msg: '该记录已处理' })
    await WalletWithdrawal.updateOne({ _id: req.params.id }, {
      $set: { status: 3, paidTime: new Date(), paidBy: 'admin' }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/withdrawals/:id/reject', adminAuth, async (req, res) => {
  try {
    const w = await WalletWithdrawal.findById(req.params.id)
    if (!w) return res.json({ code: -1, msg: '记录不存在' })
    if (w.status !== 0) return res.json({ code: -1, msg: '该记录已处理' })
    // 拒绝时退还余额
    const UserWallet = require('../models/UserWallet')
    await UserWallet.updateOne({ openid: w.openid }, {
      $inc: { balance: w.amount },
      $set: { updateTime: new Date() }
    }, { upsert: true })
    await WalletWithdrawal.updateOne({ _id: req.params.id }, {
      $set: { status: 2, statusText: '已拒绝', handleTime: new Date(), rejectReason: req.body.reason || '' }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 美食管理 =====
router.get('/food/shops', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword } = req.query
    const query = {}
    if (keyword) query.name = { $regex: keyword, $options: 'i' }
    const total = await FoodShop.countDocuments(query)
    const data = await FoodShop.find(query).sort({ sort: -1, createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/food/shops', adminAuth, async (req, res) => {
  try {
    const { name, logo, category, phone, address, deliveryFee, minOrder, openTime, closeTime, status, sort } = req.body
    if (!name) return res.json({ code: -1, msg: '商家名称不能为空' })
    await FoodShop.create({ name, logo, category, phone, address, deliveryFee: Number(deliveryFee) || 0, minOrder: Number(minOrder) || 0, openTime, closeTime, status: status ?? 1, sort: Number(sort) || 0 })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/food/shops/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['name', 'logo', 'category', 'phone', 'address', 'deliveryFee', 'minOrder', 'openTime', 'closeTime', 'status', 'sort']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await FoodShop.updateOne({ _id: req.params.id }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/food/shops/:id', adminAuth, async (req, res) => {
  try {
    await Promise.all([
      FoodShop.deleteOne({ _id: req.params.id }),
      FoodItem.deleteMany({ shopId: req.params.id })
    ])
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.get('/food/items', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 50, shopId, keyword } = req.query
    const query = {}
    if (shopId) query.shopId = shopId
    if (keyword) query.name = { $regex: keyword, $options: 'i' }
    const total = await FoodItem.countDocuments(query)
    const data = await FoodItem.find(query).sort({ sort: -1, createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/food/items', adminAuth, async (req, res) => {
  try {
    const { shopId, name, image, price, category, desc, status, sort } = req.body
    if (!shopId || !name) return res.json({ code: -1, msg: '商家和菜品名称不能为空' })
    await FoodItem.create({ shopId, name, image, price: Number(price) || 0, category, desc, status: status ?? 1, sort: Number(sort) || 0 })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/food/items/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['name', 'image', 'price', 'category', 'desc', 'status', 'sort']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await FoodItem.updateOne({ _id: req.params.id }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/food/items/:id', adminAuth, async (req, res) => {
  try {
    await FoodItem.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.get('/food/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, shopId } = req.query
    const query = {}
    if (status !== undefined && status !== '') query.status = Number(status)
    if (shopId) query.shopId = shopId
    const total = await FoodOrder.countDocuments(query)
    const data = await FoodOrder.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/food/orders/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['status', 'statusText']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    const statusTextMap = { 0: '待确认', 1: '已确认', 2: '配送中', 3: '已完成', 4: '已取消' }
    if (update.status !== undefined) update.statusText = statusTextMap[update.status] || ''
    await FoodOrder.updateOne({ _id: req.params.id }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 洗护管理 =====
router.get('/wash/products', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const total = await WashProduct.countDocuments()
    const data = await WashProduct.find().sort({ sort: -1, createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/wash/products', adminAuth, async (req, res) => {
  try {
    const { name, desc, image, originalPrice, groupPrice, groupSize, status, sort } = req.body
    if (!name) return res.json({ code: -1, msg: '商品名称不能为空' })
    await WashProduct.create({ name, desc, image, originalPrice: Number(originalPrice) || 0, groupPrice: Number(groupPrice) || 0, groupSize: Number(groupSize) || 3, status: status ?? 1, sort: Number(sort) || 0 })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/wash/products/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['name', 'desc', 'image', 'originalPrice', 'groupPrice', 'groupSize', 'status', 'sort']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    await WashProduct.updateOne({ _id: req.params.id }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/wash/products/:id', adminAuth, async (req, res) => {
  try {
    await WashProduct.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.get('/wash/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const query = {}
    if (status !== undefined && status !== '') query.status = Number(status)
    const total = await WashOrder.countDocuments(query)
    const data = await WashOrder.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/wash/orders/:id', adminAuth, async (req, res) => {
  try {
    const allowed = ['status', 'statusText']
    const update = {}
    for (const k of allowed) { if (req.body[k] !== undefined) update[k] = req.body[k] }
    const statusTextMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
    if (update.status !== undefined) update.statusText = statusTextMap[update.status] || ''
    await WashOrder.updateOne({ _id: req.params.id }, { $set: update })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 数据分析 =====
router.get('/analytics/overview', adminAuth, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7
    const result = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1)
      const range = { createTime: { $gte: start, $lt: end } }
      const [express, errand, food, wash, newUsers] = await Promise.all([
        ExpressOrder.countDocuments(range),
        ErrandTask.countDocuments(range),
        FoodOrder.countDocuments(range),
        WashOrder.countDocuments(range),
        User.countDocuments(range)
      ])
      result.push({
        date: start.toISOString().slice(0, 10),
        orders: express + errand + food + wash,
        express, errand, food, wash, newUsers
      })
    }
    res.json({ code: 0, data: result })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.get('/analytics/revenue', adminAuth, async (req, res) => {
  try {
    const days = Number(req.query.days) || 7
    const result = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1)
      const range = { createTime: { $gte: start, $lt: end } }
      const [expAgg, errAgg, foodAgg] = await Promise.all([
        ExpressOrder.aggregate([{ $match: { ...range, status: 3 } }, { $group: { _id: null, t: { $sum: '$totalPrice' } } }]),
        ErrandTask.aggregate([{ $match: { ...range, status: 2 } }, { $group: { _id: null, t: { $sum: { $add: ['$price', { $ifNull: ['$tip', 0] }] } } } }]),
        FoodOrder.aggregate([{ $match: { ...range, status: 3 } }, { $group: { _id: null, t: { $sum: '$totalPrice' } } }])
      ])
      result.push({
        date: start.toISOString().slice(0, 10),
        revenue: Number(((expAgg[0]?.t || 0) + (errAgg[0]?.t || 0) + (foodAgg[0]?.t || 0)).toFixed(2))
      })
    }
    res.json({ code: 0, data: result })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 首页/福利页配置 =====
router.get('/home-config', adminAuth, async (req, res) => {
  try {
    let cfg = await PageConfig.findOne({ page: 'home' })
    if (!cfg) cfg = { page: 'home', sections: [], config: {} }
    res.json({ code: 0, data: cfg })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/home-config', adminAuth, async (req, res) => {
  try {
    const { sections, config } = req.body
    const update = { updateTime: new Date() }
    if (sections) update.sections = sections
    if (config) update.config = config
    await saveConfigHistory('home', req.admin?.username || 'admin')
    await PageConfig.updateOne({ page: 'home' }, { $set: update }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.get('/welfare-config', adminAuth, async (req, res) => {
  try {
    let cfg = await PageConfig.findOne({ page: 'welfare' })
    if (!cfg) cfg = { page: 'welfare', sections: [], config: {} }
    res.json({ code: 0, data: cfg })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/welfare-config', adminAuth, async (req, res) => {
  try {
    const { sections, config } = req.body
    const update = { updateTime: new Date() }
    if (sections) update.sections = sections
    if (config) update.config = config
    await saveConfigHistory('welfare', req.admin?.username || 'admin')
    await PageConfig.updateOne({ page: 'welfare' }, { $set: update }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.get('/job-config', adminAuth, async (req, res) => {
  try {
    let cfg = await PageConfig.findOne({ page: 'job' })
    if (!cfg) cfg = { page: 'job', sections: [], config: {} }
    res.json({ code: 0, data: cfg })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/job-config', adminAuth, async (req, res) => {
  try {
    const { config } = req.body
    const update = { updateTime: new Date() }
    if (config) update.config = config
    await saveConfigHistory('job', req.admin?.username || 'admin')
    await PageConfig.updateOne({ page: 'job' }, { $set: update }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 价格配置 =====
router.get('/price-config', adminAuth, async (req, res) => {
  try {
    let cfg = await PageConfig.findOne({ page: 'price' })
    if (!cfg) cfg = { page: 'price', config: {} }
    res.json({ code: 0, data: cfg })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/price-config', adminAuth, async (req, res) => {
  try {
    const { config } = req.body
    const update = { updateTime: new Date() }
    if (config) update.config = config
    await saveConfigHistory('price', req.admin?.username || 'admin')
    await PageConfig.updateOne({ page: 'price' }, { $set: update }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 管理员图片上传 =====
const uploadDir = path.join(__dirname, '../uploads/')
const adminUpload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file || !file.mimetype) return cb(new Error('无效的文件'))
    // 统一放宽为所有 image/*，避免某些浏览器/工具对 GIF/WebP 使用非常见 mime 导致上传失败
    if (file.mimetype.startsWith('image/')) return cb(null, true)
    cb(new Error('仅支持图片文件'))
  }
})

router.post('/upload', adminAuth, adminUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.json({ code: -1, msg: '未选择文件' })
    const ext = path.extname(req.file.originalname) || '.jpg'
    const fname = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext
    const folder = req.query.folder || 'admin'
    const destDir = path.join(uploadDir, folder)
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
    fs.renameSync(req.file.path, path.join(destDir, fname))
    const url = '/uploads/' + folder + '/' + fname
    res.json({ code: 0, data: { url } })
  } catch (err) {
    console.error('[/admin/upload] error:', err)
    if (req.file?.path) try { fs.unlinkSync(req.file.path) } catch (e) { }
    res.status(500).json({ code: -1, msg: '上传失败' })
  }
})

// ===== 兼职管理 =====
router.get('/jobs', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 50, category, keyword } = req.query
    const query = {}
    if (category) query.category = category
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { company: { $regex: keyword, $options: 'i' } }
      ]
    }
    const total = await JobPost.countDocuments(query)
    const data = await JobPost.find(query).sort({ sort: 1, createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data, total })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/jobs', adminAuth, async (req, res) => {
  try {
    const job = await JobPost.create(req.body)
    res.json({ code: 0, data: job })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '创建失败' })
  }
})

router.put('/jobs/:id', adminAuth, async (req, res) => {
  try {
    await JobPost.updateOne({ _id: req.params.id }, { $set: req.body })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '更新失败' })
  }
})

router.delete('/jobs/:id', adminAuth, async (req, res) => {
  try {
    await JobPost.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '删除失败' })
  }
})
// ===== 屏蔽词管理 =====
router.get('/banned-words', adminAuth, async (req, res) => {
  try {
    const cfg = await PageConfig.findOne({ page: 'bannedWords' })
    const words = (cfg && cfg.config && cfg.config.words) || []
    res.json({ code: 0, data: { words } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/banned-words', adminAuth, async (req, res) => {
  try {
    const { words } = req.body
    if (!Array.isArray(words)) return res.json({ code: -1, msg: '参数格式错误' })
    // 过滤空字符串，去重，去除前后空格
    const cleanWords = [...new Set(words.map(w => (w || '').trim()).filter(w => w.length > 0))]
    await saveConfigHistory('bannedWords', req.admin?.username || 'admin')
    await PageConfig.updateOne(
      { page: 'bannedWords' },
      { $set: { page: 'bannedWords', config: { words: cleanWords }, updateTime: new Date() } },
      { upsert: true }
    )
    // 清除内存缓存
    const { clearBannedWordsCache } = require('../services/wechat')
    clearBannedWordsCache()
    res.json({ code: 0, msg: `已保存 ${cleanWords.length} 个屏蔽词` })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// 小程序端管理屏蔽词
router.post('/get-banned-words', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const cfg = await PageConfig.findOne({ page: 'bannedWords' })
    const words = (cfg && cfg.config && cfg.config.words) || []
    res.json({ code: 0, data: { words } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/save-banned-words', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { words } = req.body
    if (!Array.isArray(words)) return res.json({ code: -1, msg: '参数格式错误' })
    const cleanWords = [...new Set(words.map(w => (w || '').trim()).filter(w => w.length > 0))]
    await saveConfigHistory('bannedWords', 'mp-admin')
    await PageConfig.updateOne(
      { page: 'bannedWords' },
      { $set: { page: 'bannedWords', config: { words: cleanWords }, updateTime: new Date() } },
      { upsert: true }
    )
    const { clearBannedWordsCache } = require('../services/wechat')
    clearBannedWordsCache()
    res.json({ code: 0, msg: `已保存 ${cleanWords.length} 个屏蔽词` })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 骑手审核 =====
router.get('/rider-applications', adminAuth, async (req, res) => {
  try {
    const { status = 'pending' } = req.query
    const query = {}
    if (status === 'pending') query.riderStatus = 'pending'
    else if (status === 'approved') query.riderStatus = 'approved'
    else if (status === 'rejected') query.riderStatus = 'rejected'
    else query.riderStatus = { $in: ['pending', 'approved', 'rejected'] }
    const data = await User.find(query).sort({ riderRegTime: -1 }).limit(100)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/rider-applications/:id/approve', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.json({ code: -1, msg: '用户不存在' })
    await User.updateOne({ _id: req.params.id }, {
      $set: { isRider: true, riderStatus: 'approved' }
    })
    // 通知用户
    await Message.create({
      toOpenid: user.openid, fromOpenid: 'system', fromName: '系统管理员',
      type: 'system', title: '骑手注册审核通过',
      content: '恭喜！您的骑手注册申请已通过审核，现在可以开始接单了。',
      targetId: '', targetType: 'system', read: false, createTime: new Date()
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/rider-applications/:id/reject', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.json({ code: -1, msg: '用户不存在' })
    await User.updateOne({ _id: req.params.id }, {
      $set: { riderStatus: 'rejected' }
    })
    await Message.create({
      toOpenid: user.openid, fromOpenid: 'system', fromName: '系统管理员',
      type: 'system', title: '骑手注册审核未通过',
      content: '您的骑手注册申请未通过审核，请确认信息后重新申请。' + (req.body.reason ? '原因：' + req.body.reason : ''),
      targetId: '', targetType: 'system', read: false, createTime: new Date()
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 内容审核 =====
router.get('/pending-reviews', adminAuth, async (req, res) => {
  try {
    const [express, errand, market, forum, skill, tutor] = await Promise.all([
      ExpressOrder.find({ reviewStatus: 'pending' }).sort({ createTime: -1 }).limit(50),
      ErrandTask.find({ reviewStatus: 'pending' }).sort({ createTime: -1 }).limit(50),
      MarketGoods.find({ reviewStatus: 'pending' }).sort({ createTime: -1 }).limit(50),
      ForumPost.find({ reviewStatus: 'pending' }).sort({ createTime: -1 }).limit(50),
      Skill.find({ reviewStatus: 'pending' }).sort({ createTime: -1 }).limit(50),
      TutorPost.find({ reviewStatus: 'pending' }).sort({ createTime: -1 }).limit(50)
    ])
    res.json({
      code: 0,
      data: {
        express: express.map(d => ({ ...d.toObject(), _type: 'express' })),
        errand: errand.map(d => ({ ...d.toObject(), _type: 'errand' })),
        market: market.map(d => ({ ...d.toObject(), _type: 'market' })),
        forum: forum.map(d => ({ ...d.toObject(), _type: 'forum' })),
        skill: skill.map(d => ({ ...d.toObject(), _type: 'skill' })),
        tutor: tutor.map(d => ({ ...d.toObject(), _type: 'tutor' }))
      }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/review/:type/:id/approve', adminAuth, async (req, res) => {
  try {
    const modelMap = { express: ExpressOrder, errand: ErrandTask, market: MarketGoods, forum: ForumPost, skill: Skill, tutor: TutorPost }
    const Model = modelMap[req.params.type]
    if (!Model) return res.json({ code: -1, msg: '未知类型' })
    await Model.updateOne({ _id: req.params.id }, { $set: { reviewStatus: 'approved' } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/review/:type/:id/reject', adminAuth, async (req, res) => {
  try {
    const modelMap = { express: ExpressOrder, errand: ErrandTask, market: MarketGoods, forum: ForumPost, skill: Skill, tutor: TutorPost }
    const Model = modelMap[req.params.type]
    if (!Model) return res.json({ code: -1, msg: '未知类型' })
    await Model.updateOne({ _id: req.params.id }, { $set: { reviewStatus: 'rejected' } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 修改后台密码 =====
router.put('/change-password', adminAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    if (!oldPassword || !newPassword) return res.json({ code: -1, msg: '请输入旧密码和新密码' })
    if (newPassword.length < 6) return res.json({ code: -1, msg: '新密码长度至少6位' })
    const admin = await AdminUser.findById(req.admin.adminId)
    if (!admin) return res.json({ code: -1, msg: '管理员不存在' })
    const valid = await bcrypt.compare(oldPassword, admin.passwordHash)
    if (!valid) return res.json({ code: -1, msg: '旧密码错误' })
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)
    await AdminUser.updateOne({ _id: req.admin.adminId }, { $set: { passwordHash } })
    res.json({ code: 0, msg: '密码修改成功' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 骑手审核（小程序端） =====
router.post('/rider-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { status } = req.body // pending / approved / rejected
    const query = {}
    if (status === 'pending') query.riderStatus = 'pending'
    else if (status === 'rejected') query.riderStatus = 'rejected'
    else query.riderStatus = { $in: ['pending', 'rejected'] }
    const riders = await User.find(query).sort({ riderRegTime: -1 }).limit(50)
    const data = riders.map(u => ({
      _id: u._id, openid: u.openid, name: u.name || '', avatar: u.avatar || '',
      riderStatus: u.riderStatus, riderInfo: u.riderInfo || {},
      riderRegTime: u.riderRegTime, riderId: u.riderId || '',
      riderRejectReason: u.riderRejectReason || ''
    }))
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/approve-rider', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { userId } = req.body
    await User.updateOne({ _id: userId }, {
      $set: { isRider: true, riderStatus: 'approved', riderRejectReason: '' }
    })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/reject-rider', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { userId, reason } = req.body
    await User.updateOne({ _id: userId }, {
      $set: { isRider: false, riderStatus: 'rejected', riderRejectReason: reason || '资料不完整' }
    })
    // 发送消息通知
    const u = await User.findById(userId)
    if (u) {
      await Message.create({
        toOpenid: u.openid, fromOpenid: req.user.openid, fromName: '系统管理员',
        type: 'system', title: '骑手审核未通过',
        content: '您的骑手注册申请未通过审核，原因：' + (reason || '资料不完整') + '。请修改后重新提交。',
        targetId: '', targetType: 'system', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 邮政快递条幅管理（小程序端） =====
router.post('/express-banner-list', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const ExpressBanner = require('../models/ExpressBanner')
    const data = await ExpressBanner.find().sort({ createTime: -1 }).limit(20)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/review-express-banner', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const ExpressBanner = require('../models/ExpressBanner')
    const { bannerId, status } = req.body // status: 1=通过  2=拒绝
    if (!bannerId) return res.json({ code: -1, msg: '缺少条幅ID' })
    await ExpressBanner.updateOne({ _id: bannerId }, { $set: { status: Number(status) || 0 } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 外卖配送费配置 =====
router.post('/save-food-delivery-fee', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { foodDeliveryFee } = req.body
    await saveConfigHistory('price', 'mp-admin')
    await PageConfig.updateOne({ page: 'price' }, {
      $set: { 'config.foodDeliveryFee': parseFloat(foodDeliveryFee) || 0, updateTime: new Date() }
    }, { upsert: true })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// 批量更新所有商家配送费
router.put('/batch-update-shop-delivery-fee', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { deliveryFee } = req.body
    const fee = parseFloat(deliveryFee)
    if (isNaN(fee) || fee < 0) return res.json({ code: -1, msg: '配送费数值无效' })
    const result = await FoodShop.updateMany({}, { $set: { deliveryFee: fee } })
    res.json({ code: 0, msg: `已更新 ${result.modifiedCount} 个商家的配送费为 ¥${fee}` })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 配置版本历史与回滚 =====
router.get('/config-history', adminAuth, async (req, res) => {
  try {
    const { page } = req.query // 可选筛选，如 page=home
    const query = {}
    if (page) query.page = page
    const data = await ConfigHistory.find(query).sort({ createTime: -1 }).limit(100)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.get('/config-history/:id', adminAuth, async (req, res) => {
  try {
    const history = await ConfigHistory.findById(req.params.id)
    if (!history) return res.json({ code: -1, msg: '版本记录不存在' })
    res.json({ code: 0, data: history })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.put('/config-rollback/:id', adminAuth, async (req, res) => {
  try {
    const history = await ConfigHistory.findById(req.params.id)
    if (!history) return res.json({ code: -1, msg: '版本记录不存在' })

    // 回滚前先把当前的配置存为历史（这样回滚操作本身也可以被回滚）
    await saveConfigHistory(history.page, req.admin?.username || 'admin')

    // 用历史版本覆盖当前配置
    const update = {
      config: history.config || {},
      updateTime: new Date()
    }
    if (history.sections && Array.isArray(history.sections) && history.sections.length > 0) {
      update.sections = history.sections
    }
    await PageConfig.updateOne(
      { page: history.page },
      { $set: update },
      { upsert: true }
    )

    // 如果是屏蔽词回滚，清除内存缓存
    if (history.page === 'bannedWords') {
      try {
        const { clearBannedWordsCache } = require('../services/wechat')
        clearBannedWordsCache()
      } catch (e) { /* ignore */ }
    }

    res.json({ code: 0, msg: `已回滚到 v${history.version}` })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.delete('/config-history/:id', adminAuth, async (req, res) => {
  try {
    await ConfigHistory.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// ===== 条幅发布授权管理（小程序端） =====
router.post('/get-express-banner-auth', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const doc = await PageConfig.findOne({ page: 'expressBannerAuth' })
    const authorizedOpenids = (doc && doc.config && doc.config.authorizedOpenids) || []
    // 查询用户名
    const users = await User.find({ openid: { $in: authorizedOpenids } }, 'openid name avatar')
    const data = authorizedOpenids.map(oid => {
      const u = users.find(x => x.openid === oid)
      return { openid: oid, name: u ? u.name : '未知用户', avatar: u ? u.avatar : '' }
    })
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

router.post('/save-express-banner-auth', auth, async (req, res) => {
  try {
    if (!await checkAdminByOpenid(req.user.openid)) return res.json({ code: -1, msg: '无权限' })
    const { authorizedOpenids } = req.body
    if (!Array.isArray(authorizedOpenids)) return res.json({ code: -1, msg: '参数格式错误' })
    await PageConfig.updateOne(
      { page: 'expressBannerAuth' },
      { $set: { page: 'expressBannerAuth', config: { authorizedOpenids }, updateTime: new Date() } },
      { upsert: true }
    )
    res.json({ code: 0, msg: `已保存 ${authorizedOpenids.length} 个授权用户` })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router

