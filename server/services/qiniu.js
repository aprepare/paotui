const qiniu = require('qiniu')
const config = require('../config')

const mac = new qiniu.auth.digest.Mac(config.qiniu.ak, config.qiniu.sk)

/**
 * 创建带 regionsProvider 的 Config（七牛 SDK 7.12+ 要求）
 */
function createConfig() {
  const cfg = new qiniu.conf.Config()
  // SDK 7.12+ 需要 regionsProvider 来自动查询上传区域
  if (qiniu.httpc && qiniu.httpc.Region && qiniu.httpc.Region.fromRegionId) {
    // 如果支持新版 API，使用 regionsProvider
    cfg.regionsProvider = qiniu.httpc.Region.fromRegionId('z2')
  } else {
    // 兼容旧版 SDK
    cfg.zone = qiniu.zone.Zone_z2
  }
  return cfg
}

/**
 * 生成上传凭证
 */
function getUploadToken() {
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: config.qiniu.bucket,
    expires: 3600
  })
  return putPolicy.uploadToken(mac)
}

/**
 * 服务端上传文件到七牛云
 * @param {string} localPath - 本地文件路径
 * @param {string} key - 七牛云存储 key（含文件夹前缀）
 * @returns {Promise<{key: string, url: string}>}
 */
function uploadFile(localPath, key) {
  return new Promise((resolve, reject) => {
    const token = getUploadToken()
    const cfg = createConfig()
    const formUploader = new qiniu.form_up.FormUploader(cfg)
    const putExtra = new qiniu.form_up.PutExtra()

    formUploader.putFile(token, key, localPath, putExtra, (err, body, info) => {
      if (err) return reject(err)
      if (info.statusCode === 200) {
        resolve({ key: body.key, url: getPublicUrl(body.key) })
      } else {
        reject(new Error(`Upload failed with status ${info.statusCode}: ${JSON.stringify(body)}`))
      }
    })
  })
}

/**
 * 获取文件公开访问 URL
 */
function getPublicUrl(key) {
  const domain = config.qiniu.domain.startsWith('http') ? config.qiniu.domain : `http://${config.qiniu.domain}`
  return `${domain}/${key}`
}

/**
 * 删除七牛云文件
 */
function deleteFile(key) {
  return new Promise((resolve, reject) => {
    const cfg = createConfig()
    const bucketManager = new qiniu.rs.BucketManager(mac, cfg)
    bucketManager.delete(config.qiniu.bucket, key, (err, respBody, respInfo) => {
      if (err) return reject(err)
      resolve(respInfo.statusCode === 200)
    })
  })
}

module.exports = { getUploadToken, uploadFile, getPublicUrl, deleteFile }
