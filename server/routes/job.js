const router = require('express').Router()
const auth = require('../middleware/auth')
const JobPost = require('../models/JobPost')
const PageConfig = require('../models/PageConfig')

// GET /api/job/page-config — 前端获取兼职页面配置（分类入口+寒暑假横幅）
router.get('/page-config', async (req, res) => {
    try {
        const doc = await PageConfig.findOne({ page: 'job' })
        const cfg = doc && doc.config ? doc.config : {}
        res.json({
            code: 0,
            data: {
                categories: Array.isArray(cfg.categories) ? cfg.categories : [],
                seasonBanner: cfg.seasonBanner || null,
                hotJobs: Array.isArray(cfg.hotJobs) ? cfg.hotJobs : []
            }
        })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// GET /api/job/list — 前端获取兼职列表（只返回启用的）
router.get('/list', async (req, res) => {
    try {
        const { category, subCategory } = req.query
        const query = { enabled: true }
        if (category) query.category = category
        if (subCategory) query.subCategory = subCategory
        const data = await JobPost.find(query).sort({ sort: 1, createTime: -1 })
        res.json({ code: 0, data })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

// GET /api/job/:id
router.get('/:id', async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id)
        if (!job) return res.json({ code: -1, msg: '岗位不存在' })
        res.json({ code: 0, data: job })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '服务器错误' })
    }
})

module.exports = router
