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
        const { type } = data
        const where = { status: 1 }
        if (type) where.type = type
        const res = await db.collection('wash_products')
          .where(where)
          .orderBy('sort', 'asc')
          .get()
        return { code: 0, data: res.data }
      } catch (e) {
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

    // 普通商品下单
    case 'createOrder': {
      if (!openid) return { code: -1, msg: '未登录' }
      const { productId, quantity = 1, phone, userName, address, remark, needDelivery = false } = data
      if (!productId) return { code: -1, msg: '缺少商品ID' }
      if (!phone) return { code: -1, msg: '请填写联系电话' }
      if (needDelivery && (!address || !address.trim())) return { code: -1, msg: '跑腿取送需填写宿舍地址' }

      // 获取商品信息
      let product = null
      const defaultNormalProducts = {
        'normal_1': { name: '运动鞋基础清洗', price: 35, image: '', desc: '适用于日常运动鞋、帆布鞋' },
        'normal_2': { name: '运动鞋深度清洗', price: 55, image: '', desc: '深层去污+除臭+护理' },
        'normal_3': { name: '皮鞋/靴子养护', price: 65, image: '', desc: '皮面清洁+滋养+抛光护理' },
        'normal_4': { name: 'AJ/椰子精洗', price: 79, image: '', desc: '高端球鞋专业清洗' },
        'normal_5': { name: '小白鞋焕新套餐', price: 45, image: '', desc: '去黄增白+防水喷雾' },
        'normal_6': { name: '衣物干洗（件）', price: 25, image: '', desc: '羽绒服/大衣/西装等' },
        'normal_7': { name: '书包清洗', price: 30, image: '', desc: '书包/双肩包深度清洗' }
      }
      if (defaultNormalProducts[productId]) {
        product = defaultNormalProducts[productId]
      } else {
        try {
          const pRes = await db.collection('wash_products').doc(productId).get()
          product = pRes.data
        } catch (e) {
          return { code: -1, msg: '商品不存在' }
        }
      }

      const deliveryFee = needDelivery ? 3 : 0
      const itemPrice = (product.price || 0) * quantity
      const totalPrice = itemPrice + deliveryFee

      const order = {
        openid,
        productId,
        productName: product.name,
        productImage: product.image || '',
        quantity,
        unitPrice: product.price || 0,
        itemPrice,
        deliveryFee,
        totalPrice,
        needDelivery,
        address: needDelivery ? address.trim() : '',
        phone,
        userName: userName || '',
        remark: remark || '',
        status: 0, // 0=待处理 1=处理中 2=已完成 3=已取消
        statusText: '待处理',
        errandTaskId: null,
        createTime: db.serverDate()
      }

      try {
        const addRes = await db.collection('wash_orders').add({ data: order })
        const orderId = addRes._id

        // 如果选了跑腿取送，自动创建跑腿任务
        if (needDelivery) {
          const userRes = await db.collection('users').where({ openid }).get()
          const publisher = userRes.data.length > 0 ? userRes.data[0].name : (userName || '匿名')
          const errandRes = await db.collection('errand_tasks').add({
            data: {
              openid,
              title: '萌马洗护取件',
              desc: '【萌马洗护】' + product.name + ' x' + quantity + '\n请到宿舍取件送至萌马洗护店',
              fromAddr: address.trim(),
              toAddr: '萌马洗护店',
              price: deliveryFee,
              tip: 0,
              phone,
              remark: '洗护订单关联取件，订单号: ' + orderId,
              publisher,
              status: 0,
              statusText: '待接单',
              statusColor: '#DD6B20',
              riderId: null,
              destLat: 0, destLng: 0,
              riderLat: 0, riderLng: 0,
              riderLocationTime: null,
              washOrderId: orderId,
              createTime: db.serverDate()
            }
          })
          // 回写跑腿任务ID到洗护订单
          await db.collection('wash_orders').doc(orderId).update({
            data: { errandTaskId: errandRes._id }
          })
        }

        return { code: 0, data: { orderId } }
      } catch (e) {
        return { code: -1, msg: '下单失败: ' + e.message }
      }
    }

    // 我的洗护订单
    case 'myOrders': {
      if (!openid) return { code: -1, msg: '未登录' }
      try {
        const res = await db.collection('wash_orders').where({ openid })
          .orderBy('createTime', 'desc').limit(50).get()
        return { code: 0, data: res.data || [] }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    // 订单详情
    case 'orderDetail': {
      const { orderId } = data
      if (!orderId) return { code: -1, msg: '缺少orderId' }
      try {
        const res = await db.collection('wash_orders').doc(orderId).get()
        return { code: 0, data: res.data }
      } catch (e) {
        return { code: -1, msg: '订单不存在' }
      }
    }

    // 取消订单
    case 'cancelOrder': {
      if (!openid) return { code: -1, msg: '未登录' }
      const { orderId } = data
      try {
        const orderRes = await db.collection('wash_orders').doc(orderId).get()
        if (orderRes.data.openid !== openid) return { code: -1, msg: '无权操作' }
        if (orderRes.data.status > 0) return { code: -1, msg: '当前状态不可取消' }
        await db.collection('wash_orders').doc(orderId).update({
          data: { status: 3, statusText: '已取消' }
        })
        // 如果有关联跑腿任务也取消
        if (orderRes.data.errandTaskId) {
          try {
            await db.collection('errand_tasks').doc(orderRes.data.errandTaskId).update({
              data: { status: 3, statusText: '已取消', statusColor: '#E53E3E' }
            })
          } catch (e) {}
        }
        return { code: 0 }
      } catch (e) {
        return { code: -1, msg: '取消失败' }
      }
    }

    // 管理员：洗护订单列表
    case 'adminOrderList': {
      const { page = 1, pageSize = 20, status: aoStatus } = data
      const where = {}
      if (aoStatus !== undefined && aoStatus !== -1) where.status = aoStatus
      try {
        const total = await db.collection('wash_orders').where(where).count()
        const res = await db.collection('wash_orders').where(where)
          .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
        return { code: 0, data: res.data || [], total: total.total }
      } catch (e) {
        return { code: 0, data: [], total: 0 }
      }
    }

    // 管理员：更新洗护订单状态
    case 'updateOrderStatus': {
      const { orderId: uoId, status: newStatus } = data
      if (!uoId) return { code: -1, msg: '缺少orderId' }
      const statusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
      try {
        await db.collection('wash_orders').doc(uoId).update({
          data: { status: newStatus, statusText: statusMap[newStatus] || '待处理' }
        })
        return { code: 0 }
      } catch (e) {
        return { code: -1, msg: '更新失败' }
      }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
