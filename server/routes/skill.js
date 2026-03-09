const router = require('express').Router()
const auth = require('../middleware/auth')
const Skill = require('../models/Skill')
const User = require('../models/User')
const SkillUnlock = require('../models/SkillUnlock')
const UserWallet = require('../models/UserWallet')
const WalletRecord = require('../models/WalletRecord')

const UNLOCK_PRICE = 1 // 解锁联系方式费用

// GET /api/skill/list
router.get('/list', async (req, res) => {
  try {
    const { category, keyword } = req.query
    const query = { status: 0 }
    if (category && category !== '全部') query.category = category
    if (keyword) query.title = { $regex: keyword, $options: 'i' }
    const data = await Skill.find(query).sort({ createTime: -1 }).limit(20)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/skill/my（必须在 /:id 之前）
router.get('/my', auth, async (req, res) => {
  try {
    const data = await Skill.find({ openid: req.user.openid }).sort({ createTime: -1 }).limit(20)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/skill/:id
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
    if (!skill) return res.json({ code: -1, msg: '记录不存在' })
    await Skill.updateOne({ _id: req.params.id }, { $inc: { views: 1 } })
    const data = skill.toObject()
    // 检查当前用户是否已解锁
    const token = req.headers.authorization && req.headers.authorization.replace('Bearer ', '')
    if (token) {
      try {
        const jwt = require('jsonwebtoken')
        const config = require('../config')
        const decoded = jwt.verify(token, config.jwtSecret)
        if (decoded.openid === skill.openid) {
          data.unlocked = true // 自己的技能直接显示
        } else {
          const existing = await SkillUnlock.findOne({ openid: decoded.openid, skillId: req.params.id })
          data.unlocked = !!existing
        }
        if (!data.unlocked) {
          data.contact = '' // 未解锁时隐藏联系方式
          data.contactType = ''
        }
      } catch (e) { /* token 无效则不解锁 */ }
    } else {
      data.unlocked = false
      data.contact = ''
      data.contactType = ''
    }
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/skill
router.post('/', auth, async (req, res) => {
  try {
    const { title, category, desc, price, priceUnit, works, contact, contactType } = req.body
    if (!title || !title.trim()) return res.json({ code: -1, msg: '请填写技能标题' })
    if (title.length > 50) return res.json({ code: -1, msg: '标题过长' })
    if (!contact || !contact.trim()) return res.json({ code: -1, msg: '请填写联系方式' })
    if (price !== undefined && (isNaN(price) || price < 0)) return res.json({ code: -1, msg: '价格不合法' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    const skill = await Skill.create({
      openid: req.user.openid, publisher: userName, title, category: category || '其他',
      desc: desc || '', price: price || 0, priceUnit: priceUnit || '次',
      works: works || [], contact: contact || '', contactType: contactType || '微信',
      status: 0, views: 0, createTime: new Date()
    })
    res.json({ code: 0, data: { id: skill._id } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/skill/:id/unlock
router.post('/:id/unlock', auth, async (req, res) => {
  try {
    const { payType } = req.body
    const skill = await Skill.findById(req.params.id)
    if (!skill) return res.json({ code: -1, msg: '记录不存在' })
    // 自己发布的直接返回
    if (skill.openid === req.user.openid) {
      return res.json({ code: 0, data: { contact: skill.contact, contactType: skill.contactType } })
    }
    // 检查是否已解锁（避免重复扣费）
    const existing = await SkillUnlock.findOne({ openid: req.user.openid, skillId: req.params.id })
    if (existing) {
      return res.json({ code: 0, data: { contact: skill.contact, contactType: skill.contactType } })
    }

    // 微信支付
    if (payType === 'wechat') {
      const outTradeNo = 'skill_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
      // 先记录待支付的解锁记录
      await SkillUnlock.create({ openid: req.user.openid, skillId: req.params.id, amount: UNLOCK_PRICE, outTradeNo, paid: false })
      const { createJSAPIOrder } = require('../services/wxpay')
      const payment = await createJSAPIOrder(
        req.user.openid,
        outTradeNo,
        Math.round(UNLOCK_PRICE * 100),
        '解锁技能联系方式'
      )
      return res.json({ code: 0, payment })
    }

    // 钱包支付（默认）
    let wallet = await UserWallet.findOne({ openid: req.user.openid })
    if (!wallet) {
      wallet = await UserWallet.create({ openid: req.user.openid, balance: 0, totalIncome: 0 })
    }
    if (wallet.balance < UNLOCK_PRICE) {
      return res.json({ code: -1, msg: '钱包余额不足，需要 ¥' + UNLOCK_PRICE })
    }
    // 扣款
    await UserWallet.updateOne(
      { openid: req.user.openid },
      { $inc: { balance: -UNLOCK_PRICE }, $set: { updateTime: new Date() } }
    )
    // 记录流水
    await WalletRecord.create({
      openid: req.user.openid, type: 'income', amount: -UNLOCK_PRICE,
      title: '解锁技能联系方式: ' + (skill.title || '').substring(0, 20),
      orderId: req.params.id, orderType: 'skill_unlock',
      status: 1, statusText: '已扣款', createTime: new Date()
    })
    // 收入给技能发布者
    await UserWallet.updateOne(
      { openid: skill.openid },
      { $inc: { balance: UNLOCK_PRICE, totalIncome: UNLOCK_PRICE }, $set: { updateTime: new Date() } },
      { upsert: true }
    )
    await WalletRecord.create({
      openid: skill.openid, type: 'income', amount: UNLOCK_PRICE,
      title: '技能被解锁收入: ' + (skill.title || '').substring(0, 20),
      orderId: req.params.id, orderType: 'skill_unlock',
      status: 1, statusText: '已到账', createTime: new Date()
    })
    // 记录解锁关系
    await SkillUnlock.create({ openid: req.user.openid, skillId: req.params.id, amount: UNLOCK_PRICE })
    res.json({ code: 0, data: { contact: skill.contact, contactType: skill.contactType } })
  } catch (err) {
    console.error('skill unlock error:', err)
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router

