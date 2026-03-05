const router = require('express').Router()
const jwt = require('jsonwebtoken')
const config = require('../config')
const auth = require('../middleware/auth')
const wechatService = require('../services/wechat')
const User = require('../models/User')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const UserFavorite = require('../models/UserFavorite')
const ForumPost = require('../models/ForumPost')
const MarketGoods = require('../models/MarketGoods')
const SmsCode = require('../models/SmsCode')
const Message = require('../models/Message')

// POST /api/user/login
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.json({ code: -1, msg: 'missing code' })

    let openid
    try {
      const result = await wechatService.code2session(code)
      openid = result.openid
    } catch (wxErr) {
      // 开发模式：code2session 失败时用模拟 openid（WX_SECRET 未配置或开发者工具模拟 code）
      console.warn('code2session failed, using dev fallback:', wxErr.message)
      const crypto = require('crypto')
      openid = 'dev_' + crypto.createHash('md5').update(code).digest('hex').substring(0, 16)
    }

    let user = await User.findOne({ openid })
    let isNew = false
    if (!user) {
      user = await User.create({
        openid,
        name: '',
        avatar: '',
        phone: '',
        isRider: false,
        riderId: '',
        level: 'Lv.1 新手',
        createTime: new Date()
      })
      isNew = true
    }

    const token = jwt.sign(
      { openid: user.openid, userId: user._id.toString() },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    res.json({ code: 0, data: { token, userInfo: user, isNew } })
  } catch (err) {
    console.error('Login error:', err)
    res.json({ code: -1, msg: '微信登录失败' })
  }
})

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findOne({ openid: req.user.openid })
    if (!user) return res.json({ code: -1, msg: 'user not found' })
    res.json({ code: 0, data: user })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar, phone } = req.body
    if (name) {
      const { checkContent } = require('../services/wechat')
      const safe = await checkContent(req.user.openid, name, 1)
      if (!safe) return res.json({ code: -1, msg: '昵称包含违规内容，请修改' })
    }
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar
    if (phone !== undefined) updateData.phone = phone
    await User.updateOne({ openid: req.user.openid }, { $set: updateData })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/user/register-rider
router.post('/register-rider', auth, async (req, res) => {
  try {
    const { realName, phone, studentId, building } = req.body
    if (!realName || !phone || !studentId) {
      return res.json({ code: -1, msg: 'missing fields' })
    }
    const riderId = 'R-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      '-' + String(Math.floor(Math.random() * 100)).padStart(2, '0')
    await User.updateOne({ openid: req.user.openid }, {
      $set: {
        isRider: true,
        riderId,
        riderInfo: { realName, phone, studentId, building },
        riderRegTime: new Date()
      }
    })
    res.json({ code: 0, riderId })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/user/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const openid = req.user.openid
    const [publishedExpress, takenExpress, publishedErrand, takenErrand] = await Promise.all([
      ExpressOrder.countDocuments({ openid }),
      ExpressOrder.countDocuments({ riderId: openid }),
      ErrandTask.countDocuments({ openid }),
      ErrandTask.countDocuments({ riderId: openid })
    ])

    // 计算收入
    const [completedExpress, completedErrand] = await Promise.all([
      ExpressOrder.find({ riderId: openid, status: 3 }, 'price tip'),
      ErrandTask.find({ riderId: openid, status: 2 }, 'price')
    ])
    let income = 0
    completedExpress.forEach(o => { income += (o.price || 0) + (o.tip || 0) })
    completedErrand.forEach(o => { income += (o.price || 0) })

    res.json({
      code: 0,
      data: {
        publishedCount: publishedExpress + publishedErrand,
        takenCount: takenExpress + takenErrand,
        income
      }
    })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/user/favorite
router.post('/favorite', auth, async (req, res) => {
  try {
    const { targetId, targetType } = req.body
    if (!targetId || !targetType) return res.json({ code: -1, msg: 'missing fields' })
    const openid = req.user.openid
    const existing = await UserFavorite.findOne({ openid, targetId, targetType })
    if (existing) {
      await UserFavorite.deleteOne({ _id: existing._id })
      return res.json({ code: 0, favorited: false })
    }
    await UserFavorite.create({ openid, targetId, targetType, createTime: new Date() })
    res.json({ code: 0, favorited: true })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/user/favorite/check
router.get('/favorite/check', auth, async (req, res) => {
  try {
    const { targetId, targetType } = req.query
    const count = await UserFavorite.countDocuments({ openid: req.user.openid, targetId, targetType })
    res.json({ code: 0, favorited: count > 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/user/favorites
router.get('/favorites', auth, async (req, res) => {
  try {
    const favs = await UserFavorite.find({ openid: req.user.openid })
      .sort({ createTime: -1 }).limit(50)
    const result = []
    for (const fav of favs) {
      const item = { _id: fav._id, targetId: fav.targetId, targetType: fav.targetType, createTime: fav.createTime }
      try {
        if (fav.targetType === 'post') {
          const post = await ForumPost.findById(fav.targetId)
          item.title = post ? (post.content || '').substring(0, 40) : '内容已删除'
          item.extra = post ? (post.nickname || '匿名') : ''
        } else if (fav.targetType === 'goods') {
          const goods = await MarketGoods.findById(fav.targetId)
          item.title = goods ? (goods.title || '') : '内容已删除'
          item.extra = goods ? ('¥' + (goods.price || 0)) : ''
        }
      } catch (e) {
        item.title = '内容已删除'
        item.extra = ''
      }
      result.push(item)
    }
    res.json({ code: 0, data: result })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/user/sms/send
router.post('/sms/send', auth, async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({ code: -1, msg: '手机号格式不正确' })
    }
    let code = ''
    for (let i = 0; i < 6; i++) code += String(Math.floor(Math.random() * 10))
    const expireAt = Date.now() + 5 * 60 * 1000

    await SmsCode.deleteMany({ phone })
    await SmsCode.create({ phone, code, expireAt, createTime: new Date() })

    // TODO: 接入短信 API
    console.log('[SMS TEST] phone:', phone, 'code:', code)

    res.json({ code: 0, msg: '验证码已发送' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/user/sms/verify
router.post('/sms/verify', auth, async (req, res) => {
  try {
    const { phone, smsCode } = req.body
    if (!phone || !smsCode) return res.json({ code: -1, msg: '参数缺失' })
    const rec = await SmsCode.findOne({ phone }).sort({ createTime: -1 })
    if (!rec) return res.json({ code: -1, msg: '请先获取验证码' })
    if (Date.now() > rec.expireAt) return res.json({ code: -1, msg: '验证码已过期，请重新获取' })
    // 开发模式：万能验证码 000000
    if (rec.code !== smsCode && smsCode !== '000000') return res.json({ code: -1, msg: '验证码错误' })
    await SmsCode.deleteOne({ _id: rec._id })
    res.json({ code: 0, msg: '验证通过' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/user/phone-by-code
router.post('/phone-by-code', auth, async (req, res) => {
  try {
    const { code } = req.body
    if (!code) return res.json({ code: -1, msg: '缺少code' })
    const result = await wechatService.getPhoneNumber(code)
    res.json({ code: 0, data: { phone: result.phone } })
  } catch (err) {
    console.error('getPhoneByCode error:', err.message)
    res.json({ code: -1, msg: 'Error: ' + err.message })
  }
})
// POST /api/user/getWallet
router.post('/getWallet', auth, async (req, res) => {
  try {
    const UserWallet = require('../models/UserWallet')
    let wallet = await UserWallet.findOne({ openid: req.user.openid })
    if (!wallet) {
      wallet = await UserWallet.create({ openid: req.user.openid, balance: 0, totalIncome: 0 })
    }
    res.json({ code: 0, data: wallet })
  } catch (err) {
    console.error('getWallet error:', err)
    res.status(500).json({ code: -1, msg: '获取钱包失败' })
  }
})

module.exports = router
