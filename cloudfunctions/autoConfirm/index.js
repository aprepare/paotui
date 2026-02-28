const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 订阅消息模板ID
var ORDER_TMPL = 'xlvGM1wbE0FKTpG7rB8ktBsCo1gn_9n0USbqRw48fjI'

// 发送订单状态订阅消息
async function sendOrderSubscribe(toOpenid, orderNo, statusText, tips, page) {
  try {
    await cloud.openapi.subscribeMessage.send({
      touser: toOpenid,
      templateId: ORDER_TMPL,
      data: {
        character_string1: { value: orderNo },
        phrase2: { value: statusText },
        thing3: { value: tips.length > 20 ? tips.substring(0, 17) + '...' : tips },
        time4: { value: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) }
      },
      page: page || '',
      miniprogramState: 'formal'
    })
  } catch (e) {
    console.log('[subscribe] autoConfirm send failed:', e.errCode, e.errMsg)
  }
}

// 24小时自动确认定时云函数
// 触发器：每小时执行一次，批量处理超时未确认的订单
exports.main = async function (event) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const results = { express: 0, errand: 0, errors: [] }

  // 1. 快递订单：status=2（配送中）且有送达照片且超过24小时
  try {
    const expressOrders = await db.collection('express_orders')
      .where({
        status: 2,
        deliverPhoto: _.exists(true),
        deliverPhotoTime: _.lte(cutoff)
      })
      .limit(100)
      .get()

    for (const order of expressOrders.data) {
      try {
        await db.collection('express_orders').doc(order._id).update({
          data: {
            status: 3,
            statusText: '已完成',
            statusColor: '#A0AEC0',
            completeTime: db.serverDate(),
            autoConfirmed: true
          }
        })
        // 通知下单人订单已自动完成
        await db.collection('messages').add({
          data: {
            toOpenid: order.openid,
            fromOpenid: 'system',
            fromName: '系统',
            type: 'order_complete',
            title: '快递单已自动确认',
            content: '您的快递单已超过24小时未确认，系统已自动确认完成',
            targetId: order._id,
            targetType: 'express',
            read: false,
            createTime: db.serverDate()
          }
        })
        // 发送订阅消息
        await sendOrderSubscribe(
          order.openid,
          order._id.substring(0, 20),
          '已完成',
          '系统已自动确认完成',
          '/pages/express/detail?id=' + order._id
        )
        results.express++
      } catch (e) {
        results.errors.push({ type: 'express', id: order._id, msg: e.message })
      }
    }
  } catch (e) {
    results.errors.push({ type: 'express_query', msg: e.message })
  }

  // 2. 跑腿任务：status=4（待确认）且超过24小时
  try {
    const errandTasks = await db.collection('errand_tasks')
      .where({
        status: 4,
        submitTime: _.lte(cutoff)
      })
      .limit(100)
      .get()

    for (const task of errandTasks.data) {
      try {
        await db.collection('errand_tasks').doc(task._id).update({
          data: {
            status: 2,
            statusText: '已完成',
            statusColor: '#A0AEC0',
            completeTime: db.serverDate(),
            autoConfirmed: true
          }
        })
        // 通知发布者任务已自动完成
        await db.collection('messages').add({
          data: {
            toOpenid: task.openid,
            fromOpenid: 'system',
            fromName: '系统',
            type: 'order_complete',
            title: '跑腿任务已自动确认',
            content: '您的跑腿任务已超过24小时未确认，系统已自动确认完成',
            targetId: task._id,
            targetType: 'errand',
            read: false,
            createTime: db.serverDate()
          }
        })
        // 发送订阅消息
        await sendOrderSubscribe(
          task.openid,
          task._id.substring(0, 20),
          '已完成',
          '系统已自动确认完成',
          '/pages/errand/detail?id=' + task._id
        )
        results.errand++
      } catch (e) {
        results.errors.push({ type: 'errand', id: task._id, msg: e.message })
      }
    }
  } catch (e) {
    results.errors.push({ type: 'errand_query', msg: e.message })
  }

  console.log('[autoConfirm]', JSON.stringify(results))
  return { code: 0, data: results }
}
