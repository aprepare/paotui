const router = require('express').Router()
const TutorPayOrder = require('../models/TutorPayOrder')
const TutorPayment = require('../models/TutorPayment')
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

        // 查找订单
        const order = await TutorPayOrder.findOne({ outTradeNo })
        if (!order) {
            console.error('[payment notify] 订单不存在:', outTradeNo)
            // 仍然返回成功，避免微信重复通知
            return res.json({ code: 'SUCCESS', message: '成功' })
        }

        // 防止重复处理
        if (order.status === 'paid') {
            return res.json({ code: 'SUCCESS', message: '成功' })
        }

        // 更新订单状态
        await TutorPayOrder.updateOne(
            { _id: order._id },
            { $set: { status: 'paid', payTime: new Date(), transactionId: orderInfo.transaction_id || '' } }
        )

        // 创建付费记录
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

        console.log('[payment notify] 订单处理成功:', outTradeNo)
        res.json({ code: 'SUCCESS', message: '成功' })
    } catch (err) {
        console.error('[payment notify] 处理异常:', err)
        res.status(500).json({ code: 'FAIL', message: '服务器错误' })
    }
})

module.exports = router
