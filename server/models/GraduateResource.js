const mongoose = require('mongoose')

const graduateResourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    desc: String,
    category: { type: String, default: '综合' }, // 英语/数学/政治/专业课/综合
    size: { type: String, default: '' },
    link: { type: String, default: '' },
    password: { type: String, default: '' },
    emoji: { type: String, default: '📘' },
    color: { type: String, default: 'linear-gradient(135deg, #63B3ED, #2B6CB0)' },
    status: { type: Number, default: 1 }, // 1=上架 0=下架
    sort: { type: Number, default: 0 },
    createTime: { type: Date, default: Date.now }
})

graduateResourceSchema.index({ status: 1, category: 1 })

module.exports = mongoose.model('GraduateResource', graduateResourceSchema, 'graduate_resources')
