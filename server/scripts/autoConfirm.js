/**
 * 24小时自动确认定时脚本
 * 用法: node scripts/autoConfirm.js
 * cron: 0 * * * * (每小时执行一次)
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const config = require('../config')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const Message = require('../models/Message')
const UserWallet = require('../models/UserWallet')
const WalletRecord = require('../models/WalletRecord')

async function creditRiderWallet(riderId, amount, orderId, orderType) {
    if (!riderId || !amount || amount <= 0) return
    await UserWallet.updateOne(
        { openid: riderId },
        { $inc: { balance: amount, totalIncome: amount }, $set: { updateTime: new Date() } },
        { upsert: true }
    )
    await WalletRecord.create({
        openid: riderId, type: 'income', amount, title: orderType === 'express' ? '快递代拿收入' : '跑腿任务收入',
        orderId: orderId || '', orderType: orderType || '', status: 1, statusText: '已到账', createTime: new Date()
    })
}

async function autoConfirm() {
    await mongoose.connect(config.mongoUri)
    console.log('[autoConfirm]', new Date().toISOString(), 'started')

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const results = { express: 0, errand: 0, errors: [] }

    // 1. 快递订单：status=2（配送中）且有送达照片且超过24小时
    try {
        const expressOrders = await ExpressOrder.find({
            status: 2,
            deliverPhoto: { $exists: true, $ne: null },
            deliverPhotoTime: { $lte: cutoff }
        }).limit(100)

        for (const order of expressOrders) {
            try {
                await ExpressOrder.updateOne({ _id: order._id }, {
                    $set: {
                        status: 3, statusText: '已完成', statusColor: '#A0AEC0',
                        completeTime: new Date(), autoConfirmed: true
                    }
                })
                await Message.create({
                    toOpenid: order.openid, fromOpenid: 'system', fromName: '系统',
                    type: 'order_complete', title: '快递单已自动确认',
                    content: '您的快递单已超过24小时未确认，系统已自动确认完成',
                    targetId: order._id.toString(), targetType: 'express',
                    read: false, createTime: new Date()
                })
                // 更新骑手钱包
                const earnAmount = (order.price || 0) + (order.tip || 0)
                await creditRiderWallet(order.riderId, earnAmount, order._id.toString(), 'express')
                results.express++
            } catch (e) {
                results.errors.push({ type: 'express', id: order._id, msg: e.message })
            }
        }
    } catch (e) {
        results.errors.push({ type: 'express_query', msg: e.message })
    }

    // 2. 跑腿任务：status=4（待确认）且超过24小时
    try {
        const errandTasks = await ErrandTask.find({
            status: 4,
            submitTime: { $lte: cutoff }
        }).limit(100)

        for (const task of errandTasks) {
            try {
                await ErrandTask.updateOne({ _id: task._id }, {
                    $set: {
                        status: 2, statusText: '已完成', statusColor: '#A0AEC0',
                        completeTime: new Date(), autoConfirmed: true
                    }
                })
                await Message.create({
                    toOpenid: task.openid, fromOpenid: 'system', fromName: '系统',
                    type: 'order_complete', title: '跑腿任务已自动确认',
                    content: '您的跑腿任务已超过24小时未确认，系统已自动确认完成',
                    targetId: task._id.toString(), targetType: 'errand',
                    read: false, createTime: new Date()
                })
                // 更新骑手钱包
                const earnAmount = (task.price || 0) + (task.tip || 0)
                await creditRiderWallet(task.riderId, earnAmount, task._id.toString(), 'errand')
                results.errand++
            } catch (e) {
                results.errors.push({ type: 'errand', id: task._id, msg: e.message })
            }
        }
    } catch (e) {
        results.errors.push({ type: 'errand_query', msg: e.message })
    }

    console.log('[autoConfirm] done:', JSON.stringify(results))
    await mongoose.disconnect()
}

autoConfirm().catch(err => {
    console.error('[autoConfirm] fatal:', err)
    process.exit(1)
})
