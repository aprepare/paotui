<template>
  <view class="forum-page">
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索帖子/用户" v-model="keyword"></input>
      </view>
    </view>

    <view class="post-list">
      <view v-for="post in filteredPosts" :key="post.id" class="post-card" @click="goDetail(post.id)">
        <view class="post-header">
          <view class="avatar">          <image v-if="isUrl(post.avatar)" :src="post.avatar" class="avatar-img" mode="aspectFill" />
          <text v-else class="avatar-text">{{ post.avatar }}</text></view>
          <view class="user-info">
            <text class="nickname">{{ post.nickname }}</text>
            <text class="time">{{ post.time }}</text>
          </view>
        </view>
        <text class="post-content">{{ post.content }}</text>
        <view v-if="post.images.length" class="post-images">
          <image v-for="(img, i) in post.images" :key="i" class="img-placeholder" :src="img.url" mode="aspectFill" @error="onImgError" />
        </view>
        <view class="post-actions">
          <view class="action-item" @click.stop="toggleLike(post)">
            <text>{{ post.liked ? '❤️' : '🤍' }}</text>
            <text class="action-num">{{ post.likes }}</text>
          </view>
          <view class="action-item">
            <text>💬</text>
            <text class="action-num">{{ post.comments }}</text>
          </view>
          <button class="action-item share-btn" open-type="share" @click.stop="setSharePost(post)">
            <text>🔗</text>
            <text class="action-num">分享</text>
          </button>
        </view>
      </view>
    </view>
    <view class="fab-btn" @click="goCreate">
      <text>✏️</text>
    </view>

    <MsgNotify />
      <CustomTabBar :current="2" />
  </view>
</template>

<script setup>
import CustomTabBar from '@/components/CustomTabBar.vue'
import { ref, computed } from 'vue'
import { onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud'
import MsgNotify from '@/components/MsgNotify.vue'

const keyword = ref('')
const posts = ref([])
const shareData = ref(null)

const loadData = async () => {
  const res = await callCloud('forum', 'list', { keyword: keyword.value })
  if (res.code === 0) {
    posts.value = res.data.map(p => ({
      id: p._id,
      avatar: p.avatar || '🧑',
      nickname: p.nickname || '匿名',
      time: formatTime(p.createTime),
      content: p.content || '',
      images: (p.images || []).filter(function(img) { return img && typeof img === 'string' && (img.indexOf('cloud://') === 0 || img.indexOf('https://') === 0 || img.indexOf('http://') === 0 || img.indexOf('wxfile://') === 0) }).map(function(img) { return { url: img } }),
      likes: p.likes || 0,
      comments: p.comments || 0,
      liked: (p.likedBy || []).indexOf(uni.getStorageSync('openid') || '') !== -1
    }))
  }
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

onShow(() => {
  uni.hideTabBar({ animation: false })
  loadData() })

const filteredPosts = computed(() => {
  const key = keyword.value.trim()
  if (!key) return posts.value
  return posts.value.filter(p => p.content.includes(key) || p.nickname.includes(key))
})

const toggleLike = async (post) => {
  if (!checkLogin()) return
  const res = await callCloud('forum', 'like', { postId: post.id })
  if (res.code === 0) {
    post.liked = res.liked
    post.likes += res.liked ? 1 : -1
  }
}
const goDetail = (id) => {
  uni.navigateTo({ url: '/pages/forum-sub/detail?id=' + id })
}
const goCreate = () => {
  if (!checkLogin()) return
  uni.navigateTo({ url: '/pages/forum-sub/create' })
}
const isUrl = (str) => {
  if (!str || typeof str !== 'string') return false
  return str.indexOf('cloud://') === 0 || str.indexOf('https://') === 0 || str.indexOf('http://') === 0
}
const onImgError = (e) => {
  if (e && e.target) e.target.style = 'display:none'
}
const setSharePost = (post) => {
  shareData.value = post
}

onShareAppMessage(() => {
  if (shareData.value) {
    var title = shareData.value.nickname + '：' + shareData.value.content
    if (title.length > 40) title = title.substring(0, 40) + '...'
    return {
      title: title,
      path: '/pages/forum-sub/detail?id=' + shareData.value.id
    }
  }
  return {
    title: '校园广场 - 一起来看看同学们在聊什么',
    path: '/pages/forum/index'
  }
})
</script>

<style scoped>
.forum-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }

.search-bar { padding: 20rpx 24rpx 12rpx; }
.search-input { display: flex; align-items: center; background: #fff; border-radius: 40rpx; padding: 16rpx 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.search-icon { margin-right: 12rpx; font-size: 28rpx; }
.search-input input { flex: 1; font-size: 28rpx; }

.post-list { padding: 8rpx 24rpx 20rpx; }
.post-card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.post-header { display: flex; align-items: center; margin-bottom: 16rpx; }
.avatar { width: 72rpx; height: 72rpx; border-radius: 50%; background: #E3F2FD; display: flex; align-items: center; justify-content: center; font-size: 36rpx; margin-right: 16rpx; overflow: hidden; }
.avatar-img { width: 72rpx; height: 72rpx; border-radius: 50%; }
.avatar-text { font-size: 36rpx; }
.user-info { display: flex; flex-direction: column; }
.nickname { font-size: 28rpx; font-weight: bold; color: #333; }
.time { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.post-content { font-size: 28rpx; color: #333; line-height: 1.6; margin-bottom: 16rpx; }
.post-images { display: flex; gap: 12rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.img-placeholder { width: 200rpx; height: 200rpx; border-radius: 12rpx; background: #E3F2FD; }
.post-actions { display: flex; border-top: 1rpx solid #f0f0f0; padding-top: 16rpx; }
.action-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.action-num { font-size: 24rpx; color: #999; }
.share-btn { background: none; border: none; padding: 0; margin: 0; line-height: normal; font-size: inherit; color: inherit; }
.share-btn::after { border: none; }
.fab-btn { position: fixed; right: 40rpx; bottom: 200rpx; width: 100rpx; height: 100rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.fab-btn text { font-size: 40rpx; }
</style>
