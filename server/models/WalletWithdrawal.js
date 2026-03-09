const mongoose = require('mongoose')

const walletWithdrawalSchema = new mongoose.Schema({
    openid: { type: String, required: true },
    amount: { type: Number, required: true },
    withdrawCode: String, // 提现凭证编号，如 TX20260309001
    userName: String, // 用户昵称
    status: { type: Number, default: 0 }, // 0=待提现 1=已通过(旧) 2=已拒绝 3=已提现
    rejectReason: String,
    approveTime: Date,
    approvedBy: String,
    rejectTime: Date,
    rejectedBy: String,
    paidTime: Date, // 管理员标记已提现时间
    paidBy: String, // 处理提现的管理员
    createTime: { type: Date, default: Date.now }
})

walletWithdrawalSchema.index({ openid: 1 })
walletWithdrawalSchema.index({ status: 1 })
walletWithdrawalSchema.index({ withdrawCode: 1 })

module.exports = mongoose.model('WalletWithdrawal', walletWithdrawalSchema, 'wallet_withdrawals')

