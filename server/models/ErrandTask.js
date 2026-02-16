const mongoose = require('mongoose')

const errandTaskSchema = new mongoose.Schema({
  openid: String,
  title: String,
  desc: String,
  price: Number,
  tip: { type: Number, default: 0 },
  deadline: String,
  contact: String,
  images: [String],
  status: { type: Number, default: 0 },
  statusText: { type: String, default: '待接单' },
  statusColor: { type: String, default: '' },
  riderId: { type: String, default: '' },
  pickupPhoto: { type: String, default: '' },
  deliverPhoto: { type: String, default: '' },
  submitTime: Date,
  completeTime: Date,
  autoConfirmed: { type: Boolean, default: false },
  publisher: { type: String, default: '' },
  createTime: { type: Date, default: Date.now }
})

errandTaskSchema.index({ openid: 1 })
errandTaskSchema.index({ riderId: 1 })
errandTaskSchema.index({ status: 1 })
errandTaskSchema.index({ createTime: -1 })

module.exports = mongoose.model('ErrandTask', errandTaskSchema, 'errand_tasks')
