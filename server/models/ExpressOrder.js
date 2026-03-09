const mongoose = require('mongoose')

const expressOrderSchema = new mongoose.Schema({
  openid: String,
  pickupPoint: String,
  pickupCode: String,
  expressCompany: String,
  sizeType: Number,
  sizeText: String,
  sizeClass: String,
  building: String,
  room: String,
  phone: String,
  price: Number,
  tip: { type: Number, default: 0 },
  totalPrice: Number,
  remark: { type: String, default: '' },
  status: { type: Number, default: 0 },
  statusText: { type: String, default: '待接单' },
  statusColor: { type: String, default: '' },
  riderId: { type: String, default: '' },
  pickupPhoto: { type: String, default: '' },
  deliverPhoto: { type: String, default: '' },
  deliverPhotoTime: Date,
  completeTime: Date,
  autoConfirmed: { type: Boolean, default: false },
  destLat: Number,
  destLng: Number,
  riderLat: Number,
  riderLng: Number,
  riderLocationTime: Date,
  outTradeNo: String,
  createTime: { type: Date, default: Date.now }
})

expressOrderSchema.index({ openid: 1 })
expressOrderSchema.index({ riderId: 1 })
expressOrderSchema.index({ status: 1 })
expressOrderSchema.index({ building: 1 })
expressOrderSchema.index({ createTime: -1 })

module.exports = mongoose.model('ExpressOrder', expressOrderSchema, 'express_orders')
