const mongoose = require('mongoose')

const skillUnlockSchema = new mongoose.Schema({
    openid: { type: String, required: true },
    skillId: { type: String, required: true },
    amount: { type: Number, default: 1 },
    payType: { type: String, default: 'wallet' },
    outTradeNo: { type: String, default: '' },
    paid: { type: Boolean, default: true },
    createTime: { type: Date, default: Date.now }
})

skillUnlockSchema.index({ openid: 1, skillId: 1 })
skillUnlockSchema.index({ outTradeNo: 1 })

module.exports = mongoose.model('SkillUnlock', skillUnlockSchema, 'skill_unlocks')
