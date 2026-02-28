const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 内容安全检查（文字）
async function checkContent(openid, text, scene) {
  if (!text || !text.trim()) return true
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      openid: openid,
      scene: scene || 2,
      version: 2,
      content: text
    })
    if (res.result && res.result.suggest === 'pass') return true
    return false
  } catch (e) {
    console.log('[contentCheck] error', e)
    return true // 接口异常时放行，避免阻塞正常使用
  }
}

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  switch (action) {
    // 登录/自动注册
    case 'login': {
      const userRes = await db.collection('users').where({ openid }).get()
      if (userRes.data.length > 0) {
        return { code: 0, data: userRes.data[0] }
      }
      // 新用户自动创建
      const newUser = {
        openid,
        name: '',
        avatar: '',
        phone: '',
        isRider: false,
        riderId: '',
        level: 'Lv.1 新手',
        createTime: db.serverDate()
      }
      const addRes = await db.collection('users').add({ data: newUser })
      newUser._id = addRes._id
      return { code: 0, data: newUser, isNew: true }
    }

    // 获取用户信息
    case 'getProfile': {
      const res = await db.collection('users').where({ openid }).get()
      if (res.data.length === 0) return { code: -1, msg: 'user not found' }
      return { code: 0, data: res.data[0] }
    }

    // 更新用户信息
    case 'updateProfile': {
      const { name, avatar, phone } = data
      if (name) {
        const safe = await checkContent(openid, name, 1)
        if (!safe) return { code: -1, msg: '昵称包含违规内容，请修改' }
      }
      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (avatar !== undefined) updateData.avatar = avatar
      if (phone !== undefined) updateData.phone = phone
      await db.collection('users').where({ openid }).update({ data: updateData })
      return { code: 0 }
    }

    // 注册骑手
    case 'registerRider': {
      const { realName, phone, studentId, building, school, studentCardFileID } = data
      if (!realName || !phone || !studentId) {
        return { code: -1, msg: 'missing fields' }
      }
      const riderId = 'R-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 100)).padStart(2, '0')
      await db.collection('users').where({ openid }).update({
        data: {
          isRider: true,
          riderId,
          riderInfo: { realName, phone, studentId, building, school: school || '', studentCardFileID: studentCardFileID || '' },
          riderRegTime: db.serverDate()
        }
      })
      return { code: 0, riderId }
    }

    // 获取统计
    case 'getStats': {
      const published = await db.collection('express_orders').where({ openid }).count()
      const taken = await db.collection('express_orders').where({ riderId: openid }).count()
      const errandPublished = await db.collection('errand_tasks').where({ openid }).count()
      const errandTaken = await db.collection('errand_tasks').where({ riderId: openid }).count()
      // 计算收入：已完成的接单
      let income = 0
      const completedExpress = await db.collection('express_orders').where({ riderId: openid, status: 3 }).get()
      completedExpress.data.forEach(o => { income += (o.price || 0) + (o.tip || 0) })
      const completedErrand = await db.collection('errand_tasks').where({ riderId: openid, status: 2 }).get()
      completedErrand.data.forEach(o => { income += (o.price || 0) })
      return {
        code: 0,
        data: {
          publishedCount: published.total + errandPublished.total,
          takenCount: taken.total + errandTaken.total,
          income: income
        }
      }
    }

    // 收藏/取消收藏
    case 'toggleFavorite': {
      const { targetId, targetType } = data
      if (!targetId || !targetType) return { code: -1, msg: 'missing fields' }
      const existing = await db.collection('user_favorites').where({ openid, targetId, targetType }).get()
      if (existing.data.length > 0) {
        await db.collection('user_favorites').doc(existing.data[0]._id).remove()
        return { code: 0, favorited: false }
      }
      await db.collection('user_favorites').add({
        data: { openid, targetId, targetType, createTime: db.serverDate() }
      })
      return { code: 0, favorited: true }
    }

    // 检查是否已收藏
    case 'checkFavorite': {
      const check = await db.collection('user_favorites').where({ openid, targetId: data.targetId, targetType: data.targetType }).count()
      return { code: 0, favorited: check.total > 0 }
    }

    // 我的收藏列表
    case 'myFavorites': {
      const favs = await db.collection('user_favorites').where({ openid })
        .orderBy('createTime', 'desc')
        .limit(50)
        .get()
      var result = []
      for (var i = 0; i < favs.data.length; i++) {
        var fav = favs.data[i]
        var item = { _id: fav._id, targetId: fav.targetId, targetType: fav.targetType, createTime: fav.createTime }
        try {
          if (fav.targetType === 'post') {
            var post = await db.collection('forum_posts').doc(fav.targetId).get()
            item.title = (post.data.content || '').substring(0, 40)
            item.extra = post.data.nickname || '匿名'
          } else if (fav.targetType === 'goods') {
            var goods = await db.collection('market_goods').doc(fav.targetId).get()
            item.title = goods.data.title || ''
            item.extra = '¥' + (goods.data.price || 0)
          }
        } catch (e) {
          item.title = '内容已删除'
          item.extra = ''
        }
        result.push(item)
      }
      return { code: 0, data: result }
    }

    // 微信手机号快速验证（通过 code 换取手机号）
    case 'getPhoneByCode': {
      var phoneCode = data.code
      if (!phoneCode) return { code: -1, msg: '缺少code' }
      try {
        var phoneRes = await cloud.openapi.phonenumber.getPhoneNumber({
          code: phoneCode
        })
        if (phoneRes.errCode === 0 && phoneRes.phoneInfo) {
          var purePhone = phoneRes.phoneInfo.purePhoneNumber || phoneRes.phoneInfo.phoneNumber || ''
          return { code: 0, data: { phone: purePhone } }
        }
        return { code: -1, msg: '获取手机号失败: ' + (phoneRes.errMsg || '') }
      } catch (e) {
        console.error('getPhoneByCode error', e)
        return { code: -1, msg: '获取手机号失败' }
      }
    }

    // 发送短信验证码
    case 'sendSmsCode': {
      var phone = data.phone
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        return { code: -1, msg: '手机号格式不正确' }
      }

      // Rate limiting: 60 seconds between sends (Req 4.1)
      try {
        var recentCodes = await db.collection('sms_codes').where({ phone: phone }).orderBy('createTime', 'desc').limit(1).get()
        if (recentCodes.data.length > 0) {
          var lastCreate = recentCodes.data[0].createTime
          var lastTs = lastCreate instanceof Date ? lastCreate.getTime() : new Date(lastCreate).getTime()
          if (Date.now() - lastTs < 60 * 1000) {
            return { code: -1, msg: '请求过于频繁，请稍后再试' }
          }
        }
      } catch (e) {}

      // 生成6位随机验证码
      var code = ''
      for (var ci = 0; ci < 6; ci++) {
        code += String(Math.floor(Math.random() * 10))
      }
      var expireAt = Date.now() + 5 * 60 * 1000 // 5分钟有效

      // 存储验证码到数据库
      // 先删除该手机号旧的验证码
      try {
        await db.collection('sms_codes').where({ phone: phone }).remove()
      } catch (e) {}
      await db.collection('sms_codes').add({
        data: { phone: phone, code: code, expireAt: expireAt, createTime: db.serverDate(), attempts: 0 }
      })

      // TODO: 接入腾讯云短信API发送验证码
      // 目前测试阶段，验证码打印到云函数日志
      console.log('[SMS TEST] phone:', phone, 'code:', code)

      /*
      // 腾讯云短信发送（等配置好后取消注释）
      const tencentcloud = require('tencentcloud-sdk-nodejs')
      const SmsClient = tencentcloud.sms.v20210111.Client
      const client = new SmsClient({
        credential: { secretId: 'YOUR_SECRET_ID', secretKey: 'YOUR_SECRET_KEY' },
        region: 'ap-guangzhou'
      })
      await client.SendSms({
        SmsSdkAppId: 'YOUR_APP_ID',
        SignName: 'YOUR_SIGN_NAME',
        TemplateId: 'YOUR_TEMPLATE_ID',
        TemplateParamSet: [code, '5'],
        PhoneNumberSet: ['+86' + phone]
      })
      */

      return { code: 0, msg: '验证码已发送' }
    }

    // 校验短信验证码
    case 'verifySmsCode': {
      var vPhone = data.phone
      var vCode = data.smsCode
      if (!vPhone || !vCode) return { code: -1, msg: '参数缺失' }
      // 万能验证码（测试用，上线前删除）
      if (vCode === '000000') {
        return { code: 0, msg: '验证通过' }
      }
      var record = await db.collection('sms_codes').where({ phone: vPhone }).orderBy('createTime', 'desc').limit(1).get()
      if (record.data.length === 0) return { code: -1, msg: '请先获取验证码' }
      var rec = record.data[0]
      if (Date.now() > rec.expireAt) return { code: -1, msg: '验证码已过期，请重新获取' }
      // Attempt limit: max 5 tries (Req 4.2, 4.3)
      if ((rec.attempts || 0) >= 5) return { code: -1, msg: '验证码已失效，请重新获取' }
      if (rec.code !== vCode) {
        // Increment attempts on failure
        try {
          await db.collection('sms_codes').doc(rec._id).update({ data: { attempts: (rec.attempts || 0) + 1 } })
        } catch (e) {}
        return { code: -1, msg: '验证码错误' }
      }
      // 验证通过，删除已用验证码
      try { await db.collection('sms_codes').doc(rec._id).remove() } catch (e) {}
      return { code: 0, msg: '验证通过' }
    }

    // 获取钱包信息
    case 'getWallet': {
      // 计算收入：已完成的接单
      var walletIncome = 0
      try {
        var cExpress = await db.collection('express_orders').where({ riderId: openid, status: 3 }).get()
        cExpress.data.forEach(function(o) { walletIncome += (o.price || 0) + (o.tip || 0) })
      } catch (e) {}
      var cErrand = { data: [] }
      try {
        cErrand = await db.collection('errand_tasks').where({ riderId: openid, status: 2 }).get()
        cErrand.data.forEach(function(o) { walletIncome += (o.price || 0) })
      } catch (e) {}

      // 查提现记录
      var totalWithdraw = 0
      var pendingWithdraw = 0
      var withdrawRecords = []
      try {
        var withdrawRes = await db.collection('wallet_withdrawals').where({ openid }).orderBy('createTime', 'desc').limit(50).get()
        withdrawRes.data.forEach(function(w) {
          if (w.status === 1) totalWithdraw += (w.amount || 0)
          if (w.status === 0) pendingWithdraw += (w.amount || 0)
          withdrawRecords.push({
            _id: w._id, type: 'withdraw', amount: w.amount || 0,
            status: w.status,
            statusText: w.status === 0 ? '审核中' : w.status === 1 ? '已到账' : '已拒绝',
            title: '提现到微信零钱', createTime: w.createTime
          })
        })
      } catch (e) {}

      // 收入明细（最近完成的订单）
      var incomeRecords = []
      try { cExpress = cExpress || { data: [] } } catch (e) {}
      ;(cExpress && cExpress.data || []).forEach(function(o) {
        incomeRecords.push({
          _id: o._id, type: 'income', amount: (o.price || 0) + (o.tip || 0),
          status: 1, statusText: '已到账',
          title: '快递代取 - ' + (o.building || ''),
          createTime: o.completeTime || o.createTime
        })
      })
      ;(cErrand && cErrand.data || []).forEach(function(o) {
        incomeRecords.push({
          _id: o._id, type: 'income', amount: o.price || 0,
          status: 1, statusText: '已到账',
          title: '跑腿任务 - ' + (o.title || '').substring(0, 10),
          createTime: o.completeTime || o.createTime
        })
      })

      // 合并并按时间排序
      var allRecords = incomeRecords.concat(withdrawRecords)

      // 技能解锁支出
      var unlockSpent = 0
      try {
        var unlockRes = await db.collection('skill_unlocks').where({ openid }).orderBy('createTime', 'desc').limit(50).get()
        unlockRes.data.forEach(function(u) {
          unlockSpent += (u.amount || 0)
          allRecords.push({
            _id: u._id, type: 'expense', amount: u.amount || 0,
            status: 1, statusText: '已扣费',
            title: '查看联系方式 - ' + (u.skillTitle || '').substring(0, 10),
            createTime: u.createTime
          })
        })
      } catch (e) {}

      allRecords.sort(function(a, b) {
        var ta = a.createTime ? new Date(a.createTime).getTime() : 0
        var tb = b.createTime ? new Date(b.createTime).getTime() : 0
        return tb - ta
      })

      var balance = walletIncome - totalWithdraw - pendingWithdraw - unlockSpent
      if (balance < 0) balance = 0

      return {
        code: 0,
        data: {
          balance: balance,
          totalIncome: walletIncome,
          totalWithdraw: totalWithdraw,
          pendingWithdraw: pendingWithdraw,
          records: allRecords.slice(0, 50)
        }
      }
    }

    // 申请提现
    case 'applyWithdraw': {
      var wAmount = parseFloat(data.amount)
      if (!wAmount || wAmount < 1) return { code: -1, msg: '最低提现1元' }

      // 计算可用余额
      var wIncome = 0
      try {
        var wExpress = await db.collection('express_orders').where({ riderId: openid, status: 3 }).get()
        wExpress.data.forEach(function(o) { wIncome += (o.price || 0) + (o.tip || 0) })
      } catch (e) {}
      try {
        var wErrand = await db.collection('errand_tasks').where({ riderId: openid, status: 2 }).get()
        wErrand.data.forEach(function(o) { wIncome += (o.price || 0) })
      } catch (e) {}

      var wUsed = 0
      try {
        var wWithdrawn = await db.collection('wallet_withdrawals').where({ openid }).get()
        wWithdrawn.data.forEach(function(w) {
          if (w.status === 0 || w.status === 1) wUsed += (w.amount || 0)
        })
      } catch (e) {}

      var wBalance = wIncome - wUsed
      // 减去技能解锁支出
      try {
        var wUnlocks = await db.collection('skill_unlocks').where({ openid }).get()
        wUnlocks.data.forEach(function(u) { wBalance -= (u.amount || 0) })
      } catch (e) {}
      if (wAmount > wBalance) return { code: -1, msg: '余额不足' }

      // 获取用户信息
      var wUser = await db.collection('users').where({ openid }).get()
      var userName = (wUser.data[0] && wUser.data[0].name) || '未知'

      await db.collection('wallet_withdrawals').add({
        data: {
          openid: openid,
          userName: userName,
          amount: wAmount,
          status: 0, // 0=审核中 1=已到账 2=已拒绝
          createTime: db.serverDate()
        }
      })

      return { code: 0, msg: '提现申请已提交' }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
