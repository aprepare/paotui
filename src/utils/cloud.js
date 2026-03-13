// HTTP 模式 — 已迁移到自建服务器
const USE_CLOUD = false
const BASE_URL = 'https://xaioshualan.asia/api'
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '')

/**
 * 解析图片地址：后台上传的 /uploads/xxx 需拼成完整 URL 才能在小程序里从服务器加载（支持 GIF 等，不占包体积）
 */
export const resolveImageUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/uploads/')) return SERVER_ORIGIN + url
  // 其它形式（例如纯文字）一律视为无效，避免被当成本地路径 /pages/... 导致加载报错
  return ''
}

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
 * 封装 uni.request 为 Promise（HTTP 模式用）
 */
function request(options) {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 封装 uni.login 为 Promise
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 封装 uni.uploadFile 为 Promise
 */
function uploadFilePromise(options) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      ...options,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

/**
 * 封装 wx.cloud.callFunction 为 Promise（兼容 uni-app）
 */
function callCloudFunction(name, data) {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: data,
      success: (res) => resolve(res),
      fail: (err) => reject(err)
    })
  })
}

/**
 * URL 映射：将 (functionName, action, data) 映射到 RESTful 端点（HTTP 模式用）
 */
export function buildUrl(name, action, data = {}) {
  const id = data.id || data.orderId || data.taskId || data.postId || data.goodsId || data.carpoolId || data.activityId || data.msgId || data.commentId || data.shopId || ''
  const map = {
    user: {
      login: { path: '/user/login', method: 'POST' },
      getProfile: { path: '/user/profile', method: 'GET' },
      updateProfile: { path: '/user/profile', method: 'PUT' },
      registerRider: { path: '/user/register-rider', method: 'POST' },
      getStats: { path: '/user/stats', method: 'GET' },
      toggleFavorite: { path: '/user/favorite', method: 'POST' },
      checkFavorite: { path: '/user/favorite/check', method: 'GET' },
      myFavorites: { path: '/user/favorites', method: 'GET' },
      sendSmsCode: { path: '/user/sms/send', method: 'POST' },
      verifySmsCode: { path: '/user/sms/verify', method: 'POST' },
      getPhoneByCode: { path: '/user/phone-by-code', method: 'POST' },
      getWallet: { path: '/user/getWallet', method: 'POST' },
      applyWithdraw: { path: '/user/applyWithdraw', method: 'POST' }
    },
    express: {
      list: { path: '/express/list', method: 'GET' },
      detail: { path: `/express/${id}`, method: 'GET' },
      create: { path: '/express', method: 'POST' },
      accept: { path: `/express/${id}/accept`, method: 'POST' },
      updateStatus: { path: `/express/${id}/status`, method: 'PUT' },
      uploadPhoto: { path: `/express/${id}/photo`, method: 'POST' },
      cancel: { path: `/express/${id}/cancel`, method: 'POST' },
      reportLocation: { path: `/express/${id}/location`, method: 'PUT' },
      buildingStats: { path: '/express/building-stats', method: 'GET' }
    },
    errand: {
      list: { path: '/errand/list', method: 'GET' },
      detail: { path: `/errand/${id}`, method: 'GET' },
      create: { path: '/errand', method: 'POST' },
      accept: { path: `/errand/${id}/accept`, method: 'POST' },
      updateStatus: { path: `/errand/${id}/status`, method: 'PUT' },
      cancel: { path: `/errand/${id}/cancel`, method: 'POST' },
      uploadPhoto: { path: `/errand/${id}/photo`, method: 'POST' },
      reportLocation: { path: '/errand/reportLocation', method: 'POST' },
      getRiderLocation: { path: '/errand/getRiderLocation', method: 'POST' }
    },
    job: {
      list: { path: '/job/list', method: 'GET' },
      detail: { path: `/job/${id}`, method: 'GET' },
      pageConfig: { path: '/job/page-config', method: 'GET' }
    },
    carpool: {
      list: { path: '/carpool/list', method: 'GET' },
      detail: { path: `/carpool/${id}`, method: 'GET' },
      create: { path: '/carpool', method: 'POST' },
      join: { path: `/carpool/${id}/join`, method: 'POST' },
      leave: { path: `/carpool/${id}/leave`, method: 'POST' }
    },
    market: {
      list: { path: '/market/list', method: 'GET' },
      detail: { path: `/market/${id}`, method: 'GET' },
      create: { path: '/market', method: 'POST' },
      want: { path: `/market/${id}/want`, method: 'POST' },
      comment: { path: `/market/${id}/comment`, method: 'POST' },
      deleteComment: { path: `/market/comment/${id}`, method: 'DELETE' },
      myGoods: { path: '/market/my', method: 'GET' },
      delete: { path: `/market/${id}`, method: 'DELETE' },
      updateStatus: { path: `/market/${id}/status`, method: 'PATCH' }
    },
    forum: {
      list: { path: '/forum/list', method: 'GET' },
      detail: { path: `/forum/${id}`, method: 'GET' },
      create: { path: '/forum', method: 'POST' },
      like: { path: `/forum/${id}/like`, method: 'POST' },
      comment: { path: `/forum/${id}/comment`, method: 'POST' },
      myPosts: { path: '/forum/my', method: 'GET' },
      delete: { path: `/forum/${id}`, method: 'DELETE' },
      deleteComment: { path: `/forum/comment/${id}`, method: 'DELETE' },
      likeComment: { path: `/forum/comment/${id}/like`, method: 'POST' }
    },
    team: {
      list: { path: '/team/list', method: 'GET' },
      detail: { path: `/team/${id}`, method: 'GET' },
      create: { path: '/team', method: 'POST' },
      join: { path: `/team/${id}/join`, method: 'POST' },
      leave: { path: `/team/${id}/leave`, method: 'POST' },
      uploadPhotos: { path: `/team/${id}/photo`, method: 'POST' },
      endActivity: { path: `/team/${id}/end`, method: 'POST' },
      myTeam: { path: '/team/my', method: 'GET' },
      getGroupQrcode: { path: `/team/${id}/qrcode`, method: 'POST' },
      getGroupStatus: { path: `/team/${id}/group-status`, method: 'GET' },
      getGroupList: { path: `/team/${id}/group-list`, method: 'GET' },
      bindGroup: { path: `/team/${id}/bind-group`, method: 'POST' }
    },
    message: {
      list: { path: '/message/list', method: 'GET' },
      unreadCount: { path: '/message/unread-count', method: 'GET' },
      markRead: { path: `/message/${id}/read`, method: 'PUT' },
      markAllRead: { path: '/message/read-all', method: 'PUT' },
      send: { path: '/message', method: 'POST' },
      delete: { path: `/message/${id}`, method: 'DELETE' },
      deleteAll: { path: '/message/all', method: 'DELETE' }
    },
    order: {
      myPublished: { path: '/order/my-published', method: 'GET' },
      myAccepted: { path: '/order/my-accepted', method: 'GET' },
      myCarpool: { path: '/order/my-carpool', method: 'GET' }
    },
    home: {
      getLiveData: { path: '/home/live-data', method: 'GET' },
      getLatestOrders: { path: '/home/latest-orders', method: 'GET' },
      getPageConfig: { path: '/home/page-config', method: 'GET' },
      priceConfig: { path: '/home/price-config', method: 'GET' }
    },
    skill: {
      list: { path: '/skill/list', method: 'GET' },
      detail: { path: `/skill/${id}`, method: 'GET' },
      create: { path: '/skill', method: 'POST' },
      my: { path: '/skill/my', method: 'GET' },
      unlockContact: { path: `/skill/${id}/unlock`, method: 'POST' }
    },
    tutor: {
      listTutors: { path: '/tutor/list-tutors', method: 'GET' },
      listDemands: { path: '/tutor/list-demands', method: 'GET' },
      createTutor: { path: '/tutor/create-tutor', method: 'POST' },
      createDemand: { path: '/tutor/create-demand', method: 'POST' },
      getDetail: { path: `/tutor/${id}`, method: 'GET' },
      apply: { path: `/tutor/${id}/apply`, method: 'POST' },
      contact: { path: `/tutor/${id}/contact`, method: 'POST' },
      myPosts: { path: '/tutor/my', method: 'GET' },
      delete: { path: `/tutor/${id}`, method: 'DELETE' },
      checkPayment: { path: `/tutor/${id}/check-payment`, method: 'POST' },
      createPayOrder: { path: `/tutor/${id}/create-pay-order`, method: 'POST' }
    },
    food: {
      listShops: { path: '/food/shops', method: 'GET' },
      getShopMenu: { path: `/food/shop/${id}/menu`, method: 'GET' },
      createOrder: { path: '/food/order', method: 'POST' },
      myOrders: { path: '/food/my-orders', method: 'GET' },
      orderDetail: { path: `/food/order/${id}`, method: 'GET' },
      cancelOrder: { path: `/food/order/${id}/cancel`, method: 'POST' },
      riderAccept: { path: `/food/order/${id}/rider-accept`, method: 'POST' },
      riderComplete: { path: `/food/order/${id}/rider-complete`, method: 'POST' },
      adminShopList: { path: '/food/admin/shops', method: 'GET' },
      addShop: { path: '/food/admin/shop', method: 'POST' },
      updateShop: { path: `/food/admin/shop/${id}`, method: 'PUT' },
      deleteShop: { path: `/food/admin/shop/${id}`, method: 'DELETE' },
      adminItemList: { path: `/food/admin/items/${id}`, method: 'GET' },
      addItem: { path: '/food/admin/item', method: 'POST' },
      updateItem: { path: `/food/admin/item/${id}`, method: 'PUT' },
      deleteItem: { path: `/food/admin/item/${id}`, method: 'DELETE' },
      adminOrderList: { path: '/food/admin/orders', method: 'GET' },
      updateOrderStatus: { path: `/food/admin/order/${id}/status`, method: 'PUT' },
      getPrinterConfig: { path: '/food/admin/printer-config', method: 'GET' },
      savePrinterConfig: { path: '/food/admin/printer-config', method: 'POST' },
      reprintOrder: { path: `/food/admin/order/${id}/reprint`, method: 'POST' }
    },
    wash: {
      getProducts: { path: '/wash/products', method: 'GET' },
      getGroups: { path: '/wash/groups', method: 'GET' },
      createGroup: { path: '/wash/group', method: 'POST' },
      joinGroup: { path: `/wash/group/${id}/join`, method: 'POST' },
      myGroups: { path: '/wash/my-groups', method: 'GET' },
      createOrder: { path: '/wash/order', method: 'POST' },
      myOrders: { path: '/wash/my-orders', method: 'GET' },
      orderDetail: { path: `/wash/order/${id}`, method: 'GET' },
      cancelOrder: { path: `/wash/order/${id}/cancel`, method: 'POST' },
      adminOrderList: { path: '/wash/admin/orders', method: 'GET' },
      updateOrderStatus: { path: `/wash/admin/order/${id}/status`, method: 'PUT' }
    },
    experience: {
      list: { path: '/experience/list', method: 'GET' },
      detail: { path: `/experience/${id}`, method: 'GET' },
      create: { path: '/experience', method: 'POST' },
      like: { path: `/experience/${id}/like`, method: 'POST' },
      comment: { path: `/experience/${id}/comment`, method: 'POST' },
      likeComment: { path: `/experience/comment/${id}/like`, method: 'POST' },
      deleteComment: { path: `/experience/comment/${id}`, method: 'DELETE' },
      delete: { path: `/experience/${id}`, method: 'DELETE' }
    },
    admin: {
      checkAdmin: { path: '/admin/check-admin', method: 'POST' },
      dashboard: { path: '/admin/dashboard-mp', method: 'POST' },
      updateStats: { path: '/admin/update-stats', method: 'POST' },
      userList: { path: '/admin/user-list', method: 'POST' },
      userDetail: { path: '/admin/user-detail', method: 'POST' },
      toggleUserStatus: { path: '/admin/toggle-user-status', method: 'POST' },
      setUserAdmin: { path: '/admin/set-user-admin', method: 'POST' },
      expressList: { path: '/admin/express-list', method: 'POST' },
      cancelExpress: { path: '/admin/cancel-express', method: 'POST' },
      errandList: { path: '/admin/errand-list', method: 'POST' },
      cancelErrand: { path: '/admin/cancel-errand', method: 'POST' },
      forumList: { path: '/admin/forum-list', method: 'POST' },
      deletePost: { path: '/admin/delete-post', method: 'POST' },
      marketList: { path: '/admin/market-list', method: 'POST' },
      deleteGoods: { path: '/admin/delete-goods', method: 'POST' },
      teamList: { path: '/admin/team-list', method: 'POST' },
      deleteTeam: { path: '/admin/delete-team', method: 'POST' },
      carpoolList: { path: '/admin/carpool-list', method: 'POST' },
      deleteCarpool: { path: '/admin/delete-carpool', method: 'POST' },
      getPageConfig: { path: '/admin/get-page-config', method: 'POST' },
      savePageConfig: { path: '/admin/save-page-config', method: 'POST' },
      getWelfareConfig: { path: '/admin/get-welfare-config', method: 'POST' },
      saveWelfareConfig: { path: '/admin/save-welfare-config', method: 'POST' },
      getWelfarePublic: { path: '/admin/get-welfare-public', method: 'POST' },
      getTabBarConfig: { path: '/admin/get-tabbar-config', method: 'POST' },
      saveTabBarConfig: { path: '/admin/save-tabbar-config', method: 'POST' },
      getTabBarPublic: { path: '/admin/get-tabbar-public', method: 'POST' },
      adminList: { path: '/admin/admin-list', method: 'POST' },
      addAdmin: { path: '/admin/add-admin', method: 'POST' },
      removeAdmin: { path: '/admin/remove-admin', method: 'POST' },
      sendNotice: { path: '/admin/send-notice', method: 'POST' },
      withdrawList: { path: '/admin/withdraw-list', method: 'POST' },
      approveWithdraw: { path: '/admin/approve-withdraw', method: 'POST' },
      rejectWithdraw: { path: '/admin/reject-withdraw', method: 'POST' },
      washProductList: { path: '/admin/wash-product-list', method: 'POST' },
      addWashProduct: { path: '/admin/add-wash-product', method: 'POST' },
      updateWashProduct: { path: '/admin/update-wash-product', method: 'POST' },
      deleteWashProduct: { path: '/admin/delete-wash-product', method: 'POST' }
    }
  }

  const route = map[name] && map[name][action]
  if (!route) {
    console.warn('[cloud] unknown route:', name, action)
    return { url: `${BASE_URL}/${name}/${action}`, method: 'POST' }
  }
  return { url: BASE_URL + route.path, method: route.method }
}

/**
 * 云函数调用封装 — 支持云开发和 HTTP 两种模式
 * 调用签名: callCloud('express', 'list', { status: 0, page: 1 })
 */
export const callCloud = async (name, action, data = {}, _isRetry = false) => {
  // ========== 云开发模式 ==========
  if (USE_CLOUD) {
    try {
      const res = await callCloudFunction(name, { action, data })
      const result = res.result
      if (result && result.code === 0) {
        return result
      }
      const msg = (result && result.msg) || '请求失败'
      console.error('[cloud]', name, action, msg)
      uni.showToast({ title: msg, icon: 'none' })
      return result || { code: -1, msg }
    } catch (err) {
      console.error('[cloud error]', name, action, err)
      uni.showToast({ title: '网络异常，请重试', icon: 'none' })
      return { code: -1, msg: err.errMsg || err.message || '网络异常' }
    }
  }

  // ========== HTTP 模式（备案后启用）==========
  try {
    const token = uni.getStorageSync('token') || ''
    const { url, method } = buildUrl(name, action, data)

    let requestUrl = url
    let requestData = data
    if (method === 'GET') {
      const params = Object.entries(data)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&')
      if (params) requestUrl += '?' + params
      requestData = undefined
    }

    const res = await request({
      url: requestUrl,
      method,
      data: requestData,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })

    const result = res.data

    if (res.statusCode === 401 && !_isRetry) {
      console.warn('[cloud] token expired, re-login')
      uni.removeStorageSync('token')
      await autoLogin()
      return callCloud(name, action, data, true)
    }

    if (result && result.code === 0) {
      return result
    }
    const msg = (result && result.msg) || '请求失败'
    console.error('[cloud]', name, action, msg)
    uni.showToast({ title: msg, icon: 'none' })
    return result || { code: -1, msg }
  } catch (err) {
    console.error('[cloud error]', name, action, err)
    uni.showToast({ title: '网络异常，请重试', icon: 'none' })
    return { code: -1, msg: err.errMsg || err.message || '网络异常' }
  }
}

/**
 * 自动登录
 * 云开发模式：直接调用 user 云函数的 login action
 * HTTP 模式：wx.login 获取 code → 发送到服务器换 JWT
 */
export const autoLogin = async () => {
  // ========== 云开发模式 ==========
  if (USE_CLOUD) {
    try {
      const res = await callCloudFunction('user', { action: 'login', data: {} })
      const result = res.result
      if (result && result.code === 0) {
        const userInfo = result.data
        uni.setStorageSync('userInfo', userInfo)
        uni.setStorageSync('openid', userInfo.openid || '')
        uni.setStorageSync('isRider', userInfo.isRider ? 1 : 0)
        console.log('cloud login success', userInfo.openid)
      } else {
        console.error('cloud login failed', result)
      }
    } catch (e) {
      console.error('autoLogin error', e)
    }
    return
  }

  // ========== HTTP 模式（备案后启用）==========
  try {
    const existingToken = uni.getStorageSync('token')
    if (existingToken) {
      try {
        const profileRes = await request({
          url: BASE_URL + '/user/profile',
          method: 'GET',
          header: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + existingToken
          }
        })
        if (profileRes.data && profileRes.data.code === 0) {
          const userInfo = profileRes.data.data
          uni.setStorageSync('userInfo', userInfo)
          uni.setStorageSync('openid', userInfo.openid || '')
          uni.setStorageSync('isRider', userInfo.isRider ? 1 : 0)
          console.log('token still valid, skip re-login')
          return
        }
      } catch (e) {
        console.log('existing token invalid, re-login')
      }
    }

    const loginRes = await wxLogin()
    if (!loginRes.code) {
      console.error('wx.login failed, no code')
      return
    }
    const res = await request({
      url: BASE_URL + '/user/login',
      method: 'POST',
      data: { code: loginRes.code },
      header: { 'Content-Type': 'application/json' }
    })
    if (!res.data || res.data.code !== 0) {
      console.error('login api failed', res)
      return
    }
    const { token, userInfo } = res.data.data
    uni.setStorageSync('token', token)
    uni.setStorageSync('userInfo', userInfo)
    uni.setStorageSync('openid', userInfo.openid || '')
    uni.setStorageSync('isRider', userInfo.isRider ? 1 : 0)
    console.log('login success', userInfo.openid)
  } catch (e) {
    console.error('autoLogin error', e)
  }
}

/**
 * 上传图片
 * 云开发模式：上传到微信云存储
 * HTTP 模式：上传到 API Server
 */
export const uploadImage = async (tempPath, folder = 'images') => {
  if (USE_CLOUD) {
    const ext = tempPath.split('.').pop() || 'png'
    const cloudPath = folder + '/' + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext
    const res = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempPath
    })
    return res.fileID
  }

  // HTTP 模式
  const token = uni.getStorageSync('token') || ''
  const res = await uploadFilePromise({
    url: BASE_URL + '/upload/image?folder=' + folder,
    filePath: tempPath,
    name: 'file',
    header: { 'Authorization': token ? `Bearer ${token}` : '' }
  })
  const data = JSON.parse(res.data)
  if (data.code !== 0) throw new Error(data.msg || '上传失败')
  let url = data.data.url
  if (url && url.startsWith('/')) {
    url = BASE_URL.replace('/api', '') + url
  }
  return url
}

/**
 * 批量上传图片
 */
export const uploadImages = async (tempPaths, folder = 'images') => {
  const tasks = tempPaths.map(p => uploadImage(p, folder))
  return Promise.all(tasks)
}
