const mongoose = require('mongoose')

const foodOrderSchema = new mongoose.Schema({
    openid: String,
    shopId: String,
    shopName: String,
    items: [{
        itemId: String,
        name: String,
        price: Number,
        image: String,
        quantity: Number
    }],
    itemsTotal: Number,
    deliveryFee: { type: Number, default: 0 },
    totalPrice: Number,
    deliveryMode: { type: String, default: 'delivery' },
    address: String,
    phone: String,
    userName: String,
    remark: String,
    status: { type: Number, default: 0 },
    statusText: { type: String, default: '待确认' },
    riderId: String,
    riderName: String,
    riderPhone: String,
    outTradeNo: String,
    payType: { type: String, default: 'wxpay' },
    createTime: { type: Date, default: Date.now }
})

foodOrderSchema.index({ openid: 1, createTime: -1 })
foodOrderSchema.index({ status: 1 })
foodOrderSchema.index({ shopId: 1 })

module.exports = mongoose.model('FoodOrder', foodOrderSchema, 'food_orders')
