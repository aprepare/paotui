const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

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
      const updateData = {}
      if (name !== undefined) updateData.name = name
      if (avatar !== undefined) updateData.avatar = avatar
      if (phone !== undefined) updateData.phone = phone
      await db.collection('users').where({ openid }).update({ data: updateData })
      return { code: 0 }
    }

    // 注册骑手
    case 'registerRider': {
      const { realName, phone, studentId, building } = data
      if (!realName || !phone || !studentId) {
        return { code: -1, msg: 'missing fields' }
      }
      const riderId = 'R-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(Math.floor(Math.random() * 100)).padStart(2, '0')
      await db.collection('users').where({ openid }).update({
        data: {
          isRider: true,
          riderId,
          riderInfo: { realName, phone, studentId, building },
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

    // 发送短信验证码
    case 'sendSmsCode': {
      var phone = data.phone
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
        return { code: -1, msg: '手机号格式不正确' }
      }
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
        data: { phone: phone, code: code, expireAt: expireAt, createTime: db.serverDate() }
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
      var record = await db.collection('sms_codes').where({ phone: vPhone }).orderBy('createTime', 'desc').limit(1).get()
      if (record.data.length === 0) return { code: -1, msg: '请先获取验证码' }
      var rec = record.data[0]
      if (Date.now() > rec.expireAt) return { code: -1, msg: '验证码已过期，请重新获取' }
      if (rec.code !== vCode) return { code: -1, msg: '验证码错误' }
      // 验证通过，删除已用验证码
      try { await db.collection('sms_codes').doc(rec._id).remove() } catch (e) {}
      return { code: 0, msg: '验证通过' }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
