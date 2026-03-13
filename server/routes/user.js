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
      return res.json({ code: -1, msg: '请填写完整信息' })
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) return res.json({ code: -1, msg: '手机号格式不正确' })
    if (realName.length > 20) return res.json({ code: -1, msg: '姓名过长' })
    if (!/^\d{12}$/.test(studentId)) return res.json({ code: -1, msg: '学号必须为12位数字' })
    const riderId = 'R-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      '-' + String(Math.floor(Math.random() * 100)).padStart(2, '0')
    // 检查是否已提交过申请
    const existingUser = await User.findOne({ openid: req.user.openid })
    if (existingUser && existingUser.riderStatus === 'pending') {
      return res.json({ code: -1, msg: '您已提交注册申请，请等待审核' })
    }
    if (existingUser && existingUser.isRider) {
      return res.json({ code: -1, msg: '您已是骑手，无需重复注册' })
    }
    // rejected 状态允许重新提交
    await User.updateOne({ openid: req.user.openid }, {
      $set: {
        riderStatus: 'pending',
        riderId,
        riderInfo: { realName, phone, studentId, building },
        riderRegTime: new Date(),
        riderRejectReason: ''
      }
    })
    res.json({ code: 0, riderId, msg: '注册申请已提交，请等待管理员审核' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/user/rider-status — 获取骑手审核状态
router.get('/rider-status', auth, async (req, res) => {
  try {
    const user = await User.findOne({ openid: req.user.openid })
    if (!user) return res.json({ code: 0, data: { status: 'none' } })
    res.json({
      code: 0,
      data: {
        status: user.riderStatus || 'none',
        rejectReason: user.riderRejectReason || '',
        isRider: !!user.isRider
      }
    })
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
    if (rec.code !== smsCode) return res.json({ code: -1, msg: '验证码错误' })
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
    res.json({ code: -1, msg: '获取手机号失败，请重试' })
  }
})
// POST /api/user/getWallet
router.post('/getWallet', auth, async (req, res) => {
  try {
    const UserWallet = require('../models/UserWallet')
    const WalletRecord = require('../models/WalletRecord')
    const WalletWithdrawal = require('../models/WalletWithdrawal')
    let wallet = await UserWallet.findOne({ openid: req.user.openid })
    if (!wallet) {
      wallet = await UserWallet.create({ openid: req.user.openid, balance: 0, totalIncome: 0 })
    }
    // 查询收入记录
    const incomeRecords = await WalletRecord.find({ openid: req.user.openid })
      .sort({ createTime: -1 }).limit(50).lean()
    // 查询提现记录
    const withdrawRecords = await WalletWithdrawal.find({ openid: req.user.openid })
      .sort({ createTime: -1 }).limit(50).lean()
    // 合并并排序
    const records = [
      ...incomeRecords.map(r => ({ ...r, type: 'income' })),
      ...withdrawRecords.map(r => ({ ...r, type: 'withdraw' }))
    ].sort((a, b) => new Date(b.createTime) - new Date(a.createTime)).slice(0, 50)
    // 计算提现中金额和累计提现
    const pendingWithdraw = withdrawRecords
      .filter(r => r.status === 0)
      .reduce((s, r) => s + (r.amount || 0), 0)
    const totalWithdraw = withdrawRecords
      .filter(r => r.status === 1)
      .reduce((s, r) => s + (r.amount || 0), 0)
    res.json({
      code: 0,
      data: {
        balance: wallet.balance || 0,
        totalIncome: wallet.totalIncome || 0,
        totalWithdraw,
        pendingWithdraw,
        records
      }
    })
  } catch (err) {
    console.error('getWallet error:', err)
    res.status(500).json({ code: -1, msg: '获取钱包失败' })
  }
})

// POST /api/user/applyWithdraw
router.post('/applyWithdraw', auth, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || isNaN(amount) || amount < 100) {
      return res.json({ code: -1, msg: '最低提现金额为100元' })
    }
    const UserWallet = require('../models/UserWallet')
    const WalletWithdrawal = require('../models/WalletWithdrawal')
    const User = require('../models/User')
    const wallet = await UserWallet.findOne({ openid: req.user.openid })
    if (!wallet || wallet.balance < amount) {
      return res.json({ code: -1, msg: '余额不足' })
    }
    const pendingCount = await WalletWithdrawal.countDocuments({ openid: req.user.openid, status: 0 })
    if (pendingCount > 0) return res.json({ code: -1, msg: '您有待提现的申请，请先完成后再申请' })

    // 生成提现凭证编号: TX + 日期 + 4位随机
    const now = new Date()
    const dateStr = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0')
    const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    const withdrawCode = 'TX' + dateStr + rand

    // 获取用户信息
    const user = await User.findOne({ openid: req.user.openid })
    const userName = (user && user.name) || '用户'

    await UserWallet.updateOne({ openid: req.user.openid }, {
      $inc: { balance: -amount },
      $set: { updateTime: new Date() }
    })
    const withdrawal = await WalletWithdrawal.create({
      openid: req.user.openid,
      amount,
      withdrawCode,
      userName,
      status: 0,
      createTime: now
    })
    res.json({
      code: 0,
      msg: '提现申请已提交，请联系管理员提现',
      data: {
        withdrawId: withdrawal._id,
        withdrawCode,
        amount,
        userName,
        createTime: now.toISOString()
      }
    })
  } catch (err) {
    console.error('applyWithdraw error:', err)
    res.status(500).json({ code: -1, msg: '提现失败，请重试' })
  }
})

module.exports = router
