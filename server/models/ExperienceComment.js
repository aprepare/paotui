const mongoose = require('mongoose')

const experienceCommentSchema = new mongoose.Schema({
    postId: String,
    openid: String,
    nickname: String,
    avatar: String,
    content: String,
    replyTo: String,
    replyName: String,
    likes: { type: Number, default: 0 },
    likedBy: [String],
    createTime: { type: Date, default: Date.now }
})

experienceCommentSchema.index({ postId: 1, createTime: -1 })

module.exports = mongoose.model('ExperienceComment', experienceCommentSchema, 'experience_comments')
