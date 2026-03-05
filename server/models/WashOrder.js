const mongoose = require('mongoose')

const washOrderSchema = new mongoose.Schema({
    openid: String,
    productId: String,
    productName: String,
    productImage: String,
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    itemPrice: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    needDelivery: { type: Boolean, default: false },
    address: String,
    phone: String,
    userName: String,
    remark: String,
    status: { type: Number, default: 0 }, // 0=待处理 1=处理中 2=已完成 3=已取消
    statusText: { type: String, default: '待处理' },
    errandTaskId: String,
    createTime: { type: Date, default: Date.now }
})

washOrderSchema.index({ openid: 1, createTime: -1 })
washOrderSchema.index({ status: 1 })

module.exports = mongoose.model('WashOrder', washOrderSchema, 'wash_orders')
