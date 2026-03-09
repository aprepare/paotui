/**
 * 一次性钱包数据同步脚本
 * 遍历所有已完成的快递和跑腿订单，为每个骑手重新计算 totalIncome 和 balance
 * 用法: node scripts/syncWallet.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const config = require('../config')
const ExpressOrder = require('../models/ExpressOrder')
const ErrandTask = require('../models/ErrandTask')
const UserWallet = require('../models/UserWallet')
const WalletRecord = require('../models/WalletRecord')
const WalletWithdrawal = require('../models/WalletWithdrawal')

async function syncWallet() {
    await mongoose.connect(config.mongoUri)
    console.log('[syncWallet] connected, starting sync...')

    // 收集每个骑手的总收入
    const riderIncomeMap = {}

    // 1. 统计快递已完成订单 (status=3)
    const expressOrders = await ExpressOrder.find({ status: 3, riderId: { $exists: true, $ne: null } })
    console.log(`[syncWallet] found ${expressOrders.length} completed express orders`)
    for (const order of expressOrders) {
        if (!order.riderId) continue
        const amount = (order.price || 0) + (order.tip || 0)
        if (amount <= 0) continue
        if (!riderIncomeMap[order.riderId]) riderIncomeMap[order.riderId] = 0
        riderIncomeMap[order.riderId] += amount
    }

    // 2. 统计跑腿已完成订单 (status=2)
    const errandTasks = await ErrandTask.find({ status: 2, riderId: { $exists: true, $ne: null } })
    console.log(`[syncWallet] found ${errandTasks.length} completed errand tasks`)
    for (const task of errandTasks) {
        if (!task.riderId) continue
        const amount = (task.price || 0) + (task.tip || 0)
        if (amount <= 0) continue
        if (!riderIncomeMap[task.riderId]) riderIncomeMap[task.riderId] = 0
        riderIncomeMap[task.riderId] += amount
    }

    console.log(`[syncWallet] ${Object.keys(riderIncomeMap).length} riders with income`)

    // 3. 为每个骑手更新钱包
    let updated = 0
    for (const [riderId, totalIncome] of Object.entries(riderIncomeMap)) {
        // 查询已批准提现总额
        const approvedWithdrawals = await WalletWithdrawal.find({ openid: riderId, status: 1 })
        const totalWithdrawn = approvedWithdrawals.reduce((s, w) => s + (w.amount || 0), 0)
        // 查询提现中的冻结金额
        const pendingWithdrawals = await WalletWithdrawal.find({ openid: riderId, status: 0 })
        const pendingAmount = pendingWithdrawals.reduce((s, w) => s + (w.amount || 0), 0)

        const balance = Math.max(0, totalIncome - totalWithdrawn - pendingAmount)

        await UserWallet.updateOne(
            { openid: riderId },
            { $set: { balance, totalIncome, updateTime: new Date() } },
            { upsert: true }
        )
        console.log(`  rider: ${riderId.substring(0, 12)}... totalIncome: ${totalIncome.toFixed(2)}, withdrawn: ${totalWithdrawn.toFixed(2)}, balance: ${balance.toFixed(2)}`)
        updated++
    }

    console.log(`[syncWallet] done, updated ${updated} rider wallets`)
    await mongoose.disconnect()
}

syncWallet().catch(err => {
    console.error('[syncWallet] fatal:', err)
    process.exit(1)
})
