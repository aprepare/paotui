const mongoose = require('mongoose')

const foodItemSchema = new mongoose.Schema({
    shopId: String,
    name: String,
    image: String,
    price: { type: Number, default: 0 },
    category: { type: String, default: '热销' },
    desc: String,
    status: { type: Number, default: 1 },
    sort: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    createTime: { type: Date, default: Date.now }
})

foodItemSchema.index({ shopId: 1, status: 1, sort: 1 })

module.exports = mongoose.model('FoodItem', foodItemSchema, 'food_items')
