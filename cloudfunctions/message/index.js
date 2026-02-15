const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    // 获取我的消息列表
    case 'list': {
      const { page = 1, pageSize = 20 } = data
      const res = await db.collection('messages')
        .where({ toOpenid: openid })
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      return { code: 0, data: res.data }
    }

    // 未读消息数
    case 'unreadCount': {
      const res = await db.collection('messages')
        .where({ toOpenid: openid, read: false })
        .count()
      return { code: 0, count: res.total }
    }

    // 标记单条已读
    case 'markRead': {
      if (data.msgId) {
        await db.collection('messages').doc(data.msgId).update({
          data: { read: true }
        })
      }
      return { code: 0 }
    }

    // 全部标记已读
    case 'markAllRead': {
      const unread = await db.collection('messages')
        .where({ toOpenid: openid, read: false })
        .limit(100)
        .get()
      for (var i = 0; i < unread.data.length; i++) {
        await db.collection('messages').doc(unread.data[i]._id).update({
          data: { read: true }
        })
      }
      return { code: 0 }
    }

    // 删除单条消息
    case 'delete': {
      if (data.msgId) {
        await db.collection('messages').doc(data.msgId).remove()
      }
      return { code: 0 }
    }

    // 一键删除全部消息
    case 'deleteAll': {
      const allMsgs = await db.collection('messages')
        .where({ toOpenid: openid })
        .limit(100)
        .get()
      for (var j = 0; j < allMsgs.data.length; j++) {
        await db.collection('messages').doc(allMsgs.data[j]._id).remove()
      }
      return { code: 0 }
    }

    // 发送消息（内部调用，由其他云函数触发）
    case 'send': {
      var { toOpenid, fromOpenid, fromName, type, title, content, targetId, targetType } = data
      if (!toOpenid || !type) return { code: -1, msg: 'missing fields' }
      // 不给自己发通知
      if (toOpenid === fromOpenid) return { code: 0, msg: 'skip self' }
      await db.collection('messages').add({
        data: {
          toOpenid: toOpenid,
          fromOpenid: fromOpenid || '',
          fromName: fromName || '系统',
          type: type,
          title: title || '',
          content: content || '',
          targetId: targetId || '',
          targetType: targetType || '',
          read: false,
          createTime: db.serverDate()
        }
      })
      return { code: 0 }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
