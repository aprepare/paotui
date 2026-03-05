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
  },
  wework: {
    corpid: process.env.WEWORK_CORPID || '',
    agentid: process.env.WEWORK_AGENTID || '',
    corpsecret: process.env.WEWORK_CORPSECRET || '',
    token: process.env.WEWORK_TOKEN || '',
    encodingAESKey: process.env.WEWORK_ENCODING_AES_KEY || '',
    staffUserId: process.env.WEWORK_STAFF_USERID || ''
  },
  domain: process.env.DOMAIN || 'https://xaioshualan.asia'
}
