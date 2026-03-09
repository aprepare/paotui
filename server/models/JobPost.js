const mongoose = require('mongoose')

const jobPostSchema = new mongoose.Schema({
    title: { type: String, required: true },       // 岗位标题
    company: { type: String, default: '' },         // 招聘单位
    location: { type: String, default: '' },        // 工作地点
    pay: { type: String, default: '' },             // 薪资 如 ¥120/小时
    emoji: { type: String, default: '💼' },         // 图标emoji
    bg: { type: String, default: 'linear-gradient(135deg, #4299E1, #2B6CB0)' }, // 渐变背景
    image: { type: String, default: '' },           // 岗位图片URL（可选，优先于emoji显示）
    category: { type: String, default: '校内' },    // 分类: 校内/家教/阿那亚/阿尔卡迪亚/寒暑假
    subCategory: { type: String, default: '' },     // 子分类(阿那亚下的: 酒店/餐饮/活动等)
    time: { type: String, default: '' },            // 工作时间
    description: { type: String, default: '' },     // 岗位描述
    hot: { type: Boolean, default: false },         // 是否热招
    enabled: { type: Boolean, default: true },      // 是否启用
    sort: { type: Number, default: 0 },             // 排序
    createTime: { type: Date, default: Date.now }
})

jobPostSchema.index({ category: 1 })
jobPostSchema.index({ enabled: 1, sort: 1 })

module.exports = mongoose.model('JobPost', jobPostSchema, 'job_posts')
