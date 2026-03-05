const mongoose = require('mongoose')

const tutorPaymentSchema = new mongoose.Schema({
    openid: String,
    postId: String,
    outTradeNo: String,
    totalFee: Number,
    createTime: { type: Date, default: Date.now }
})

tutorPaymentSchema.index({ openid: 1, postId: 1 })

module.exports = mongoose.model('TutorPayment', tutorPaymentSchema, 'tutor_payments')
