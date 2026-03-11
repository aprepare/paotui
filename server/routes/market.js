const router = require('express').Router()
const auth = require('../middleware/auth')
const { checkContent } = require('../services/wechat')
const MarketGoods = require('../models/MarketGoods')
const MarketComment = require('../models/MarketComment')
const User = require('../models/User')
const Message = require('../models/Message')

// GET /api/market/list
router.get('/list', async (req, res) => {
  try {
    const { category, keyword, page = 1, pageSize = 10 } = req.query
    const query = {}
    if (category && category !== '全部') query.category = category
    query.reviewStatus = { $in: ['approved', undefined] }
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
    const commentList = await MarketComment.find({ goodsId: req.params.id }).sort({ createTime: -1 }).limit(50)
    res.json({ code: 0, data: { ...goods.toObject(), commentList } })
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
      views: 0, wants: 0, comments: 0, publisher: userName, status: 'active', createTime: new Date(),
      reviewStatus: 'pending'
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

// POST /api/market/:id/comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content, replyTo, replyName } = req.body
    if (!content) return res.json({ code: -1, msg: '请输入留言内容' })
    const safe = await checkContent(req.user.openid, content, 2)
    if (!safe) return res.json({ code: -1, msg: '留言包含违规内容，请修改' })
    const user = await User.findOne({ openid: req.user.openid })
    const commentName = user ? user.name || '匿名' : '匿名'
    const commentData = {
      goodsId: req.params.id, openid: req.user.openid, nickname: commentName,
      avatar: user ? user.avatar || '' : '', content, createTime: new Date()
    }
    if (replyTo) { commentData.replyTo = replyTo; commentData.replyName = replyName || '' }
    const newCmt = await MarketComment.create(commentData)
    await MarketGoods.updateOne({ _id: req.params.id }, { $inc: { comments: 1 } })
    // 通知商品发布者
    const goods = await MarketGoods.findById(req.params.id)
    if (goods && goods.openid !== req.user.openid) {
      const shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content
      await Message.create({
        toOpenid: goods.openid, fromOpenid: req.user.openid, fromName: commentName,
        type: 'comment', title: '商品收到一条留言',
        content: commentName + ' 留言了你的商品「' + (goods.title || '') + '」: ' + shortContent,
        targetId: req.params.id, targetType: 'market', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0, id: newCmt._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// DELETE /api/market/comment/:id
router.delete('/comment/:id', auth, async (req, res) => {
  try {
    const cmt = await MarketComment.findById(req.params.id)
    if (!cmt) return res.json({ code: -1, msg: '记录不存在' })
    // 评论者本人可删
    if (cmt.openid === req.user.openid) {
      await MarketComment.deleteOne({ _id: req.params.id })
      await MarketGoods.updateOne({ _id: cmt.goodsId }, { $inc: { comments: -1 } })
      return res.json({ code: 0 })
    }
    // 商品发布者也可删
    const goods = await MarketGoods.findById(cmt.goodsId)
    if (goods && goods.openid === req.user.openid) {
      await MarketComment.deleteOne({ _id: req.params.id })
      await MarketGoods.updateOne({ _id: cmt.goodsId }, { $inc: { comments: -1 } })
      return res.json({ code: 0 })
    }
    res.json({ code: -1, msg: '无权删除该留言' })
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
    await MarketComment.deleteMany({ goodsId: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
