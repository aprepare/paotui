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

// 留言提醒模板ID
var MSG_TMPL = 'Xx4pl5WbjptPWfN3zS7Trz2yQV6eukLMDgsj4uXNOH4'

// 发送留言提醒订阅消息
async function sendMsgSubscribe(toOpenid, userName, remark, page) {
  try {
    await cloud.openapi.subscribeMessage.send({
      touser: toOpenid,
      templateId: MSG_TMPL,
      data: {
        thing1: { value: userName.length > 20 ? userName.substring(0, 17) + '...' : userName },
        thing2: { value: remark.length > 20 ? remark.substring(0, 17) + '...' : remark }
      },
      page: page || '',
      miniprogramState: 'formal'
    })
  } catch (e) {
    console.log('[subscribe] tutor send failed:', e.errCode, e.errMsg)
  }
}

exports.main = async (event) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    // 家教列表
    case 'listTutors': {
      try {
        const { subject } = data
        const where = { type: 'tutor', status: 1 }
        if (subject && subject !== '全部') where.subject = subject
        const res = await db.collection('tutor_posts')
          .where(where)
          .orderBy('createTime', 'desc')
          .limit(50)
          .get()
        return { code: 0, data: res.data }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    // 需求列表
    case 'listDemands': {
      try {
        const { subject } = data
        const where = { type: 'demand', status: 1 }
        if (subject && subject !== '全部') where.subject = subject
        const res = await db.collection('tutor_posts')
          .where(where)
          .orderBy('createTime', 'desc')
          .limit(50)
          .get()
        // 隐藏家长信息，防止前端直接获取
        const list = (res.data || []).map(function(item) {
          delete item.parentName
          delete item.idCard
          delete item.openid
          return item
        })
        return { code: 0, data: list }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    // 发布家教信息
    case 'createTutor': {
      const { name, school, major, subjects, mode, area, price, experience, desc, studentCard, phone, wechat, qq } = data
      if (!name || !subjects || !price) return { code: -1, msg: '请填写必要信息' }
      if (!phone && !wechat && !qq) return { code: -1, msg: '请至少填写一种联系方式' }
      const textToCheck = [name, desc, experience].filter(Boolean).join(' ')
      const safe = await checkContent(openid, textToCheck, 2)
      if (!safe) return { code: -1, msg: '内容包含违规信息，请修改后重试' }
      const userRes = await db.collection('users').where({ openid }).get()
      const avatar = (userRes.data[0] && userRes.data[0].avatar) || ''
      await db.collection('tutor_posts').add({
        data: {
          type: 'tutor', openid, status: 1,
          name, school: school || '', major: major || '',
          subject: (subjects || [])[0] || '',
          subjects: subjects || [],
          mode: mode || '线上+线下', area: area || '',
          price: parseFloat(price) || 0,
          experience: experience || '', desc: desc || '',
          avatar, verified: false,
          studentCard: studentCard || '',
          phone: phone || '', wechat: wechat || '', qq: qq || '',
          createTime: db.serverDate()
        }
      })
      return { code: 0 }
    }

    // 发布家长需求
    case 'createDemand': {
      const { subject, title, desc: dDesc, grade, location, schedule, budget, contactName, idCard, phone, wechat, qq } = data
      if (!subject || !title || !budget) return { code: -1, msg: '请填写必要信息' }
      if (!phone && !wechat && !qq) return { code: -1, msg: '请至少填写一种联系方式' }
      const textToCheck = [title, dDesc].filter(Boolean).join(' ')
      const safe = await checkContent(openid, textToCheck, 2)
      if (!safe) return { code: -1, msg: '内容包含违规信息，请修改后重试' }
      const uRes = await db.collection('users').where({ openid }).get()
      const uName = contactName || (uRes.data[0] && uRes.data[0].name) || '匿名'
      await db.collection('tutor_posts').add({
        data: {
          type: 'demand', openid, status: 1,
          subject, title, desc: dDesc || '',
          grade: grade || '', location: location || '',
          schedule: schedule || '',
          budget: parseFloat(budget) || 0,
          parentName: uName,
          idCard: idCard || '',
          phone: phone || '', wechat: wechat || '', qq: qq || '',
          createTime: db.serverDate()
        }
      })
      return { code: 0 }
    }

    // 应聘需求
    case 'apply': {
      const { postId } = data
      if (!postId) return { code: -1, msg: '缺少参数' }
      const userRes2 = await db.collection('users').where({ openid }).get()
      const applyUser = userRes2.data[0] || {}
      const applyName = applyUser.name || '匿名'
      const applyPhone = applyUser.phone || ''
      // 获取需求信息发消息给发布者
      const post = await db.collection('tutor_posts').doc(postId).get()
      if (!post.data) return { code: -1, msg: '信息不存在' }
      var contactInfo = applyName
      if (applyPhone) contactInfo += '（手机：' + applyPhone + '）'
      try {
        await db.collection('messages').add({
          data: {
            toOpenid: post.data.openid,
            fromOpenid: openid,
            fromName: applyName,
            fromPhone: applyPhone,
            type: 'tutor_apply',
            title: '有人应聘你的家教需求',
            content: contactInfo + ' 应聘了「' + (post.data.title || '') + '」',
            targetId: postId, targetType: 'tutor',
            read: false, createTime: db.serverDate()
          }
        })
        // 发送订阅消息
        await sendMsgSubscribe(
          post.data.openid,
          applyName,
          '应聘了你的家教需求「' + (post.data.title || '') + '」',
          '/pages/message/index'
        )
      } catch (e) {}
      return { code: 0 }
    }

    // 联系家教
    case 'contact': {
      const { postId } = data
      if (!postId) return { code: -1, msg: '缺少参数' }
      const userRes3 = await db.collection('users').where({ openid }).get()
      const contactUser = userRes3.data[0] || {}
      const contactName2 = contactUser.name || '匿名'
      const contactPhone2 = contactUser.phone || ''
      const tPost = await db.collection('tutor_posts').doc(postId).get()
      if (!tPost.data) return { code: -1, msg: '信息不存在' }
      var contactInfo2 = contactName2
      if (contactPhone2) contactInfo2 += '（手机：' + contactPhone2 + '）'
      try {
        await db.collection('messages').add({
          data: {
            toOpenid: tPost.data.openid,
            fromOpenid: openid,
            fromName: contactName2,
            fromPhone: contactPhone2,
            type: 'tutor_contact',
            title: '有人想联系你',
            content: contactInfo2 + ' 想联系你关于家教信息',
            targetId: postId, targetType: 'tutor',
            read: false, createTime: db.serverDate()
          }
        })
        // 发送订阅消息
        await sendMsgSubscribe(
          tPost.data.openid,
          contactName2,
          '想联系你关于家教信息',
          '/pages/message/index'
        )
      } catch (e) {}
      return { code: 0 }
    }

    // 我的发布（家教+需求）
    case 'myPosts': {
      try {
        const res = await db.collection('tutor_posts')
          .where({ openid })
          .orderBy('createTime', 'desc')
          .limit(50)
          .get()
        // 查每个帖子的应聘者/联系者消息
        var posts = res.data || []
        for (var i = 0; i < posts.length; i++) {
          try {
            var msgs = await db.collection('messages')
              .where({
                targetId: posts[i]._id,
                targetType: 'tutor'
              })
              .orderBy('createTime', 'desc')
              .limit(20)
              .get()
            posts[i].applicants = (msgs.data || []).map(function(m) {
              return {
                name: m.fromName || '匿名',
                phone: m.fromPhone || '',
                type: m.type,
                time: m.createTime
              }
            })
          } catch (e) {
            posts[i].applicants = []
          }
        }
        return { code: 0, data: posts }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    // 获取单条详情
    case 'getDetail': {
      const { postId } = data
      if (!postId) return { code: -1, msg: '缺少参数' }
      try {
        const res = await db.collection('tutor_posts').doc(postId).get()
        return { code: 0, data: res.data || null }
      } catch (e) {
        return { code: -1, msg: '信息不存在' }
      }
    }

    // 删除自己的发布
    case 'delete': {
      const { postId } = data
      if (!postId) return { code: -1, msg: '缺少参数' }
      const dPost = await db.collection('tutor_posts').doc(postId).get()
      if (!dPost.data || dPost.data.openid !== openid) return { code: -1, msg: '无权限' }
      await db.collection('tutor_posts').doc(postId).remove()
      return { code: 0 }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
