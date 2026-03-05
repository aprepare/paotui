/**
 * 企业微信回调路由
 * GET  /api/wework/callback - URL 验证
 * POST /api/wework/callback - 事件接收（自动拉群）
 */
const router = require('express').Router()
const express = require('express')
const weworkService = require('../services/weworkService')
const config = require('../config')
const TeamActivity = require('../models/TeamActivity')
const TeamMember = require('../models/TeamMember')

// 企微回调需要接收 raw body 用于 XML 解析
router.use('/callback', express.text({ type: 'text/xml' }))

// GET /api/wework/callback - URL 验证
router.get('/callback', (req, res) => {
    const { msg_signature, timestamp, nonce, echostr } = req.query
    console.log('[wework verify] params:', { msg_signature, timestamp, nonce })

    if (!msg_signature || !echostr) return res.status(400).send('missing params')

    const valid = weworkService.verifySignature(timestamp, nonce, echostr, msg_signature)
    if (!valid) {
        console.error('[wework verify] signature mismatch')
        return res.status(403).send('invalid signature')
    }

    const plainEchostr = weworkService.decryptMsg(echostr)
    console.log('[wework verify] success')
    res.set('Content-Type', 'text/plain')
    res.send(plainEchostr)
})

// POST /api/wework/callback - 接收事件
router.post('/callback', async (req, res) => {
    try {
        const body = typeof req.body === 'string' ? req.body : ''
        const { msg_signature, timestamp, nonce } = req.query

        const encryptedMsg = weworkService.getXmlValue(body, 'Encrypt')
        if (!encryptedMsg) {
            console.error('[wework callback] no Encrypt in body')
            return res.send('success')
        }

        const valid = weworkService.verifySignature(timestamp, nonce, encryptedMsg, msg_signature)
        if (!valid) {
            console.error('[wework callback] signature mismatch')
            return res.send('success')
        }

        const xmlContent = weworkService.decryptMsg(encryptedMsg)
        console.log('[wework callback] decrypted:', xmlContent.slice(0, 300))

        const eventType = weworkService.getXmlValue(xmlContent, 'Event')
        const changeType = weworkService.getXmlValue(xmlContent, 'ChangeType')

        if (eventType === 'change_external_contact' && changeType === 'add_external_contact') {
            const externalUserId = weworkService.getXmlValue(xmlContent, 'ExternalUserID')
            const userId = weworkService.getXmlValue(xmlContent, 'UserID')
            const state = weworkService.getXmlValue(xmlContent, 'State')

            console.log('[add_external_contact]', { externalUserId, userId, state })

            if (state && externalUserId) {
                await handleAddContact(state, externalUserId, userId)
            }
        }
    } catch (e) {
        console.error('[wework callback] error:', e)
    }
    res.send('success')
})

/**
 * 处理添加好友事件 → 自动拉群
 * state 格式: "activityId_openid"
 */
async function handleAddContact(state, externalUserId, staffUserId) {
    const parts = state.split('_')
    if (parts.length < 2) return console.log('[handleAddContact] invalid state:', state)
    const activityId = parts[0]
    const openid = parts.slice(1).join('_')

    // 校验用户是否是该活动的成员
    const memberCount = await TeamMember.countDocuments({ activityId, openid })
    if (memberCount === 0) return console.log('[handleAddContact] 用户不是活动成员')

    // 检查活动状态
    const activity = await TeamActivity.findById(activityId)
    if (!activity || activity.status === 'ended') return console.log('[handleAddContact] 活动不存在或已结束')

    if (activity.chatId) {
        // 已有群 → 拉人进群
        console.log('[handleAddContact] 拉入已有群:', activity.chatId)
        await weworkService.addMemberToGroupChat(activity.chatId, externalUserId)
    } else {
        // 创建新群
        const groupName = activity.title ? (activity.title + ' 沟通群') : '组队沟通群'
        const result = await weworkService.createGroupChat(groupName, staffUserId, [externalUserId])
        if (result.errcode === 0 && result.chat_id) {
            await TeamActivity.updateOne({ _id: activityId }, { $set: { chatId: result.chat_id } })
            console.log('[handleAddContact] 群已创建, chatId:', result.chat_id)
        } else {
            console.error('[handleAddContact] 创建群失败', result)
        }
    }
}

module.exports = router
