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
            const welcomeCode = weworkService.getXmlValue(xmlContent, 'WelcomeCode')

            console.log('[add_external_contact]', { externalUserId, userId, state, welcomeCode })

            if (state && externalUserId) {
                await handleAddContact(state, externalUserId, userId, welcomeCode)
            }
        }
    } catch (e) {
        console.error('[wework callback] error:', e)
    }
    res.send('success')
})

/**
 * 处理添加好友事件 → 自动发送欢迎语 + 进群链接
 * state 格式: TeamMember 的 ObjectId（24字符）
 */
async function handleAddContact(state, externalUserId, staffUserId, welcomeCode) {
    if (!state || state.length !== 24) return console.log('[handleAddContact] invalid state:', state)

    // 校验用户是否是该活动的成员
    const member = await TeamMember.findById(state)
    if (!member) return console.log('[handleAddContact] 用户不是活动成员')

    // 标记该用户已是企微好友（同时更新该 openid 的所有活动记录）
    await TeamMember.updateMany(
        { openid: member.openid },
        { $set: { externalUserId, isWeworkFriend: true } }
    )
    console.log('[handleAddContact] 已标记好友状态, openid:', member.openid)

    const activityId = member.activityId

    // 获取活动信息
    const activity = await TeamActivity.findById(activityId)
    if (!activity || activity.status === 'ended') return console.log('[handleAddContact] 活动不存在或已结束')

    // 如果没有 welcomeCode，只能打日志了
    if (!welcomeCode) {
        console.log('[handleAddContact] 无 welcomeCode，无法发送欢迎语')
        return
    }

    try {
        // 获取或创建活动的进群二维码
        let joinQrCode = ''

        if (activity.joinWayConfigId) {
            // 已有进群配置，直接获取二维码
            const joinWayRes = await weworkService.getGroupJoinWay(activity.joinWayConfigId)
            if (joinWayRes.errcode === 0 && joinWayRes.join_way) {
                joinQrCode = joinWayRes.join_way.qr_code || ''
            }
        }

        if (!joinQrCode) {
            // 需要创建进群配置，但必须有活动绑定的群
            let chatId = activity.chatId

            if (chatId) {
                const joinResult = await weworkService.createGroupJoinWay(
                    [chatId], state.slice(0, 24),
                    { autoCreateRoom: true, roomBaseName: activity.title || '组队群' }
                )
                if (joinResult.errcode === 0 && joinResult.config_id) {
                    await TeamActivity.updateOne({ _id: activityId }, { $set: { joinWayConfigId: joinResult.config_id } })
                    const joinWayRes = await weworkService.getGroupJoinWay(joinResult.config_id)
                    if (joinWayRes.errcode === 0 && joinWayRes.join_way) {
                        joinQrCode = joinWayRes.join_way.qr_code || ''
                    }
                }
            }
        }

        // 构造欢迎消息
        const activityTitle = activity.title || '组队活动'
        let welcomeText = `🎉 欢迎加入！您已成功报名「${activityTitle}」\n\n`

        const attachments = []

        if (joinQrCode) {
            welcomeText += `👇 请点击下方链接加入活动群聊，和队友一起沟通吧！`
            attachments.push({
                msgtype: 'link',
                link: {
                    title: `加入「${activityTitle}」群聊`,
                    picurl: joinQrCode,
                    desc: '点击即可加入活动专属群聊',
                    url: joinQrCode
                }
            })
        } else {
            welcomeText += `⏳ 群聊正在创建中，稍后会通知您进群。`
        }

        // 发送欢迎消息
        const result = await weworkService.sendWelcomeMsg(welcomeCode, welcomeText, attachments)
        console.log('[handleAddContact] 欢迎消息发送结果:', JSON.stringify(result))

    } catch (err) {
        console.error('[handleAddContact] error:', err.message)
    }
}

module.exports = router

