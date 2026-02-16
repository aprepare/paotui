const mongoose = require('mongoose')

const carpoolSchema = new mongoose.Schema({
  openid: String,
  from: String,
  to: String,
  departTime: String,
  pickupLocation: String,
  maxPeople: Number,
  currentPeople: { type: Number, default: 1 },
  deadline: String,
  contact: String,
  remark: { type: String, default: '' },
  publisher: { type: String, default: '' },
  members: [String],
  createTime: { type: Date, default: Date.now }
})

carpoolSchema.index({ openid: 1 })
carpoolSchema.index({ createTime: -1 })

module.exports = mongoose.model('Carpool', carpoolSchema, 'carpool')
