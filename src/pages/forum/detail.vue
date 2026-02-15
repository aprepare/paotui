<template>
  <view class="post-detail">
    <view class="post-card">
      <view class="post-header">
        <view class="avatar">
          <image v-if="isUrl(postData.avatar)" :src="postData.avatar" class="avatar-img" mode="aspectFill" />
          <text v-else>{{ postData.avatar }}</text>
        </view>
        <view class="user-info">
          <text class="nickname">{{ postData.nickname }}</text>
          <text class="time">{{ postData.time }}</text>
        </view>
        <view class="follow-btn" @click="toggleFollow">
          <text>{{ followed ? '已关注' : '+ 关注' }}</text>
        </view>
      </view>
      <text class="post-content">{{ postData.content }}</text>
      <view class="post-images" v-if="postData.images.length">
        <image v-for="(img, i) in postData.images" :key="i" class="img-item" :src="img.url" mode="aspectFill" />
      </view>
      <view class="post-actions">
        <view class="action-item" @click="toggleLike">
          <text>{{ liked ? '❤️' : '🤍' }}</text>
          <text class="action-num">{{ likeCount }}</text>
        </view>
        <view class="action-item">
          <text>💬</text>
          <text class="action-num">{{ comments.length }}</text>
        </view>
        <view class="action-item" @click="toggleFavorite">
          <text>{{ favorited ? '⭐' : '☆' }}</text>
          <text class="action-num">{{ favorited ? '已收藏' : '收藏' }}</text>
        </view>
      </view>
    </view>
    <view class="comment-section">
      <text class="comment-title">评论 ({{ comments.length }})</text>
      <view v-for="(c, i) in comments" :key="i" class="comment-item">
        <view class="comment-avatar">
          <image v-if="isUrl(c.avatar)" :src="c.avatar" class="comment-avatar-img" mode="aspectFill" />
          <text v-else>{{ c.avatar }}</text>
        </view>
        <view class="comment-body">
          <view class="comment-header">
            <text class="comment-name">{{ c.name }}</text>
            <text class="comment-time">{{ c.time }}</text>
          </view>
          <view class="reply-tag" v-if="c.replyName">
            <text class="reply-prefix">回复</text>
            <text class="reply-target">{{ c.replyName }}</text>
          </view>
          <text class="comment-text">{{ c.content }}</text>
          <view class="comment-actions">
            <view class="cmt-act-item" @click.stop="toggleCommentLike(c)">
              <text>{{ c.liked ? '👍' : '👍🏻' }}</text>
              <text class="cmt-act-num">{{ c.likes }}</text>
            </view>
            <view class="cmt-act-item" @click.stop="startReply(c)">
              <text>💬</text>
              <text class="cmt-act-num">回复</text>
            </view>
            <view class="cmt-act-item cmt-act-del" v-if="canDeleteComment(c)" @click.stop="deleteComment(c, i)">
              <text class="cmt-del-text">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="input-bar">
      <view class="reply-hint" v-if="replyTarget._id" @click="cancelReply">
        <text class="reply-hint-text">回复 {{ replyTarget.name }}</text>
        <text class="reply-hint-close">×</text>
      </view>
      <view class="input-row">
        <input v-model="newComment" :placeholder="inputPlaceholder" class="comment-input" :focus="inputFocus" />
        <view class="send-btn" @click="sendComment">
          <text>发送</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud'

const postId = ref('')
const liked = ref(false)
const likeCount = ref(0)
const newComment = ref('')
const followed = ref(false)
const favorited = ref(false)
const inputFocus = ref(false)
const replyTarget = ref({ _id: '', name: '' })
const postData = ref({
  avatar: '🧑',
  nickname: '加载中...',
  time: '',
  content: '',
  images: [],
  openid: ''
})
const comments = ref([])

var inputPlaceholder = ref('写评论...')

onLoad((opts) => {
  if (opts && opts.id) {
    postId.value = opts.id
    loadDetail(opts.id)
  }
})

const loadDetail = async (id) => {
  const res = await callCloud('forum', 'detail', { id: id })
  if (res.code === 0) {
    const d = res.data
    postData.value = {
      avatar: d.avatar || '🧑',
      nickname: d.nickname || '匿名',
      time: formatTime(d.createTime),
      content: d.content || '',
      images: (d.images || []).filter(function(img) { return img && typeof img === 'string' && (img.indexOf('cloud://') === 0 || img.indexOf('https://') === 0 || img.indexOf('http://') === 0 || img.indexOf('wxfile://') === 0) }).map(function(img) { return { url: img } }),
      openid: d.openid || ''
    }
    likeCount.value = d.likes || 0
    liked.value = (d.likedBy || []).indexOf(uni.getStorageSync('openid') || '') !== -1
    comments.value = (d.commentList || []).map(c => {
      var myOpenid = uni.getStorageSync('openid') || ''
      return {
        _id: c._id || '',
        openid: c.openid || '',
        avatar: c.avatar || '🧑',
        name: c.nickname || '匿名',
        time: formatTime(c.createTime),
        content: c.content || '',
        likes: c.likes || 0,
        liked: (c.likedBy || []).indexOf(myOpenid) !== -1,
        replyTo: c.replyTo || '',
        replyName: c.replyName || ''
      }
    })
  }
  // 检查收藏状态
  var favRes = await callCloud('user', 'checkFavorite', { targetId: id, targetType: 'post' })
  if (favRes.code === 0) favorited.value = favRes.favorited
}

var formatTime = (t) => {
  if (!t) return ''
  var d = new Date(t)
  if (isNaN(d.getTime())) return ''
  var now = new Date()
  var diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  var y = d.getFullYear()
  var m = d.getMonth() + 1
  var day = d.getDate()
  var hh = d.getHours()
  var mm = d.getMinutes()
  if (y === now.getFullYear()) {
    return (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day) + ' ' + (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm)
  }
  return y + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day)
}

const toggleLike = async () => {
  if (!checkLogin()) return
  const res = await callCloud('forum', 'like', { postId: postId.value })
  if (res.code === 0) {
    liked.value = res.liked
    likeCount.value += res.liked ? 1 : -1
  }
}

const toggleFollow = () => {
  followed.value = !followed.value
  uni.showToast({ title: followed.value ? '已关注' : '取消关注', icon: 'success' })
}

const toggleFavorite = async () => {
  if (!checkLogin()) return
  var res = await callCloud('user', 'toggleFavorite', { targetId: postId.value, targetType: 'post' })
  if (res.code === 0) {
    favorited.value = res.favorited
    uni.showToast({ title: res.favorited ? '已收藏' : '取消收藏', icon: 'success' })
  }
}

const isUrl = (str) => {
  if (!str || typeof str !== 'string') return false
  return str.indexOf('cloud://') === 0 || str.indexOf('https://') === 0 || str.indexOf('http://') === 0
}

const sendComment = async () => {
  if (!checkLogin()) return
  if (!newComment.value.trim()) return
  var params = { postId: postId.value, content: newComment.value }
  if (replyTarget.value._id) {
    params.replyTo = replyTarget.value._id
    params.replyName = replyTarget.value.name
  }
  const res = await callCloud('forum', 'comment', params)
  if (res.code === 0) {
    var myOpenid = uni.getStorageSync('openid') || ''
    comments.value.unshift({
      _id: res.id || '', openid: myOpenid,
      avatar: '🧑‍💼', name: '我', time: '刚刚',
      content: newComment.value, likes: 0, liked: false,
      replyTo: replyTarget.value._id || '',
      replyName: replyTarget.value.name || ''
    })
    newComment.value = ''
    cancelReply()
    uni.showToast({ title: replyTarget.value._id ? '回复成功' : '评论成功', icon: 'success' })
  }
}

var startReply = (c) => {
  if (!checkLogin()) return
  replyTarget.value = { _id: c._id, name: c.name }
  inputPlaceholder.value = '回复 ' + c.name + '...'
  inputFocus.value = true
}

var cancelReply = () => {
  replyTarget.value = { _id: '', name: '' }
  inputPlaceholder.value = '写评论...'
  inputFocus.value = false
}

var toggleCommentLike = async (c) => {
  if (!checkLogin()) return
  if (!c._id) return
  var res = await callCloud('forum', 'likeComment', { commentId: c._id })
  if (res.code === 0) {
    c.liked = res.liked
    c.likes += res.liked ? 1 : -1
  }
}

const canDeleteComment = (c) => {
  var myOpenid = uni.getStorageSync('openid') || ''
  if (!myOpenid) return false
  return c.openid === myOpenid || postData.value.openid === myOpenid
}

const deleteComment = (c, index) => {
  uni.showModal({
    title: '删除评论',
    content: '确定要删除这条评论吗？',
    success: async (res) => {
      if (!res.confirm) return
      if (!c._id) {
        comments.value.splice(index, 1)
        return
      }
      var delRes = await callCloud('forum', 'deleteComment', { commentId: c._id })
      if (delRes.code === 0) {
        comments.value.splice(index, 1)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}
</script>

<style scoped>
.post-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 120rpx; }
.post-card { background: #fff; padding: 28rpx 24rpx; margin-bottom: 16rpx; }
.post-header { display: flex; align-items: center; margin-bottom: 20rpx; }
.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #E3F2FD; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 16rpx; overflow: hidden; }
.avatar-img { width: 80rpx; height: 80rpx; border-radius: 50%; }
.user-info { flex: 1; }
.nickname { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.time { font-size: 22rpx; color: #999; }
.follow-btn { padding: 10rpx 24rpx; background: #4A90D9; border-radius: 24rpx; }
.follow-btn text { font-size: 24rpx; color: #fff; }
.post-content { font-size: 30rpx; color: #333; line-height: 1.7; margin-bottom: 20rpx; }
.post-images { display: flex; gap: 12rpx; margin-bottom: 20rpx; flex-wrap: wrap; }
.img-item { width: 300rpx; height: 300rpx; border-radius: 12rpx; background: #E3F2FD; }
.post-actions { display: flex; border-top: 1rpx solid #f0f0f0; padding-top: 20rpx; }
.action-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.action-num { font-size: 26rpx; color: #999; }
.comment-section { background: #fff; padding: 24rpx; }
.comment-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; display: block; }
.comment-item { display: flex; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.comment-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #F5F7FA; display: flex; align-items: center; justify-content: center; font-size: 32rpx; margin-right: 16rpx; flex-shrink: 0; overflow: hidden; }
.comment-avatar-img { width: 64rpx; height: 64rpx; border-radius: 50%; }
.comment-body { flex: 1; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.comment-name { font-size: 26rpx; font-weight: bold; color: #333; }
.comment-time { font-size: 22rpx; color: #999; }
.comment-text { font-size: 28rpx; color: #333; line-height: 1.5; }
.comment-actions { display: flex; gap: 24rpx; margin-top: 12rpx; align-items: center; }
.cmt-act-item { display: flex; align-items: center; gap: 6rpx; }
.cmt-act-item:active { opacity: 0.6; }
.cmt-act-num { font-size: 22rpx; color: #999; }
.cmt-act-del { margin-left: auto; }
.cmt-del-text { font-size: 22rpx; color: #E53E3E; }
.reply-tag { display: flex; align-items: center; margin-bottom: 6rpx; }
.reply-prefix { font-size: 22rpx; color: #A0AEC0; margin-right: 6rpx; }
.reply-target { font-size: 22rpx; color: #2B6CB0; font-weight: 600; }
.input-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 0 24rpx 36rpx; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); }
.reply-hint { display: flex; align-items: center; justify-content: space-between; padding: 12rpx 0 4rpx; }
.reply-hint-text { font-size: 22rpx; color: #2B6CB0; font-weight: 500; }
.reply-hint-close { font-size: 28rpx; color: #A0AEC0; padding: 0 8rpx; }
.reply-hint:active { opacity: 0.7; }
.input-row { display: flex; align-items: center; padding-top: 12rpx; }
.comment-input { flex: 1; background: #F5F7FA; border-radius: 36rpx; height: 72rpx; line-height: 72rpx; padding-left: 24rpx; padding-right: 24rpx; font-size: 28rpx; }
.send-btn { margin-left: 16rpx; padding: 16rpx 32rpx; background: #4A90D9; border-radius: 36rpx; }
.send-btn text { color: #fff; font-size: 26rpx; }
</style>
