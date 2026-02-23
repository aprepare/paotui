const cloud = require('wx-server-sdk')
const crypto = require('crypto')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// ========== 飞鹅云打印机配置 ==========
// 管理员在 page_config 集合中配置 key='printer' 的文档
// { key: 'printer', config: { user: 'xxx', ukey: 'xxx', defaultSn: 'xxx' } }
const FEIE_URL = 'http://api.feieyun.cn/Api/Open/'

async function getPrinterConfig() {
  try {
    const res = await db.collection('page_config').where({ key: 'printer' }).get()
    if (res.data.length > 0) return res.data[0].config || null
  } catch (e) { console.log('getPrinterConfig error', e) }
  return null
}

function feieSign(user, ukey, stime) {
  return crypto.createHash('sha1').update(user + ukey + stime).digest('hex')
}

async function printOrder(order, shop, printerSn) {
  const config = await getPrinterConfig()
  if (!config || !config.user || !config.ukey) {
    console.log('[print] 未配置打印机账号')
    return { success: false, msg: '未配置打印机' }
  }
  const sn = printerSn || shop.printerSn || config.defaultSn
  if (!sn) {
    console.log('[print] 无打印机SN')
    return { success: false, msg: '无打印机SN' }
  }

  const stime = Math.floor(Date.now() / 1000).toString()
  const sig = feieSign(config.user, config.ukey, stime)

  // 构建小票内容（ESC/POS 标签格式）
  let content = '<CB>校园外卖订单</CB><BR>'
  content += '--------------------------------<BR>'
  content += '订单号: ' + order._id.substr(-8) + '<BR>'
  content += '商家: ' + (shop.name || '') + '<BR>'
  content += '--------------------------------<BR>'
  content += '<B>商品明细</B><BR>'
  for (const item of (order.items || [])) {
    const name = (item.name || '').padEnd(10, ' ')
    content += name + ' x' + item.quantity + '  ¥' + (item.price * item.quantity).toFixed(2) + '<BR>'
  }
  content += '--------------------------------<BR>'
  content += '配送费: ¥' + (order.deliveryFee || 0).toFixed(2) + '<BR>'
  content += '<B>合计: ¥' + (order.totalPrice || 0).toFixed(2) + '</B><BR>'
  content += '--------------------------------<BR>'
  content += '收货地址: ' + (order.address || '') + '<BR>'
  content += '联系电话: ' + (order.phone || '') + '<BR>'
  if (order.remark) content += '备注: ' + order.remark + '<BR>'
  content += '下单时间: ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + '<BR>'
  content += '<BR><BR>'

  try {
    const http = require('http')
    const querystring = require('querystring')
    const postData = querystring.stringify({
      user: config.user,
      stime: stime,
      sig: sig,
      apiname: 'Open_printMsg',
      sn: sn,
      content: content,
      times: '1'
    })
    const result = await new Promise((resolve, reject) => {
      const req = http.request(FEIE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(postData) }
      }, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => { try { resolve(JSON.parse(body)) } catch (e) { resolve({ ret: -1, msg: body }) } })
      })
      req.on('error', reject)
      req.write(postData)
      req.end()
    })
    console.log('[print] result:', JSON.stringify(result))
    return { success: result.ret === 0, msg: result.msg || '' }
  } catch (e) {
    console.error('[print] error:', e)
    return { success: false, msg: e.message }
  }
}

exports.main = async (event) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {

    // ========== 商家列表 ==========
    case 'listShops': {
      const { category } = data
      const where = { status: 1 }
      if (category && category !== '全部') where.category = category
      try {
        const res = await db.collection('food_shops').where(where).orderBy('sort', 'asc').get()
        if (res.data && res.data.length > 0) return { code: 0, data: res.data }
      } catch (e) {
        console.log('[food] listShops collection error', e)
      }
      // 集合为空或不存在时返回默认商家
      const defaults = [
        { _id: 'default_shop_1', name: '学苑快餐', logo: '', category: '快餐', phone: '', address: '一食堂二楼', deliveryFee: 2, minOrder: 10, openTime: '07:00', closeTime: '21:00', status: 1, sort: 0 },
        { _id: 'default_shop_2', name: '茶语时光', logo: '', category: '饮品', phone: '', address: '二食堂一楼', deliveryFee: 1, minOrder: 8, openTime: '09:00', closeTime: '22:00', status: 1, sort: 1 },
        { _id: 'default_shop_3', name: '麻辣香锅', logo: '', category: '快餐', phone: '', address: '三食堂', deliveryFee: 3, minOrder: 15, openTime: '10:30', closeTime: '21:30', status: 1, sort: 2 },
        { _id: 'default_shop_4', name: '鸡蛋灌饼·煎饼果子', logo: '', category: '小吃', phone: '', address: '北门小吃街', deliveryFee: 2, minOrder: 5, openTime: '06:30', closeTime: '20:00', status: 1, sort: 3 },
        { _id: 'default_shop_5', name: '兰州拉面', logo: '', category: '面食', phone: '', address: '一食堂一楼', deliveryFee: 2, minOrder: 12, openTime: '07:00', closeTime: '21:00', status: 1, sort: 4 }
      ]
      if (category && category !== '全部') {
        return { code: 0, data: defaults.filter(s => s.category === category) }
      }
      return { code: 0, data: defaults }
    }

    // ========== 商家菜单 ==========
    case 'getShopMenu': {
      const { shopId } = data
      if (!shopId) return { code: -1, msg: '缺少shopId' }

      // 默认商家的默认菜单
      const defaultMenus = {
        'default_shop_1': {
          shop: { _id: 'default_shop_1', name: '学苑快餐', category: '快餐', deliveryFee: 2, minOrder: 10, openTime: '07:00', closeTime: '21:00' },
          items: [
            { _id: 'di_1_1', shopId: 'default_shop_1', name: '红烧肉套餐', price: 15, category: '热销', desc: '红烧肉+米饭+时蔬', status: 1, sort: 0 },
            { _id: 'di_1_2', shopId: 'default_shop_1', name: '番茄炒蛋套餐', price: 12, category: '热销', desc: '番茄炒蛋+米饭+汤', status: 1, sort: 1 },
            { _id: 'di_1_3', shopId: 'default_shop_1', name: '宫保鸡丁套餐', price: 14, category: '主食', desc: '宫保鸡丁+米饭+小菜', status: 1, sort: 2 },
            { _id: 'di_1_4', shopId: 'default_shop_1', name: '鱼香肉丝套餐', price: 14, category: '主食', desc: '鱼香肉丝+米饭+汤', status: 1, sort: 3 },
            { _id: 'di_1_5', shopId: 'default_shop_1', name: '可乐', price: 3, category: '饮品', desc: '', status: 1, sort: 10 },
            { _id: 'di_1_6', shopId: 'default_shop_1', name: '矿泉水', price: 2, category: '饮品', desc: '', status: 1, sort: 11 }
          ]
        },
        'default_shop_2': {
          shop: { _id: 'default_shop_2', name: '茶语时光', category: '饮品', deliveryFee: 1, minOrder: 8, openTime: '09:00', closeTime: '22:00' },
          items: [
            { _id: 'di_2_1', shopId: 'default_shop_2', name: '珍珠奶茶', price: 12, category: '奶茶', desc: '经典珍珠奶茶', status: 1, sort: 0 },
            { _id: 'di_2_2', shopId: 'default_shop_2', name: '芒果冰沙', price: 15, category: '冰沙', desc: '新鲜芒果打制', status: 1, sort: 1 },
            { _id: 'di_2_3', shopId: 'default_shop_2', name: '柠檬绿茶', price: 8, category: '茶饮', desc: '清爽柠檬绿茶', status: 1, sort: 2 },
            { _id: 'di_2_4', shopId: 'default_shop_2', name: '草莓奶昔', price: 14, category: '奶昔', desc: '草莓+牛奶', status: 1, sort: 3 }
          ]
        },
        'default_shop_3': {
          shop: { _id: 'default_shop_3', name: '麻辣香锅', category: '快餐', deliveryFee: 3, minOrder: 15, openTime: '10:30', closeTime: '21:30' },
          items: [
            { _id: 'di_3_1', shopId: 'default_shop_3', name: '麻辣香锅（小份）', price: 18, category: '香锅', desc: '微辣/中辣/特辣', status: 1, sort: 0 },
            { _id: 'di_3_2', shopId: 'default_shop_3', name: '麻辣香锅（大份）', price: 28, category: '香锅', desc: '微辣/中辣/特辣', status: 1, sort: 1 },
            { _id: 'di_3_3', shopId: 'default_shop_3', name: '酸辣粉', price: 12, category: '小吃', desc: '正宗重庆酸辣粉', status: 1, sort: 2 },
            { _id: 'di_3_4', shopId: 'default_shop_3', name: '米饭', price: 2, category: '主食', desc: '', status: 1, sort: 10 }
          ]
        },
        'default_shop_4': {
          shop: { _id: 'default_shop_4', name: '鸡蛋灌饼·煎饼果子', category: '小吃', deliveryFee: 2, minOrder: 5, openTime: '06:30', closeTime: '20:00' },
          items: [
            { _id: 'di_4_1', shopId: 'default_shop_4', name: '鸡蛋灌饼', price: 5, category: '灌饼', desc: '经典鸡蛋灌饼', status: 1, sort: 0 },
            { _id: 'di_4_2', shopId: 'default_shop_4', name: '鸡蛋灌饼+火腿', price: 7, category: '灌饼', desc: '加火腿肠', status: 1, sort: 1 },
            { _id: 'di_4_3', shopId: 'default_shop_4', name: '煎饼果子', price: 6, category: '煎饼', desc: '薄脆+鸡蛋+酱', status: 1, sort: 2 },
            { _id: 'di_4_4', shopId: 'default_shop_4', name: '煎饼果子+火腿', price: 8, category: '煎饼', desc: '加火腿肠', status: 1, sort: 3 },
            { _id: 'di_4_5', shopId: 'default_shop_4', name: '豆浆', price: 3, category: '饮品', desc: '现磨豆浆', status: 1, sort: 10 }
          ]
        },
        'default_shop_5': {
          shop: { _id: 'default_shop_5', name: '兰州拉面', category: '面食', deliveryFee: 2, minOrder: 12, openTime: '07:00', closeTime: '21:00' },
          items: [
            { _id: 'di_5_1', shopId: 'default_shop_5', name: '牛肉拉面', price: 15, category: '拉面', desc: '正宗兰州牛肉面', status: 1, sort: 0 },
            { _id: 'di_5_2', shopId: 'default_shop_5', name: '牛肉刀削面', price: 14, category: '刀削面', desc: '手工刀削', status: 1, sort: 1 },
            { _id: 'di_5_3', shopId: 'default_shop_5', name: '炸酱面', price: 12, category: '拌面', desc: '老北京炸酱面', status: 1, sort: 2 },
            { _id: 'di_5_4', shopId: 'default_shop_5', name: '凉皮', price: 10, category: '小吃', desc: '麻酱凉皮', status: 1, sort: 3 },
            { _id: 'di_5_5', shopId: 'default_shop_5', name: '肉夹馍', price: 8, category: '小吃', desc: '腊汁肉夹馍', status: 1, sort: 4 }
          ]
        }
      }

      if (defaultMenus[shopId]) {
        return { code: 0, data: defaultMenus[shopId] }
      }

      try {
        const shopRes = await db.collection('food_shops').doc(shopId).get()
        const shop = shopRes.data
        const itemsRes = await db.collection('food_items').where({ shopId, status: 1 }).orderBy('sort', 'asc').get()
        return { code: 0, data: { shop, items: itemsRes.data } }
      } catch (e) {
        return { code: -1, msg: '获取菜单失败' }
      }
    }

    // ========== 创建订单（写入 errand_tasks） ==========
    case 'createOrder': {
      if (!openid) return { code: -1, msg: '未登录' }
      const { shopId, items, address, phone, remark, userName } = data
      if (!shopId || !items || !items.length) return { code: -1, msg: '参数不完整' }
      if (!address) return { code: -1, msg: '请填写收货地址' }
      if (!phone) return { code: -1, msg: '请填写联系电话' }

      try {
        // 获取商家信息（支持默认商家）
        let shop = null
        const defaultShopNames = {
          'default_shop_1': { name: '学苑快餐', deliveryFee: 2, minOrder: 10, address: '一食堂二楼' },
          'default_shop_2': { name: '茶语时光', deliveryFee: 1, minOrder: 8, address: '二食堂一楼' },
          'default_shop_3': { name: '麻辣香锅', deliveryFee: 3, minOrder: 15, address: '三食堂' },
          'default_shop_4': { name: '鸡蛋灌饼·煎饼果子', deliveryFee: 2, minOrder: 5, address: '北门小吃街' },
          'default_shop_5': { name: '兰州拉面', deliveryFee: 2, minOrder: 12, address: '一食堂一楼' }
        }
        if (defaultShopNames[shopId]) {
          shop = defaultShopNames[shopId]
        } else {
          const shopRes = await db.collection('food_shops').doc(shopId).get()
          shop = shopRes.data
        }

        // 计算总价
        let itemsTotal = 0
        const orderItems = []
        for (const ci of items) {
          let itemName = ci.name || '未知菜品'
          let itemPrice = ci.price || 0
          let itemImage = ci.image || ''
          if (!ci.itemId.startsWith('di_')) {
            try {
              const itemRes = await db.collection('food_items').doc(ci.itemId).get()
              if (itemRes.data) {
                itemName = itemRes.data.name
                itemPrice = itemRes.data.price
                itemImage = itemRes.data.image || ''
              }
            } catch (e) { /* 使用前端传来的数据 */ }
          }
          orderItems.push({ itemId: ci.itemId, name: itemName, price: itemPrice, image: itemImage, quantity: ci.quantity })
          itemsTotal += itemPrice * ci.quantity
        }

        const deliveryFee = shop.deliveryFee || 0
        const totalPrice = itemsTotal + deliveryFee

        if (shop.minOrder && itemsTotal < shop.minOrder) {
          return { code: -1, msg: '未达到起送价 ¥' + shop.minOrder }
        }

        // 获取用户名
        const userRes = await db.collection('users').where({ openid }).get()
        const publisher = userRes.data.length > 0 ? userRes.data[0].name : (userName || '匿名')

        // 构建商品明细文本
        const itemLines = orderItems.map(i => i.name + ' x' + i.quantity + ' ¥' + (i.price * i.quantity).toFixed(1))
        const desc = '【' + shop.name + '】\n' + itemLines.join('\n') +
          '\n配送费: ¥' + deliveryFee.toFixed(1) +
          '\n合计: ¥' + totalPrice.toFixed(2) +
          (remark ? '\n备注: ' + remark : '')

        // 写入 errand_tasks 集合
        const errandTask = {
          openid,
          type: 'food',
          title: '外卖代取: ' + shop.name,
          desc,
          fromAddr: shop.address || shop.name,
          toAddr: address,
          price: deliveryFee,
          tip: 0,
          phone,
          publisher,
          status: 0,
          statusText: '待接单',
          statusColor: '#DD6B20',
          riderId: null,
          destLat: 0,
          destLng: 0,
          riderLat: 0,
          riderLng: 0,
          riderLocationTime: null,
          // 外卖专属字段
          foodInfo: {
            shopId,
            shopName: shop.name,
            items: orderItems,
            itemsTotal,
            deliveryFee,
            totalPrice,
            userName: userName || '',
            remark: remark || ''
          },
          createTime: db.serverDate()
        }

        const addRes = await db.collection('errand_tasks').add({ data: errandTask })
        errandTask._id = addRes._id

        // 异步打印小票（不阻塞下单）
        const printData = {
          _id: addRes._id,
          items: orderItems,
          deliveryFee,
          totalPrice,
          address,
          phone,
          remark: remark || ''
        }
        printOrder(printData, shop).catch(e => console.error('[print async]', e))

        return { code: 0, data: { orderId: addRes._id } }
      } catch (e) {
        console.error('createOrder error', e)
        return { code: -1, msg: '下单失败: ' + e.message }
      }
    }

    // ========== 我的外卖订单（从 errand_tasks 查询） ==========
    case 'myOrders': {
      if (!openid) return { code: -1, msg: '未登录' }
      const { page = 1, pageSize = 20 } = data
      try {
        const where = { openid, type: 'food' }
        const total = await db.collection('errand_tasks').where(where).count()
        const res = await db.collection('errand_tasks').where(where)
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize).limit(pageSize).get()
        // 转换为前端期望的格式
        const orders = (res.data || []).map(t => ({
          _id: t._id,
          shopName: t.foodInfo ? t.foodInfo.shopName : t.title.replace('外卖代取: ', ''),
          items: t.foodInfo ? t.foodInfo.items : [],
          totalPrice: t.foodInfo ? t.foodInfo.totalPrice : t.price,
          status: t.status,
          statusText: t.statusText,
          createTime: t.createTime
        }))
        return { code: 0, data: orders, total: total.total }
      } catch (e) {
        return { code: 0, data: [], total: 0 }
      }
    }

    // ========== 订单详情 ==========
    case 'orderDetail': {
      const { orderId } = data
      if (!orderId) return { code: -1, msg: '缺少orderId' }
      try {
        const res = await db.collection('errand_tasks').doc(orderId).get()
        return { code: 0, data: res.data }
      } catch (e) {
        return { code: -1, msg: '订单不存在' }
      }
    }

    // ========== 取消订单 ==========
    case 'cancelOrder': {
      if (!openid) return { code: -1, msg: '未登录' }
      const { orderId } = data
      try {
        const orderRes = await db.collection('errand_tasks').doc(orderId).get()
        if (orderRes.data.openid !== openid) return { code: -1, msg: '无权操作' }
        if (orderRes.data.status > 1) return { code: -1, msg: '当前状态不可取消' }
        await db.collection('errand_tasks').doc(orderId).update({
          data: { status: 3, statusText: '已取消', statusColor: '#E53E3E' }
        })
        return { code: 0 }
      } catch (e) {
        return { code: -1, msg: '取消失败' }
      }
    }

    // ========== 管理员：商家管理 ==========
    case 'adminShopList': {
      try {
        const res = await db.collection('food_shops').orderBy('sort', 'asc').get()
        return { code: 0, data: res.data }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    case 'addShop': {
      const { name, logo, category, phone: shopPhone, address: shopAddr, deliveryFee: df, minOrder: mo, printerSn, openTime, closeTime } = data
      if (!name) return { code: -1, msg: '商家名称不能为空' }
      await db.collection('food_shops').add({
        data: {
          name, logo: logo || '', category: category || '快餐',
          phone: shopPhone || '', address: shopAddr || '',
          deliveryFee: parseFloat(df) || 0, minOrder: parseFloat(mo) || 0,
          printerSn: printerSn || '', openTime: openTime || '08:00', closeTime: closeTime || '22:00',
          status: 1, sort: 0, createTime: db.serverDate()
        }
      })
      return { code: 0 }
    }

    case 'updateShop': {
      const { shopId: usId, ...shopUpdate } = data
      if (!usId) return { code: -1, msg: '缺少shopId' }
      if (shopUpdate.deliveryFee !== undefined) shopUpdate.deliveryFee = parseFloat(shopUpdate.deliveryFee) || 0
      if (shopUpdate.minOrder !== undefined) shopUpdate.minOrder = parseFloat(shopUpdate.minOrder) || 0
      await db.collection('food_shops').doc(usId).update({ data: shopUpdate })
      return { code: 0 }
    }

    case 'deleteShop': {
      const { shopId: dsId } = data
      if (!dsId) return { code: -1, msg: '缺少shopId' }
      await db.collection('food_shops').doc(dsId).remove()
      // 同时删除该商家的菜品
      try {
        const items = await db.collection('food_items').where({ shopId: dsId }).get()
        for (const item of items.data) {
          await db.collection('food_items').doc(item._id).remove()
        }
      } catch (e) {}
      return { code: 0 }
    }

    // ========== 管理员：菜品管理 ==========
    case 'adminItemList': {
      const { shopId: aiShopId } = data
      if (!aiShopId) return { code: -1, msg: '缺少shopId' }
      try {
        const res = await db.collection('food_items').where({ shopId: aiShopId }).orderBy('sort', 'asc').get()
        return { code: 0, data: res.data }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    case 'addItem': {
      const { shopId: addShopId, name: itemName, image: itemImg, price: itemPrice, category: itemCat, desc: itemDesc } = data
      if (!addShopId || !itemName) return { code: -1, msg: '参数不完整' }
      await db.collection('food_items').add({
        data: {
          shopId: addShopId, name: itemName, image: itemImg || '',
          price: parseFloat(itemPrice) || 0, category: itemCat || '热销',
          desc: itemDesc || '', status: 1, sort: 0, sales: 0,
          createTime: db.serverDate()
        }
      })
      return { code: 0 }
    }

    case 'updateItem': {
      const { itemId: uiId, ...itemUpdate } = data
      if (!uiId) return { code: -1, msg: '缺少itemId' }
      if (itemUpdate.price !== undefined) itemUpdate.price = parseFloat(itemUpdate.price) || 0
      await db.collection('food_items').doc(uiId).update({ data: itemUpdate })
      return { code: 0 }
    }

    case 'deleteItem': {
      const { itemId: diId } = data
      if (!diId) return { code: -1, msg: '缺少itemId' }
      await db.collection('food_items').doc(diId).remove()
      return { code: 0 }
    }

    // ========== 管理员：外卖订单管理（从 errand_tasks 查询） ==========
    case 'adminOrderList': {
      const { page = 1, pageSize = 20, status: aoStatus } = data
      const where = { type: 'food' }
      if (aoStatus !== undefined && aoStatus !== -1) where.status = aoStatus
      try {
        const total = await db.collection('errand_tasks').where(where).count()
        const res = await db.collection('errand_tasks').where(where)
          .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
        // 转换为前端期望的格式
        const orders = (res.data || []).map(t => ({
          _id: t._id,
          shopName: t.foodInfo ? t.foodInfo.shopName : t.title.replace('外卖代取: ', ''),
          items: t.foodInfo ? t.foodInfo.items : [],
          totalPrice: t.foodInfo ? t.foodInfo.totalPrice : t.price,
          address: t.toAddr,
          status: t.status,
          statusText: t.statusText,
          createTime: t.createTime
        }))
        return { code: 0, data: orders, total: total.total }
      } catch (e) {
        return { code: 0, data: [], total: 0 }
      }
    }

    case 'updateOrderStatus': {
      const { orderId: uoId, status: newStatus, statusText: newText } = data
      if (!uoId) return { code: -1, msg: '缺少orderId' }
      const statusMap = {
        0: { text: '待接单', color: '#DD6B20' },
        1: { text: '进行中', color: '#38A169' },
        2: { text: '已完成', color: '#A0AEC0' },
        3: { text: '已取消', color: '#E53E3E' }
      }
      const s = statusMap[newStatus] || statusMap[0]
      await db.collection('errand_tasks').doc(uoId).update({
        data: { status: newStatus, statusText: newText || s.text, statusColor: s.color }
      })
      return { code: 0 }
    }

    // ========== 打印机配置 ==========
    case 'getPrinterConfig': {
      const pc = await getPrinterConfig()
      return { code: 0, data: pc || {} }
    }

    case 'savePrinterConfig': {
      const { user: pUser, ukey: pUkey, defaultSn: pSn } = data
      const pConfig = { user: pUser || '', ukey: pUkey || '', defaultSn: pSn || '' }
      const existing = await db.collection('page_config').where({ key: 'printer' }).get()
      if (existing.data.length === 0) {
        await db.collection('page_config').add({ data: { key: 'printer', config: pConfig, updateTime: db.serverDate() } })
      } else {
        await db.collection('page_config').where({ key: 'printer' }).update({ data: { config: pConfig, updateTime: db.serverDate() } })
      }
      return { code: 0 }
    }

    // 手动重打
    case 'reprintOrder': {
      const { orderId: rpId } = data
      if (!rpId) return { code: -1, msg: '缺少orderId' }
      try {
        const taskRes = await db.collection('errand_tasks').doc(rpId).get()
        const task = taskRes.data
        const fi = task.foodInfo || {}
        const printData = {
          _id: task._id,
          items: fi.items || [],
          deliveryFee: fi.deliveryFee || 0,
          totalPrice: fi.totalPrice || 0,
          address: task.toAddr || '',
          phone: task.phone || '',
          remark: fi.remark || ''
        }
        const shopData = { name: fi.shopName || '', printerSn: '' }
        // 尝试获取商家打印机SN
        if (fi.shopId && !fi.shopId.startsWith('default_')) {
          try {
            const shopRes = await db.collection('food_shops').doc(fi.shopId).get()
            shopData.printerSn = shopRes.data.printerSn || ''
          } catch (e) {}
        }
        const result = await printOrder(printData, shopData)
        return { code: 0, data: result }
      } catch (e) {
        return { code: -1, msg: '打印失败: ' + e.message }
      }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
