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
      var expressPending = await db.collection('express_orders')
        .where({ status: 0 })
        .orderBy('tip', 'desc')
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get()
      var expressOther = await db.collection('express_orders')
        .where({ status: _.and(_.neq(0), _.neq(4)) })
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get()
      var errandPending = await db.collection('errand_tasks')
        .where({ status: 0 })
        .orderBy('tip', 'desc')
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get()
      var errandOther = await db.collection('errand_tasks')
        .where({ status: _.and(_.neq(0), _.neq(3)) })
        .orderBy('createTime', 'desc')
        .limit(limit)
        .get()
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
      // 排序：待接单 > 配送中/进行中 > 已接单 > 已完成，同状态按小费降序
      // 快递状态：0=待接单, 1=已接单, 2=配送中, 3=已完成, 4=已取消
      // 跑腿状态：0=待接单, 1=进行中, 2=已完成, 3=已取消
      var expressPriority = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
      var errandPriority = { 0: 0, 1: 1, 2: 3, 3: 4 }
      all.sort(function(a, b) {
        var pm = a.orderType === 'errand' ? errandPriority : expressPriority
        var pm2 = b.orderType === 'errand' ? errandPriority : expressPriority
        var ap = pm[a.status] !== undefined ? pm[a.status] : 5
        var bp = pm2[b.status] !== undefined ? pm2[b.status] : 5
        if (ap !== bp) return ap - bp
        var tipDiff = (b.tip || 0) - (a.tip || 0)
        if (tipDiff !== 0) return tipDiff
        var ta = a.createTime ? new Date(a.createTime).getTime() : 0
        var tb = b.createTime ? new Date(b.createTime).getTime() : 0
        return tb - ta
      })
      return { code: 0, data: all.slice(0, limit) }
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
