const mongoose = require('mongoose')

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' },
  createTime: { type: Date, default: Date.now }
})

adminUserSchema.index({ username: 1 }, { unique: true })

module.exports = mongoose.model('AdminUser', adminUserSchema, 'admin_users')
