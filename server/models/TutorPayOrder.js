const mongoose = require('mongoose')

const tutorPayOrderSchema = new mongoose.Schema({
    openid: String,
    postId: String,
    orderType: { type: String, default: 'view_contact' },
    outTradeNo: String,
    totalFee: Number,
    status: { type: String, default: 'pending' },
    payTime: Date,
    createTime: { type: Date, default: Date.now }
})

tutorPayOrderSchema.index({ outTradeNo: 1 })
tutorPayOrderSchema.index({ openid: 1, postId: 1 })

module.exports = mongoose.model('TutorPayOrder', tutorPayOrderSchema, 'tutor_pay_orders')
