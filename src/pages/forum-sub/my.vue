<template>
  <view class="my-posts-page">
    <view v-if="posts.length === 0 && !loading" class="empty">
      <text class="empty-emoji">📭</text>
      <text class="empty-text">还没有发过帖子</text>
      <view class="empty-btn" @click="goCreate">
        <text>去发帖</text>
      </view>
    </view>
    <view class="post-list">
      <view v-for="post in posts" :key="post.id" class="post-card" @click="goDetail(post.id)">
        <view class="post-header">
          <text class="post-content">{{ post.content }}</text>
          <view class="del-btn" @click.stop="onDelete(post.id)">
            <text>删除</text>
          </view>
        </view>
        <view v-if="post.images.length" class="post-images">
          <image v-for="(img, i) in post.images" :key="i" class="post-img" :src="img" mode="aspectFill" />
        </view>
        <view class="post-footer">
          <text class="post-stat">❤️ {{ post.likes }}  💬 {{ post.comments }}</text>
          <text class="post-time">{{ post.time }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

const posts = ref([])
const loading = ref(true)

const loadData = async () => {
  loading.value = true
  var res = await callCloud('forum', 'myPosts')
  if (res.code === 0) {
    posts.value = res.data.map(function(p) {
      var imgs = (p.images || []).filter(function(img) {
        return img && typeof img === 'string' && img.indexOf('cloud://') === 0
      })
      var t = p.createTime ? new Date(p.createTime) : new Date()
      var timeStr = (t.getMonth() + 1) + '/' + t.getDate() + ' ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0')
      return {
        id: p._id,
        content: p.content || '',
        images: imgs,
        likes: p.likes || 0,
        comments: p.comments || 0,
        time: timeStr
      }
    })
  }
  loading.value = false
}

onShow(function() { loadData() })

const onDelete = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定吗？',
    success: async function(res) {
      if (res.confirm) {
        var r = await callCloud('forum', 'delete', { postId: id })
        if (r.code === 0) {
          posts.value = posts.value.filter(function(p) { return p.id !== id })
          uni.showToast({ title: '已删除', icon: 'success' })
        }
      }
    }
  })
}

var goDetail = function(id) { uni.navigateTo({ url: '/pages/forum-sub/detail?id=' + id }) }
var goCreate = function() { uni.navigateTo({ url: '/pages/forum-sub/create' }) }
</script>

<style scoped>
.my-posts-page { background: #F0F2F5; min-height: 100vh; padding: 20rpx 28rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; margin-bottom: 32rpx; }
.empty-btn { padding: 16rpx 48rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 36rpx; }
.empty-btn text { color: #fff; font-size: 28rpx; font-weight: 600; }

.post-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.post-header { display: flex; justify-content: space-between; align-items: flex-start; }
.post-content { flex: 1; font-size: 28rpx; color: #2D3748; line-height: 1.6; margin-right: 16rpx; }
.del-btn { padding: 8rpx 20rpx; border: 1rpx solid #E53E3E; border-radius: 20rpx; flex-shrink: 0; }
.del-btn text { font-size: 22rpx; color: #E53E3E; }

.post-images { display: flex; gap: 12rpx; margin-top: 16rpx; flex-wrap: wrap; }
.post-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; background: #E3F2FD; }

.post-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #F7FAFC; }
.post-stat { font-size: 24rpx; color: #A0AEC0; }
.post-time { font-size: 22rpx; color: #CBD5E0; }
</style>
