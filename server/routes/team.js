const router = require('express').Router()
const auth = require('../middleware/auth')
const TeamActivity = require('../models/TeamActivity')
const TeamMember = require('../models/TeamMember')
const User = require('../models/User')

// GET /api/team/list
router.get('/list', async (req, res) => {
  try {
    const { type, page = 1, pageSize = 20 } = req.query
    const query = {}
    if (type) query.type = type
    const data = await TeamActivity.find(query).sort({ createTime: -1 })
      .skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/team/my - 获取我参与的或发布的（必须在 /:id 之前）
router.get('/my', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query
    const members = await TeamMember.find({ openid: req.user.openid }).select('activityId')
    const actIds = members.map(m => m.activityId)
    const data = await TeamActivity.find({
      $or: [
        { openid: req.user.openid },
        { _id: { $in: actIds } }
      ]
    }).sort({ createTime: -1 }).skip((Number(page) - 1) * Number(pageSize)).limit(Number(pageSize))
    res.json({ code: 0, data })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/team/:id
router.get('/:id', async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    const members = await TeamMember.find({ activityId: req.params.id })
    res.json({ code: 0, data: { ...activity.toObject(), members } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team
router.post('/', auth, async (req, res) => {
  try {
    const { title, type, place, time, max, desc, images } = req.body
    if (!title || !type) return res.json({ code: -1, msg: 'missing fields' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    const activity = await TeamActivity.create({
      openid: req.user.openid, title, type, place: place || '', time: time || '',
      max: Number(max) || 10, current: 1, desc: desc || '', images: images || [],
      photos: [], status: 'active', tag: '招募中', owner: userName, createTime: new Date()
    })
    await TeamMember.create({ activityId: activity._id.toString(), openid: req.user.openid, name: userName, joinTime: new Date() })
    res.json({ code: 0, id: activity._id })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.status === 'ended') return res.json({ code: -1, msg: '活动已结束' })
    if (activity.current >= activity.max) return res.json({ code: -1, msg: '已满员' })
    const existing = await TeamMember.countDocuments({ activityId: req.params.id, openid: req.user.openid })
    if (existing > 0) return res.json({ code: -1, msg: '已加入' })
    const user = await User.findOne({ openid: req.user.openid })
    const userName = user ? user.name || '匿名' : '匿名'
    await TeamMember.create({ activityId: req.params.id, openid: req.user.openid, name: userName, joinTime: new Date() })
    const newCurrent = activity.current + 1
    const updateData = { $inc: { current: 1 } }
    if (newCurrent >= activity.max) updateData.$set = { tag: '已满员' }
    await TeamActivity.updateOne({ _id: req.params.id }, updateData)
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.openid === req.user.openid) return res.json({ code: -1, msg: '发起人不能退出' })
    const member = await TeamMember.findOne({ activityId: req.params.id, openid: req.user.openid })
    if (!member) return res.json({ code: -1, msg: '未加入该活动' })
    await TeamMember.deleteOne({ _id: member._id })
    await TeamActivity.updateOne({ _id: req.params.id }, { $inc: { current: -1 } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/photo
router.post('/:id/photo', auth, async (req, res) => {
  try {
    const { fileIDs } = req.body
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.openid !== req.user.openid) return res.json({ code: -1, msg: '仅发起人可上传' })
    await TeamActivity.updateOne({ _id: req.params.id }, { $push: { photos: { $each: fileIDs } } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/end
router.post('/:id/end', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '记录不存在' })
    if (activity.openid !== req.user.openid) return res.json({ code: -1, msg: '仅发起人可结束' })
    await TeamActivity.updateOne({ _id: req.params.id }, { $set: { status: 'ended', tag: '已结束' } })
    res.json({ code: 0 })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/qrcode - 获取二维码（智能判断：已是好友返回进群码，否则返回加好友码）
router.post('/:id/qrcode', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '活动不存在' })
    const member = await TeamMember.findOne({ activityId: req.params.id, openid: req.user.openid })
    if (!member) return res.json({ code: -1, msg: '仅活动成员可获取' })
    const weworkService = require('../services/weworkService')

    // 判断是否已是企微好友
    if (member.isWeworkFriend) {
      // 已是好友 → 返回进群二维码
      try {
        // 先检查活动是否已有进群配置
        if (activity.joinWayConfigId) {
          const joinWayRes = await weworkService.getGroupJoinWay(activity.joinWayConfigId)
          if (joinWayRes.errcode === 0 && joinWayRes.join_way && joinWayRes.join_way.qr_code) {
            return res.json({ code: 0, data: { qr_code: joinWayRes.join_way.qr_code, type: 'group' } })
          }
        }
        // 没有缓存的进群配置，需要创建
        let chatId = activity.chatId
        if (chatId) {
          const state = member._id.toString()
          const result = await weworkService.createGroupJoinWay(
            [chatId], state,
            { autoCreateRoom: true, roomBaseName: activity.title || '组队群' }
          )
          if (result.errcode === 0 && result.config_id) {
            await TeamActivity.updateOne({ _id: req.params.id }, { $set: { joinWayConfigId: result.config_id } })
            const joinWayRes = await weworkService.getGroupJoinWay(result.config_id)
            if (joinWayRes.errcode === 0 && joinWayRes.join_way && joinWayRes.join_way.qr_code) {
              return res.json({ code: 0, data: { qr_code: joinWayRes.join_way.qr_code, type: 'group' } })
            }
          }
        }
        // 进群码生成失败，降级为联系我二维码
      } catch (e) {
        console.error('[qrcode group error]', e.message)
      }
    }

    // 未添加好友 或 进群码生成失败 → 返回「联系我」二维码
    const state = member._id.toString()
    const result = await weworkService.createContactQrcode(state)
    if (result.errcode === 0) {
      res.json({ code: 0, data: { qr_code: result.qr_code, config_id: result.config_id, type: 'contact' } })
    } else {
      res.json({ code: -1, msg: result.errmsg || '获取二维码失败' })
    }
  } catch (err) {
    console.error('[qrcode error]', err.message)
    res.status(500).json({ code: -1, msg: '服务器错误: ' + err.message })
  }
})

// GET /api/team/:id/group-status - 查询群聊状态
router.get('/:id/group-status', async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '活动不存在' })
    res.json({ code: 0, data: { chatId: activity.chatId || '', hasGroup: !!activity.chatId } })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// GET /api/team/:id/group-list - 管理员获取企微客户群列表（用于绑定群到活动）
router.get('/:id/group-list', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '活动不存在' })
    if (activity.openid !== req.user.openid) return res.json({ code: -1, msg: '仅活动发起人可操作' })
    const weworkService = require('../services/weworkService')
    const listRes = await weworkService.getGroupChatList()
    if (listRes.errcode === 0 && listRes.group_chat_list) {
      // 获取每个群的详情（群名）
      const groups = []
      for (const g of listRes.group_chat_list.slice(0, 20)) {
        try {
          const token = await weworkService.getAccessToken()
          const axios = require('axios')
          const detailRes = await axios.post(
            `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/get?access_token=${token}`,
            { chat_id: g.chat_id, need_name: 1 }
          )
          if (detailRes.data.errcode === 0) {
            groups.push({
              chat_id: g.chat_id,
              name: detailRes.data.group_chat.name || '未命名群',
              member_count: (detailRes.data.group_chat.member_list || []).length
            })
          }
        } catch (e) { /* skip */ }
      }
      res.json({ code: 0, data: { groups } })
    } else {
      res.json({ code: -1, msg: listRes.errmsg || '获取群列表失败' })
    }
  } catch (err) {
    console.error('[group-list error]', err.message)
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

// POST /api/team/:id/bind-group - 管理员将一个客户群绑定到活动
router.post('/:id/bind-group', auth, async (req, res) => {
  try {
    const activity = await TeamActivity.findById(req.params.id)
    if (!activity) return res.json({ code: -1, msg: '活动不存在' })
    if (activity.openid !== req.user.openid) return res.json({ code: -1, msg: '仅活动发起人可操作' })
    const { chatId } = req.body
    if (!chatId) return res.json({ code: -1, msg: '请选择一个群' })
    // 清除旧的进群配置缓存
    await TeamActivity.updateOne({ _id: req.params.id }, { $set: { chatId, joinWayConfigId: '' } })
    res.json({ code: 0, msg: '群聊已绑定到该活动' })
  } catch (err) {
    res.status(500).json({ code: -1, msg: '服务器错误' })
  }
})

module.exports = router
