const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'list': {
      const { status, page = 1, pageSize = 10 } = data
      const where = {}
      if (status !== undefined && status !== -1) where.status = status
      const total = await db.collection('errand_tasks').where(where).count()
      const res = await db.collection('errand_tasks').where(where)
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'detail': {
      const res = await db.collection('errand_tasks').doc(data.id).get()
      return { code: 0, data: res.data }
    }

    case 'create': {
      const { title, desc, fromAddr, toAddr, price, tip, phone } = data
      if (!title || !desc) return { code: -1, msg: 'missing fields' }
      const user = await db.collection('users').where({ openid }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      const res = await db.collection('errand_tasks').add({
        data: {
          openid, title, desc,
          fromAddr: fromAddr || '',
          toAddr: toAddr || '',
          price: price || 5,
          tip: tip || 0,
          phone: phone || '',
          publisher: userName,
          status: 0,
          statusText: '待接单',
          statusColor: '#DD6B20',
          riderId: null,
          createTime: db.serverDate()
        }
      })
      return { code: 0, id: res._id }
    }

    case 'accept': {
      const task = await db.collection('errand_tasks').doc(data.taskId).get()
      if (task.data.status !== 0) return { code: -1, msg: '任务已被接' }
      var errandAcceptUser = await db.collection('users').where({ openid }).get()
      var errandAcceptName = errandAcceptUser.data.length > 0 ? errandAcceptUser.data[0].name : '骑手'
      await db.collection('errand_tasks').doc(data.taskId).update({
        data: { status: 1, statusText: '进行中', statusColor: '#38A169', riderId: openid, acceptTime: db.serverDate() }
      })
      // 通知发布者
      if (task.data.openid !== openid) {
        await db.collection('messages').add({
          data: {
            toOpenid: task.data.openid,
            fromOpenid: openid,
            fromName: errandAcceptName,
            type: 'order_accept',
            title: '跑腿任务已被接',
            content: errandAcceptName + ' 已接您的跑腿任务: ' + (task.data.title || ''),
            targetId: data.taskId,
            targetType: 'errand',
            read: false,
            createTime: db.serverDate()
          }
        })
      }
      return { code: 0 }
    }

    case 'updateStatus': {
      const { taskId, status } = data
      const statusMap = {
        0: { text: '待接单', color: '#DD6B20' },
        1: { text: '进行中', color: '#38A169' },
        2: { text: '已完成', color: '#A0AEC0' },
        3: { text: '已取消', color: '#E53E3E' }
      }
      const s = statusMap[status] || statusMap[0]
      await db.collection('errand_tasks').doc(taskId).update({
        data: { status, statusText: s.text, statusColor: s.color }
      })
      // 通知相关方
      var errandTask = await db.collection('errand_tasks').doc(taskId).get()
      var errandStatusUser = await db.collection('users').where({ openid }).get()
      var errandStatusName = errandStatusUser.data.length > 0 ? errandStatusUser.data[0].name : '用户'
      var errandNotifyTarget = errandTask.data.openid === openid ? errandTask.data.riderId : errandTask.data.openid
      if (errandNotifyTarget && errandNotifyTarget !== openid) {
        await db.collection('messages').add({
          data: {
            toOpenid: errandNotifyTarget,
            fromOpenid: openid,
            fromName: errandStatusName,
            type: 'order_status',
            title: '跑腿任务状态更新',
            content: '跑腿任务状态已更新为: ' + s.text,
            targetId: taskId,
            targetType: 'errand',
            read: false,
            createTime: db.serverDate()
          }
        })
      }
      return { code: 0 }
    }

    case 'cancel': {
      const task = await db.collection('errand_tasks').doc(data.taskId).get()
      if (task.data.openid !== openid) return { code: -1, msg: '仅发布者可取消' }
      await db.collection('errand_tasks').doc(data.taskId).update({
        data: { status: 3, statusText: '已取消', statusColor: '#E53E3E' }
      })
      // 通知骑手
      if (task.data.riderId && task.data.riderId !== openid) {
        var errandCancelUser = await db.collection('users').where({ openid }).get()
        var errandCancelName = errandCancelUser.data.length > 0 ? errandCancelUser.data[0].name : '用户'
        await db.collection('messages').add({
          data: {
            toOpenid: task.data.riderId,
            fromOpenid: openid,
            fromName: errandCancelName,
            type: 'order_cancel',
            title: '跑腿任务已取消',
            content: errandCancelName + ' 取消了跑腿任务: ' + (task.data.title || ''),
            targetId: data.taskId,
            targetType: 'errand',
            read: false,
            createTime: db.serverDate()
          }
        })
      }
      return { code: 0 }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
