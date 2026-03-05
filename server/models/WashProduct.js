const mongoose = require('mongoose')

const washProductSchema = new mongoose.Schema({
    name: String,
    image: String,
    type: { type: String, default: 'normal' }, // normal | group
    price: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    groupPrice: { type: Number, default: 0 },
    groupSize: { type: Number, default: 3 },
    desc: String,
    status: { type: Number, default: 1 },
    sort: { type: Number, default: 0 },
    createTime: { type: Date, default: Date.now }
})

washProductSchema.index({ status: 1, type: 1 })

module.exports = mongoose.model('WashProduct', washProductSchema, 'wash_products')
