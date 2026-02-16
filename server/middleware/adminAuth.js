const jwt = require('jsonwebtoken')
const config = require('../config')

/**
 * 管理员鉴权中间件
 * 验证 JWT 中包含 role=admin
 */
module.exports = function adminAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: -1, msg: '未登录' })
  }

  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ code: -1, msg: '无权限' })
    }
    req.admin = { adminId: decoded.adminId, username: decoded.username, role: decoded.role }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: -1, msg: 'token已过期' })
    }
    return res.status(401).json({ code: -1, msg: '无效token' })
  }
}
