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

// 订阅消息模板ID
var ORDER_TMPL = 'xlvGM1wbE0FKTpG7rB8ktBsCo1gn_9n0USbqRw48fjI'

// 发送订单状态订阅消息（失败不影响主流程）
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
    console.log('[subscribe] express send failed:', e.errCode, e.errMsg)
  }
}

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
      // 24小时自动确认收货：配送中且已上传送达照片超过24小时
      if (detailData.status === 2 && detailData.deliverPhotoTime) {
        var photoTime = new Date(detailData.deliverPhotoTime).getTime()
        if (Date.now() - photoTime >= 24 * 60 * 60 * 1000) {
          await db.collection('express_orders').doc(data.id).update({
            data: { status: 3, statusText: '已完成', statusColor: '#A0AEC0', completeTime: db.serverDate(), autoConfirmed: true }
          })
          detailData.status = 3
          detailData.statusText = '已完成'
          detailData.autoConfirmed = true
        }
      }
      // 查询骑手信息
      if (detailData.riderId) {
        var riderUser = await db.collection('users').where({ openid: detailData.riderId }).get()
        if (riderUser.data.length > 0) {
          detailData.riderName = riderUser.data[0].name || '骑手'
          detailData.riderPhone = riderUser.data[0].phone || ''
          detailData.riderAvatar = riderUser.data[0].avatar || ''
        }
      }
      // 将云存储fileID转为临时可访问URL，解决跨用户无法查看照片的问题
      var fileIDs = []
      if (detailData.pickupPhoto) fileIDs.push(detailData.pickupPhoto)
      if (detailData.deliverPhoto) fileIDs.push(detailData.deliverPhoto)
      if (fileIDs.length > 0) {
        try {
          var tempRes = await cloud.getTempFileURL({ fileList: fileIDs })
          if (tempRes.fileList && tempRes.fileList.length > 0) {
            tempRes.fileList.forEach(function(f) {
              if (f.status === 0 && f.tempFileURL) {
                if (f.fileID === detailData.pickupPhoto) detailData.pickupPhoto = f.tempFileURL
                if (f.fileID === detailData.deliverPhoto) detailData.deliverPhoto = f.tempFileURL
              }
            })
          }
        } catch(e) {
          // 转换失败不影响主流程，前端仍可尝试用fileID加载
        }
      }
      return { code: 0, data: detailData }
    }

    case 'create': {
      const { pickupPoint, pickupCode, expressCompany, sizeType, building, room, phone, price, tip, remark, destLat, destLng } = data
      if (!pickupPoint || !building) {
        return { code: -1, msg: 'missing required fields' }
      }
      if (remark) {
        const safe = await checkContent(openid, remark, 2)
        if (!safe) return { code: -1, msg: '备注包含违规内容，请修改' }
      }
      // Room validation: non-empty, 1-10 chars (Req 11.2)
      if (!room || typeof room !== 'string' || room.trim().length < 1 || room.trim().length > 10) {
        return { code: -1, msg: '房间号不能为空且长度需在1-10个字符之间' }
      }
      // Phone validation (Req 3.2)
      if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
        return { code: -1, msg: '手机号格式不正确' }
      }
      // Tip validation: 0-99 (Req 5.2, 5.4)
      const tipVal = typeof tip === 'number' ? tip : 0
      if (tipVal < 0 || tipVal > 99) {
        return { code: -1, msg: '小费金额需在0-99元之间' }
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
          room: room.trim(),
          phone: phone || '',
          price: price || 2,
          tip: tipVal,
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
      if (order.data.openid === openid) return { code: -1, msg: '不能接自己发布的单' }
      // Rider identity check (Req 15.1)
      var acceptUser = await db.collection('users').where({ openid }).get()
      if (acceptUser.data.length === 0 || !acceptUser.data[0].isRider) {
        return { code: -1, msg: '需要注册骑手才能接单' }
      }
      var acceptName = acceptUser.data[0].name || '骑手'
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
        // 发送订阅消息
        await sendOrderSubscribe(
          order.data.openid,
          data.orderId.substring(0, 20),
          '已接单',
          acceptName + '正在为您取件',
          '/pages/express/detail?id=' + data.orderId
        )
      }
      return { code: 0 }
    }

    case 'updateStatus': {
      const { orderId, status } = data
      if (!orderId) return { code: -1, msg: '缺少订单ID' }

      // Fetch current order to validate transition (Req 6.1, 6.3, 6.4)
      const currentOrder = await db.collection('express_orders').doc(orderId).get()
      const currentStatus = currentOrder.data.status

      // Reject terminal states (Req 6.3)
      if (currentStatus === 3 || currentStatus === 4) {
        return { code: -1, msg: '当前状态不允许此操作' }
      }
      // Reject same-state (Req 6.4)
      if (currentStatus === status) {
        return { code: -1, msg: '当前状态不允许此操作' }
      }
      // Validate transition (Req 6.1): only 0→1, 1→2, 2→3
      const validTransitions = { 0: [1], 1: [2], 2: [3] }
      const allowed = validTransitions[currentStatus]
      if (!allowed || !allowed.includes(status)) {
        return { code: -1, msg: '当前状态不允许此操作' }
      }

      // Photo guards (Req 1.3, 1.4)
      if (status === 2 && !currentOrder.data.pickupPhoto) {
        return { code: -1, msg: '请先上传取件照片' }
      }
      if (status === 3 && !currentOrder.data.deliverPhoto) {
        return { code: -1, msg: '请先上传送达照片' }
      }

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
        // 随机增加2-3件，让数据看起来更活跃
        var increment = Math.random() < 0.5 ? 2 : 3
        await db.collection('stats').where({ key: 'global' }).update({
          data: { todayDelivered: _.inc(increment) }
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
        // 发送订阅消息
        await sendOrderSubscribe(
          notifyTarget,
          orderId.substring(0, 20),
          s.text,
          '快递单状态已更新',
          '/pages/express/detail?id=' + orderId
        )
      }
      return { code: 0 }
    }

    case 'cancel': {
      var cancelOrder = await db.collection('express_orders').doc(data.orderId).get()
      var cancelData = cancelOrder.data
      // 配送中（status=2）不允许用户取消
      if (cancelData.status === 2 && cancelData.openid === openid) {
        return { code: -1, msg: '骑手正在配送中，无法取消订单' }
      }
      // 只有发布者或骑手可以取消
      if (cancelData.openid !== openid && cancelData.riderId !== openid) {
        return { code: -1, msg: '无权取消该订单' }
      }
      await db.collection('express_orders').doc(data.orderId).update({
        data: { status: 4, statusText: '已取消', statusColor: '#E53E3E' }
      })
      // 通知相关方
      var cancelUser = await db.collection('users').where({ openid }).get()
      var cancelName = cancelUser.data.length > 0 ? cancelUser.data[0].name : '用户'
      var cancelTarget = cancelData.openid === openid ? cancelData.riderId : cancelData.openid
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
        // 发送订阅消息
        await sendOrderSubscribe(
          cancelTarget,
          data.orderId.substring(0, 20),
          '已取消',
          cancelName + '取消了快递单',
          '/pages/express/detail?id=' + data.orderId
        )
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

    // 查询骑手实时位置（含距离计算）
    case 'getRiderLocation': {
      var locOrder = await db.collection('express_orders').doc(data.orderId).get()
      var locData = locOrder.data
      var result = {
        riderLat: locData.riderLat || 0,
        riderLng: locData.riderLng || 0,
        riderLocationTime: locData.riderLocationTime || null,
        destLat: locData.destLat || 0,
        destLng: locData.destLng || 0,
        distance: 0,
        duration: 0
      }
      // 使用腾讯地图WebService API计算步行距离
      if (result.riderLat && result.destLat) {
        try {
          var https = require('https')
          var qqmapKey = 'JJUBZ-RA7WV-UKAPA-5JPXQ-TZFWV-N3FPV'
          var fromStr = result.riderLat + ',' + result.riderLng
          var toStr = result.destLat + ',' + result.destLng
          var url = '/ws/direction/v1/walking/?from=' + fromStr + '&to=' + toStr + '&key=' + qqmapKey
          var distRes = await new Promise(function(resolve) {
            var reqData = ''
            var req = https.request({
              hostname: 'apis.map.qq.com',
              path: url,
              method: 'GET'
            }, function(res) {
              res.on('data', function(chunk) { reqData += chunk })
              res.on('end', function() {
                try { resolve(JSON.parse(reqData)) } catch(e) { resolve(null) }
              })
            })
            req.on('error', function() { resolve(null) })
            req.setTimeout(3000, function() { req.destroy(); resolve(null) })
            req.end()
          })
          if (distRes && distRes.status === 0 && distRes.result && distRes.result.routes && distRes.result.routes.length > 0) {
            result.distance = distRes.result.routes[0].distance || 0
            result.duration = distRes.result.routes[0].duration || 0
          }
        } catch(e) {
          // 距离计算失败不影响主流程
        }
      }
      return { code: 0, data: result }
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
