const mongoose = require('mongoose')

const forumPostSchema = new mongoose.Schema({
  openid: String,
  nickname: { type: String, default: '' },
  avatar: { type: String, default: '' },
  content: String,
  images: [String],
  likes: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  likedBy: [String],
  createTime: { type: Date, default: Date.now }
})

forumPostSchema.index({ openid: 1 })
forumPostSchema.index({ createTime: -1 })

module.exports = mongoose.model('ForumPost', forumPostSchema, 'forum_posts')
