const mongoose = require('mongoose')

const expressBannerSchema = new mongoose.Schema({
    title: { type: String, default: '寄邮政快递免费上门取件' },
    content: { type: String, default: '' },
    wechat: { type: String, default: '' },
    publisherOpenid: { type: String, required: true },
    publisherName: { type: String, default: '' },
    status: { type: Number, default: 0 }, // 0=待审核 1=已通过 2=已拒绝
    createTime: { type: Date, default: Date.now }
})

module.exports = mongoose.model('ExpressBanner', expressBannerSchema, 'express_banners')
