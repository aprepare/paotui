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
 * 创建客户群聊
 */
async function createGroupChat(name, ownerUserId, externalUserIds) {
    const token = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/create?access_token=${token}`
    const body = {
        group_name: name,
        owner: ownerUserId,
        user_list: [ownerUserId],
        external_userid_list: externalUserIds
    }
    const res = await axios.post(url, body)
    console.log('[createGroupChat]', JSON.stringify(res.data))
    return res.data
}

/**
 * 将外部联系人加入已有群聊
 */
async function addMemberToGroupChat(chatId, externalUserId) {
    const token = await getAccessToken()
    const url = `https://qyapi.weixin.qq.com/cgi-bin/externalcontact/groupchat/update?access_token=${token}`
    const body = {
        chat_id: chatId,
        add_external_userid: [externalUserId]
    }
    const res = await axios.post(url, body)
    console.log('[addMemberToGroupChat]', JSON.stringify(res.data))
    return res.data
}

module.exports = {
    verifySignature,
    decryptMsg,
    getXmlValue,
    getAccessToken,
    createContactQrcode,
    createGroupChat,
    addMemberToGroupChat
}
