const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    // 获取团购商品列表（管理员在后台配置）
    case 'getProducts': {
      try {
        const res = await db.collection('wash_products')
          .where({ status: 1 })
          .orderBy('sort', 'asc')
          .get()
        return { code: 0, data: res.data }
      } catch (e) {
        // 集合不存在时返回空
        return { code: 0, data: [] }
      }
    }

    // 获取进行中的团购列表
    case 'getGroups': {
      try {
        const { productId } = data
        const where = { status: 0 } // 0=拼团中
        if (productId) where.productId = productId
        const res = await db.collection('wash_groups')
          .where(where)
          .orderBy('createTime', 'desc')
          .limit(50)
          .get()
        return { code: 0, data: res.data }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    // 开团
    case 'createGroup': {
      const { productId } = data
      if (!productId) return { code: -1, msg: '缺少商品ID' }

      let p = null
      // 默认商品（集合为空时前端用的假ID）
      const defaultProductMap = {
        'default_1': { name: '运动鞋基础清洗', originalPrice: 35, groupPrice: 19.9, groupSize: 3, image: '' },
        'default_2': { name: '运动鞋深度清洗', originalPrice: 55, groupPrice: 29.9, groupSize: 3, image: '' },
        'default_3': { name: '皮鞋/靴子养护', originalPrice: 65, groupPrice: 39.9, groupSize: 3, image: '' },
        'default_4': { name: 'AJ/椰子精洗', originalPrice: 79, groupPrice: 49.9, groupSize: 3, image: '' },
        'default_5': { name: '小白鞋焕新套餐', originalPrice: 45, groupPrice: 25.9, groupSize: 3, image: '' }
      }

      if (defaultProductMap[productId]) {
        p = defaultProductMap[productId]
      } else {
        try {
          const product = await db.collection('wash_products').doc(productId).get()
          if (!product.data) return { code: -1, msg: '商品不存在' }
          p = product.data
        } catch (e) {
          return { code: -1, msg: '商品不存在' }
        }
      }

      // 获取用户信息
      const userRes = await db.collection('users').where({ openid }).get()
      const userName = (userRes.data[0] && userRes.data[0].name) || '匿名'

      const group = {
        productId: productId,
        productName: p.name,
        productImage: p.image || '',
        originalPrice: p.originalPrice || 0,
        groupPrice: p.groupPrice || 0,
        targetCount: p.groupSize || 3,
        currentCount: 1,
        members: [{ openid, name: userName, joinTime: new Date() }],
        status: 0, // 0=拼团中 1=已成团 2=已过期
        expireTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
        creatorOpenid: openid,
        creatorName: userName,
        createTime: db.serverDate()
      }
      const addRes = await db.collection('wash_groups').add({ data: group })
      return { code: 0, data: { groupId: addRes._id } }
    }

    // 参团
    case 'joinGroup': {
      const { groupId } = data
      if (!groupId) return { code: -1, msg: '缺少团购ID' }
      const groupRes = await db.collection('wash_groups').doc(groupId).get()
      if (!groupRes.data) return { code: -1, msg: '团购不存在' }
      const g = groupRes.data
      if (g.status !== 0) return { code: -1, msg: '该团购已结束' }
      if (new Date(g.expireTime) < new Date()) {
        await db.collection('wash_groups').doc(groupId).update({ data: { status: 2 } })
        return { code: -1, msg: '团购已过期' }
      }
      // 检查是否已参团
      for (var i = 0; i < g.members.length; i++) {
        if (g.members[i].openid === openid) return { code: -1, msg: '你已参加该团购' }
      }
      if (g.currentCount >= g.targetCount) return { code: -1, msg: '该团已满' }
      const userRes2 = await db.collection('users').where({ openid }).get()
      const uName = (userRes2.data[0] && userRes2.data[0].name) || '匿名'
      const newCount = g.currentCount + 1
      const updateData = {
        currentCount: newCount,
        members: _.push([{ openid, name: uName, joinTime: new Date() }])
      }
      // 达到目标人数，自动成团
      if (newCount >= g.targetCount) updateData.status = 1
      await db.collection('wash_groups').doc(groupId).update({ data: updateData })
      return { code: 0, success: newCount >= g.targetCount }
    }

    // 我的团购
    case 'myGroups': {
      try {
        const res = await db.collection('wash_groups')
          .where({ 'members.openid': openid })
          .orderBy('createTime', 'desc')
          .limit(50)
          .get()
        return { code: 0, data: res.data }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
