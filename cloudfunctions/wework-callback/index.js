/**
 * 企业微信回调接收云函数（HTTP 触发）
 * 
 * 用途：接收企业微信事件回调，处理用户添加好友后自动拉群
 * 
 * 企微回调配置需要的信息：
 *   - Token: 你在企微后台设置的 Token
 *   - EncodingAESKey: 你在企微后台设置的 EncodingAESKey
 *   - corpid: 你的企业ID
 * 
 * 请在下方 CONFIG 中填入你的配置
 */
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// ============ 请填入你的配置 ============
const CONFIG = {
  token: '',            // 企微后台设置的 Token
  encodingAESKey: '',   // 企微后台设置的 EncodingAESKey
  corpid: '',           // 企业ID
  corpsecret: '',       // 应用的 Secret
  agentid: '',          // 应用ID
}
// ======================================

// ============ 加解密工具 ============

/**
 * 验证企微签名
 */
function verifySignature(token, timestamp, nonce, echostr, msgSignature) {
  const arr = [token, timestamp, nonce, echostr].filter(Boolean).sort()
  const str = arr.join('')
  const sha1 = crypto.createHash('sha1').update(str).digest('hex')
  return sha1 === msgSignature
}

/**
 * 解密 AES（企微消息加解密）
 */
function decryptMsg(encodingAESKey, encryptedMsg) {
  // EncodingAESKey 是 Base64 编码的，解码后得到 AES Key
  const aesKey = Buffer.from(encodingAESKey + '=', 'base64')
  const iv = aesKey.slice(0, 16)

  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv)
  decipher.setAutoPadding(false)

  let decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedMsg, 'base64')),
    decipher.final()
  ])

  // 去除 PKCS7 填充
  const padLen = decrypted[decrypted.length - 1]
  decrypted = decrypted.slice(0, decrypted.length - padLen)

  // 前16字节是随机字符串，接下来4字节是内容长度，之后是内容，最后是 corpid
  const msgLen = decrypted.readUInt32BE(16)
  const content = decrypted.slice(20, 20 + msgLen).toString('utf8')
  return content
}

/**
 * 从 XML 中提取指定标签的值
 */
function getXmlValue(xml, tag) {
  const regex = new RegExp('<' + tag + '><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></' + tag + '>')
  const match = xml.match(regex)
  if (match) return match[1]
  // 也可能没有 CDATA
  const regex2 = new RegExp('<' + tag + '>([^<]*)</' + tag + '>')
  const match2 = xml.match(regex2)
  return match2 ? match2[1] : ''
}

// ============ 企微 API 调用工具 ============

let accessTokenCache = { token: '', expireAt: 0 }

/**
 * 获取企微 access_token（带缓存）
 */
async function getAccessToken() {
  if (accessTokenCache.token && Date.now() < accessTokenCache.expireAt) {
    return accessTokenCache.token
  }
  const https = require('https')
  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CONFIG.corpid}&corpsecret=${CONFIG.corpsecret}`
  
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        const json = JSON.parse(data)
        if (json.access_token) {
          accessTokenCache = {
            token: json.access_token,
            expireAt: Date.now() + (json.expires_in - 300) * 1000
          }
          resolve(json.access_token)
        } else {
          console.error('[getAccessToken] failed', json)
          reject(new Error(json.errmsg || 'get token failed'))
        }
      })
    }).on('error', reject)
  })
}

/**
 * 发起 HTTPS POST 请求
 */
function httpsPost(url, body) {
  const https = require('https')
  const urlObj = new URL(url)
  const postData = JSON.stringify(body)
  
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { resolve(data) }
      })
    })
    req.on('error', reject)
    req.write(postData)
    req.end()
  })
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
  const res = await httpsPost(url, body)
  console.log('[createGroupChat]', JSON.stringify(res))
  return res
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
  const res = await httpsPost(url, body)
  console.log('[addMemberToGroupChat]', JSON.stringify(res))
  return res
}

// ============ 主入口 ============

exports.main = async (event, context) => {
  console.log('[weworkCallback] event:', JSON.stringify(event).slice(0, 500))

  // HTTP触发的云函数，event 结构不同
  const method = event.httpMethod || (event.queryStringParameters ? 'GET' : 'POST')
  const query = event.queryStringParameters || {}

  // ========== GET: URL 验证 ==========
  if (method === 'GET') {
    const { msg_signature, timestamp, nonce, echostr } = query
    console.log('[verify] params:', { msg_signature, timestamp, nonce, echostr: echostr ? echostr.slice(0, 20) + '...' : '' })

    if (!msg_signature || !echostr) {
      return { statusCode: 400, body: 'missing params' }
    }

    // 验证签名
    const valid = verifySignature(CONFIG.token, timestamp, nonce, echostr, msg_signature)
    if (!valid) {
      console.error('[verify] signature mismatch')
      return { statusCode: 403, body: 'invalid signature' }
    }

    // 解密 echostr
    const plainEchostr = decryptMsg(CONFIG.encodingAESKey, echostr)
    console.log('[verify] success, echostr:', plainEchostr)

    // 必须直接返回解密后的内容（纯文本）
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: plainEchostr
    }
  }

  // ========== POST: 接收事件 ==========
  const body = event.body || ''
  const { msg_signature, timestamp, nonce } = query

  // 从 XML 中提取加密内容
  const encryptedMsg = getXmlValue(body, 'Encrypt')
  if (!encryptedMsg) {
    console.error('[callback] no Encrypt in body')
    return { statusCode: 200, body: 'success' }
  }

  // 验证签名
  const valid = verifySignature(CONFIG.token, timestamp, nonce, encryptedMsg, msg_signature)
  if (!valid) {
    console.error('[callback] signature mismatch')
    return { statusCode: 200, body: 'success' }
  }

  // 解密消息
  const xmlContent = decryptMsg(CONFIG.encodingAESKey, encryptedMsg)
  console.log('[callback] decrypted:', xmlContent.slice(0, 300))

  const event_type = getXmlValue(xmlContent, 'Event')
  const changeType = getXmlValue(xmlContent, 'ChangeType')

  // 只处理「添加外部联系人」事件
  if (event_type === 'change_external_contact' && changeType === 'add_external_contact') {
    const externalUserId = getXmlValue(xmlContent, 'ExternalUserID')
    const userId = getXmlValue(xmlContent, 'UserID')  // 企微员工 userid
    const state = getXmlValue(xmlContent, 'State')

    console.log('[add_external_contact]', { externalUserId, userId, state })

    if (state && externalUserId) {
      await handleAddContact(state, externalUserId, userId)
    }
  }

  return { statusCode: 200, body: 'success' }
}

/**
 * 处理添加好友事件 → 自动拉群
 * state 格式: "activityId_openid"
 */
async function handleAddContact(state, externalUserId, staffUserId) {
  const parts = state.split('_')
  if (parts.length < 2) {
    console.log('[handleAddContact] invalid state:', state)
    return
  }
  const activityId = parts[0]
  const openid = parts.slice(1).join('_')  // openid 可能包含下划线

  console.log('[handleAddContact] activityId:', activityId, 'openid:', openid)

  // 1. 校验用户是否是该活动的成员
  try {
    const memberCheck = await db.collection('team_members')
      .where({ activityId, openid })
      .count()
    
    if (memberCheck.total === 0) {
      console.log('[handleAddContact] 用户不是活动成员，不拉群')
      return
    }
  } catch (e) {
    console.error('[handleAddContact] 查询成员失败', e)
    return
  }

  // 2. 检查活动状态
  try {
    const activity = await db.collection('team_activities').doc(activityId).get()
    const act = activity.data
    if (act.status === 'ended') {
      console.log('[handleAddContact] 活动已结束，不拉群')
      return
    }

    // 3. 检查是否已有群聊
    if (act.chatId) {
      // 已有群 → 拉人进群
      console.log('[handleAddContact] 拉入已有群:', act.chatId)
      await addMemberToGroupChat(act.chatId, externalUserId)
    } else {
      // 创建新群
      const groupName = act.title ? (act.title + ' 沟通群') : '组队沟通群'
      console.log('[handleAddContact] 创建新群:', groupName)
      const res = await createGroupChat(groupName, staffUserId, [externalUserId])
      if (res.errcode === 0 && res.chat_id) {
        // 保存 chatId 到活动记录
        await db.collection('team_activities').doc(activityId).update({
          data: { chatId: res.chat_id }
        })
        console.log('[handleAddContact] 群已创建, chatId:', res.chat_id)
      } else {
        console.error('[handleAddContact] 创建群失败', res)
      }
    }
  } catch (e) {
    console.error('[handleAddContact] 处理失败', e)
  }
}
