const router = require('express').Router()
const auth = require('../middleware/auth')
const { checkContent } = require('../services/wechat')
const ForumPost = require('../models/ForumPost')
const ForumComment = require('../models/ForumComment')
const User = require('../models/User')
const Message = require('../models/Message')

// GET /api/forum/list
router.get('/list', async (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 10 } = req.query
    const query = {}
    if (keyword) query.content = { $regex: keyword, $options: 'i' }
    const data = await ForumPost.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/forum/my
router.get('/my', auth, async (req, res) => {
  try {
    const data = await ForumPost.find({ openid: req.user.openid }).sort({ createTime: -1 }).limit(20)
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/forum/:id
router.get('/:id', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
    if (!post) return res.json({ code: -1, msg: '记录不存在' })
    const comments = await ForumComment.find({ postId: req.params.id }).sort({ createTime: -1 }).limit(50)
    res.json({ code: 0, data: { ...post.toObject(), commentList: comments } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/forum
router.post('/', auth, async (req, res) => {
  try {
    const { content, images } = req.body
    if (!content) return res.json({ code: -1, msg: 'content required' })
    const safe = await checkContent(req.user.openid, content, 3)
    if (!safe) return res.json({ code: -1, msg: '内容包含违规信息，请修改后重新发布' })
    const user = await User.findOne({ openid: req.user.openid })
    const post = await ForumPost.create({
      openid: req.user.openid, nickname: user ? user.name || '匿名' : '匿名',
      avatar: user ? user.avatar || '' : '', content, images: images || [],
      likes: 0, comments: 0, likedBy: [], createTime: new Date()
    })
    res.json({ code: 0, id: post._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/forum/:id/like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
    if (!post) return res.json({ code: -1, msg: '记录不存在' })
    const liked = post.likedBy && post.likedBy.includes(req.user.openid)
    if (liked) {
      await ForumPost.updateOne({ _id: req.params.id }, { $inc: { likes: -1 }, $pull: { likedBy: req.user.openid } })
    } else {
      await ForumPost.updateOne({ _id: req.params.id }, { $inc: { likes: 1 }, $push: { likedBy: req.user.openid } })
      if (post.openid !== req.user.openid) {
        const likeUser = await User.findOne({ openid: req.user.openid })
        const likeName = likeUser ? likeUser.name || '有人' : '有人'
        await Message.create({
          toOpenid: post.openid, fromOpenid: req.user.openid, fromName: likeName,
          type: 'like', title: '收到一个赞', content: likeName + ' 赞了你的帖子',
          targetId: req.params.id, targetType: 'forum', read: false, createTime: new Date()
        })
      }
    }
    res.json({ code: 0, liked: !liked })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/forum/:id/comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { content, replyTo, replyName } = req.body
    if (!content) return res.json({ code: -1, msg: 'content required' })
    const safe = await checkContent(req.user.openid, content, 2)
    if (!safe) return res.json({ code: -1, msg: '评论包含违规内容，请修改' })
    const user = await User.findOne({ openid: req.user.openid })
    const commentName = user ? user.name || '匿名' : '匿名'
    const commentData = {
      postId: req.params.id, openid: req.user.openid, nickname: commentName,
      avatar: user ? user.avatar || '' : '', content, createTime: new Date()
    }
    if (replyTo) { commentData.replyTo = replyTo; commentData.replyName = replyName || '' }
    const newCmt = await ForumComment.create(commentData)
    await ForumPost.updateOne({ _id: req.params.id }, { $inc: { comments: 1 } })
    // 通知帖子作者
    const post = await ForumPost.findById(req.params.id)
    if (post && post.openid !== req.user.openid) {
      const shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content
      await Message.create({
        toOpenid: post.openid, fromOpenid: req.user.openid, fromName: commentName,
        type: 'comment', title: '收到一条评论', content: commentName + ' 评论了你的帖子: ' + shortContent,
        targetId: req.params.id, targetType: 'forum', read: false, createTime: new Date()
      })
    }
    res.json({ code: 0, id: newCmt._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// DELETE /api/forum/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
    if (!post) return res.json({ code: -1, msg: '记录不存在' })
    if (post.openid !== req.user.openid) return res.json({ code: -1, msg: '仅发布者可删除' })
    await ForumPost.deleteOne({ _id: req.params.id })
    await ForumComment.deleteMany({ postId: req.params.id })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// DELETE /api/forum/comment/:id
router.delete('/comment/:id', auth, async (req, res) => {
  try {
    const cmt = await ForumComment.findById(req.params.id)
    if (!cmt) return res.json({ code: -1, msg: '记录不存在' })
    if (cmt.openid === req.user.openid) {
      await ForumComment.deleteOne({ _id: req.params.id })
      await ForumPost.updateOne({ _id: cmt.postId }, { $inc: { comments: -1 } })
      return res.json({ code: 0 })
    }
    const post = await ForumPost.findById(cmt.postId)
    if (post && post.openid === req.user.openid) {
      await ForumComment.deleteOne({ _id: req.params.id })
      await ForumPost.updateOne({ _id: cmt.postId }, { $inc: { comments: -1 } })
      return res.json({ code: 0 })
    }
    res.json({ code: -1, msg: '无权删除该评论' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
