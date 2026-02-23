<template>
  <view class="fav-page">
    <view v-if="list.length === 0 && !loading" class="empty">
      <text class="empty-emoji">⭐</text>
      <text class="empty-text">还没有收藏内容</text>
    </view>
    <view class="fav-list">
      <view v-for="item in list" :key="item._id" class="fav-card" @click="goDetail(item)">
        <view class="fav-icon-wrap" :style="{background: iconBg(item.targetType)}">
          <text class="fav-icon">{{ iconEmoji(item.targetType) }}</text>
        </view>
        <view class="fav-info">
          <text class="fav-title">{{ item.title }}</text>
          <text class="fav-extra">{{ item.extra }}</text>
        </view>
        <view class="fav-type-tag">
          <text>{{ typeName(item.targetType) }}</text>
        </view>
        <view class="fav-del" @click.stop="onRemove(item)">
          <text>取消</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

var list = ref([])
var loading = ref(true)

var loadData = async function() {
  loading.value = true
  var res = await callCloud('user', 'myFavorites')
  if (res.code === 0) {
    list.value = res.data || []
  }
  loading.value = false
}

onShow(function() { loadData() })

var iconEmoji = function(type) {
  if (type === 'post') return '💬'
  if (type === 'goods') return '🛒'
  return '⭐'
}
var iconBg = function(type) {
  if (type === 'post') return 'linear-gradient(135deg, #4FD1C5, #319795)'
  if (type === 'goods') return 'linear-gradient(135deg, #FC8181, #E53E3E)'
  return 'linear-gradient(135deg, #F6E05E, #D69E2E)'
}
var typeName = function(type) {
  if (type === 'post') return '帖子'
  if (type === 'goods') return '商品'
  return '其他'
}

var goDetail = function(item) {
  if (item.targetType === 'post') {
    uni.navigateTo({ url: '/pages/forum-sub/detail?id=' + item.targetId })
  } else if (item.targetType === 'goods') {
    uni.navigateTo({ url: '/pages/market/detail?id=' + item.targetId })
  }
}

var onRemove = async function(item) {
  var res = await callCloud('user', 'toggleFavorite', { targetId: item.targetId, targetType: item.targetType })
  if (res.code === 0) {
    list.value = list.value.filter(function(f) { return f._id !== item._id })
    uni.showToast({ title: '已取消收藏', icon: 'success' })
  }
}
</script>

<style scoped>
.fav-page { background: #F0F2F5; min-height: 100vh; padding: 20rpx 28rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; }

.fav-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; display: flex; align-items: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.fav-icon-wrap { width: 64rpx; height: 64rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; }
.fav-icon { font-size: 28rpx; }
.fav-info { flex: 1; overflow: hidden; }
.fav-title { font-size: 28rpx; color: #2D3748; font-weight: 600; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fav-extra { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }
.fav-type-tag { padding: 4rpx 14rpx; border-radius: 12rpx; background: #F7FAFC; margin-right: 12rpx; flex-shrink: 0; }
.fav-type-tag text { font-size: 20rpx; color: #718096; }
.fav-del { padding: 8rpx 20rpx; border: 1rpx solid #E53E3E; border-radius: 20rpx; flex-shrink: 0; }
.fav-del text { font-size: 22rpx; color: #E53E3E; }
</style>
