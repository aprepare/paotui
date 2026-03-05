const mongoose = require('mongoose')

const washGroupSchema = new mongoose.Schema({
    productId: String,
    productName: String,
    productImage: String,
    originalPrice: { type: Number, default: 0 },
    groupPrice: { type: Number, default: 0 },
    targetCount: { type: Number, default: 3 },
    currentCount: { type: Number, default: 1 },
    members: [{
        openid: String,
        name: String,
        joinTime: Date
    }],
    status: { type: Number, default: 0 }, // 0=拼团中 1=已成团 2=已过期
    expireTime: Date,
    creatorOpenid: String,
    creatorName: String,
    createTime: { type: Date, default: Date.now }
})

washGroupSchema.index({ status: 1, createTime: -1 })
washGroupSchema.index({ 'members.openid': 1 })

module.exports = mongoose.model('WashGroup', washGroupSchema, 'wash_groups')
