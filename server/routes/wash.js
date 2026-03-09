const router = require('express').Router()
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/adminAuth')
const WashProduct = require('../models/WashProduct')
const WashGroup = require('../models/WashGroup')
const WashOrder = require('../models/WashOrder')
const User = require('../models/User')
const ErrandTask = require('../models/ErrandTask')
const UserWallet = require('../models/UserWallet')
const WalletRecord = require('../models/WalletRecord')

// 默认商品数据
const defaultGroupProducts = {
    'default_1': { name: '运动鞋基础清洗', originalPrice: 35, groupPrice: 19.9, groupSize: 3 },
    'default_2': { name: '运动鞋深度清洗', originalPrice: 55, groupPrice: 29.9, groupSize: 3 },
    'default_3': { name: '皮鞋/靴子养护', originalPrice: 65, groupPrice: 39.9, groupSize: 3 },
    'default_4': { name: 'AJ/椰子精洗', originalPrice: 79, groupPrice: 49.9, groupSize: 3 },
    'default_5': { name: '小白鞋焕新套餐', originalPrice: 45, groupPrice: 25.9, groupSize: 3 }
}

const defaultNormalProducts = {
    'normal_1': { name: '运动鞋基础清洗', price: 35 },
    'normal_2': { name: '运动鞋深度清洗', price: 55 },
    'normal_3': { name: '皮鞋/靴子养护', price: 65 },
    'normal_4': { name: 'AJ/椰子精洗', price: 79 },
    'normal_5': { name: '小白鞋焕新套餐', price: 45 },
    'normal_6': { name: '衣物干洗（件）', price: 25 },
    'normal_7': { name: '书包清洗', price: 30 }
}

// GET /api/wash/products
router.get('/products', async (req, res) => {
    try {
        const { type } = req.query
        const where = { status: 1 }
        if (type) where.type = type
        const data = await WashProduct.find(where).sort({ sort: 1 })
        res.json({ code: 0, data })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// GET /api/wash/groups
router.get('/groups', async (req, res) => {
    try {
        const { productId } = req.query
        const where = { status: 0 }
        if (productId) where.productId = productId
        const data = await WashGroup.find(where).sort({ createTime: -1 }).limit(50)
        res.json({ code: 0, data })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// POST /api/wash/group
router.post('/group', auth, async (req, res) => {
    try {
        const { productId } = req.body
        if (!productId) return res.json({ code: -1, msg: '缺少商品ID' })

        let p = null
        if (defaultGroupProducts[productId]) {
            p = defaultGroupProducts[productId]
        } else {
            p = await WashProduct.findById(productId)
            if (!p) return res.json({ code: -1, msg: '商品不存在' })
        }

        const user = await User.findOne({ openid: req.user.openid })
        const userName = (user && user.name) || '匿名'

        const group = await WashGroup.create({
            productId, productName: p.name, productImage: p.image || '',
            originalPrice: p.originalPrice || 0, groupPrice: p.groupPrice || 0,
            targetCount: p.groupSize || 3, currentCount: 1,
            members: [{ openid: req.user.openid, name: userName, joinTime: new Date() }],
            status: 0, expireTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            creatorOpenid: req.user.openid, creatorName: userName, createTime: new Date()
        })
        res.json({ code: 0, data: { groupId: group._id } })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// POST /api/wash/group/:id/join
router.post('/group/:id/join', auth, async (req, res) => {
    try {
        const group = await WashGroup.findById(req.params.id)
        if (!group) return res.json({ code: -1, msg: '团购不存在' })
        if (group.status !== 0) return res.json({ code: -1, msg: '该团购已结束' })
        if (new Date(group.expireTime) < new Date()) {
            await WashGroup.updateOne({ _id: req.params.id }, { $set: { status: 2 } })
            return res.json({ code: -1, msg: '团购已过期' })
        }
        const already = group.members.some(m => m.openid === req.user.openid)
        if (already) return res.json({ code: -1, msg: '你已参加该团购' })
        if (group.currentCount >= group.targetCount) return res.json({ code: -1, msg: '该团已满' })

        const user = await User.findOne({ openid: req.user.openid })
        const uName = (user && user.name) || '匿名'
        const newCount = group.currentCount + 1
        const updateData = {
            $inc: { currentCount: 1 },
            $push: { members: { openid: req.user.openid, name: uName, joinTime: new Date() } }
        }
        if (newCount >= group.targetCount) updateData.$set = { status: 1 }
        await WashGroup.updateOne({ _id: req.params.id }, updateData)
        res.json({ code: 0, success: newCount >= group.targetCount })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// GET /api/wash/my-groups
router.get('/my-groups', auth, async (req, res) => {
    try {
        const data = await WashGroup.find({ 'members.openid': req.user.openid })
            .sort({ createTime: -1 }).limit(50)
        res.json({ code: 0, data })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// POST /api/wash/order
router.post('/order', auth, async (req, res) => {
    try {
        const { productId, quantity = 1, phone, userName, address, remark, needDelivery = false, payType } = req.body
        if (!productId) return res.json({ code: -1, msg: '缺少商品ID' })
        if (!phone) return res.json({ code: -1, msg: '请填写联系电话' })
        if (needDelivery && (!address || !address.trim())) return res.json({ code: -1, msg: '跑腿取送需填写宿舍地址' })

        let product = null
        if (defaultNormalProducts[productId]) {
            product = defaultNormalProducts[productId]
        } else {
            product = await WashProduct.findById(productId)
            if (!product) return res.json({ code: -1, msg: '商品不存在' })
        }

        const deliveryFee = needDelivery ? 3 : 0
        const itemPrice = (product.price || 0) * quantity
        const totalPrice = itemPrice + deliveryFee

        const outTradeNo = 'wash_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)

        // 钱包支付
        if (payType === 'wallet') {
            let wallet = await UserWallet.findOne({ openid: req.user.openid })
            if (!wallet) wallet = await UserWallet.create({ openid: req.user.openid, balance: 0, totalIncome: 0 })
            if (wallet.balance < totalPrice) return res.json({ code: -1, msg: '钱包余额不足，需要 ¥' + totalPrice })
            await UserWallet.updateOne({ openid: req.user.openid }, { $inc: { balance: -totalPrice }, $set: { updateTime: new Date() } })
            await WalletRecord.create({
                openid: req.user.openid, type: 'income', amount: -totalPrice,
                title: '洗护订单支付 - ' + (product.name || ''), orderId: '', orderType: 'wash_pay',
                status: 1, statusText: '已扣款', createTime: new Date()
            })
            const order = await WashOrder.create({
                openid: req.user.openid, productId, productName: product.name,
                productImage: product.image || '', quantity, unitPrice: product.price || 0,
                itemPrice, deliveryFee, totalPrice, needDelivery,
                address: needDelivery ? address.trim() : '', phone, userName: userName || '',
                remark: remark || '', status: 0, statusText: '待处理', createTime: new Date(),
                outTradeNo, payType: 'wallet'
            })
            // 如果选了跑腿取送，自动创建跑腿任务
            if (needDelivery) {
                const user = await User.findOne({ openid: req.user.openid })
                const publisher = (user && user.name) || userName || '匿名'
                const errand = await ErrandTask.create({
                    openid: req.user.openid,
                    title: '萌马洗护取件',
                    desc: '【萌马洗护】' + product.name + ' x' + quantity + '\n请到宿舍取件送至萌马洗护店',
                    fromAddr: address.trim(), toAddr: '萌马洗护店',
                    price: deliveryFee, tip: 0, phone,
                    remark: '洗护订单关联取件，订单号: ' + order._id,
                    publisher, status: 0, statusText: '待接单', statusColor: '#DD6B20',
                    washOrderId: order._id.toString(), createTime: new Date()
                })
                await WashOrder.updateOne({ _id: order._id }, { $set: { errandTaskId: errand._id.toString() } })
            }
            return res.json({ code: 0, data: { orderId: order._id }, walletPaid: true })
        }

        // 微信支付
        const order = await WashOrder.create({
            openid: req.user.openid, productId, productName: product.name,
            productImage: product.image || '', quantity, unitPrice: product.price || 0,
            itemPrice, deliveryFee, totalPrice, needDelivery,
            address: needDelivery ? address.trim() : '', phone, userName: userName || '',
            remark: remark || '', status: -1, statusText: '待支付', createTime: new Date(),
            outTradeNo, payType: 'wxpay'
        })

        const { createJSAPIOrder } = require('../services/wxpay')
        const payment = await createJSAPIOrder(
            req.user.openid,
            outTradeNo,
            Math.round(totalPrice * 100),
            '萌马洗护-' + (product.name || '洗护服务')
        )

        res.json({ code: 0, data: { orderId: order._id }, payment })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '下单失败: ' + err.message })
    }
})

// GET /api/wash/my-orders
router.get('/my-orders', auth, async (req, res) => {
    try {
        const data = await WashOrder.find({ openid: req.user.openid }).sort({ createTime: -1 }).limit(50)
        res.json({ code: 0, data })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// GET /api/wash/order/:id
router.get('/order/:id', auth, async (req, res) => {
    try {
        const order = await WashOrder.findById(req.params.id)
        if (!order) return res.json({ code: -1, msg: '订单不存在' })
        if (order.openid !== req.user.openid) return res.json({ code: -1, msg: '无权查看该订单' })
        res.json({ code: 0, data: order })
    } catch (err) {
        res.json({ code: -1, msg: '订单不存在' })
    }
})

// POST /api/wash/order/:id/cancel
router.post('/order/:id/cancel', auth, async (req, res) => {
    try {
        const order = await WashOrder.findById(req.params.id)
        if (!order || order.openid !== req.user.openid) return res.json({ code: -1, msg: '无权操作' })
        if (order.status > 0) return res.json({ code: -1, msg: '当前状态不可取消' })
        await WashOrder.updateOne({ _id: req.params.id }, { $set: { status: 3, statusText: '已取消' } })
        if (order.errandTaskId) {
            try {
                await ErrandTask.updateOne({ _id: order.errandTaskId }, {
                    $set: { status: 3, statusText: '已取消', statusColor: '#E53E3E' }
                })
            } catch (e) { }
        }

        // 退款处理
        if (order.status >= 0 && order.outTradeNo) {
            if (order.payType === 'wallet') {
                // 钱包支付退回余额
                await UserWallet.updateOne({ openid: order.openid }, { $inc: { balance: order.totalPrice }, $set: { updateTime: new Date() } })
                await WalletRecord.create({
                    openid: order.openid, type: 'income', amount: order.totalPrice,
                    title: '洗护订单取消退款', orderId: order._id.toString(), orderType: 'wash_refund',
                    status: 1, statusText: '已退款', createTime: new Date()
                })
            } else {
                // 微信支付退款
                try {
                    const { refundOrder } = require('../services/wxpay')
                    const outRefundNo = 'ref_' + order.outTradeNo + '_' + Date.now()
                    const totalAmount = Math.round((order.totalPrice || 0) * 100)
                    await refundOrder(order.outTradeNo, outRefundNo, totalAmount, totalAmount)
                    console.log(`[wxpay refund] 洗护退款成功: ${order.outTradeNo}`)
                } catch (refundErr) {
                    console.error(`[wxpay refund] 洗护退款失败: ${order.outTradeNo}`, refundErr.message)
                }
            }
        }

        res.json({ code: 0 })
    } catch (err) {
        res.json({ code: -1, msg: '取消失败' })
    }
})

// ========== 管理员 ==========
// GET /api/wash/admin/orders
router.get('/admin/orders', adminAuth, async (req, res) => {
    try {
        const { page = 1, pageSize = 20, status } = req.query
        const where = {}
        if (status !== undefined && status !== '-1') where.status = Number(status)
        const total = await WashOrder.countDocuments(where)
        const data = await WashOrder.find(where)
            .sort({ createTime: -1 }).skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
        res.json({ code: 0, data, total })
    } catch (err) {
        res.json({ code: 0, data: [], total: 0 })
    }
})

// PUT /api/wash/admin/order/:id/status
router.put('/admin/order/:id/status', adminAuth, async (req, res) => {
    try {
        const { status: newStatus } = req.body
        const statusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
        await WashOrder.updateOne({ _id: req.params.id }, {
            $set: { status: newStatus, statusText: statusMap[newStatus] || '待处理' }
        })
        res.json({ code: 0 })
    } catch (err) {
        res.json({ code: -1, msg: '更新失败' })
    }
})

module.exports = router
