const mongoose = require('mongoose')

const walletRecordSchema = new mongoose.Schema({
    openid: { type: String, required: true, index: true },
    type: { type: String, enum: ['income', 'withdraw'], required: true },
    amount: { type: Number, required: true },
    title: { type: String, default: '' },
    // 关联的订单ID和类型
    orderId: { type: String, default: '' },
    orderType: { type: String, default: '' }, // 'express' | 'errand'
    // 提现相关
    status: { type: Number, default: 1 }, // income: 固定1(已到账); withdraw: 0=审核中 1=已到账 2=已拒绝
    statusText: { type: String, default: '' },
    createTime: { type: Date, default: Date.now }
})

walletRecordSchema.index({ openid: 1, createTime: -1 })

module.exports = mongoose.model('WalletRecord', walletRecordSchema, 'wallet_records')
