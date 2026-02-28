const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 内容安全检查
async function checkContent(openid, text, scene) {
  if (!text || !text.trim()) return true
  try {
    const res = await cloud.openapi.security.msgSecCheck({ openid, scene: scene || 2, version: 2, content: text })
    return res.result && res.result.suggest === 'pass'
  } catch (e) { console.log('[contentCheck] error', e); return true }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action, data = {} } = event

  switch (action) {
    case 'list': {
      const { category, keyword } = data
      let where = { status: 0 }
      if (category && category !== '全部') where.category = category
      if (keyword) where.title = db.RegExp({ regexp: keyword, options: 'i' })
      const res = await db.collection('skills').where(where).orderBy('createTime', 'desc').limit(20).get()
      return { code: 0, data: res.data }
    }

    case 'create': {
      const { title, category, desc, price, priceUnit, works, contact, contactType } = data
      if (!title || (typeof title === 'string' && title.trim().length === 0)) {
        return { code: -1, msg: '请填写技能标题' }
      }
      const textToCheck = [title, desc].filter(Boolean).join(' ')
      const safe = await checkContent(OPENID, textToCheck, 2)
      if (!safe) return { code: -1, msg: '内容包含违规信息，请修改后重试' }
      if (!price || Number(price) <= 0) {
        return { code: -1, msg: '价格必须大于0' }
      }
      if (!contact || (typeof contact === 'string' && contact.trim().length === 0)) {
        return { code: -1, msg: '请填写联系方式' }
      }
      const user = await db.collection('users').where({ openid: OPENID }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      const res = await db.collection('skills').add({
        data: {
          openid: OPENID,
          publisher: userName,
          title, category: category || '其他',
          desc: desc || '', price: price || 0,
          priceUnit: priceUnit || '次',
          works: works || [],
          contact: contact || '',
          contactType: contactType || '微信',
          status: 0,
          views: 0,
          createTime: db.serverDate()
        }
      })
      return { code: 0, data: { id: res._id } }
    }

    case 'detail': {
      const { id } = data
      if (!id) return { code: -1, msg: '缺少id参数' }
      const res = await db.collection('skills').doc(id).get()
      await db.collection('skills').doc(id).update({ data: { views: _.inc(1) } })
      const skillData = res.data
      // 发布者自己可以看到联系方式，其他人需要付费解锁
      let unlocked = false
      if (skillData.openid === OPENID) {
        unlocked = true
      } else {
        try {
          const unlockRes = await db.collection('skill_unlocks').where({ openid: OPENID, skillId: id }).get()
          unlocked = unlockRes.data.length > 0
        } catch (e) { unlocked = false }
      }
      if (!unlocked) {
        skillData.contact = ''
        skillData.contactType = ''
      }
      skillData.unlocked = unlocked
      return { code: 0, data: skillData }
    }

    // 付费解锁联系方式（¥1）
    case 'unlockContact': {
      const { id } = data
      if (!id) return { code: -1, msg: '缺少参数' }
      const UNLOCK_PRICE = 1
      // 检查是否已解锁
      try {
        const existRes = await db.collection('skill_unlocks').where({ openid: OPENID, skillId: id }).get()
        if (existRes.data.length > 0) {
          // 已解锁，直接返回联系方式
          const sPost = await db.collection('skills').doc(id).get()
          return { code: 0, data: { contact: sPost.data.contact, contactType: sPost.data.contactType } }
        }
      } catch (e) {}
      // 不能解锁自己的
      const skillPost = await db.collection('skills').doc(id).get()
      if (!skillPost.data) return { code: -1, msg: '技能不存在' }
      if (skillPost.data.openid === OPENID) {
        return { code: 0, data: { contact: skillPost.data.contact, contactType: skillPost.data.contactType } }
      }
      // 计算余额
      var uIncome = 0
      try {
        var uExpress = await db.collection('express_orders').where({ riderId: OPENID, status: 3 }).get()
        uExpress.data.forEach(function(o) { uIncome += (o.price || 0) + (o.tip || 0) })
      } catch (e) {}
      try {
        var uErrand = await db.collection('errand_tasks').where({ riderId: OPENID, status: 2 }).get()
        uErrand.data.forEach(function(o) { uIncome += (o.price || 0) })
      } catch (e) {}
      var uUsed = 0
      try {
        var uWithdrawn = await db.collection('wallet_withdrawals').where({ openid: OPENID }).get()
        uWithdrawn.data.forEach(function(w) {
          if (w.status === 0 || w.status === 1) uUsed += (w.amount || 0)
        })
      } catch (e) {}
      // 减去已花费的解锁费用
      try {
        var uUnlocks = await db.collection('skill_unlocks').where({ openid: OPENID }).get()
        uUnlocks.data.forEach(function(u) { uUsed += (u.amount || 0) })
      } catch (e) {}
      var uBalance = uIncome - uUsed
      if (uBalance < UNLOCK_PRICE) return { code: -1, msg: '余额不足，当前余额¥' + uBalance.toFixed(2) }
      // 记录解锁
      await db.collection('skill_unlocks').add({
        data: {
          openid: OPENID,
          skillId: id,
          skillTitle: skillPost.data.title || '',
          publisherOpenid: skillPost.data.openid,
          amount: UNLOCK_PRICE,
          createTime: db.serverDate()
        }
      })
      return { code: 0, data: { contact: skillPost.data.contact, contactType: skillPost.data.contactType } }
    }

    case 'my': {
      const res = await db.collection('skills').where({ openid: OPENID }).orderBy('createTime', 'desc').get()
      return { code: 0, data: res.data }
    }

    case 'delete': {
      const { id } = data
      if (!id) return { code: -1, msg: '缺少id参数' }
      await db.collection('skills').doc(id).remove()
      return { code: 0 }
    }

    default:
      return { code: -1, msg: '未知操作' }
  }
}
