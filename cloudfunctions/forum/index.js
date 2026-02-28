const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// 内容安全检查
async function checkContent(openid, text, scene) {
  if (!text || !text.trim()) return true
  try {
    const res = await cloud.openapi.security.msgSecCheck({ openid, scene: scene || 3, version: 2, content: text })
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
    console.log('[subscribe] forum send failed:', e.errCode, e.errMsg)
  }
}

exports.main = async (event, context) => {
  const { action, data = {} } = event
  const openid = cloud.getWXContext().OPENID

  switch (action) {
    case 'list': {
      const { keyword, page = 1, pageSize = 10 } = data
      const res = await db.collection('forum_posts')
        .orderBy('createTime', 'desc')
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .get()
      let list = res.data
      if (keyword) {
        const kw = keyword.toLowerCase()
        list = list.filter(p => p.content.toLowerCase().includes(kw))
      }
      return { code: 0, data: list }
    }

    case 'detail': {
      const post = await db.collection('forum_posts').doc(data.id).get()
      const comments = await db.collection('forum_comments').where({ postId: data.id })
        .orderBy('createTime', 'desc')
        .limit(50)
        .get()
      return { code: 0, data: { ...post.data, commentList: comments.data } }
    }

    case 'create': {
      const { content, images } = data
      if (!content) return { code: -1, msg: 'content required' }
      if (content.length > 1000) return { code: -1, msg: '内容长度不能超过1000个字符' }
      const contentSafe = await checkContent(openid, content, 3)
      if (!contentSafe) return { code: -1, msg: '内容包含违规信息，请修改后重试' }
      const user = await db.collection('users').where({ openid }).get()
      const u = user.data[0] || {}
      const res = await db.collection('forum_posts').add({
        data: {
          openid,
          nickname: u.name || '匿名',
          avatar: u.avatar || '',
          content,
          images: images || [],
          likes: 0, comments: 0,
          likedBy: [],
          createTime: db.serverDate()
        }
      })
      return { code: 0, id: res._id }
    }

    case 'like': {
      const post = await db.collection('forum_posts').doc(data.postId).get()
      const liked = post.data.likedBy && post.data.likedBy.includes(openid)
      if (liked) {
        await db.collection('forum_posts').doc(data.postId).update({
          data: { likes: _.inc(-1), likedBy: _.pull(openid) }
        })
      } else {
        await db.collection('forum_posts').doc(data.postId).update({
          data: { likes: _.inc(1), likedBy: _.push(openid) }
        })
        // 发送点赞通知
        if (post.data.openid !== openid) {
          var likeUser = await db.collection('users').where({ openid }).get()
          var likeName = likeUser.data.length > 0 ? likeUser.data[0].name : '有人'
          await db.collection('messages').add({
            data: {
              toOpenid: post.data.openid,
              fromOpenid: openid,
              fromName: likeName,
              type: 'like',
              title: '收到一个赞',
              content: likeName + ' 赞了你的帖子',
              targetId: data.postId,
              targetType: 'forum',
              read: false,
              createTime: db.serverDate()
            }
          })
          // 发送订阅消息
          await sendMsgSubscribe(
            post.data.openid,
            likeName,
            '赞了你的帖子',
            '/pages/forum-sub/detail?id=' + data.postId
          )
        }
      }
      return { code: 0, liked: !liked }
    }

    case 'comment': {
      const { postId, content, replyTo, replyName } = data
      if (!content) return { code: -1, msg: 'content required' }
      if (content.length > 500) return { code: -1, msg: '评论长度不能超过500个字符' }
      const commentSafe = await checkContent(openid, content, 2)
      if (!commentSafe) return { code: -1, msg: '评论包含违规内容，请修改' }
      const user = await db.collection('users').where({ openid }).get()
      const u = user.data[0] || {}
      var commentName = u.name || '匿名'
      var commentData = {
        postId, openid,
        nickname: commentName,
        avatar: u.avatar || '',
        content,
        likes: 0,
        likedBy: [],
        createTime: db.serverDate()
      }
      if (replyTo) {
        commentData.replyTo = replyTo
        commentData.replyName = replyName || ''
      }
      var newCmt = await db.collection('forum_comments').add({ data: commentData })
      await db.collection('forum_posts').doc(postId).update({ data: { comments: _.inc(1) } })
      // 发送评论通知给帖子作者
      var commentPost = await db.collection('forum_posts').doc(postId).get()
      if (commentPost.data.openid !== openid) {
        var shortContent = content.length > 20 ? content.substring(0, 20) + '...' : content
        await db.collection('messages').add({
          data: {
            toOpenid: commentPost.data.openid,
            fromOpenid: openid,
            fromName: commentName,
            type: 'comment',
            title: '收到一条评论',
            content: commentName + ' 评论了你的帖子: ' + shortContent,
            targetId: postId,
            targetType: 'forum',
            read: false,
            createTime: db.serverDate()
          }
        })
        // 发送订阅消息
        await sendMsgSubscribe(
          commentPost.data.openid,
          commentName,
          '评论了你的帖子: ' + shortContent,
          '/pages/forum-sub/detail?id=' + postId
        )
      }
      // 如果是回复别人的评论，也通知被回复者
      if (replyTo) {
        try {
          var repliedCmt = await db.collection('forum_comments').doc(replyTo).get()
          if (repliedCmt.data.openid !== openid && repliedCmt.data.openid !== commentPost.data.openid) {
            var replyShort = content.length > 20 ? content.substring(0, 20) + '...' : content
            await db.collection('messages').add({
              data: {
                toOpenid: repliedCmt.data.openid,
                fromOpenid: openid,
                fromName: commentName,
                type: 'comment',
                title: '收到一条回复',
                content: commentName + ' 回复了你的评论: ' + replyShort,
                targetId: postId,
                targetType: 'forum',
                read: false,
                createTime: db.serverDate()
              }
            })
            // 发送订阅消息
            await sendMsgSubscribe(
              repliedCmt.data.openid,
              commentName,
              '回复了你的评论: ' + replyShort,
              '/pages/forum-sub/detail?id=' + postId
            )
          }
        } catch (e) {}
      }
      return { code: 0, id: newCmt._id }
    }

    case 'myPosts': {
      const res = await db.collection('forum_posts').where({ openid })
        .orderBy('createTime', 'desc')
        .limit(20)
        .get()
      return { code: 0, data: res.data }
    }

    case 'delete': {
      const post = await db.collection('forum_posts').doc(data.postId).get()
      if (post.data.openid !== openid) return { code: -1, msg: '仅发布者可删除' }
      await db.collection('forum_posts').doc(data.postId).remove()
      // 删除关联评论
      const cmts = await db.collection('forum_comments').where({ postId: data.postId }).get()
      for (var i = 0; i < cmts.data.length; i++) {
        await db.collection('forum_comments').doc(cmts.data[i]._id).remove()
      }
      return { code: 0 }
    }

    case 'likeComment': {
      var lc = await db.collection('forum_comments').doc(data.commentId).get()
      var lcData = lc.data
      var lcLiked = lcData.likedBy && lcData.likedBy.indexOf(openid) !== -1
      if (lcLiked) {
        await db.collection('forum_comments').doc(data.commentId).update({
          data: { likes: _.inc(-1), likedBy: _.pull(openid) }
        })
      } else {
        await db.collection('forum_comments').doc(data.commentId).update({
          data: { likes: _.inc(1), likedBy: _.push(openid) }
        })
      }
      return { code: 0, liked: !lcLiked }
    }

    case 'deleteComment': {
      var cmt = await db.collection('forum_comments').doc(data.commentId).get()
      var cmtData = cmt.data
      // 评论者本人可删
      if (cmtData.openid === openid) {
        await db.collection('forum_comments').doc(data.commentId).remove()
        await db.collection('forum_posts').doc(cmtData.postId).update({ data: { comments: _.inc(-1) } })
        return { code: 0 }
      }
      // 帖子作者可删
      var ownerPost = await db.collection('forum_posts').doc(cmtData.postId).get()
      if (ownerPost.data.openid === openid) {
        await db.collection('forum_comments').doc(data.commentId).remove()
        await db.collection('forum_posts').doc(cmtData.postId).update({ data: { comments: _.inc(-1) } })
        return { code: 0 }
      }
      return { code: -1, msg: '无权删除该评论' }
    }

    default:
      return { code: -1, msg: 'unknown action: ' + action }
  }
}
