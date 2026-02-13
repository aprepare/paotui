<template>
  <view class="home-page">
    <!-- 顶部区域 -->
    <view class="header-area">
      <view class="search-bar">
        <view class="search-input" @click="onSearchClick">
          <text class="search-icon">🔍</text>
          <text class="search-placeholder">搜索服务、商品、帖子...</text>
        </view>
      </view>

      <!-- 送达数据卡片 -->
      <view class="hero-card">
        <view class="hero-content">
          <view class="hero-text-row">
            <text class="hero-label">成功送达 </text>
            <text class="hero-num">{{ live.todayDelivered }}</text>
            <text class="hero-label"> 件</text>
          </view>
          <text class="hero-sub">实时更新 · {{ live.updatedAt }}</text>
        </view>
        <view class="hero-gif-wrap">
          <image class="hero-gif" src="/static/快递.gif" mode="aspectFit" />
        </view>
      </view>
      <view class="school-strip" @click="switchSchool">
        <text class="school-text">📍 {{ currentSchool }}</text>
        <text class="school-switch">切换 ›</text>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="section">
      <text class="section-label">快捷操作</text>
      <view class="action-row">
        <view class="action-card" @click="goPage('/pages/express/create')">
          <view class="action-icon-bg" style="background: linear-gradient(135deg, #4299E1, #2B6CB0);">
            <text class="action-icon">📦</text>
          </view>
          <text class="action-name">代取快递</text>
        </view>
        <view class="action-card" @click="goPage('/pages/errand/create')">
          <view class="action-icon-bg" style="background: linear-gradient(135deg, #ED8936, #DD6B20);">
            <text class="action-icon">🏃</text>
          </view>
          <text class="action-name">万能跑腿</text>
        </view>
        <view class="action-card" @click="goPage('/pages/express/rider-register')">
          <view class="action-icon-bg" style="background: linear-gradient(135deg, #48BB78, #38A169);">
            <text class="action-icon">🏅</text>
          </view>
          <text class="action-name">骑手注册</text>
        </view>
      </view>
    </view>

    <!-- 最新快递订单 -->
    <view class="section">
      <view class="section-head">
        <text class="section-label">最新快递订单</text>
        <text class="section-link" @click="goPage('/pages/express/index')">查看全部 ›</text>
      </view>
      <view v-for="order in sortedOrders" :key="order.id" class="order-card" @click="goDetail(order.id)">
        <view class="order-tag" :class="order.sizeClass">{{ order.sizeText }}</view>
        <view class="order-info">
          <text class="order-from">{{ order.pickupPoint }}</text>
          <view class="order-route">
            <view class="route-line"></view>
            <text class="order-to">{{ order.building }}</text>
          </view>
          <text class="order-meta">{{ order.time }}</text>
        </view>
        <view class="order-end">
          <text class="order-price">¥{{ order.price }}</text>
          <text v-if="order.tip > 0" class="order-tip">+{{ order.tip }}小费</text>
          <text class="order-state" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
      </view>
    </view>

    <!-- 配送时间说明 -->
    <view class="section">
      <view class="notice-card">
        <view class="notice-header">
          <text class="notice-icon">⏰</text>
          <text class="notice-title">配送时间说明</text>
        </view>
        <view class="notice-body">
          <view class="notice-row">
            <view class="notice-dot"></view>
            <text class="notice-text">工作日配送时间：8:00-22:00</text>
          </view>
          <view class="notice-row">
            <view class="notice-dot"></view>
            <text class="notice-text">周末/节假日：9:00-21:00</text>
          </view>
          <view class="notice-row">
            <view class="notice-dot"></view>
            <text class="notice-text">恶劣天气可能影响配送时效</text>
          </view>
          <view class="notice-row">
            <view class="notice-dot"></view>
            <text class="notice-text">大件/超大件请提前与骑手沟通</text>
          </view>
        </view>
      </view>
    </view>

    <ServiceFab />
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad, onUnload, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import ServiceFab from '@/components/ServiceFab.vue'

const schools = ['北京邮电大学（海淀校区）', '北京邮电大学（沙河校区）', '北京大学', '清华大学', '中国人民大学']
const currentSchool = ref(schools[0])

const switchSchool = () => {
  uni.showActionSheet({
    itemList: schools,
    success: (res) => {
      currentSchool.value = schools[res.tapIndex]
      uni.showToast({ title: '已切换', icon: 'success' })
    }
  })
}

const live = reactive({
  updatedAt: '刚刚', inTransit: 12, todayDelivered: 86, lastMinuteDelivered: 24, avgMinutes: 22
})

let liveTimer = null
const refreshLive = () => {
  const now = new Date()
  live.updatedAt = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
  live.inTransit = Math.max(6, live.inTransit + (Math.random() > 0.6 ? 1 : -1))
  live.todayDelivered += Math.random() > 0.7 ? 1 : 0
  live.avgMinutes = Math.min(35, Math.max(12, live.avgMinutes + (Math.random() > 0.6 ? -1 : 1)))
}

onLoad(() => { refreshLive(); liveTimer = setInterval(refreshLive, 15000) })
onShow(() => {})
onUnload(() => { if (liveTimer) clearInterval(liveTimer) })
onPullDownRefresh(() => {
  refreshLive()
  live.todayDelivered += Math.floor(Math.random() * 3) + 1
  setTimeout(() => { uni.stopPullDownRefresh() }, 800)
})

const latestOrders = ref([
  { id: 1, pickupPoint: '菜鸟驿站A区', building: '6号宿舍楼302', sizeText: '小件', sizeClass: 'small', price: 2, tip: 0, time: '10分钟前', statusText: '待接单', statusColor: '#DD6B20' },
  { id: 2, pickupPoint: '京东快递柜', building: '3号宿舍楼501', sizeText: '大件', sizeClass: 'large', price: 5, tip: 3, time: '20分钟前', statusText: '配送中', statusColor: '#38A169' },
  { id: 3, pickupPoint: '顺丰快递站', building: '1号宿舍楼108', sizeText: '超大件', sizeClass: 'xlarge', price: 20, tip: 5, time: '30分钟前', statusText: '待接单', statusColor: '#DD6B20' }
])

const sortedOrders = computed(() => [...latestOrders.value].sort((a, b) => b.tip - a.tip))

const goPage = (url) => { uni.navigateTo({ url }) }
const goDetail = (id) => { uni.navigateTo({ url: '/pages/express/detail?id=' + id }) }
const onSearchClick = () => { uni.showToast({ title: '搜索功能开发中', icon: 'none' }) }
</script>

<style scoped>
.home-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }

/* 顶部区域 */
.header-area { background: linear-gradient(160deg, #1A4F8B 0%, #2B6CB0 40%, #4299E1 100%); padding-bottom: 0; }
.search-bar { padding: 16rpx 28rpx 20rpx; }
.search-input { display: flex; align-items: center; background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border: 1rpx solid rgba(255,255,255,0.2); border-radius: 40rpx; padding: 18rpx 28rpx; transition: background 0.2s ease; }
.search-input:active { background: rgba(255,255,255,0.25); }
.search-icon { font-size: 26rpx; margin-right: 12rpx; opacity: 0.8; }
.search-placeholder { font-size: 26rpx; color: rgba(255,255,255,0.6); }

/* 送达卡片 */
.hero-card { margin: 0 28rpx; background: rgba(255,255,255,0.12); backdrop-filter: blur(20px); border: 1rpx solid rgba(255,255,255,0.18); border-radius: 20rpx 20rpx 0 0; padding: 28rpx 32rpx; display: flex; align-items: center; justify-content: center; }
.hero-content { display: flex; flex-direction: column; align-items: center; flex: 1; }
.hero-text-row { display: flex; align-items: baseline; justify-content: center; }
.hero-label { font-size: 28rpx; color: rgba(255,255,255,0.85); font-weight: 600; }
.hero-num { font-size: 56rpx; font-weight: 800; color: #fff; line-height: 1; margin: 0 6rpx; letter-spacing: -2rpx; }
.hero-sub { font-size: 20rpx; color: rgba(255,255,255,0.5); margin-top: 8rpx; display: block; text-align: center; }
.hero-gif-wrap { width: 110rpx; height: 110rpx; border-radius: 20rpx; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.hero-gif { width: 100rpx; height: 100rpx; }

/* 学校条 */
.school-strip { margin: 0 28rpx 0; background: #fff; padding: 18rpx 32rpx; display: flex; align-items: center; justify-content: space-between; border-radius: 0 0 20rpx 20rpx; box-shadow: 0 8rpx 24rpx rgba(26,79,139,0.12); transition: background 0.2s ease; }
.school-strip:active { background: #F7FAFC; }
.school-text { font-size: 24rpx; color: #4A5568; font-weight: 500; }
.school-switch { font-size: 22rpx; color: #2B6CB0; font-weight: 600; }

/* 通用区块 */
.section { padding: 28rpx 28rpx 0; }
.section-label { font-size: 32rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 20rpx; letter-spacing: 1rpx; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-link { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }

/* 快捷操作 */
.action-row { display: flex; gap: 20rpx; }
.action-card { flex: 1; background: #fff; border-radius: 20rpx; padding: 32rpx 0 24rpx; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04), 0 1rpx 4rpx rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.action-card:active { transform: scale(0.95); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.action-icon-bg { width: 80rpx; height: 80rpx; border-radius: 22rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 14rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1); transition: transform 0.25s ease; }
.action-card:active .action-icon-bg { transform: scale(1.1); }
.action-icon { font-size: 36rpx; }
.action-name { font-size: 24rpx; color: #2D3748; font-weight: 600; }

/* 订单卡片 */
.order-card { display: flex; align-items: center; background: #fff; border-radius: 18rpx; padding: 24rpx 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04), 0 1rpx 3rpx rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.order-card:active { transform: scale(0.98); box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08); }
.order-tag { padding: 8rpx 18rpx; border-radius: 10rpx; font-size: 22rpx; font-weight: 700; color: #fff; margin-right: 20rpx; letter-spacing: 1rpx; }
.order-tag.small { background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.order-tag.large { background: linear-gradient(135deg, #ED8936, #DD6B20); }
.order-tag.xlarge { background: linear-gradient(135deg, #FC8181, #E53E3E); }
.order-info { flex: 1; }
.order-from { font-size: 28rpx; font-weight: 600; color: #1A1A2E; display: block; }
.order-route { display: flex; align-items: center; margin-top: 8rpx; }
.route-line { width: 16rpx; height: 2rpx; background: #CBD5E0; margin-right: 8rpx; }
.order-to { font-size: 24rpx; color: #718096; }
.order-meta { font-size: 22rpx; color: #A0AEC0; display: block; margin-top: 6rpx; }
.order-end { text-align: right; min-width: 120rpx; }
.order-price { font-size: 34rpx; color: #E53E3E; font-weight: 800; display: block; }
.order-tip { font-size: 20rpx; color: #DD6B20; background: #FFFAF0; padding: 4rpx 12rpx; border-radius: 8rpx; display: inline-block; margin-top: 4rpx; font-weight: 600; }
.order-state { font-size: 22rpx; display: block; margin-top: 6rpx; font-weight: 600; }

/* 通知卡片 */
.notice-card { background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.notice-header { display: flex; align-items: center; margin-bottom: 20rpx; }
.notice-icon { font-size: 28rpx; margin-right: 10rpx; }
.notice-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.notice-body { background: #F7FAFC; border-radius: 14rpx; padding: 20rpx 24rpx; }
.notice-row { display: flex; align-items: center; padding: 8rpx 0; }
.notice-dot { width: 8rpx; height: 8rpx; border-radius: 50%; background: #4299E1; margin-right: 14rpx; flex-shrink: 0; }
.notice-text { font-size: 24rpx; color: #4A5568; line-height: 1.6; }
</style>
