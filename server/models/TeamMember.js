const mongoose = require('mongoose')

const teamMemberSchema = new mongoose.Schema({
  activityId: String,
  openid: String,
  name: { type: String, default: '' },
  joinTime: { type: Date, default: Date.now }
})

teamMemberSchema.index({ activityId: 1 })
teamMemberSchema.index({ openid: 1 })

module.exports = mongoose.model('TeamMember', teamMemberSchema, 'team_members')
