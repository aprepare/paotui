const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    phone: { type: String, required: true },
    name: { type: String, default: '' },
    status: { type: String, default: 'active' },
    addedBy: String,
    createTime: { type: Date, default: Date.now }
})

adminSchema.index({ phone: 1 })

module.exports = mongoose.model('Admin', adminSchema, 'admins')
