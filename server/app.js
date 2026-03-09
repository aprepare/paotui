const express = require('express')
const cors = require('cors')
const path = require('path')
const mongoose = require('mongoose')
const config = require('./config')

const app = express()

// Middleware
app.use(cors())
// 微信支付回调需要原始 body 来验证签名
app.use('/api/payment/notify', express.raw({ type: '*/*' }), (req, res, next) => {
  // 将 raw buffer 转为 JSON 供路由使用
  try { req.body = JSON.parse(req.body.toString()) } catch (e) { }
  next()
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Static files - admin panel
app.use('/admin', express.static(path.join(__dirname, 'public/admin')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Request logger
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    if (duration > 1000) {
      console.warn(`[slow] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
    }
  })
  next()
})

// Routes
app.use('/api/upload', require('./routes/upload'))
app.use('/api/user', require('./routes/user'))
app.use('/api/express', require('./routes/express'))
app.use('/api/errand', require('./routes/errand'))
app.use('/api/carpool', require('./routes/carpool'))
app.use('/api/market', require('./routes/market'))
app.use('/api/forum', require('./routes/forum'))
app.use('/api/team', require('./routes/team'))
app.use('/api/message', require('./routes/message'))
app.use('/api/order', require('./routes/order'))
app.use('/api/home', require('./routes/home'))
app.use('/api/skill', require('./routes/skill'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/tutor', require('./routes/tutor'))
app.use('/api/food', require('./routes/food'))
app.use('/api/wash', require('./routes/wash'))
app.use('/api/experience', require('./routes/experience'))
app.use('/api/wework', require('./routes/wework'))
app.use('/api/job', require('./routes/job'))
app.use('/api/payment', require('./routes/payment'))

// API 404 handler
app.use('/api', (req, res) => {
  res.status(404).json({ code: -1, msg: '接口不存在' })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ code: -1, msg: '服务器内部错误' })
})

// Admin SPA fallback - 非 API 路由的 /admin/* 返回 index.html
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin/index.html'))
})

// Connect to MongoDB and start server
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB connected')
    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port}`)
    })
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })

module.exports = app
