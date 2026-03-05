const router = require('express').Router()
const auth = require('../middleware/auth')
const { checkContent } = require('../services/wechat')
const ExperiencePost = require('../models/ExperiencePost')
const ExperienceComment = require('../models/ExperienceComment')
const User = require('../models/User')
const Message = require('../models/Message')

// GET /api/experience/list
router.get('/list', async (req, res) => {
    try {
        const { keyword, category, page = 1, pageSize = 20 } = req.query
        const where = {}
        if (category) where.category = category
        let list = await ExperiencePost.find(where)
            .sort({ createTime: -1 })
            .skip((Number(page) - 1) * Number(pageSize))
            .limit(Number(pageSize))
        if (keyword) {
            const kw = keyword.toLowerCase()
            list = list.filter(p =>
                (p.title || '').toLowerCase().includes(kw) ||
                (p.content || '').toLowerCase().includes(kw)
            )
        }
        res.json({ code: 0, data: list })
    } catch (err) {
        res.json({ code: 0, data: [] })
    }
})

// GET /api/experience/:id
router.get('/:id', async (req, res) => {
    try {
        const post = await ExperiencePost.findById(req.params.id)
        if (!post) return res.json({ code: -1, msg: '帖子不存在' })
        const comments = await ExperienceComment.find({ postId: req.params.id })
            .sort({ createTime: -1 }).limit(50)
        res.json({ code: 0, data: { ...post.toObject(), commentList: comments } })
    } catch (err) {
        res.json({ code: -1, msg: '帖子不存在' })
    }
})

// POST /api/experience
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, category, school, admitted, images } = req.body
        if (!title || !content) return res.json({ code: -1, msg: '标题和内容不能为空' })
        const textToCheck = (title || '') + ' ' + (content || '')
        const safe = await checkContent(req.user.openid, textToCheck, 3)
        if (!safe) return res.json({ code: -1, msg: '内容包含违规信息，请修改后重新发布' })
        const user = await User.findOne({ openid: req.user.openid })
        const u = user || {}
        const post = await ExperiencePost.create({
            openid: req.user.openid,
            nickname: u.name || '匿名', avatar: u.avatar || '',
            title, content, category: category || '',
            school: school || '', admitted: admitted || false,
            images: images || [], likes: 0, comments: 0, likedBy: [],
            createTime: new Date()
        })
        res.json({ code: 0, id: post._id })
    } catch (err) {
        res.status(500).json({ code: -1, msg: '发布失败' })
    }
})

// POST /api/experience/:id/like
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await ExperiencePost.findById(req.params.id)
        if (!post) return res.json({ code: -1, msg: '帖子不存在' })
        const liked = post.likedBy && post.likedBy.includes(req.user.openid)
        if (liked) {
            await ExperiencePost.updateOne({ _id: req.params.id }, {
                $inc: { likes: -1 }, $pull: { likedBy: req.user.openid }
            })
        } else {
            await ExperiencePost.updateOne({ _id: req.params.id }, {
                $inc: { likes: 1 }, $push: { likedBy: req.user.openid }
            })
            if (post.openid !== req.user.openid) {
                const likeUser = await User.findOne({ openid: req.user.openid })
                const likeName = (likeUser && likeUser.name) || '有人'
                await Message.create({
                    toOpenid: post.openid, fromOpenid: req.user.openid, fromName: likeName,
                    type: 'like', title: '收到一个赞',
                    content: likeName + ' 赞了你的经验帖「' + (post.title || '') + '」',
                    targetId: req.params.id, targetType: 'experience',
                    read: false, createTime: new Date()
                })
            }
        }
        res.json({ code: 0, liked: !liked })
    } catch (err) {
        res.json({ code: -1, msg: err.message })
    }
})

// POST /api/experience/:id/comment
router.post('/:id/comment', auth, async (req, res) => {
    try {
        const { content, replyTo, replyName } = req.body
        if (!content) return res.json({ code: -1, msg: '评论内容不能为空' })
        const safe = await checkContent(req.user.openid, content, 2)
        if (!safe) return res.json({ code: -1, msg: '评论包含违规内容，请修改' })
        const user = await User.findOne({ openid: req.user.openid })
        const u = user || {}
        const commentData = {
            postId: req.params.id, openid: req.user.openid,
            nickname: u.name || '匿名', avatar: u.avatar || '',
            content, likes: 0, likedBy: [], createTime: new Date()
        }
        if (replyTo) { commentData.replyTo = replyTo; commentData.replyName = replyName || '' }
        const comment = await ExperienceComment.create(commentData)
        await ExperiencePost.updateOne({ _id: req.params.id }, { $inc: { comments: 1 } })

        const post = await ExperiencePost.findById(req.params.id)
        if (post && post.openid !== req.user.openid) {
            const shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content
            await Message.create({
                toOpenid: post.openid, fromOpenid: req.user.openid, fromName: u.name || '匿名',
                type: 'comment', title: '收到一条评论',
                content: (u.name || '匿名') + ' 评论了你的经验帖: ' + shortContent,
                targetId: req.params.id, targetType: 'experience',
                read: false, createTime: new Date()
            })
        }
        res.json({ code: 0, id: comment._id })
    } catch (err) {
        res.json({ code: -1, msg: err.message })
    }
})

// POST /api/experience/comment/:id/like
router.post('/comment/:id/like', auth, async (req, res) => {
    try {
        const comment = await ExperienceComment.findById(req.params.id)
        if (!comment) return res.json({ code: -1, msg: '评论不存在' })
        const liked = comment.likedBy && comment.likedBy.includes(req.user.openid)
        if (liked) {
            await ExperienceComment.updateOne({ _id: req.params.id }, {
                $inc: { likes: -1 }, $pull: { likedBy: req.user.openid }
            })
        } else {
            await ExperienceComment.updateOne({ _id: req.params.id }, {
                $inc: { likes: 1 }, $push: { likedBy: req.user.openid }
            })
        }
        res.json({ code: 0, liked: !liked })
    } catch (err) {
        res.json({ code: -1, msg: err.message })
    }
})

// DELETE /api/experience/comment/:id
router.delete('/comment/:id', auth, async (req, res) => {
    try {
        const comment = await ExperienceComment.findById(req.params.id)
        if (!comment) return res.json({ code: -1, msg: '评论不存在' })
        if (comment.openid === req.user.openid) {
            await ExperienceComment.deleteOne({ _id: req.params.id })
            await ExperiencePost.updateOne({ _id: comment.postId }, { $inc: { comments: -1 } })
            return res.json({ code: 0 })
        }
        const post = await ExperiencePost.findById(comment.postId)
        if (post && post.openid === req.user.openid) {
            await ExperienceComment.deleteOne({ _id: req.params.id })
            await ExperiencePost.updateOne({ _id: comment.postId }, { $inc: { comments: -1 } })
            return res.json({ code: 0 })
        }
        res.json({ code: -1, msg: '无权删除该评论' })
    } catch (err) {
        res.json({ code: -1, msg: err.message })
    }
})

// DELETE /api/experience/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await ExperiencePost.findById(req.params.id)
        if (!post || post.openid !== req.user.openid) return res.json({ code: -1, msg: '仅发布者可删除' })
        await ExperiencePost.deleteOne({ _id: req.params.id })
        await ExperienceComment.deleteMany({ postId: req.params.id })
        res.json({ code: 0 })
    } catch (err) {
        res.json({ code: -1, msg: err.message })
    }
})

module.exports = router
