const mongoose = require('mongoose')

const userWalletSchema = new mongoose.Schema({
    openid: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 },
    // 可加上累计收益等其他字段
    totalIncome: { type: Number, default: 0 },
    createTime: { type: Date, default: Date.now },
    updateTime: { type: Date, default: Date.now }
})

userWalletSchema.index({ openid: 1 })

module.exports = mongoose.model('UserWallet', userWalletSchema, 'user_wallets')
