const mongoose = require('mongoose')

const userFavoriteSchema = new mongoose.Schema({
  openid: String,
  targetId: String,
  targetType: String,
  createTime: { type: Date, default: Date.now }
})

userFavoriteSchema.index({ openid: 1, targetId: 1, targetType: 1 }, { unique: true })

module.exports = mongoose.model('UserFavorite', userFavoriteSchema, 'user_favorites')
