const mongoose = require('mongoose')

const marketCommentSchema = new mongoose.Schema({
  goodsId: String,
  openid: String,
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  content: String,
  replyTo: { type: String, default: '' },
  replyName: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  createTime: { type: Date, default: Date.now }
})

marketCommentSchema.index({ goodsId: 1 })
marketCommentSchema.index({ createTime: -1 })

module.exports = mongoose.model('MarketComment', marketCommentSchema, 'market_comments')
