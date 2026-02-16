const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { action } = event

  switch (action) {
    case 'list': {
      const { category, keyword } = event
      let where = { status: 0 }
      if (category && category !== '全部') where.category = category
      if (keyword) where.title = db.RegExp({ regexp: keyword, options: 'i' })
      const res = await db.collection('skills').where(where).orderBy('createTime', 'desc').limit(20).get()
      return { code: 0, data: res.data }
    }

    case 'create': {
      const { title, category, desc, price, priceUnit, works, contact, contactType } = event
      const user = await db.collection('users').where({ _openid: OPENID }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      const res = await db.collection('skills').add({
        data: {
          _openid: OPENID,
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
      const { id } = event
      const res = await db.collection('skills').doc(id).get()
      await db.collection('skills').doc(id).update({ data: { views: _.inc(1) } })
      return { code: 0, data: res.data }
    }

    case 'my': {
      const res = await db.collection('skills').where({ _openid: OPENID }).orderBy('createTime', 'desc').get()
      return { code: 0, data: res.data }
    }

    case 'delete': {
      const { id } = event
      await db.collection('skills').doc(id).remove()
      return { code: 0 }
    }

    default:
      return { code: -1, msg: '未知操作' }
  }
}
