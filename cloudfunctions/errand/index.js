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
    console.log('[subscribe] errand send failed:', e.errCode, e.errMsg)
  }
}

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
      if (!data.id) return { code: -1, msg: '缺少任务ID' }
      let res
      try {
        res = await db.collection('errand_tasks').doc(data.id).get()
      } catch (e) {
        return { code: -1, msg: '任务不存在' }
      }
      var detailData = res.data
      // 24小时自动确认：待确认状态超过24小时自动完成
      if (detailData.status === 4 && detailData.submitTime) {
        var submitTs = new Date(detailData.submitTime).getTime()
        if (Date.now() - submitTs >= 24 * 60 * 60 * 1000) {
          await db.collection('errand_tasks').doc(data.id).update({
            data: { status: 2, statusText: '已完成', statusColor: '#A0AEC0', completeTime: db.serverDate(), autoConfirmed: true }
          })
          detailData.status = 2
          detailData.statusText = '已完成'
          detailData.autoConfirmed = true
        }
      }
      // 查询接单人信息
      if (detailData.riderId) {
        var riderUser = await db.collection('users').where({ openid: detailData.riderId }).get()
        if (riderUser.data.length > 0) {
          detailData.riderName = riderUser.data[0].name || '接单人'
          detailData.riderPhone = riderUser.data[0].phone || ''
        }
      }
      // 将云存储fileID转为临时URL
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
        } catch(e) {}
      }
      return { code: 0, data: detailData }
    }

    case 'create': {
      const { title, desc, fromAddr, toAddr, price, tip, phone, remark, timeRequire, destLat, destLng } = data
      if (!title || !desc) return { code: -1, msg: 'missing fields' }
      const textToCheck = [title, desc, remark].filter(Boolean).join(' ')
      const safe = await checkContent(openid, textToCheck, 2)
      if (!safe) return { code: -1, msg: '内容包含违规信息，请修改后重试' }
      // Price validation: 1-999 (Req 5.5)
      const priceVal = typeof price === 'number' ? price : 0
      if (priceVal <= 0 || priceVal > 999) {
        return { code: -1, msg: '报酬金额需在1-999元之间' }
      }
      const user = await db.collection('users').where({ openid }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      const res = await db.collection('errand_tasks').add({
        data: {
          openid, title, desc,
          fromAddr: fromAddr || '',
          toAddr: toAddr || '',
          price: priceVal,
          tip: tip || 0,
          phone: phone || '',
          remark: remark || '',
          timeRequire: timeRequire || '',
          publisher: userName,
          status: 0,
          statusText: '待接单',
          statusColor: '#DD6B20',
          riderId: null,
          destLat: destLat || 0,
          destLng: destLng || 0,
          riderLat: 0,
          riderLng: 0,
          riderLocationTime: null,
          createTime: db.serverDate()
        }
      })
      return { code: 0, id: res._id }
    }

    case 'accept': {
      const task = await db.collection('errand_tasks').doc(data.taskId).get()
      if (task.data.status !== 0) return { code: -1, msg: '任务已被接' }
      if (task.data.openid === openid) return { code: -1, msg: '不能接自己发布的单' }
      // Rider identity check (Req 15.2)
      var errandAcceptUser = await db.collection('users').where({ openid }).get()
      if (errandAcceptUser.data.length === 0 || !errandAcceptUser.data[0].isRider) {
        return { code: -1, msg: '需要注册骑手才能接单' }
      }
      var errandAcceptName = errandAcceptUser.data[0].name || '骑手'
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
        // 发送订阅消息
        await sendOrderSubscribe(
          task.data.openid,
          data.taskId.substring(0, 20),
          '已接单',
          errandAcceptName + '已接您的跑腿任务',
          '/pages/errand/detail?id=' + data.taskId
        )
      }
      return { code: 0 }
    }

    case 'updateStatus': {
      const { taskId, status } = data
      if (!taskId) return { code: -1, msg: '缺少任务ID' }

      // Fetch current task to validate transition (Req 6.2)
      const currentTask = await db.collection('errand_tasks').doc(taskId).get()
      const currentStatus = currentTask.data.status

      // Reject terminal states (2=已完成, 3=已取消)
      if (currentStatus === 2 || currentStatus === 3) {
        return { code: -1, msg: '当前状态不允许此操作' }
      }
      // Reject same-state
      if (currentStatus === status) {
        return { code: -1, msg: '当前状态不允许此操作' }
      }
      // Validate transition: only 0→1, 1→4, 4→2
      const validTransitions = { 0: [1], 1: [4], 4: [2] }
      const allowed = validTransitions[currentStatus]
      if (!allowed || !allowed.includes(status)) {
        return { code: -1, msg: '当前状态不允许此操作' }
      }

      // Photo guard: 1→4 requires pickupPhoto + deliverPhoto (Req 2.1, 2.2)
      if (status === 4 && (!currentTask.data.pickupPhoto || !currentTask.data.deliverPhoto)) {
        return { code: -1, msg: '请先上传凭证照片' }
      }

      const statusMap = {
        0: { text: '待接单', color: '#DD6B20' },
        1: { text: '进行中', color: '#38A169' },
        2: { text: '已完成', color: '#A0AEC0' },
        3: { text: '已取消', color: '#E53E3E' },
        4: { text: '待确认', color: '#2B6CB0' }
      }
      const s = statusMap[status] || statusMap[0]
      var errandUpdateData = { status, statusText: s.text, statusColor: s.color }
      if (status === 4) errandUpdateData.submitTime = db.serverDate()
      if (status === 2) errandUpdateData.completeTime = db.serverDate()
      await db.collection('errand_tasks').doc(taskId).update({ data: errandUpdateData })
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
        // 发送订阅消息
        await sendOrderSubscribe(
          errandNotifyTarget,
          taskId.substring(0, 20),
          s.text,
          '跑腿任务状态已更新',
          '/pages/errand/detail?id=' + taskId
        )
      }
      return { code: 0 }
    }

    case 'cancel': {
      const task = await db.collection('errand_tasks').doc(data.taskId).get()
      // 进行中（status=1）不允许发布者取消
      if (task.data.status === 1 && task.data.openid === openid) {
        return { code: -1, msg: '接单人正在执行任务，无法取消' }
      }
      // 只有发布者或接单人可以取消
      if (task.data.openid !== openid && task.data.riderId !== openid) {
        return { code: -1, msg: '无权取消该任务' }
      }
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
        // 发送订阅消息
        await sendOrderSubscribe(
          task.data.riderId,
          data.taskId.substring(0, 20),
          '已取消',
          errandCancelName + '取消了跑腿任务',
          '/pages/errand/detail?id=' + data.taskId
        )
      }
      return { code: 0 }
    }

    case 'uploadPhoto': {
      const { taskId, type, fileID } = data
      if (!taskId || !type || !fileID) return { code: -1, msg: 'missing fields' }
      var photoUpdate = {}
      if (type === 'pickup') {
        photoUpdate.pickupPhoto = fileID
        photoUpdate.pickupPhotoTime = db.serverDate()
      } else if (type === 'deliver') {
        photoUpdate.deliverPhoto = fileID
        photoUpdate.deliverPhotoTime = db.serverDate()
      }
      await db.collection('errand_tasks').doc(taskId).update({ data: photoUpdate })
      return { code: 0 }
    }

    case 'reportLocation': {
      const { taskId, latitude, longitude } = data
      if (!taskId) return { code: -1, msg: 'missing taskId' }
      var locTask = await db.collection('errand_tasks').doc(taskId).get()
      if (locTask.data.riderId !== openid) return { code: -1, msg: '非接单人' }
      await db.collection('errand_tasks').doc(taskId).update({
        data: { riderLat: latitude, riderLng: longitude, riderLocationTime: db.serverDate() }
      })
      return { code: 0 }
    }

    case 'getRiderLocation': {
      const { taskId } = data
      if (!taskId) return { code: -1, msg: 'missing taskId' }
      var rlocTask = await db.collection('errand_tasks').doc(taskId).get()
      var rd = rlocTask.data
      return {
        code: 0,
        data: {
          riderLat: rd.riderLat || 0,
          riderLng: rd.riderLng || 0,
          riderLocationTime: rd.riderLocationTime || null
        }
      }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
