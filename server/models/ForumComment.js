const mongoose = require('mongoose')

const forumCommentSchema = new mongoose.Schema({
  postId: String,
  openid: String,
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  content: String,
  replyTo: { type: String, default: '' },
  replyName: { type: String, default: '' },
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  createTime: { type: Date, default: Date.now }
})

forumCommentSchema.index({ postId: 1 })
forumCommentSchema.index({ createTime: -1 })

module.exports = mongoose.model('ForumComment', forumCommentSchema, 'forum_comments')
