const mongoose = require('mongoose')

const experiencePostSchema = new mongoose.Schema({
    openid: String,
    nickname: String,
    avatar: String,
    title: String,
    content: String,
    category: String,
    school: String,
    admitted: { type: Boolean, default: false },
    images: [String],
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    likedBy: [String],
    createTime: { type: Date, default: Date.now }
})

experiencePostSchema.index({ category: 1, createTime: -1 })
experiencePostSchema.index({ openid: 1 })

module.exports = mongoose.model('ExperiencePost', experiencePostSchema, 'experience_posts')
