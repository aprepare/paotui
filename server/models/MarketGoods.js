const mongoose = require('mongoose')

const marketGoodsSchema = new mongoose.Schema({
  openid: String,
  title: String,
  desc: String,
  price: Number,
  category: { type: String, default: '' },
  images: [String],
  deliveryType: Number,
  deliveryText: { type: String, default: '' },
  contact: String,
  contactPublic: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  wants: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  wantUsers: [String],
  publisher: { type: String, default: '' },
  status: { type: String, default: 'active' },
  createTime: { type: Date, default: Date.now }
})

marketGoodsSchema.index({ openid: 1 })
marketGoodsSchema.index({ category: 1 })
marketGoodsSchema.index({ createTime: -1 })

module.exports = mongoose.model('MarketGoods', marketGoodsSchema, 'market_goods')
