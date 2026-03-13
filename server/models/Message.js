const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  toOpenid: String,
  fromOpenid: { type: String, default: '' },
  fromName: { type: String, default: '' },
  fromPhone: { type: String, default: '' },
  type: String,
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  targetId: { type: String, default: '' },
  targetType: { type: String, default: '' },
  read: { type: Boolean, default: false },
  createTime: { type: Date, default: Date.now }
})

messageSchema.index({ toOpenid: 1, read: 1 })
messageSchema.index({ toOpenid: 1, createTime: -1 })
messageSchema.index({ fromOpenid: 1 })
messageSchema.index({ createTime: -1 })

module.exports = mongoose.model('Message', messageSchema, 'messages')
