const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

const DEFAULT_ADMIN_PHONES = ['19922240902']

async function checkAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).get()
  if (userRes.data.length === 0) return false
  const phone = userRes.data[0].phone || ''
  if (DEFAULT_ADMIN_PHONES.indexOf(phone) !== -1) return true
  const adminRes = await db.collection('admins').where({ phone, status: 'active' }).get()
  return adminRes.data.length > 0
}

exports.main = async (event) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'checkAdmin': {
      return { code: 0, isAdmin: await checkAdmin(openid) }
    }

    // ========== 仪表盘 ==========
    case 'dashboard': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const [uc, ec, erc, cc, fc, mc, tc, msgc, rc] = await Promise.all([
        db.collection('users').count(),
        db.collection('express_orders').count(),
        db.collection('errand_tasks').count(),
        db.collection('carpool').count(),
        db.collection('forum_posts').count(),
        db.collection('market_goods').count(),
        db.collection('team_activities').count(),
        db.collection('messages').count(),
        db.collection('users').where({ isRider: true }).count()
      ])
      const [pe, per] = await Promise.all([
        db.collection('express_orders').where({ status: 0 }).count(),
        db.collection('errand_tasks').where({ status: 0 }).count()
      ])
      // 获取可编辑的统计数据
      const statsRes = await db.collection('stats').where({ key: 'global' }).get()
      const statsData = statsRes.data.length > 0 ? statsRes.data[0] : { todayDelivered: 0, totalOrders: 0 }
      return {
        code: 0, data: {
          userCount: uc.total, expressCount: ec.total, errandCount: erc.total,
          carpoolCount: cc.total, forumCount: fc.total, marketCount: mc.total,
          teamCount: tc.total, msgCount: msgc.total, riderCount: rc.total,
          pendingExpress: pe.total, pendingErrand: per.total,
          todayDelivered: statsData.todayDelivered || 0,
          totalOrders: statsData.totalOrders || 0
        }
      }
    }

    // 修改首页统计数据
    case 'updateStats': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { todayDelivered, totalOrders } = data
      const upd = {}
      if (todayDelivered !== undefined) upd.todayDelivered = Number(todayDelivered)
      if (totalOrders !== undefined) upd.totalOrders = Number(totalOrders)
      const existing = await db.collection('stats').where({ key: 'global' }).get()
      if (existing.data.length === 0) {
        await db.collection('stats').add({ data: { key: 'global', ...upd } })
      } else {
        await db.collection('stats').where({ key: 'global' }).update({ data: upd })
      }
      return { code: 0 }
    }

    // ========== 用户管理 ==========
    case 'userList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { page = 1, pageSize = 20, keyword } = data
      const total = await db.collection('users').count()
      const res = await db.collection('users')
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize).limit(pageSize).get()
      let list = res.data
      if (keyword) {
        const kw = keyword.toLowerCase()
        list = list.filter(u => (u.name || '').toLowerCase().includes(kw) || (u.phone || '').includes(kw))
      }
      return { code: 0, data: list, total: total.total }
    }

    case 'userDetail': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { userId } = data
      const u = await db.collection('users').doc(userId).get()
      // 统计该用户的订单数
      const ep = await db.collection('express_orders').where({ openid: u.data.openid }).count()
      const erp = await db.collection('errand_tasks').where({ openid: u.data.openid }).count()
      const fp = await db.collection('forum_posts').where({ openid: u.data.openid }).count()
      return { code: 0, data: { ...u.data, expressCount: ep.total, errandCount: erp.total, forumCount: fp.total } }
    }

    case 'toggleUserStatus': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { userId, disabled } = data
      await db.collection('users').doc(userId).update({ data: { disabled: !!disabled } })
      return { code: 0 }
    }

    case 'setUserAdmin': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { userId } = data
      const u = await db.collection('users').doc(userId).get()
      if (!u.data.phone) return { code: -1, msg: '该用户未绑定手机号' }
      if (DEFAULT_ADMIN_PHONES.indexOf(u.data.phone) !== -1) return { code: -1, msg: '已是默认管理员' }
      const ex = await db.collection('admins').where({ phone: u.data.phone }).get()
      if (ex.data.length > 0) return { code: -1, msg: '已是管理员' }
      await db.collection('admins').add({ data: { phone: u.data.phone, name: u.data.name || '', status: 'active', addedBy: openid, createTime: db.serverDate() } })
      return { code: 0 }
    }

    // ========== 快递订单 ==========
    case 'expressList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { page = 1, pageSize = 20, status } = data
      const where = {}
      if (status !== undefined && status !== -1) where.status = status
      const total = await db.collection('express_orders').where(where).count()
      const res = await db.collection('express_orders').where(where)
        .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'cancelExpress': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('express_orders').doc(data.orderId).update({
        data: { status: 4, statusText: '已取消', statusColor: '#E53E3E' }
      })
      return { code: 0 }
    }

    // ========== 跑腿任务 ==========
    case 'errandList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { page = 1, pageSize = 20, status } = data
      const where = {}
      if (status !== undefined && status !== -1) where.status = status
      const total = await db.collection('errand_tasks').where(where).count()
      const res = await db.collection('errand_tasks').where(where)
        .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'cancelErrand': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('errand_tasks').doc(data.taskId).update({
        data: { status: 3, statusText: '已取消', statusColor: '#E53E3E' }
      })
      return { code: 0 }
    }

    // ========== 帖子管理 ==========
    case 'forumList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { page = 1, pageSize = 20 } = data
      const total = await db.collection('forum_posts').count()
      const res = await db.collection('forum_posts')
        .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'deletePost': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('forum_posts').doc(data.postId).remove()
      const cmts = await db.collection('forum_comments').where({ postId: data.postId }).get()
      for (var i = 0; i < cmts.data.length; i++) {
        await db.collection('forum_comments').doc(cmts.data[i]._id).remove()
      }
      return { code: 0 }
    }

    // ========== 商品管理 ==========
    case 'marketList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { page = 1, pageSize = 20 } = data
      const total = await db.collection('market_goods').count()
      const res = await db.collection('market_goods')
        .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'deleteGoods': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('market_goods').doc(data.goodsId).remove()
      return { code: 0 }
    }

    // ========== 组队管理 ==========
    case 'teamList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { page = 1, pageSize = 20 } = data
      const total = await db.collection('team_activities').count()
      const res = await db.collection('team_activities')
        .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'deleteTeam': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('team_activities').doc(data.activityId).remove()
      await db.collection('team_members').where({ activityId: data.activityId }).remove().catch(() => {})
      return { code: 0 }
    }

    // ========== 拼车管理 ==========
    case 'carpoolList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { page = 1, pageSize = 20 } = data
      const total = await db.collection('carpool').count()
      const res = await db.collection('carpool')
        .orderBy('createTime', 'desc').skip((page - 1) * pageSize).limit(pageSize).get()
      return { code: 0, data: res.data, total: total.total }
    }

    case 'deleteCarpool': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('carpool').doc(data.carpoolId).remove()
      return { code: 0 }
    }

    // ========== 轮播图 / 首页配置 ==========
    case 'getPageConfig': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const res = await db.collection('page_config').where({ key: 'home' }).get()
      if (res.data.length === 0) {
        // 返回默认配置
        return { code: 0, data: {
          banners: [
            { emoji: '📦', title: '快递代取 极速送达', desc: '下单后最快30分钟送到宿舍', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
            { emoji: '🏃', title: '万能跑腿 有求必应', desc: '买饭、打印、取件 一键搞定', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
            { emoji: '🎉', title: '新用户首单立减', desc: '注册即享优惠 快来体验吧', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
          ],
          actions: [
            { emoji: '📦', text: '代取快递', link: '/pages/express/create', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
            { emoji: '🏃', text: '万能跑腿', link: '/pages/errand/create', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
            { emoji: '🏅', text: '骑手注册', link: '/pages/express/rider-register', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
          ]
        }}
      }
      return { code: 0, data: res.data[0].config || {} }
    }

    case 'savePageConfig': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { banners, actions } = data
      const config = {}
      if (banners) config.banners = banners
      if (actions) config.actions = actions
      const existing = await db.collection('page_config').where({ key: 'home' }).get()
      if (existing.data.length === 0) {
        await db.collection('page_config').add({ data: { key: 'home', config, updateTime: db.serverDate() } })
      } else {
        await db.collection('page_config').where({ key: 'home' }).update({ data: { config, updateTime: db.serverDate() } })
      }
      return { code: 0 }
    }

    // ========== 福利页服务配置 ==========
    case 'getWelfareConfig': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const wcRes = await db.collection('page_config').where({ key: 'welfare' }).get()
      if (wcRes.data.length === 0) {
        return { code: 0, data: { services: [], banners: [] } }
      }
      return { code: 0, data: wcRes.data[0].config || {} }
    }

    case 'saveWelfareConfig': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { services: wServices, banners: wBanners } = data
      const wConfig = {}
      if (wServices) wConfig.services = wServices
      if (wBanners) wConfig.banners = wBanners
      const wExisting = await db.collection('page_config').where({ key: 'welfare' }).get()
      if (wExisting.data.length === 0) {
        await db.collection('page_config').add({ data: { key: 'welfare', config: wConfig, updateTime: db.serverDate() } })
      } else {
        await db.collection('page_config').where({ key: 'welfare' }).update({ data: { config: wConfig, updateTime: db.serverDate() } })
      }
      return { code: 0 }
    }

    // ========== TabBar图标配置 ==========
    case 'getTabBarConfig': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const tbRes = await db.collection('page_config').where({ key: 'tabbar' }).get()
      if (tbRes.data.length === 0) {
        return { code: 0, data: { tabs: [] } }
      }
      return { code: 0, data: tbRes.data[0].config || {} }
    }

    case 'saveTabBarConfig': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { tabs: tbTabs } = data
      const tbConfig = { tabs: tbTabs || [] }
      const tbExisting = await db.collection('page_config').where({ key: 'tabbar' }).get()
      if (tbExisting.data.length === 0) {
        await db.collection('page_config').add({ data: { key: 'tabbar', config: tbConfig, updateTime: db.serverDate() } })
      } else {
        await db.collection('page_config').where({ key: 'tabbar' }).update({ data: { config: tbConfig, updateTime: db.serverDate() } })
      }
      return { code: 0 }
    }

    // ========== 公共接口（无需管理员权限） ==========
    case 'getWelfarePublic': {
      const wpRes = await db.collection('page_config').where({ key: 'welfare' }).get()
      if (wpRes.data.length === 0) return { code: 0, data: null }
      return { code: 0, data: wpRes.data[0].config || null }
    }

    case 'getTabBarPublic': {
      const tpRes = await db.collection('page_config').where({ key: 'tabbar' }).get()
      if (tpRes.data.length === 0) return { code: 0, data: null }
      return { code: 0, data: tpRes.data[0].config || null }
    }

    // ========== 管理员管理 ==========
    case 'adminList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const admins = await db.collection('admins').where({ status: 'active' }).get()
      var list = DEFAULT_ADMIN_PHONES.map(p => ({ phone: p, isDefault: true, status: 'active' }))
      admins.data.forEach(a => {
        if (DEFAULT_ADMIN_PHONES.indexOf(a.phone) === -1) {
          list.push({ _id: a._id, phone: a.phone, name: a.name || '', isDefault: false, status: a.status, createTime: a.createTime })
        }
      })
      return { code: 0, data: list }
    }

    case 'addAdmin': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { phone, name } = data
      if (!phone || !/^1[3-9]\d{9}$/.test(phone)) return { code: -1, msg: '手机号格式不正确' }
      if (DEFAULT_ADMIN_PHONES.indexOf(phone) !== -1) return { code: -1, msg: '已是默认管理员' }
      const ex = await db.collection('admins').where({ phone }).get()
      if (ex.data.length > 0) return { code: -1, msg: '已是管理员' }
      await db.collection('admins').add({ data: { phone, name: name || '', status: 'active', addedBy: openid, createTime: db.serverDate() } })
      return { code: 0 }
    }

    case 'removeAdmin': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('admins').doc(data.adminId).remove()
      return { code: 0 }
    }

    // ========== 系统公告 ==========
    case 'sendNotice': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      const { title, content } = data
      if (!title || !content) return { code: -1, msg: '标题和内容不能为空' }
      const allUsers = await db.collection('users').limit(500).get()
      var count = 0
      for (var j = 0; j < allUsers.data.length; j++) {
        if (allUsers.data[j].openid === openid) continue
        await db.collection('messages').add({
          data: { toOpenid: allUsers.data[j].openid, fromOpenid: openid, fromName: '系统管理员', type: 'system', title, content, targetId: '', targetType: 'system', read: false, createTime: db.serverDate() }
        })
        count++
      }
      return { code: 0, msg: '已发送给 ' + count + ' 位用户' }
    }

    // ========== 提现审核 ==========
    case 'withdrawList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      var { page = 1, pageSize = 20, status: wStatus } = data
      var wQuery = {}
      if (wStatus !== undefined && wStatus !== '') wQuery.status = parseInt(wStatus)
      var wTotal = await db.collection('wallet_withdrawals').where(wQuery).count()
      var wList = await db.collection('wallet_withdrawals').where(wQuery)
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize).limit(pageSize).get()
      return { code: 0, data: wList.data, total: wTotal.total }
    }

    case 'approveWithdraw': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('wallet_withdrawals').doc(data.withdrawId).update({
        data: { status: 1, approveTime: db.serverDate(), approvedBy: openid }
      })
      return { code: 0 }
    }

    case 'rejectWithdraw': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('wallet_withdrawals').doc(data.withdrawId).update({
        data: { status: 2, rejectTime: db.serverDate(), rejectReason: data.reason || '', rejectedBy: openid }
      })
      return { code: 0 }
    }

    // ========== 洗鞋团购商品管理 ==========
    case 'washProductList': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      var wpList = await db.collection('wash_products').orderBy('sort', 'asc').get()
      return { code: 0, data: wpList.data }
    }

    case 'addWashProduct': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      var { name: wpName, desc: wpDesc, image: wpImage, originalPrice: wpOp, groupPrice: wpGp, groupSize: wpGs } = data
      if (!wpName) return { code: -1, msg: '商品名称不能为空' }
      await db.collection('wash_products').add({
        data: {
          name: wpName, desc: wpDesc || '', image: wpImage || '',
          originalPrice: parseFloat(wpOp) || 0, groupPrice: parseFloat(wpGp) || 0,
          groupSize: parseInt(wpGs) || 3, status: 1, sort: 0,
          createTime: db.serverDate()
        }
      })
      return { code: 0 }
    }

    case 'updateWashProduct': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      var { productId: wpId, ...wpUpdate } = data
      if (!wpId) return { code: -1, msg: '缺少商品ID' }
      if (wpUpdate.originalPrice !== undefined) wpUpdate.originalPrice = parseFloat(wpUpdate.originalPrice) || 0
      if (wpUpdate.groupPrice !== undefined) wpUpdate.groupPrice = parseFloat(wpUpdate.groupPrice) || 0
      if (wpUpdate.groupSize !== undefined) wpUpdate.groupSize = parseInt(wpUpdate.groupSize) || 3
      await db.collection('wash_products').doc(wpId).update({ data: wpUpdate })
      return { code: 0 }
    }

    case 'deleteWashProduct': {
      if (!await checkAdmin(openid)) return { code: -1, msg: '无权限' }
      await db.collection('wash_products').doc(data.productId).remove()
      return { code: 0 }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
