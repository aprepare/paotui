const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'list': {
      const { status, building, page = 1, pageSize = 10 } = data
      const where = {}
      if (status !== undefined && status !== -1) where.status = status
      if (building && building !== '全部') where.building = building
      const total = await db.collection('express_orders').where(where).count()
      const res = await db.collection('express_orders').where(where)
        .orderBy('tip', 'desc')
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'detail': {
      const res = await db.collection('express_orders').doc(data.id).get()
      var detailData = res.data
      // 查询骑手信息
      if (detailData.riderId) {
        var riderUser = await db.collection('users').where({ openid: detailData.riderId }).get()
        if (riderUser.data.length > 0) {
          detailData.riderName = riderUser.data[0].name || '骑手'
          detailData.riderPhone = riderUser.data[0].phone || ''
          detailData.riderAvatar = riderUser.data[0].avatar || ''
        }
      }
      return { code: 0, data: detailData }
    }

    case 'create': {
      const { pickupPoint, pickupCode, expressCompany, sizeType, building, room, price, tip, remark, destLat, destLng } = data
      if (!pickupPoint || !building || !room) {
        return { code: -1, msg: 'missing required fields' }
      }
      const sizeMap = { 0: { text: '小件', class: 'small' }, 1: { text: '大件', class: 'large' }, 2: { text: '超大件', class: 'xlarge' } }
      const size = sizeMap[sizeType] || sizeMap[0]
      const res = await db.collection('express_orders').add({
        data: {
          openid,
          pickupPoint,
          pickupCode: pickupCode || '',
          expressCompany: expressCompany || '',
          sizeType: sizeType || 0,
          sizeText: size.text,
          sizeClass: size.class,
          building,
          room,
          price: price || 2,
          tip: tip || 0,
          remark: remark || '',
          status: 0,
          statusText: '待接单',
          statusColor: '#DD6B20',
          riderId: null,
          destLat: destLat || 0,
          destLng: destLng || 0,
          riderLat: 0,
          riderLng: 0,
          createTime: db.serverDate()
        }
      })
      // 更新统计
      await db.collection('stats').where({ key: 'global' }).update({
        data: { totalOrders: _.inc(1) }
      }).catch(() => {})
      return { code: 0, id: res._id }
    }

    case 'accept': {
      const order = await db.collection('express_orders').doc(data.orderId).get()
      if (order.data.status !== 0) return { code: -1, msg: '订单已被接' }
      var acceptUser = await db.collection('users').where({ openid }).get()
      var acceptName = acceptUser.data.length > 0 ? acceptUser.data[0].name : '骑手'
      await db.collection('express_orders').doc(data.orderId).update({
        data: {
          status: 1,
          statusText: '已接单',
          statusColor: '#2B6CB0',
          riderId: openid,
          acceptTime: db.serverDate()
        }
      })
      // 通知下单人
      if (order.data.openid !== openid) {
        await db.collection('messages').add({
          data: {
            toOpenid: order.data.openid,
            fromOpenid: openid,
            fromName: acceptName,
            type: 'order_accept',
            title: '快递单已被接',
            content: acceptName + ' 已接您的快递单，正在为您取件',
            targetId: data.orderId,
            targetType: 'express',
            read: false,
            createTime: db.serverDate()
          }
        })
      }
      return { code: 0 }
    }

    case 'updateStatus': {
      const { orderId, status } = data
      const statusMap = {
        0: { text: '待接单', color: '#DD6B20' },
        1: { text: '已接单', color: '#2B6CB0' },
        2: { text: '配送中', color: '#38A169' },
        3: { text: '已完成', color: '#A0AEC0' },
        4: { text: '已取消', color: '#E53E3E' }
      }
      const s = statusMap[status] || statusMap[0]
      const updateData = { status, statusText: s.text, statusColor: s.color }
      if (status === 3) {
        updateData.completeTime = db.serverDate()
        await db.collection('stats').where({ key: 'global' }).update({
          data: { todayDelivered: _.inc(1) }
        }).catch(() => {})
      }
      await db.collection('express_orders').doc(orderId).update({ data: updateData })
      // 通知相关方状态变化
      var statusOrder = await db.collection('express_orders').doc(orderId).get()
      var statusUser = await db.collection('users').where({ openid }).get()
      var statusName = statusUser.data.length > 0 ? statusUser.data[0].name : '骑手'
      var notifyTarget = statusOrder.data.openid === openid ? statusOrder.data.riderId : statusOrder.data.openid
      if (notifyTarget && notifyTarget !== openid) {
        await db.collection('messages').add({
          data: {
            toOpenid: notifyTarget,
            fromOpenid: openid,
            fromName: statusName,
            type: 'order_status',
            title: '快递单状态更新',
            content: '快递单状态已更新为: ' + s.text,
            targetId: orderId,
            targetType: 'express',
            read: false,
            createTime: db.serverDate()
          }
        })
      }
      return { code: 0 }
    }

    case 'cancel': {
      var cancelOrder = await db.collection('express_orders').doc(data.orderId).get()
      await db.collection('express_orders').doc(data.orderId).update({
        data: { status: 4, statusText: '已取消', statusColor: '#E53E3E' }
      })
      // 通知相关方
      var cancelUser = await db.collection('users').where({ openid }).get()
      var cancelName = cancelUser.data.length > 0 ? cancelUser.data[0].name : '用户'
      var cancelTarget = cancelOrder.data.openid === openid ? cancelOrder.data.riderId : cancelOrder.data.openid
      if (cancelTarget && cancelTarget !== openid) {
        await db.collection('messages').add({
          data: {
            toOpenid: cancelTarget,
            fromOpenid: openid,
            fromName: cancelName,
            type: 'order_cancel',
            title: '快递单已取消',
            content: cancelName + ' 取消了快递单',
            targetId: data.orderId,
            targetType: 'express',
            read: false,
            createTime: db.serverDate()
          }
        })
      }
      return { code: 0 }
    }

    case 'uploadPhoto': {
      const { orderId, type, fileID } = data
      if (!orderId || !type || !fileID) return { code: -1, msg: 'missing fields' }
      var updateData = {}
      if (type === 'pickup') {
        updateData.pickupPhoto = fileID
        updateData.pickupPhotoTime = db.serverDate()
      } else if (type === 'deliver') {
        updateData.deliverPhoto = fileID
        updateData.deliverPhotoTime = db.serverDate()
      }
      await db.collection('express_orders').doc(orderId).update({ data: updateData })
      return { code: 0 }
    }

    // 骑手上报实时位置
    case 'reportLocation': {
      var { orderId, latitude, longitude } = data
      if (!orderId || !latitude || !longitude) return { code: -1, msg: 'missing fields' }
      await db.collection('express_orders').doc(orderId).update({
        data: {
          riderLat: latitude,
          riderLng: longitude,
          riderLocationTime: db.serverDate()
        }
      })
      return { code: 0 }
    }

    // 查询骑手实时位置
    case 'getRiderLocation': {
      var locOrder = await db.collection('express_orders').doc(data.orderId).get()
      var locData = locOrder.data
      return {
        code: 0,
        data: {
          riderLat: locData.riderLat || 0,
          riderLng: locData.riderLng || 0,
          riderLocationTime: locData.riderLocationTime || null,
          destLat: locData.destLat || 0,
          destLng: locData.destLng || 0
        }
      }
    }

    // 获取所有订单（骑手楼栋统计用）
    case 'allOrders': {
      const orders = await db.collection('express_orders')
        .where({ status: _.neq(4) })
        .orderBy('createTime', 'desc')
        .limit(200)
        .get()
      return { code: 0, data: orders.data }
    }

    case 'buildingStats': {
      const all = await db.collection('express_orders').where({ status: _.neq(4) }).get()
      const errandAll = await db.collection('errand_tasks').where({ status: _.neq(3) }).get()
      const map = {}
      let totalEarnings = 0
      // 统计快递订单
      all.data.forEach(o => {
        if (!o.building) return
        if (!map[o.building]) map[o.building] = { total: 0, pending: 0, delivering: 0, completed: 0 }
        map[o.building].total++
        if (o.status === 0) map[o.building].pending++
        else if (o.status === 1 || o.status === 2) map[o.building].delivering++
        else if (o.status === 3) {
          map[o.building].completed++
          totalEarnings += (o.price || 0) + (o.tip || 0)
        }
      })
      // 统计跑腿任务（用toAddr作为楼栋）
      // 跑腿状态：0=待接单, 1=进行中, 2=已完成, 3=已取消
      errandAll.data.forEach(o => {
        var bName = o.toAddr || ''
        if (!bName) return
        if (!map[bName]) map[bName] = { total: 0, pending: 0, delivering: 0, completed: 0 }
        map[bName].total++
        if (o.status === 0) map[bName].pending++
        else if (o.status === 1) map[bName].delivering++
        else if (o.status === 2) {
          map[bName].completed++
          totalEarnings += (o.price || 0) + (o.tip || 0)
        }
      })
      const result = Object.keys(map).map(name => ({
        name,
        count: map[name].total,
        pending: map[name].pending,
        delivering: map[name].delivering,
        completed: map[name].completed
      }))
      result.sort((a, b) => b.count - a.count)
      const totalCount = result.reduce((s, r) => s + r.count, 0)
      result.unshift({ name: '全部', count: totalCount, pending: 0, delivering: 0, completed: 0 })
      return { code: 0, data: result, totalEarnings }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
