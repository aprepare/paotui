<template>
  <view class="forum-page">
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索帖子/用户" v-model="keyword" />
      </view>
    </view>

    <view class="post-list">
      <view v-for="post in filteredPosts" :key="post.id" class="post-card" @click="goDetail(post.id)">
        <view class="post-header">
          <view class="avatar">{{ post.avatar }}</view>
          <view class="user-info">
            <text class="nickname">{{ post.nickname }}</text>
            <text class="time">{{ post.time }}</text>
          </view>
        </view>
        <text class="post-content">{{ post.content }}</text>
        <view v-if="post.images.length" class="post-images">
          <view v-for="(img, i) in post.images" :key="i" class="img-placeholder" :style="{background: img.bg}">
            <text>{{ img.emoji }}</text>
          </view>
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
          <view class="action-item">
            <text>🔗</text>
            <text class="action-num">分享</text>
          </view>
        </view>
      </view>
    </view>
    <view class="fab-btn" @click="goCreate">
      <text>✏️</text>
    </view>

    <ServiceFab :bottom="320" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import ServiceFab from '@/components/ServiceFab.vue'

const keyword = ref('')

const posts = ref([
  { id: 1, avatar: '🧑‍🎓', nickname: '学霸小王', time: '5分钟前', content: '图书馆三楼靠窗的位置真的绝了，安静又有阳光，考研党冲！有一起自习的小伙伴吗？', images: [{ emoji: '📚', bg: '#E3F2FD' }], likes: 32, comments: 8, liked: false },
  { id: 2, avatar: '👩‍💻', nickname: '代码少女', time: '30分钟前', content: '食堂二楼新出的麻辣香锅也太好吃了吧！！强烈推荐加芝士年糕和午餐肉，绝绝子🤤', images: [{ emoji: '🍲', bg: '#FFF3E0' }, { emoji: '😋', bg: '#FFEBEE' }], likes: 89, comments: 23, liked: true },
  { id: 3, avatar: '🏃‍♂️', nickname: '跑步达人', time: '1小时前', content: '有没有人一起晨跑啊？每天早上6:30操场集合，已经坚持30天了，欢迎加入！', images: [], likes: 45, comments: 12, liked: false },
  { id: 4, avatar: '🎸', nickname: '吉他社社长', time: '2小时前', content: '校园歌手大赛报名开始啦！不管你是唱歌还是乐器都可以来，奖品丰厚，详情看图👇', images: [{ emoji: '🎤', bg: '#F3E5F5' }, { emoji: '🎵', bg: '#E8F5E9' }, { emoji: '🏆', bg: '#FFF8E1' }], likes: 128, comments: 34, liked: false },
  { id: 5, avatar: '📸', nickname: '摄影爱好者', time: '3小时前', content: '今天的晚霞太美了！在教学楼天台拍的，分享给大家~', images: [{ emoji: '🌅', bg: '#FFE0B2' }], likes: 256, comments: 41, liked: true }
])

const filteredPosts = computed(() => {
  const key = keyword.value.trim()
  if (!key) return posts.value
  return posts.value.filter(p => p.content.includes(key) || p.nickname.includes(key))
})

const toggleLike = (post) => {
  post.liked = !post.liked
  post.likes += post.liked ? 1 : -1
}
const goDetail = (id) => {
  uni.navigateTo({ url: '/pages/forum/detail?id=' + id })
}
const goCreate = () => {
  uni.navigateTo({ url: '/pages/forum/create' })
}
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
.avatar { width: 72rpx; height: 72rpx; border-radius: 50%; background: #E3F2FD; display: flex; align-items: center; justify-content: center; font-size: 36rpx; margin-right: 16rpx; }
.user-info { display: flex; flex-direction: column; }
.nickname { font-size: 28rpx; font-weight: bold; color: #333; }
.time { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.post-content { font-size: 28rpx; color: #333; line-height: 1.6; margin-bottom: 16rpx; }
.post-images { display: flex; gap: 12rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.img-placeholder { width: 200rpx; height: 200rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 60rpx; }
.post-actions { display: flex; border-top: 1rpx solid #f0f0f0; padding-top: 16rpx; }
.action-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.action-num { font-size: 24rpx; color: #999; }
.fab-btn { position: fixed; right: 40rpx; bottom: 200rpx; width: 100rpx; height: 100rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.fab-btn text { font-size: 40rpx; }
</style>
