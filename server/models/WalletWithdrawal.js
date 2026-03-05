const mongoose = require('mongoose')

const walletWithdrawalSchema = new mongoose.Schema({
    openid: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: Number, default: 0 }, // 0=待审核 1=已通过 2=已拒绝
    rejectReason: String,
    approveTime: Date,
    approvedBy: String,
    rejectTime: Date,
    rejectedBy: String,
    createTime: { type: Date, default: Date.now }
})

walletWithdrawalSchema.index({ openid: 1 })
walletWithdrawalSchema.index({ status: 1 })

module.exports = mongoose.model('WalletWithdrawal', walletWithdrawalSchema, 'wallet_withdrawals')
