/**
 * 检查是否已登录（已完善用户信息）
 * 未登录则跳转登录页，返回 false
 */
export const checkLogin = () => {
  var info = uni.getStorageSync('userInfo')
  if (info && info.name) return true
  uni.navigateTo({ url: '/pages/login/index' })
  return false
}

/**
 * 云函数调用封装
 * 用法: const res = await callCloud('express', 'list', { status: 0, page: 1 })
 */
export const callCloud = async (name, action, data = {}) => {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data: { action, data }
    })
    if (res.result && res.result.code === 0) {
      return res.result
    }
    const msg = (res.result && res.result.msg) || '请求失败'
    console.error('[cloud]', name, action, msg)
    uni.showToast({ title: msg, icon: 'none' })
    return res.result || { code: -1, msg }
  } catch (err) {
    console.error('[cloud error]', name, action, err)
    uni.showToast({ title: '网络异常，请重试', icon: 'none' })
    return { code: -1, msg: err.message }
  }
}

/**
 * 上传图片到云存储
 * @param {string} tempPath - 临时文件路径
 * @param {string} folder - 存储文件夹名
 * @returns {string} fileID
 */
export const uploadImage = async (tempPath, folder = 'images') => {
  const ext = tempPath.split('.').pop() || 'jpg'
  const cloudPath = folder + '/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext
  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath: tempPath
  })
  return res.fileID
}

/**
 * 批量上传图片
 * @param {string[]} tempPaths - 临时文件路径数组
 * @param {string} folder - 存储文件夹名
 * @returns {string[]} fileID数组
 */
export const uploadImages = async (tempPaths, folder = 'images') => {
  const tasks = tempPaths.map(p => uploadImage(p, folder))
  return Promise.all(tasks)
}
