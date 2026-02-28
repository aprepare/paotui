const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { action, data = {} } = event

  switch (action) {
    case 'getLiveData': {
      // 获取全局统计
      const statsRes = await db.collection('stats').where({ key: 'global' }).get()
      if (statsRes.data.length === 0) {
        // 初始化统计记录
        await db.collection('stats').add({
          data: { key: 'global', todayDelivered: 0, totalOrders: 0 }
        })
        return { code: 0, data: { todayDelivered: 0, totalOrders: 0 } }
      }
      return { code: 0, data: statsRes.data[0] }
    }

    case 'getLatestOrders': {
      const { limit = 10 } = data
      // 分别查待接单和非待接单，确保待接单订单一定显示
      var [expressPending, expressOther, errandPending, errandOther] = await Promise.all([
        db.collection('express_orders').where({ status: 0 }).orderBy('tip', 'desc').orderBy('createTime', 'desc').limit(limit).get(),
        db.collection('express_orders').where({ status: _.and(_.neq(0), _.neq(4)) }).orderBy('createTime', 'desc').limit(limit).get(),
        db.collection('errand_tasks').where({ status: 0 }).orderBy('tip', 'desc').orderBy('createTime', 'desc').limit(limit).get(),
        db.collection('errand_tasks').where({ status: _.and(_.neq(0), _.neq(3)) }).orderBy('createTime', 'desc').limit(limit).get()
      ])
      // 标记类型
      var expressList = expressPending.data.concat(expressOther.data).map(function(o) {
        o.orderType = 'express'
        return o
      })
      var errandList = errandPending.data.concat(errandOther.data).map(function(o) {
        o.orderType = 'errand'
        o.sizeText = '跑腿'
        o.sizeClass = 'errand'
        o.pickupPoint = o.title || o.fromAddr || '跑腿任务'
        o.building = o.toAddr || ''
        o.room = ''
        return o
      })
      // 去重（待接单和非待接单可能有重叠）
      var seen = {}
      var all = []
      var merged = expressList.concat(errandList)
      for (var i = 0; i < merged.length; i++) {
        var id = merged[i]._id
        if (!seen[id]) {
          seen[id] = true
          all.push(merged[i])
        }
      }
      // 排序：按创建时间倒序，最新的排最前面
      all.sort(function(a, b) {
        var ta = a.createTime ? new Date(a.createTime).getTime() : 0
        var tb = b.createTime ? new Date(b.createTime).getTime() : 0
        return tb - ta
      })
      return { code: 0, data: all.slice(0, limit) }
    }

    case 'getPageConfig': {
      const pcRes = await db.collection('page_config').where({ key: 'home' }).get()
      if (pcRes.data.length === 0) return { code: 0, data: null }
      return { code: 0, data: pcRes.data[0].config || null }
    }

    case 'getSchools': {
      return {
        code: 0,
        data: [
          '北京邮电大学（海淀校区）',
          '北京邮电大学（沙河校区）',
          '北京大学',
          '清华大学',
          '中国人民大学'
        ]
      }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
