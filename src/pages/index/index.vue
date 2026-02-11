<template>
  <view class="home-page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <text class="search-icon">🔍</text>
        <input placeholder="搜索服务、商品、帖子..." disabled @click="onSearchClick" />
      </view>
    </view>

    <!-- 功能入口网格 -->
    <view class="service-grid">
      <view class="service-item" @click="goPage('/pages/express/index')">
        <view class="service-icon express">📦</view>
        <text class="service-name">代取快递</text>
        <text class="service-desc">智能识别短信</text>
      </view>
      <view class="service-item" @click="goPage('/pages/errand/index')">
        <view class="service-icon errand">🏃</view>
        <text class="service-name">万能跑腿</text>
        <text class="service-desc">啥都能帮</text>
      </view>
      <view class="service-item" @click="goPage('/pages/carpool/index')">
        <view class="service-icon carpool">🚗</view>
        <text class="service-name">校园拼车</text>
        <text class="service-desc">一起出发</text>
      </view>
      <view class="service-item" @click="goMarket">
        <view class="service-icon market">🛒</view>
        <text class="service-name">二手市场</text>
        <text class="service-desc">闲置换钱</text>
      </view>
      <view class="service-item" @click="goForum">
        <view class="service-icon forum">💬</view>
        <text class="service-name">校园广场</text>
        <text class="service-desc">校园社区</text>
      </view>
      <view class="service-item" @click="goPage('/pages/express/rider-register')">
        <view class="service-icon rider">🏅</view>
        <text class="service-name">骑手注册</text>
        <text class="service-desc">赚取收入</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-section">
      <text class="section-title">快捷操作</text>
      <view class="quick-actions">
        <view class="quick-btn" @click="goPage('/pages/express/create')">
          <text class="quick-emoji">📮</text>
          <text class="quick-text">取快递</text>
        </view>
        <view class="quick-btn" @click="goPage('/pages/errand/create')">
          <text class="quick-emoji">📝</text>
          <text class="quick-text">发任务</text>
        </view>
        <view class="quick-btn" @click="goPage('/pages/carpool/create')">
          <text class="quick-emoji">🚙</text>
          <text class="quick-text">发拼车</text>
        </view>
        <view class="quick-btn" @click="goPage('/pages/express/building-orders')">
          <text class="quick-emoji">🏢</text>
          <text class="quick-text">楼栋订单</text>
        </view>
      </view>
    </view>

    <!-- 最新快递订单 -->
    <view class="order-section">
      <view class="section-header">
        <text class="section-title">最新快递订单</text>
        <text class="section-more" @click="goPage('/pages/express/index')">查看全部 ›</text>
      </view>
      <view v-for="order in latestOrders" :key="order.id" class="order-card" @click="goPage(`/pages/express/detail?id=${order.id}`)">
        <view class="order-left">
          <view class="order-size-tag" :class="order.sizeClass">{{ order.sizeText }}</view>
        </view>
        <view class="order-center">
          <text class="order-pickup">{{ order.pickupPoint }}</text>
          <text class="order-addr">→ {{ order.building }}</text>
          <text class="order-time">{{ order.time }}</text>
        </view>
        <view class="order-right">
          <text class="order-price">¥{{ order.price }}</text>
          <text class="order-status" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
      </view>
    </view>

    <!-- 配送时间说明 -->
    <view class="notice-card">
      <text class="notice-title">⏰ 配送时间说明</text>
      <text class="notice-text">工作日配送时间：8:00-22:00</text>
      <text class="notice-text">周末/节假日：9:00-21:00</text>
      <text class="notice-text">恶劣天气可能影响配送时效，请合理安排取件时间</text>
      <text class="notice-text">大件/超大件快递需提前与骑手沟通确认</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'

const latestOrders = ref([
  { id: 1, pickupPoint: '菜鸟驿站A区', building: '6号宿舍楼302', sizeText: '小件', sizeClass: 'small', price: 2, time: '10分钟前', statusText: '待接单', statusColor: '#FF9800' },
  { id: 2, pickupPoint: '京东快递柜', building: '3号宿舍楼501', sizeText: '大件', sizeClass: 'large', price: 5, time: '20分钟前', statusText: '配送中', statusColor: '#66BB6A' },
  { id: 3, pickupPoint: '顺丰快递站', building: '1号宿舍楼108', sizeText: '超大件', sizeClass: 'xlarge', price: 20, time: '30分钟前', statusText: '待接单', statusColor: '#FF9800' }
])

const goPage = (url) => {
  uni.navigateTo({ url })
}

const goMarket = () => {
  uni.switchTab({ url: '/pages/market/index' })
}

const goForum = () => {
  uni.switchTab({ url: '/pages/forum/index' })
}

const onSearchClick = () => {
  uni.showToast({ title: '搜索功能开发中', icon: 'none' })
}
</script>

<style scoped>
.home-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 40rpx; }

.search-bar { padding: 20rpx 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); }
.search-input { display: flex; align-items: center; background: rgba(255,255,255,0.95); border-radius: 36rpx; padding: 16rpx 24rpx; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input input { flex: 1; font-size: 26rpx; color: #999; }

.service-grid { display: flex; flex-wrap: wrap; padding: 24rpx 24rpx 0; gap: 16rpx; }
.service-item { width: calc(33.33% - 12rpx); background: #fff; border-radius: 16rpx; padding: 28rpx 0 20rpx; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.service-icon { width: 80rpx; height: 80rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-bottom: 12rpx; }
.service-icon.express { background: #E3F2FD; }
.service-icon.errand { background: #FFF3E0; }
.service-icon.carpool { background: #E8F5E9; }
.service-icon.market { background: #FCE4EC; }
.service-icon.forum { background: #F3E5F5; }
.service-icon.rider { background: #FFF8E1; }
.service-name { font-size: 26rpx; font-weight: bold; color: #333; }
.service-desc { font-size: 20rpx; color: #999; margin-top: 4rpx; }

.quick-section { padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.quick-actions { display: flex; gap: 16rpx; }
.quick-btn { flex: 1; background: #fff; border-radius: 16rpx; padding: 24rpx 0; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.quick-emoji { font-size: 36rpx; margin-bottom: 8rpx; }
.quick-text { font-size: 24rpx; color: #333; }

.order-section { padding: 0 24rpx; margin-bottom: 20rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-more { font-size: 24rpx; color: #4A90D9; }
.order-card { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.order-left { margin-right: 20rpx; }
.order-size-tag { padding: 8rpx 16rpx; border-radius: 8rpx; font-size: 22rpx; font-weight: bold; color: #fff; }
.order-size-tag.small { background: #4A90D9; }
.order-size-tag.large { background: #FF9800; }
.order-size-tag.xlarge { background: #FF6B6B; }
.order-center { flex: 1; }
.order-pickup { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.order-addr { font-size: 24rpx; color: #666; display: block; margin-top: 4rpx; }
.order-time { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }
.order-right { text-align: right; }
.order-price { font-size: 32rpx; color: #FF6B6B; font-weight: bold; display: block; }
.order-status { font-size: 22rpx; display: block; margin-top: 4rpx; }

.notice-card { margin: 0 24rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.notice-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 12rpx; }
.notice-text { font-size: 24rpx; color: #666; display: block; line-height: 40rpx; }
</style>
