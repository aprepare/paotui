const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  openid: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  isRider: { type: Boolean, default: false },
  riderId: { type: String, default: '' },
  riderInfo: {
    realName: { type: String, default: '' },
    phone: { type: String, default: '' },
    studentId: { type: String, default: '' },
    building: { type: String, default: '' }
  },
  riderRegTime: Date,
  level: { type: String, default: '' },
  createTime: { type: Date, default: Date.now }
})

userSchema.index({ openid: 1 }, { unique: true })

module.exports = mongoose.model('User', userSchema, 'users')
