const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'list': {
      const { filter, page = 1, pageSize = 10 } = data
      let where = {}
      if (filter === 1) where.currentPeople = _.lt(_.field('maxPeople'))
      const res = await db.collection('carpool')
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      let list = res.data
      if (filter === 1) list = list.filter(c => c.currentPeople < c.maxPeople)
      if (filter === 2) list = list.filter(c => c.currentPeople >= c.maxPeople)
      return { code: 0, data: list }
    }

    case 'detail': {
      const res = await db.collection('carpool').doc(data.id).get()
      return { code: 0, data: res.data }
    }

    case 'create': {
      const { from, to, departTime, pickupLocation, maxPeople, deadline, contact, remark } = data
      if (!from || !to || !departTime) return { code: -1, msg: 'missing fields' }
      const user = await db.collection('users').where({ openid }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      const res = await db.collection('carpool').add({
        data: {
          openid, from, to, departTime,
          pickupLocation: pickupLocation || '',
          maxPeople: maxPeople || 4,
          currentPeople: 1,
          deadline: deadline || '',
          contact: contact || '',
          remark: remark || '',
          publisher: userName,
          members: [openid],
          createTime: db.serverDate()
        }
      })
      return { code: 0, id: res._id }
    }

    case 'join': {
      const item = await db.collection('carpool').doc(data.carpoolId).get()
      if (item.data.currentPeople >= item.data.maxPeople) return { code: -1, msg: '已满员' }
      if (item.data.members && item.data.members.includes(openid)) return { code: -1, msg: '已加入' }
      await db.collection('carpool').doc(data.carpoolId).update({
        data: { currentPeople: _.inc(1), members: _.push(openid) }
      })
      return { code: 0 }
    }

    case 'leave': {
      const cp = await db.collection('carpool').doc(data.carpoolId).get()
      if (cp.data.openid === openid) return { code: -1, msg: '发起人不能退出' }
      if (!cp.data.members || !cp.data.members.includes(openid)) return { code: -1, msg: '未加入该拼车' }
      await db.collection('carpool').doc(data.carpoolId).update({
        data: { currentPeople: _.inc(-1), members: _.pull(openid) }
      })
      return { code: 0 }
    }

    case 'cancel': {
      const cpCancel = await db.collection('carpool').doc(data.carpoolId).get()
      if (cpCancel.data.openid !== openid) return { code: -1, msg: '仅发起人可取消' }
      await db.collection('carpool').doc(data.carpoolId).remove()
      return { code: 0 }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
