require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/campus_errand',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  wx: {
    appid: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || ''
  },
  qiniu: {
    ak: process.env.QINIU_AK || '',
    sk: process.env.QINIU_SK || '',
    bucket: process.env.QINIU_BUCKET || '',
    domain: process.env.QINIU_DOMAIN || ''
  }
}
