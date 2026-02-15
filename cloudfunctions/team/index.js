const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'list': {
      const { type, page = 1, pageSize = 20 } = data
      const where = {}
      if (type) where.type = type
      const res = await db.collection('team_activities').where(where)
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      // 标记当前用户是否为发起人
      const list = res.data.map(item => ({
        ...item,
        isOwner: item.openid === openid,
        photos: item.photos || [],
        images: item.images || []
      }))
      return { code: 0, data: list }
    }

    case 'detail': {
      const activity = await db.collection('team_activities').doc(data.id).get()
      const members = await db.collection('team_members').where({ activityId: data.id }).get()
      const d = activity.data
      return {
        code: 0,
        data: {
          ...d,
          isOwner: d.openid === openid,
          photos: d.photos || [],
          images: d.images || [],
          members: members.data
        }
      }
    }

    case 'create': {
      const { title, type, place, time, max, desc, images } = data
      if (!title || !type) return { code: -1, msg: 'missing fields' }
      const user = await db.collection('users').where({ openid }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      const res = await db.collection('team_activities').add({
        data: {
          openid, title, type,
          place: place || '',
          time: time || '',
          max: Number(max) || 10,
          current: 1,
          desc: desc || '',
          images: images || [],
          photos: [],
          status: 'active',
          tag: '招募中',
          owner: userName,
          createTime: db.serverDate()
        }
      })
      // 发起人自动加入成员
      await db.collection('team_members').add({
        data: { activityId: res._id, openid, name: userName, joinTime: db.serverDate() }
      })
      return { code: 0, id: res._id }
    }

    case 'join': {
      const activity = await db.collection('team_activities').doc(data.activityId).get()
      if (activity.data.status === 'ended') return { code: -1, msg: '活动已结束' }
      // 检查时间是否过期
      if (activity.data.time) {
        var actTime = new Date(activity.data.time.replace(/-/g, '/'))
        if (!isNaN(actTime.getTime()) && actTime.getTime() < Date.now()) {
          return { code: -1, msg: '活动已过期' }
        }
      }
      if (activity.data.current >= activity.data.max) return { code: -1, msg: '已满员' }
      // 检查是否已加入
      const existing = await db.collection('team_members').where({ activityId: data.activityId, openid }).count()
      if (existing.total > 0) return { code: -1, msg: '已加入' }
      const user = await db.collection('users').where({ openid }).get()
      const userName = user.data.length > 0 ? user.data[0].name : '匿名'
      await db.collection('team_members').add({
        data: { activityId: data.activityId, openid, name: userName, joinTime: db.serverDate() }
      })
      const newCurrent = activity.data.current + 1
      const updateData = { current: _.inc(1) }
      if (newCurrent >= activity.data.max) {
        updateData.tag = '已满员'
      }
      await db.collection('team_activities').doc(data.activityId).update({ data: updateData })
      return { code: 0 }
    }

    case 'uploadPhotos': {
      const { activityId, fileIDs } = data
      const activity = await db.collection('team_activities').doc(activityId).get()
      if (activity.data.openid !== openid) return { code: -1, msg: '仅发起人可上传' }
      await db.collection('team_activities').doc(activityId).update({
        data: { photos: _.push(fileIDs) }
      })
      return { code: 0 }
    }

    case 'endActivity': {
      const act = await db.collection('team_activities').doc(data.activityId).get()
      if (act.data.openid !== openid) return { code: -1, msg: '仅发起人可结束' }
      await db.collection('team_activities').doc(data.activityId).update({
        data: { status: 'ended', tag: '已结束' }
      })
      return { code: 0 }
    }

    case 'leave': {
      const actLeave = await db.collection('team_activities').doc(data.activityId).get()
      if (actLeave.data.openid === openid) return { code: -1, msg: '发起人不能退出' }
      const memberCheck = await db.collection('team_members').where({ activityId: data.activityId, openid }).get()
      if (memberCheck.data.length === 0) return { code: -1, msg: '未加入该活动' }
      await db.collection('team_members').doc(memberCheck.data[0]._id).remove()
      await db.collection('team_activities').doc(data.activityId).update({
        data: { current: _.inc(-1) }
      })
      return { code: 0 }
    }

    // 我参与的组队
    case 'myTeam': {
      var myCreated = await db.collection('team_activities').where({ openid }).orderBy('createTime', 'desc').limit(50).get()
      var myJoined = await db.collection('team_members').where({ openid }).orderBy('joinTime', 'desc').limit(50).get()
      var idMap = {}
      var result = []
      for (var i = 0; i < myCreated.data.length; i++) {
        var a = myCreated.data[i]
        if (!idMap[a._id]) { idMap[a._id] = true; result.push(a) }
      }
      for (var j = 0; j < myJoined.data.length; j++) {
        var aid = myJoined.data[j].activityId
        if (!idMap[aid]) {
          idMap[aid] = true
          try {
            var act = await db.collection('team_activities').doc(aid).get()
            result.push(act.data)
          } catch (e) {}
        }
      }
      result.sort(function(a, b) { return new Date(b.createTime) - new Date(a.createTime) })
      return { code: 0, data: result }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
