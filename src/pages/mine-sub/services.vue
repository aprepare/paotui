<template>
  <view class="services-page">
    <!-- 个人 -->
    <view class="menu-group">
      <text class="group-title">个人</text>
      <view class="menu-card">
        <view class="menu-item last" @click="goPage('/pages/mine-sub/favorites')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6E05E, #D69E2E);"><text class="mi">⭐</text></view>
          <text class="menu-text">我的收藏</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 系统 -->
    <view class="menu-group">
      <text class="group-title">系统</text>
      <view class="menu-card">
        <view class="menu-item" @click="goPage('/pages/login/index')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #A0AEC0, #718096);"><text class="mi">⚙️</text></view>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item last" @click="showFeedback">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #4FD1C5, #319795);"><text class="mi">❓</text></view>
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const loadData = async () => {
  var info = uni.getStorageSync('userInfo')
  if (!info || !info.name) return
}

const goPage = (url) => {
  var info = uni.getStorageSync('userInfo')
  if (!info || !info.name) {
    uni.navigateTo({ url: '/pages/login/index' })
    return
  }
  uni.navigateTo({ url: url })
}

const showFeedback = () => {
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/TeamWork.png') })
}

onShow(() => { loadData() })
</script>

<style scoped>
.services-page { background: #F0F2F5; min-height: 100vh; padding: 24rpx 0 60rpx; }
.menu-group { padding: 0 28rpx; margin-bottom: 24rpx; }
.group-title { font-size: 26rpx; color: #A0AEC0; font-weight: 600; padding: 16rpx 4rpx 12rpx; display: block; letter-spacing: 1rpx; }
.menu-card { background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.menu-item { display: flex; align-items: center; padding: 28rpx 28rpx; border-bottom: 1rpx solid #F7FAFC; }
.menu-item:active { background: #F7FAFC; }
.menu-item.last { border-bottom: none; }
.menu-icon-bg { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.mi { font-size: 28rpx; }
.menu-text { flex: 1; font-size: 28rpx; color: #2D3748; font-weight: 500; }
.menu-arrow { font-size: 28rpx; color: #CBD5E0; font-weight: 300; }
</style>
