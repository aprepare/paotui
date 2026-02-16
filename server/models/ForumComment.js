const mongoose = require('mongoose')

const forumCommentSchema = new mongoose.Schema({
  postId: String,
  openid: String,
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  content: String,
  createTime: { type: Date, default: Date.now }
})

forumCommentSchema.index({ postId: 1 })
forumCommentSchema.index({ createTime: -1 })

module.exports = mongoose.model('ForumComment', forumCommentSchema, 'forum_comments')
