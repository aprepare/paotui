const mongoose = require('mongoose')

const smsCodeSchema = new mongoose.Schema({
  phone: String,
  code: String,
  expireAt: Number,
  createTime: { type: Date, default: Date.now }
})

smsCodeSchema.index({ phone: 1 })
smsCodeSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('SmsCode', smsCodeSchema, 'sms_codes')
