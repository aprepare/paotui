const router = require('express').Router()
const auth = require('../middleware/auth')
const TutorPost = require('../models/TutorPost')
const TutorPayment = require('../models/TutorPayment')
const TutorPayOrder = require('../models/TutorPayOrder')
const User = require('../models/User')
const Message = require('../models/Message')

// GET /api/tutor/list-tutors
router.get('/list-tutors', async (req, res) => {
    try {
        const { subject } = req.query
        const where = { type: 'tutor', status: 1 }
        if (subject && subject !== '全部') where.subject = subject
        const data = await TutorPost.find(where).sort({ createTime: -1 }).limit(50)
        res.json({ code: 0, data })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// GET /api/tutor/list-demands
router.get('/list-demands', async (req, res) => {
    try {
        const { subject } = req.query
        const where = { type: 'demand', status: 1 }
        if (subject && subject !== '全部') where.subject = subject
        const docs = await TutorPost.find(where).sort({ createTime: -1 }).limit(50)
        // 隐藏家长信息
        const list = docs.map(d => {
            const obj = d.toObject()
            delete obj.parentName
            delete obj.idCard
            delete obj.openid
            return obj
        })
        res.json({ code: 0, data: list })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// POST /api/tutor/create-tutor
router.post('/create-tutor', auth, async (req, res) => {
    try {
        const { name, school, major, subjects, mode, area, price, experience, desc, studentCard, phone, wechat, qq } = req.body
        if (!name || !subjects || !price) return res.json({ code: -1, msg: '请填写必要信息' })
        if (!phone && !wechat && !qq) return res.json({ code: -1, msg: '请至少填写一种联系方式' })
        const user = await User.findOne({ openid: req.user.openid })
        const avatar = (user && user.avatar) || ''
        await TutorPost.create({
            type: 'tutor', openid: req.user.openid, status: 1,
            name, school: school || '', major: major || '',
            subject: (subjects || [])[0] || '',
            subjects: subjects || [],
            mode: mode || '线上+线下', area: area || '',
            price: parseFloat(price) || 0,
            experience: experience || '', desc: desc || '',
            avatar, verified: false,
            studentCard: studentCard || '',
            phone: phone || '', wechat: wechat || '', qq: qq || '',
            createTime: new Date()
        })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// POST /api/tutor/create-demand
router.post('/create-demand', auth, async (req, res) => {
    try {
        const { subject, title, desc, grade, location, schedule, budget, contactName, idCard, phone, wechat, qq } = req.body
        if (!subject || !title || !budget) return res.json({ code: -1, msg: '请填写必要信息' })
        if (!phone && !wechat && !qq) return res.json({ code: -1, msg: '请至少填写一种联系方式' })
        const user = await User.findOne({ openid: req.user.openid })
        const uName = contactName || (user && user.name) || '匿名'
        await TutorPost.create({
            type: 'demand', openid: req.user.openid, status: 1,
            subject, title, desc: desc || '',
            grade: grade || '', location: location || '',
            schedule: schedule || '',
            budget: parseFloat(budget) || 0,
            parentName: uName,
            idCard: idCard || '',
            phone: phone || '', wechat: wechat || '', qq: qq || '',
            createTime: new Date()
        })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// POST /api/tutor/:id/apply
router.post('/:id/apply', auth, async (req, res) => {
    try {
        const postId = req.params.id
        const user = await User.findOne({ openid: req.user.openid })
        const applyName = (user && user.name) || '匿名'
        const applyPhone = (user && user.phone) || ''
        const post = await TutorPost.findById(postId)
        if (!post) return res.json({ code: -1, msg: '信息不存在' })
        let contactInfo = applyName
        if (applyPhone) contactInfo += '（手机：' + applyPhone + '）'
        await Message.create({
            toOpenid: post.openid, fromOpenid: req.user.openid,
            fromName: applyName, fromPhone: applyPhone,
            type: 'tutor_apply', title: '有人应聘你的家教需求',
            content: contactInfo + ' 应聘了「' + (post.title || '') + '」',
            targetId: postId, targetType: 'tutor',
            read: false, createTime: new Date()
        })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// POST /api/tutor/:id/contact
router.post('/:id/contact', auth, async (req, res) => {
    try {
        const postId = req.params.id
        const user = await User.findOne({ openid: req.user.openid })
        const contactName = (user && user.name) || '匿名'
        const contactPhone = (user && user.phone) || ''
        const post = await TutorPost.findById(postId)
        if (!post) return res.json({ code: -1, msg: '信息不存在' })
        let contactInfo = contactName
        if (contactPhone) contactInfo += '（手机：' + contactPhone + '）'
        await Message.create({
            toOpenid: post.openid, fromOpenid: req.user.openid,
            fromName: contactName, fromPhone: contactPhone,
            type: 'tutor_contact', title: '有人想联系你',
            content: contactInfo + ' 想联系你关于家教信息',
            targetId: postId, targetType: 'tutor',
            read: false, createTime: new Date()
        })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// GET /api/tutor/my
router.get('/my', auth, async (req, res) => {
    try {
        const posts = await TutorPost.find({ openid: req.user.openid }).sort({ createTime: -1 }).limit(50)
        const result = []
        for (const p of posts) {
            const obj = p.toObject()
            const msgs = await Message.find({ targetId: p._id.toString(), targetType: 'tutor' })
                .sort({ createTime: -1 }).limit(20)
            obj.applicants = msgs.map(m => ({
                name: m.fromName || '匿名',
                phone: m.fromPhone || '',
                type: m.type,
                time: m.createTime
            }))
            result.push(obj)
        }
        res.json({ code: 0, data: result })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// GET /api/tutor/:id
router.get('/:id', async (req, res) => {
    try {
        const post = await TutorPost.findById(req.params.id)
        if (!post) return res.json({ code: -1, msg: '信息不存在' })
        res.json({ code: 0, data: post })
    } catch (err) {
        res.json({ code: -1, msg: '信息不存在' })
    }
})

// DELETE /api/tutor/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await TutorPost.findById(req.params.id)
        if (!post || post.openid !== req.user.openid) return res.json({ code: -1, msg: '无权限' })
        await TutorPost.deleteOne({ _id: req.params.id })
        res.json({ code: 0 })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// POST /api/tutor/:id/check-payment
router.post('/:id/check-payment', auth, async (req, res) => {
    try {
        const postId = req.params.id
        const paid = await TutorPayment.findOne({ openid: req.user.openid, postId })
        if (paid) {
            const post = await TutorPost.findById(postId)
            if (!post) return res.json({ code: -1, msg: '信息不存在' })
            return res.json({
                code: 0, paid: true,
                contact: {
                    phone: post.phone || '', wechat: post.wechat || '',
                    qq: post.qq || '', parentName: post.parentName || ''
                }
            })
        }
        res.json({ code: 0, paid: false })
    } catch (err) {
        res.json({ code: 0, paid: false })
    }
})

// POST /api/tutor/:id/create-pay-order
router.post('/:id/create-pay-order', auth, async (req, res) => {
    try {
        const postId = req.params.id
        const { orderType } = req.body
        // 检查是否已付费
        const paid = await TutorPayment.findOne({ openid: req.user.openid, postId })
        if (paid) {
            const post = await TutorPost.findById(postId)
            if (!post) return res.json({ code: -1, msg: '信息不存在' })
            return res.json({
                code: 0, paid: true,
                contact: {
                    phone: post.phone || '', wechat: post.wechat || '',
                    qq: post.qq || '', parentName: post.parentName || ''
                }
            })
        }
        // 创建支付订单
        const outTradeNo = 'tutor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8)
        await TutorPayOrder.create({
            openid: req.user.openid, postId,
            orderType: orderType || 'view_contact',
            outTradeNo, totalFee: 1, status: 'pending', // 金额修改为 1 分钱
            createTime: new Date()
        })
        // 调用微信支付 V3 JSAPI 下单
        const { createJSAPIOrder } = require('../services/wxpay')
        const payment = await createJSAPIOrder(
            req.user.openid,
            outTradeNo,
            1, // 1分钱
            '查看家教联系方式'
        )
        res.json({ code: 0, paid: false, payment })
    } catch (err) {
        console.error('[create-pay-order] error:', err)
        res.status(500).json({ code: -1, msg: '创建支付订单失败：' + (err.message || '') })
    }
})

module.exports = router
