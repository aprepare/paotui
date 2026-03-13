const mongoose = require('mongoose')

const tutorPostSchema = new mongoose.Schema({
    openid: String,
    type: { type: String, enum: ['tutor', 'demand'], default: 'tutor' },
    status: { type: Number, default: 1 },
    // 家教信息
    name: String,
    school: String,
    major: String,
    subject: String,
    subjects: [String],
    mode: { type: String, default: '线上+线下' },
    area: String,
    price: Number,
    experience: String,
    desc: String,
    avatar: String,
    verified: { type: Boolean, default: false },
    studentCard: String,
    // 联系方式
    phone: String,
    wechat: String,
    qq: String,
    // 需求信息
    title: String,
    grade: String,
    location: String,
    schedule: String,
    budget: Number,
    parentName: String,
    idCard: String,
    reviewStatus: { type: String, default: 'pending' },
    createTime: { type: Date, default: Date.now }
})

tutorPostSchema.index({ type: 1, status: 1 })
tutorPostSchema.index({ openid: 1 })
tutorPostSchema.index({ createTime: -1 })

module.exports = mongoose.model('TutorPost', tutorPostSchema, 'tutor_posts')
