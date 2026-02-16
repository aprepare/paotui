const router = require('express').Router()
const auth = require('../middleware/auth')
const Skill = require('../models/Skill')
const User = require('../models/User')

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

// GET /api/skill/:id
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
    if (!skill) return res.json({ code: -1, msg: '记录不存在' })
    await Skill.updateOne({ _id: req.params.id }, { $inc: { views: 1 } })
    res.json({ code: 0, data: skill })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/skill
router.post('/', auth, async (req, res) => {
  try {
    const { title, category, desc, price, priceUnit, works, contact, contactType } = req.body
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

module.exports = router
