const router = require('express').Router()
const auth = require('../middleware/auth')
const { checkContent } = require('../services/wechat')
const MarketGoods = require('../models/MarketGoods')
const User = require('../models/User')

// GET /api/market/list
router.get('/list', async (req, res) => {
  try {
    const { category, keyword, page = 1, pageSize = 10 } = req.query
    const query = {}
    if (category && category !== '全部') query.category = category
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { desc: { $regex: keyword, $options: 'i' } }
      ]
    }
    const data = await MarketGoods.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/market/my
router.get('/my', auth, async (req, res) => {
  try {
    const data = await MarketGoods.find({ openid: req.user.openid }).sort({ createTime: -1 }).limit(20)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/market/:id
router.get('/:id', async (req, res) => {
  try {
    const goods = await MarketGoods.findById(req.params.id)
    if (!goods) return res.json({ code: -1, msg: '记录不存在' })
    await MarketGoods.updateOne({ _id: req.params.id }, { $inc: { views: 1 } })
    res.json({ code: 0, data: goods })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/market
router.post('/', auth, async (req, res) => {
  try {
    const { title, desc, price, category, images, deliveryType, contact, contactPublic } = req.body
    if (!title || !price) return res.json({ code: -1, msg: 'missing fields' })
    const textToCheck = (title || '') + ' ' + (desc || '')
    const safe = await checkContent(req.user.openid, textToCheck, 4)
    if (!safe) return res.json({ code: -1, msg: '内容包含违规信息，请修改后重新发布' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    const deliveryText = deliveryType === 1 ? '包配送' : '自提'
    const goods = await MarketGoods.create({
      openid: req.user.openid, title, desc: desc || '', price: Number(price),
      category: category || '其他', images: images || [], deliveryType: deliveryType || 0,
      deliveryText, contact: contact || '', contactPublic: contactPublic === 0 ? 0 : 1,
      views: 0, wants: 0, publisher: userName, status: 'active', createTime: new Date()
    })
    res.json({ code: 0, id: goods._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/market/:id/want
router.post('/:id/want', auth, async (req, res) => {
  try {
    await MarketGoods.updateOne({ _id: req.params.id }, { $inc: { wants: 1 } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// DELETE /api/market/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const goods = await MarketGoods.findById(req.params.id)
    if (!goods) return res.json({ code: -1, msg: '记录不存在' })
    if (goods.openid !== req.user.openid) return res.json({ code: -1, msg: '仅发布者可删除' })
    await MarketGoods.deleteOne({ _id: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
