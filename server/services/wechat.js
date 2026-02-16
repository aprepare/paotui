const axios = require('axios')
const config = require('../config')

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

module.exports = { code2session }
