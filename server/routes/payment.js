const router = require('express').Router()
const TutorPayOrder = require('../models/TutorPayOrder')
const TutorPayment = require('../models/TutorPayment')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const SkillUnlock = require('../models/SkillUnlock')
const Skill = require('../models/Skill')
const UserWallet = require('../models/UserWallet')
const WalletRecord = require('../models/WalletRecord')
const FoodOrder = require('../models/FoodOrder')
const WashOrder = require('../models/WashOrder')
const User = require('../models/User')
const { decryptNotifyResource } = require('../services/wxpay')

/**
 * POST /api/payment/notify
 * 微信支付回调通知
 * 注意：此路由需要接收原始 body，在 app.js 中需要特殊处理
 */
router.post('/notify', async (req, res) => {
    try {
        const notification = req.body

        // 检查通知类型
        if (!notification || !notification.resource) {
            console.error('[payment notify] 无效通知:', notification)
            return res.status(400).json({ code: 'FAIL', message: '无效通知' })
        }

        // 解密通知数据
        let orderInfo
        try {
            orderInfo = decryptNotifyResource(notification.resource)
        } catch (e) {
            console.error('[payment notify] 解密失败:', e)
            return res.status(400).json({ code: 'FAIL', message: '解密失败' })
        }

        console.log('[payment notify] 解密后数据:', JSON.stringify(orderInfo))

        // 检查支付状态
        if (orderInfo.trade_state !== 'SUCCESS') {
            console.log('[payment notify] 支付状态非成功:', orderInfo.trade_state)
            return res.json({ code: 'SUCCESS', message: '成功' })
        }

        const outTradeNo = orderInfo.out_trade_no
        if (!outTradeNo) {
            console.error('[payment notify] 缺少 out_trade_no')
            return res.status(400).json({ code: 'FAIL', message: '缺少订单号' })
        }

        // 查找并处理订单
        if (outTradeNo.startsWith('tutor_')) {
            const order = await TutorPayOrder.findOne({ outTradeNo })
            if (!order) return res.json({ code: 'SUCCESS', message: '成功' })
            if (order.status === 'paid') return res.json({ code: 'SUCCESS', message: '成功' })

            await TutorPayOrder.updateOne(
                { _id: order._id },
                { $set: { status: 'paid', payTime: new Date(), transactionId: orderInfo.transaction_id || '' } }
            )

            const existingPayment = await TutorPayment.findOne({ openid: order.openid, postId: order.postId })
            if (!existingPayment) {
                await TutorPayment.create({
                    openid: order.openid,
                    postId: order.postId,
                    outTradeNo,
                    totalFee: order.totalFee,
                    createTime: new Date()
                })
            }
        } else if (outTradeNo.startsWith('express_')) {
            const order = await ExpressOrder.findOne({ outTradeNo })
            if (!order) return res.json({ code: 'SUCCESS', message: '成功' })
            if (order.status >= 0) return res.json({ code: 'SUCCESS', message: '成功' }) // 已经不是待支付状态

            await ExpressOrder.updateOne(
                { _id: order._id },
                { $set: { status: 0, statusText: '待接单', statusColor: '#DD6B20' } }
            )
        } else if (outTradeNo.startsWith('errand_')) {
            const task = await ErrandTask.findOne({ outTradeNo })
            if (!task) return res.json({ code: 'SUCCESS', message: '成功' })
            if (task.status >= 0) return res.json({ code: 'SUCCESS', message: '成功' }) // 已经不是待支付状态

            await ErrandTask.updateOne(
                { _id: task._id },
                { $set: { status: 0, statusText: '待接单', statusColor: '#DD6B20' } }
            )
        } else if (outTradeNo.startsWith('skill_')) {
            const unlock = await SkillUnlock.findOne({ outTradeNo })
            if (!unlock) return res.json({ code: 'SUCCESS', message: '成功' })
            if (unlock.paid) return res.json({ code: 'SUCCESS', message: '成功' })
            await SkillUnlock.updateOne({ _id: unlock._id }, { $set: { paid: true } })
            // 给技能发布者入账
            const skill = await Skill.findById(unlock.skillId)
            if (skill) {
                const amount = unlock.amount || 1
                await UserWallet.updateOne(
                    { openid: skill.openid },
                    { $inc: { balance: amount, totalIncome: amount }, $set: { updateTime: new Date() } },
                    { upsert: true }
                )
                await WalletRecord.create({
                    openid: skill.openid, type: 'income', amount,
                    title: '技能被解锁收入: ' + (skill.title || '').substring(0, 20),
                    orderId: unlock.skillId, orderType: 'skill_unlock',
                    status: 1, statusText: '已到账', createTime: new Date()
                })
            }
        } else if (outTradeNo.startsWith('food_')) {
            // 外卖订单支付回调
            const order = await FoodOrder.findOne({ outTradeNo })
            if (!order) return res.json({ code: 'SUCCESS', message: '成功' })
            if (order.status >= 0) return res.json({ code: 'SUCCESS', message: '成功' }) // 已经不是待支付状态

            await FoodOrder.updateOne(
                { _id: order._id },
                { $set: { status: 0, statusText: '待确认' } }
            )
            console.log('[payment notify] 外卖订单支付成功:', order._id)
        } else if (outTradeNo.startsWith('wash_')) {
            // 洗护订单支付回调
            const order = await WashOrder.findOne({ outTradeNo })
            if (!order) return res.json({ code: 'SUCCESS', message: '成功' })
            if (order.status >= 0) return res.json({ code: 'SUCCESS', message: '成功' }) // 已经不是待支付状态

            await WashOrder.updateOne(
                { _id: order._id },
                { $set: { status: 0, statusText: '待处理' } }
            )

            // 如果需要跑腿取送，支付成功后自动创建跑腿任务
            if (order.needDelivery && order.address) {
                try {
                    const user = await User.findOne({ openid: order.openid })
                    const publisher = (user && user.name) || order.userName || '匿名'
                    const errand = await ErrandTask.create({
                        openid: order.openid,
                        title: '萌马洗护取件',
                        desc: '【萌马洗护】' + order.productName + ' x' + order.quantity + '\n请到宿舍取件送至萌马洗护店',
                        fromAddr: order.address, toAddr: '萌马洗护店',
                        price: order.deliveryFee || 3, tip: 0, phone: order.phone,
                        remark: '洗护订单关联取件，订单号: ' + order._id,
                        publisher, status: 0, statusText: '待接单', statusColor: '#DD6B20',
                        washOrderId: order._id.toString(), createTime: new Date()
                    })
                    await WashOrder.updateOne({ _id: order._id }, { $set: { errandTaskId: errand._id.toString() } })
                } catch (e) {
                    console.error('[payment notify] 创建洗护跑腿任务失败:', e)
                }
            }
            console.log('[payment notify] 洗护订单支付成功:', order._id)
        } else {
            console.warn('[payment notify] 未知订单前缀:', outTradeNo)
        }

        console.log('[payment notify] 订单处理成功:', outTradeNo)
        res.json({ code: 'SUCCESS', message: '成功' })
    } catch (err) {
        console.error('[payment notify] 处理异常:', err)
        res.status(500).json({ code: 'FAIL', message: '服务器错误' })
    }
})

module.exports = router

