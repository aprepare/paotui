const mongoose = require('mongoose')

const foodShopSchema = new mongoose.Schema({
    name: String,
    logo: String,
    category: { type: String, default: '快餐' },
    phone: String,
    address: String,
    deliveryFee: { type: Number, default: 0 },
    minOrder: { type: Number, default: 0 },
    printerSn: String,
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '22:00' },
    status: { type: Number, default: 1 },
    sort: { type: Number, default: 0 },
    createTime: { type: Date, default: Date.now }
})

foodShopSchema.index({ status: 1, sort: 1 })

module.exports = mongoose.model('FoodShop', foodShopSchema, 'food_shops')
