const qiniu = require('qiniu')
const config = require('../config')

const mac = new qiniu.auth.digest.Mac(config.qiniu.ak, config.qiniu.sk)

/**
 * 生成上传凭证
 */
function getUploadToken(keyPrefix) {
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
    const formUploader = new qiniu.form_up.FormUploader(new qiniu.conf.Config())
    const putExtra = new qiniu.form_up.PutExtra()

    formUploader.putFile(token, key, localPath, putExtra, (err, body, info) => {
      if (err) return reject(err)
      if (info.statusCode === 200) {
        resolve({ key: body.key, url: getPublicUrl(body.key) })
      } else {
        reject(new Error(`Upload failed with status ${info.statusCode}`))
      }
    })
  })
}

/**
 * 获取文件公开访问 URL
 */
function getPublicUrl(key) {
  return `${config.qiniu.domain}/${key}`
}

/**
 * 删除七牛云文件
 */
function deleteFile(key) {
  return new Promise((resolve, reject) => {
    const bucketManager = new qiniu.rs.BucketManager(mac, new qiniu.conf.Config())
    bucketManager.delete(config.qiniu.bucket, key, (err, respBody, respInfo) => {
      if (err) return reject(err)
      resolve(respInfo.statusCode === 200)
    })
  })
}

module.exports = { getUploadToken, uploadFile, getPublicUrl, deleteFile }
