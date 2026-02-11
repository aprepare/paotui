<template>
  <view class="mine-page">
    <view class="user-card">
      <view class="user-avatar">🧑‍💼</view>
      <view class="user-detail">
        <text class="user-name">校园达人</text>
        <text class="user-phone">188****8888</text>
      </view>
      <view class="edit-btn" @click="goLogin">
        <text>编辑</text>
      </view>
    </view>
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-num">12</text>
        <text class="stat-label">发布订单</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">8</text>
        <text class="stat-label">完成接单</text>
      </view>
      <view class="stat-item">
        <text class="stat-num">¥236</text>
        <text class="stat-label">总收入</text>
      </view>
    </view>
    <view class="menu-section">
      <text class="section-title">我的服务</text>
      <view class="menu-list">
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <text class="menu-icon">📦</text>
          <text class="menu-text">我的快递单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <text class="menu-icon">🏃</text>
          <text class="menu-text">我的跑腿任务</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <text class="menu-icon">🚗</text>
          <text class="menu-text">我的拼车</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <text class="menu-icon">📋</text>
          <text class="menu-text">我的接单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">🛒</text>
          <text class="menu-text">我的商品</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">💬</text>
          <text class="menu-text">我的帖子</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
    <view class="menu-section">
      <text class="section-title">骑手中心</text>
      <view class="menu-list">
        <view class="menu-item" @click="goPage('/pages/express/rider-register')">
          <text class="menu-icon">🏅</text>
          <text class="menu-text">骑手注册/认证</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/express/building-orders')">
          <text class="menu-icon">🏢</text>
          <text class="menu-text">楼栋订单统计</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
    <view class="menu-section">
      <text class="section-title">其他</text>
      <view class="menu-list">
        <view class="menu-item">
          <text class="menu-icon">💰</text>
          <text class="menu-text">我的钱包</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">⭐</text>
          <text class="menu-text">我的收藏</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">⚙️</text>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <text class="menu-icon">❓</text>
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>
    <view class="logout-btn">
      <text>退出登录</text>
    </view>
  </view>
</template>

<script setup>
const goPage = (url) => {
  uni.navigateTo({ url })
}
const goLogin = () => {
  uni.navigateTo({ url: '/pages/login/index' })
}
</script>

<style scoped>
.mine-page { background: #F5F7FA; min-height: 100vh; }
.user-card { background: linear-gradient(135deg, #4A90D9, #357ABD); padding: 60rpx 32rpx 40rpx; display: flex; align-items: center; }
.user-avatar { width: 120rpx; height: 120rpx; border-radius: 50%; background: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 60rpx; margin-right: 24rpx; }
.user-detail { flex: 1; }
.user-name { font-size: 36rpx; font-weight: bold; color: #fff; display: block; }
.user-phone { font-size: 26rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }
.edit-btn { padding: 12rpx 28rpx; border: 1rpx solid rgba(255,255,255,0.6); border-radius: 30rpx; }
.edit-btn text { font-size: 24rpx; color: #fff; }
.stats-bar { display: flex; background: #fff; margin: -20rpx 24rpx 20rpx; border-radius: 16rpx; padding: 28rpx 0; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: bold; color: #4A90D9; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 8rpx; }
.menu-section { margin: 0 24rpx 20rpx; }
.section-title { font-size: 26rpx; color: #999; padding: 20rpx 16rpx 12rpx; }
.menu-list { background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.menu-item { display: flex; align-items: center; padding: 28rpx 24rpx; border-bottom: 1rpx solid #f5f5f5; }
.menu-item:last-child { border-bottom: none; }
.menu-icon { font-size: 36rpx; margin-right: 16rpx; }
.menu-text { flex: 1; font-size: 28rpx; color: #333; }
.menu-arrow { font-size: 32rpx; color: #ccc; }
.logout-btn { margin: 40rpx 24rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; text-align: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.logout-btn text { color: #FF6B6B; font-size: 28rpx; }
</style>
