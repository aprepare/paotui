/**
 * 企业微信 API 服务
 * 封装 access_token、签名验证、AES 加解密、建群/拉人
 */
const crypto = require('crypto')
const axios = require('axios')
const config = require('../config')

let accessTokenCache = { token: '', expireAt: 0 }

/**
 * 验证企微签名
 */
function verifySignature(timestamp, nonce, echostr, msgSignature) {
    const arr = [config.wework.token, timestamp, nonce, echostr].filter(Boolean).sort()
    const str = arr.join('')
    const sha1 = crypto.createHash('sha1').update(str).digest('hex')
    return sha1 === msgSignature
}

/**
 * 解密 AES（企微消息加解密）
 */
function decryptMsg(encryptedMsg) {
    const aesKey = Buffer.from(config.wework.encodingAESKey + '=', 'base64')
    const iv = aesKey.slice(0, 16)
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv)
    decipher.setAutoPadding(false)
    let decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedMsg, 'base64')),
        decipher.final()
    ])
    const padLen = decrypted[decrypted.length - 1]
    decrypted = decrypted.slice(0, decrypted.length - padLen)
    const msgLen = decrypted.readUInt32BE(16)
    return decrypted.slice(20, 20 + msgLen).toString('utf8')
}

/**
 * 从 XML 中提取指定标签的值
 */
function getXmlValue(xml, tag) {
    const regex = new RegExp('<' + tag + '><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></' + tag + '>')
    const match = xml.match(regex)
    if (match) return match[1]
    const regex2 = new RegExp('<' + tag + '>([^<]*)</' + tag + '>')
    const match2 = xml.match(regex2)
    return match2 ? match2[1] : ''
}

/**
 * 获取企微 access_token（带缓存）
 */
async function getAccessToken() {
    if (accessTokenCache.token && Date.now() < accessTokenCache.expireAt) {
        return accessTokenCache.token
    }
    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${config.wework.corpid}&corpsecret=${config.wework.corpsecret}`
    const res = await axios.get(url)
    if (res.data.access_token) {
        accessTokenCache = {
            token: res.data.access_token,
            expireAt: Date.now() + (res.data.expires_in - 300) * 1000
        }
        return res.data.access_token
    }
    throw new Error(res.data.errmsg || 'get token failed')
}

/**
 * 创建「联系我」带参二维码
 */
async function createContactQrcode(state, staffUserId) {
    const token = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/add_contact_way?access_token=${token}`
    const body = {
        type: 1,
        scene: 2,
        style: 1,
        remark: '自动拉群',
        skip_verify: true,
        state: state,
        user: [staffUserId || config.wework.staffUserId]
    }
    const res = await axios.post(url, body)
    console.log('[createContactQrcode]', JSON.stringify(res.data))
    return res.data
}

/**
 * 配置客户群进群方式（生成群活码）
 * 使用 add_join_way API — 用户扫码直接进群，无需先加好友
 * @param {string[]} chatIdList - 已有客户群的 chat_id 数组
 * @param {string} state - 自定义参数（≤30字节）
 * @param {object} options - 可选项 { autoCreateRoom, roomBaseName, roomBaseId }
 */
async function createGroupJoinWay(chatIdList, state, options = {}) {
    const token = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/add_join_way?access_token=${token}`
    const body = {
        scene: 2,
        remark: '组队进群',
        auto_create_room: options.autoCreateRoom ? 1 : 0,
        room_base_name: options.roomBaseName || '组队群',
        room_base_id: options.roomBaseId || 1,
        chat_id_list: chatIdList,
        state: state || ''
    }
    const res = await axios.post(url, body)
    console.log('[createGroupJoinWay]', JSON.stringify(res.data))
    return res.data
}

/**
 * 获取客户群进群方式配置（拿到群进群二维码）
 * @param {string} configId - add_join_way 返回的 config_id
 */
async function getGroupJoinWay(configId) {
    const token = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/get_join_way?access_token=${token}`
    const res = await axios.post(url, { config_id: configId })
    console.log('[getGroupJoinWay]', JSON.stringify(res.data))
    return res.data
}

/**
 * 获取客户群列表 — 用于自动获取已建好的群的 chat_id
 */
async function getGroupChatList(staffUserId) {
    const token = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/list?access_token=${token}`
    const body = {
        status_filter: 0,
        owner_filter: { userid_list: [staffUserId || config.wework.staffUserId] },
        limit: 100
    }
    const res = await axios.post(url, body)
    console.log('[getGroupChatList]', JSON.stringify(res.data))
    return res.data
}

/**
 * 发送新客户欢迎语
 * 当用户通过「联系我」二维码添加好友后，回调事件中会携带 welcome_code
 * 用此 code 调用该接口，可以在企微聊天中自动发送欢迎消息
 * @param {string} welcomeCode - 回调事件中的 welcome_code
 * @param {string} textContent - 文本消息内容
 * @param {object[]} attachments - 附件列表（link, image, miniprogram 等）
 */
async function sendWelcomeMsg(welcomeCode, textContent, attachments = []) {
    const token = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/send_welcome_msg?access_token=${token}`
    const body = {
        welcome_code: welcomeCode,
        text: { content: textContent }
    }
    if (attachments.length > 0) {
        body.attachments = attachments
    }
    const res = await axios.post(url, body)
    console.log('[sendWelcomeMsg]', JSON.stringify(res.data))
    return res.data
}

module.exports = {
    verifySignature,
    decryptMsg,
    getXmlValue,
    getAccessToken,
    createContactQrcode,
    createGroupJoinWay,
    getGroupJoinWay,
    getGroupChatList,
    sendWelcomeMsg
}

