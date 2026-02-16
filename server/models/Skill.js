const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema({
  openid: String,
  publisher: { type: String, default: '' },
  title: String,
  category: { type: String, default: '' },
  desc: String,
  price: Number,
  priceUnit: { type: String, default: '' },
  works: [String],
  contact: String,
  contactType: { type: String, default: '' },
  status: { type: Number, default: 1 },
  views: { type: Number, default: 0 },
  createTime: { type: Date, default: Date.now }
})

skillSchema.index({ openid: 1 })
skillSchema.index({ category: 1 })
skillSchema.index({ status: 1 })

module.exports = mongoose.model('Skill', skillSchema, 'skills')
