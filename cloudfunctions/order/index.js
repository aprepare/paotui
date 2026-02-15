const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    // 我发布的订单（快递+跑腿）
    case 'myPublished': {
      const { page = 1, pageSize = 10 } = data
      const express = await db.collection('express_orders').where({ openid })
        .orderBy('createTime', 'desc').limit(pageSize).get()
      const errand = await db.collection('errand_tasks').where({ openid })
        .orderBy('createTime', 'desc').limit(pageSize).get()
      const list = [
        ...express.data.map(o => ({ ...o, type: '代取快递', typeEmoji: '📦' })),
        ...errand.data.map(o => ({ ...o, type: '万能跑腿', typeEmoji: '🏃' }))
      ]
      // 快递：0=待接单,1=已接单,2=配送中,3=已完成,4=已取消
      // 跑腿：0=待接单,1=进行中,2=已完成,3=已取消
      var ep1 = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
      var rp1 = { 0: 0, 1: 1, 2: 3, 3: 4 }
      list.sort(function(a, b) {
        var pm = a.type === '万能跑腿' ? rp1 : ep1
        var pm2 = b.type === '万能跑腿' ? rp1 : ep1
        var ap = pm[a.status] !== undefined ? pm[a.status] : 5
        var bp = pm2[b.status] !== undefined ? pm2[b.status] : 5
        if (ap !== bp) return ap - bp
        var tipDiff = (b.tip || 0) - (a.tip || 0)
        if (tipDiff !== 0) return tipDiff
        return new Date(b.createTime) - new Date(a.createTime)
      })
      return { code: 0, data: list.slice(0, pageSize) }
    }

    // 我接的订单
    case 'myAccepted': {
      const { page = 1, pageSize = 10 } = data
      const express = await db.collection('express_orders').where({ riderId: openid })
        .orderBy('createTime', 'desc').limit(pageSize).get()
      const errand = await db.collection('errand_tasks').where({ riderId: openid })
        .orderBy('createTime', 'desc').limit(pageSize).get()
      const list = [
        ...express.data.map(o => ({ ...o, type: '代取快递', typeEmoji: '📦' })),
        ...errand.data.map(o => ({ ...o, type: '万能跑腿', typeEmoji: '🏃' }))
      ]
      var ep2 = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
      var rp2 = { 0: 0, 1: 1, 2: 3, 3: 4 }
      list.sort(function(a, b) {
        var pm = a.type === '万能跑腿' ? rp2 : ep2
        var pm2 = b.type === '万能跑腿' ? rp2 : ep2
        var ap = pm[a.status] !== undefined ? pm[a.status] : 5
        var bp = pm2[b.status] !== undefined ? pm2[b.status] : 5
        if (ap !== bp) return ap - bp
        var tipDiff = (b.tip || 0) - (a.tip || 0)
        if (tipDiff !== 0) return tipDiff
        return new Date(b.createTime) - new Date(a.createTime)
      })
      return { code: 0, data: list.slice(0, pageSize) }
    }

    // 我的拼车
    case 'myCarpool': {
      const carpools = await db.collection('carpool')
        .orderBy('createTime', 'desc')
        .limit(20)
        .get()
      const myCarpools = carpools.data.filter(c => c.members && c.members.indexOf(openid) !== -1)
      return { code: 0, data: myCarpools }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
