const jwt = require('jsonwebtoken')
const config = require('../config')

/**
 * 小程序用户鉴权中间件
 * 从 Authorization: Bearer <token> 提取并验证 JWT，将 openid 和 userId 挂到 req.user
 */
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: -1, msg: '未登录' })
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = { openid: decoded.openid, userId: decoded.userId }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: -1, msg: 'token已过期' })
    }
    return res.status(401).json({ code: -1, msg: '无效token' })
  }
}
