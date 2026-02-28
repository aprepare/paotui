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
    console.log('[subscribe] experience send failed:', e.errCode, e.errMsg)
  }
}

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'list': {
      const { keyword, category, page = 1, pageSize = 20 } = data
      let where = {}
      if (category) where.category = category
      try {
        const res = await db.collection('experience_posts')
          .where(where)
          .orderBy('createTime', 'desc')
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .get()
        let list = res.data
        if (keyword) {
          const kw = keyword.toLowerCase()
          list = list.filter(p =>
            (p.title || '').toLowerCase().includes(kw) ||
            (p.content || '').toLowerCase().includes(kw)
          )
        }
        return { code: 0, data: list }
      } catch (e) {
        return { code: 0, data: [] }
      }
    }

    case 'detail': {
      try {
        const post = await db.collection('experience_posts').doc(data.id).get()
        const comments = await db.collection('experience_comments')
          .where({ postId: data.id })
          .orderBy('createTime', 'desc')
          .limit(50)
          .get()
        return { code: 0, data: { ...post.data, commentList: comments.data } }
      } catch (e) {
        return { code: -1, msg: '帖子不存在' }
      }
    }

    case 'create': {
      const { title, content, category, school, admitted, images } = data
      if (!title || !content) return { code: -1, msg: '标题和内容不能为空' }
      const textToCheck = [title, content].filter(Boolean).join(' ')
      const safe = await checkContent(openid, textToCheck, 3)
      if (!safe) return { code: -1, msg: '内容包含违规信息，请修改后重试' }
      const user = await db.collection('users').where({ openid }).get()
      const u = user.data[0] || {}
      try {
        const res = await db.collection('experience_posts').add({
          data: {
            openid,
            nickname: u.name || '匿名',
            avatar: u.avatar || '',
            title,
            content,
            category: category || '',
            school: school || '',
            admitted: admitted || false,
            images: images || [],
            likes: 0,
            comments: 0,
            likedBy: [],
            createTime: db.serverDate()
          }
        })
        return { code: 0, id: res._id }
      } catch (e) {
        return { code: -1, msg: '发布失败: ' + e.message }
      }
    }

    case 'like': {
      try {
        const post = await db.collection('experience_posts').doc(data.postId).get()
        const liked = post.data.likedBy && post.data.likedBy.includes(openid)
        if (liked) {
          await db.collection('experience_posts').doc(data.postId).update({
            data: { likes: _.inc(-1), likedBy: _.pull(openid) }
          })
        } else {
          await db.collection('experience_posts').doc(data.postId).update({
            data: { likes: _.inc(1), likedBy: _.push(openid) }
          })
          if (post.data.openid !== openid) {
            var likeUser = await db.collection('users').where({ openid }).get()
            var likeName = likeUser.data.length > 0 ? likeUser.data[0].name : '有人'
            await db.collection('messages').add({
              data: {
                toOpenid: post.data.openid, fromOpenid: openid, fromName: likeName,
                type: 'like', title: '收到一个赞',
                content: likeName + ' 赞了你的经验帖「' + (post.data.title || '') + '」',
                targetId: data.postId, targetType: 'experience',
                read: false, createTime: db.serverDate()
              }
            })
            // 发送订阅消息
            await sendMsgSubscribe(
              post.data.openid,
              likeName,
              '赞了你的经验帖「' + (post.data.title || '') + '」',
              '/pages/graduate/experience-detail?id=' + data.postId
            )
          }
        }
        return { code: 0, liked: !liked }
      } catch (e) {
        return { code: -1, msg: e.message }
      }
    }

    case 'comment': {
      const { postId, content, replyTo, replyName } = data
      if (!content) return { code: -1, msg: '评论内容不能为空' }
      const commentSafe = await checkContent(openid, content, 2)
      if (!commentSafe) return { code: -1, msg: '评论包含违规内容，请修改' }
      const user = await db.collection('users').where({ openid }).get()
      const u = user.data[0] || {}
      var commentName = u.name || '匿名'
      var commentData = {
        postId, openid,
        nickname: commentName,
        avatar: u.avatar || '',
        content, likes: 0, likedBy: [],
        createTime: db.serverDate()
      }
      if (replyTo) { commentData.replyTo = replyTo; commentData.replyName = replyName || '' }
      try {
        var newCmt = await db.collection('experience_comments').add({ data: commentData })
        await db.collection('experience_posts').doc(postId).update({ data: { comments: _.inc(1) } })
        var commentPost = await db.collection('experience_posts').doc(postId).get()
        if (commentPost.data.openid !== openid) {
          var shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content
          await db.collection('messages').add({
            data: {
              toOpenid: commentPost.data.openid, fromOpenid: openid, fromName: commentName,
              type: 'comment', title: '收到一条评论',
              content: commentName + ' 评论了你的经验帖: ' + shortContent,
              targetId: postId, targetType: 'experience',
              read: false, createTime: db.serverDate()
            }
          })
          // 发送订阅消息
          await sendMsgSubscribe(
            commentPost.data.openid,
            commentName,
            '评论了你的经验帖: ' + shortContent,
            '/pages/graduate/experience-detail?id=' + postId
          )
        }
        return { code: 0, id: newCmt._id }
      } catch (e) {
        return { code: -1, msg: e.message }
      }
    }

    case 'likeComment': {
      try {
        var lc = await db.collection('experience_comments').doc(data.commentId).get()
        var lcLiked = lc.data.likedBy && lc.data.likedBy.indexOf(openid) !== -1
        if (lcLiked) {
          await db.collection('experience_comments').doc(data.commentId).update({
            data: { likes: _.inc(-1), likedBy: _.pull(openid) }
          })
        } else {
          await db.collection('experience_comments').doc(data.commentId).update({
            data: { likes: _.inc(1), likedBy: _.push(openid) }
          })
        }
        return { code: 0, liked: !lcLiked }
      } catch (e) {
        return { code: -1, msg: e.message }
      }
    }

    case 'deleteComment': {
      try {
        var cmt = await db.collection('experience_comments').doc(data.commentId).get()
        if (cmt.data.openid === openid) {
          await db.collection('experience_comments').doc(data.commentId).remove()
          await db.collection('experience_posts').doc(cmt.data.postId).update({ data: { comments: _.inc(-1) } })
          return { code: 0 }
        }
        var ownerPost = await db.collection('experience_posts').doc(cmt.data.postId).get()
        if (ownerPost.data.openid === openid) {
          await db.collection('experience_comments').doc(data.commentId).remove()
          await db.collection('experience_posts').doc(cmt.data.postId).update({ data: { comments: _.inc(-1) } })
          return { code: 0 }
        }
        return { code: -1, msg: '无权删除该评论' }
      } catch (e) {
        return { code: -1, msg: e.message }
      }
    }

    case 'delete': {
      try {
        const post = await db.collection('experience_posts').doc(data.postId).get()
        if (post.data.openid !== openid) return { code: -1, msg: '仅发布者可删除' }
        await db.collection('experience_posts').doc(data.postId).remove()
        const cmts = await db.collection('experience_comments').where({ postId: data.postId }).get()
        for (var i = 0; i < cmts.data.length; i++) {
          await db.collection('experience_comments').doc(cmts.data[i]._id).remove()
        }
        return { code: 0 }
      } catch (e) {
        return { code: -1, msg: e.message }
      }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
