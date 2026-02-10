<template>
  <view class="post-detail">
    <view class="post-card">
      <view class="post-header">
        <view class="avatar">🧑‍🎓</view>
        <view class="user-info">
          <text class="nickname">学霸小王</text>
          <text class="time">5分钟前</text>
        </view>
        <view class="follow-btn">
          <text>+ 关注</text>
        </view>
      </view>
      <text class="post-content">图书馆三楼靠窗的位置真的绝了，安静又有阳光，考研党冲！有一起自习的小伙伴吗？每天早上8点到晚上9点都在，可以一起互相监督学习进度，一起上岸！💪</text>
      <view class="post-images">
        <view class="img-item" style="background:#E3F2FD"><text>📚</text></view>
        <view class="img-item" style="background:#FFF8E1"><text>☀️</text></view>
      </view>
      <view class="post-actions">
        <view class="action-item" @click="liked = !liked; likeCount += liked ? 1 : -1">
          <text>{{ liked ? '❤️' : '🤍' }}</text>
          <text class="action-num">{{ likeCount }}</text>
        </view>
        <view class="action-item">
          <text>💬</text>
          <text class="action-num">{{ comments.length }}</text>
        </view>
        <view class="action-item">
          <text>⭐</text>
          <text class="action-num">收藏</text>
        </view>
      </view>
    </view>
    <view class="comment-section">
      <text class="comment-title">评论 ({{ comments.length }})</text>
      <view v-for="(c, i) in comments" :key="i" class="comment-item">
        <view class="comment-avatar">{{ c.avatar }}</view>
        <view class="comment-body">
          <view class="comment-header">
            <text class="comment-name">{{ c.name }}</text>
            <text class="comment-time">{{ c.time }}</text>
          </view>
          <text class="comment-text">{{ c.content }}</text>
          <view class="comment-actions">
            <text class="comment-like">👍 {{ c.likes }}</text>
            <text class="comment-reply">回复</text>
          </view>
        </view>
      </view>
    </view>
    <view class="input-bar">
      <input v-model="newComment" placeholder="写评论..." class="comment-input" />
      <view class="send-btn" @click="sendComment">
        <text>发送</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const liked = ref(false)
const likeCount = ref(32)
const newComment = ref('')
const comments = ref([
  { avatar: '👩‍💻', name: '代码少女', time: '3分钟前', content: '我也在三楼！靠窗第二排，下次可以一起~', likes: 5 },
  { avatar: '🏃‍♂️', name: '跑步达人', time: '10分钟前', content: '考研加油！我去年也是在图书馆泡了一年，最后上岸了', likes: 12 },
  { avatar: '🎸', name: '吉他社社长', time: '30分钟前', content: '三楼确实不错，就是空调有时候太冷了😂', likes: 3 },
  { avatar: '📸', name: '摄影爱好者', time: '1小时前', content: '落日的时候那个窗户真的超美，拍过好几次', likes: 8 }
])

const sendComment = () => {
  if (!newComment.value.trim()) return
  comments.value.unshift({
    avatar: '🧑‍💼', name: '我', time: '刚刚',
    content: newComment.value, likes: 0
  })
  newComment.value = ''
  uni.showToast({ title: '评论成功', icon: 'success' })
}
</script>

<style scoped>
.post-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 120rpx; }
.post-card { background: #fff; padding: 28rpx 24rpx; margin-bottom: 16rpx; }
.post-header { display: flex; align-items: center; margin-bottom: 20rpx; }
.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #E3F2FD; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 16rpx; }
.user-info { flex: 1; }
.nickname { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.time { font-size: 22rpx; color: #999; }
.follow-btn { padding: 10rpx 24rpx; background: #4A90D9; border-radius: 24rpx; }
.follow-btn text { font-size: 24rpx; color: #fff; }
.post-content { font-size: 30rpx; color: #333; line-height: 1.7; margin-bottom: 20rpx; }
.post-images { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.img-item { width: 300rpx; height: 300rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 80rpx; }
.post-actions { display: flex; border-top: 1rpx solid #f0f0f0; padding-top: 20rpx; }
.action-item { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx; }
.action-num { font-size: 26rpx; color: #999; }
.comment-section { background: #fff; padding: 24rpx; }
.comment-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; display: block; }
.comment-item { display: flex; padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.comment-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #F5F7FA; display: flex; align-items: center; justify-content: center; font-size: 32rpx; margin-right: 16rpx; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 8rpx; }
.comment-name { font-size: 26rpx; font-weight: bold; color: #333; }
.comment-time { font-size: 22rpx; color: #999; }
.comment-text { font-size: 28rpx; color: #333; line-height: 1.5; }
.comment-actions { display: flex; gap: 32rpx; margin-top: 12rpx; }
.comment-like { font-size: 24rpx; color: #999; }
.comment-reply { font-size: 24rpx; color: #4A90D9; }
.input-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; display: flex; align-items: center; padding: 16rpx 24rpx 36rpx; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); }
.comment-input { flex: 1; background: #F5F7FA; border-radius: 36rpx; padding: 16rpx 24rpx; font-size: 28rpx; }
.send-btn { margin-left: 16rpx; padding: 16rpx 32rpx; background: #4A90D9; border-radius: 36rpx; }
.send-btn text { color: #fff; font-size: 26rpx; }
</style>
