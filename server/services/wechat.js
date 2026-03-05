const axios = require('axios')
const config = require('../config')

let accessTokenCache = { token: '', expireAt: 0 }

/**
 * 获取微信接口调用凭据 (access_token)
 */
async function getAccessToken() {
  if (accessTokenCache.token && Date.now() < accessTokenCache.expireAt) {
    return accessTokenCache.token
  }
  const url = 'https://api.weixin.qq.com/cgi-bin/token'
  const res = await axios.get(url, {
    params: {
      grant_type: 'client_credential',
      appid: config.wx.appid,
      secret: config.wx.secret
    }
  })
  if (res.data.errcode) {
    throw new Error(`getAccessToken failed: ${res.data.errmsg}`)
  }
  accessTokenCache = {
    token: res.data.access_token,
    expireAt: Date.now() + (res.data.expires_in - 300) * 1000
  }
  return res.data.access_token
}

/**
 * 调用微信 code2session 接口
 * @param {string} code - wx.login() 获取的临时登录凭证
 * @returns {Promise<{openid: string, session_key: string}>}
 */
async function code2session(code) {
  const url = 'https://api.weixin.qq.com/sns/jscode2session'
  const res = await axios.get(url, {
    params: {
      appid: config.wx.appid,
      secret: config.wx.secret,
      js_code: code,
      grant_type: 'authorization_code'
    }
  })

  if (res.data.errcode) {
    throw new Error(`WeChat code2session failed: ${res.data.errmsg}`)
  }

  return {
    openid: res.data.openid,
    session_key: res.data.session_key
  }
}

/**
 * 通过 code 获取用户手机号
 * @param {string} code - getPhoneNumber 事件返回的 code
 * @returns {Promise<{phone: string}>}
 */
async function getPhoneNumber(code) {
  const accessToken = await getAccessToken()
  const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`
  const res = await axios.post(url, { code })

  if (res.data.errcode !== 0) {
    throw new Error(`getPhoneNumber failed: ${res.data.errmsg || 'unknown error'}`)
  }

  const phoneInfo = res.data.phone_info
  const phone = phoneInfo.purePhoneNumber || phoneInfo.phoneNumber || ''
  return { phone }
}

/**
 * 文字内容安全检测
 * @param {string} openid - 用户 openid
 * @param {string} content - 待检测文字
 * @param {number} scene - 场景值 1=资料 2=评论 3=论坛 4=社交
 * @returns {Promise<boolean>} true=通过 false=违规
 */
async function msgSecCheck(openid, content, scene = 2) {
  if (!content || !content.trim()) return true
  try {
    const accessToken = await getAccessToken()
    const url = `https://api.weixin.qq.com/wxa/msg_sec_check?access_token=${accessToken}`
    const res = await axios.post(url, {
      openid,
      scene,
      version: 2,
      content
    })
    if (res.data.errcode !== 0) {
      console.warn('[msgSecCheck] API error:', res.data.errmsg)
      return true // API 异常时放行
    }
    return res.data.result && res.data.result.suggest === 'pass'
  } catch (e) {
    console.warn('[msgSecCheck] error:', e.message)
    return true // 异常时放行，避免阻塞正常使用
  }
}

/**
 * 图片内容安全检测
 * @param {Buffer} imageBuffer - 图片二进制数据
 * @returns {Promise<boolean>} true=通过 false=违规
 */
async function imgSecCheck(imageBuffer) {
  try {
    const FormData = require('form-data')
    const accessToken = await getAccessToken()
    const url = `https://api.weixin.qq.com/wxa/img_sec_check?access_token=${accessToken}`
    const form = new FormData()
    form.append('media', imageBuffer, { filename: 'image.jpg', contentType: 'image/jpeg' })
    const res = await axios.post(url, form, { headers: form.getHeaders() })
    if (res.data.errcode === 87014) {
      console.warn('[imgSecCheck] 图片包含违规内容')
      return false
    }
    if (res.data.errcode !== 0) {
      console.warn('[imgSecCheck] API error:', res.data.errmsg)
      return true
    }
    return true // errcode === 0 表示通过
  } catch (e) {
    console.warn('[imgSecCheck] error:', e.message)
    return true
  }
}

/**
 * 便捷内容检测（与云函数 checkContent 兼容）
 */
async function checkContent(openid, text, scene) {
  return msgSecCheck(openid, text, scene)
}

module.exports = { code2session, getAccessToken, getPhoneNumber, msgSecCheck, imgSecCheck, checkContent }
