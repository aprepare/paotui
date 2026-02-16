const mongoose = require('mongoose')

const teamActivitySchema = new mongoose.Schema({
  openid: String,
  title: String,
  type: String,
  place: String,
  time: String,
  max: Number,
  current: { type: Number, default: 1 },
  desc: String,
  images: [String],
  photos: [String],
  status: { type: String, default: 'active' },
  tag: { type: String, default: '' },
  owner: { type: String, default: '' },
  createTime: { type: Date, default: Date.now }
})

teamActivitySchema.index({ type: 1 })
teamActivitySchema.index({ createTime: -1 })

module.exports = mongoose.model('TeamActivity', teamActivitySchema, 'team_activities')
