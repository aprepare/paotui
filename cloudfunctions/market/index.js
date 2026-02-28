const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 内容安全检查
async function checkContent(openid, text, scene) {
  if (!text || !text.trim()) return true
  try {
    const res = await cloud.openapi.security.msgSecCheck({ openid, scene: scene || 4, version: 2, content: text })
    return res.result && res.result.suggest === 'pass'
  } catch (e) { console.log('[contentCheck] error', e); return true }
}

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'list': {
      const { category, keyword, page = 1, pageSize = 10 } = data
      const where = {}
      if (category && category !== '全部') where.category = category
      const res = await db.collection('market_goods').where(where)
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      let list = res.data
      if (keyword) {
        const kw = keyword.toLowerCase()
        list = list.filter(g => g.title.toLowerCase().includes(kw))
      }
      return { code: 0, data: list }
    }

    case 'detail': {
      const res = await db.collection('market_goods').doc(data.id).get()
      // 增加浏览量
      await db.collection('market_goods').doc(data.id).update({ data: { views: _.inc(1) } })
      return { code: 0, data: res.data }
    }

    case 'create': {
      const { title, desc, price, category, images, deliveryType, contact, contactPublic } = data
      if (!title || !price) return { code: -1, msg: 'missing fields' }
      const textToCheck = [title, desc].filter(Boolean).join(' ')
      const safe = await checkContent(openid, textToCheck, 4)
      if (!safe) return { code: -1, msg: '内容包含违规信息，请修改后重试' }
      // Price validation: > 0 (Req 5.6)
      const priceNum = Number(price)
      if (!priceNum || priceNum <= 0) return { code: -1, msg: '价格必须大于0' }
      // Contact validation: non-empty (Req 9.2)
      if (!contact || (typeof contact === 'string' && contact.trim().length === 0)) {
        return { code: -1, msg: '请填写联系方式' }
      }
      const user = await db.collection('users').where({ openid }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      const deliveryText = deliveryType === 1 ? '包配送' : '自提'
      const res = await db.collection('market_goods').add({
        data: {
          openid, title, desc: desc || '', price: Number(price),
          category: category || '其他',
          images: images || [],
          deliveryType: deliveryType || 0,
          deliveryText: deliveryText,
          contact: contact || '',
          contactPublic: contactPublic === 0 ? 0 : 1,
          views: 0, wants: 0,
          publisher: userName,
          status: 'active',
          createTime: db.serverDate()
        }
      })
      return { code: 0, id: res._id }
    }

    case 'want': {
      await db.collection('market_goods').doc(data.goodsId).update({ data: { wants: _.inc(1) } })
      return { code: 0 }
    }

    case 'delete': {
      const good = await db.collection('market_goods').doc(data.goodsId).get()
      if (good.data.openid !== openid) return { code: -1, msg: '仅发布者可删除' }
      await db.collection('market_goods').doc(data.goodsId).remove()
      return { code: 0 }
    }

    case 'myGoods': {
      const res = await db.collection('market_goods').where({ openid })
        .orderBy('createTime', 'desc')
        .limit(20)
        .get()
      return { code: 0, data: res.data }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
