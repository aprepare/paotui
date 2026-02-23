<template>
  <view class="home-page">
    <!-- 顶部区域 -->
    <view class="header-area">
      <!-- 送达数据卡片 -->
      <view class="hero-card">
        <view class="hero-left">
          <text class="hero-title">已成功送达</text>
          <view class="hero-num-row">
            <text class="hero-num">{{ live.todayDelivered }}</text>
            <text class="hero-unit">件</text>
          </view>
          <text class="hero-sub">实时更新</text>
        </view>
        <view class="hero-right">
          <image class="hero-gif" src="/static/kuaidi.jpg" mode="aspectFit" />
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="section">
      <text class="section-label">快捷操作</text>
      <view class="action-row">
        <view class="action-item" v-for="act in actions" :key="act.text" @click="goPage(act.link)">
          <image v-if="act.iconUrl" class="action-img" :src="act.iconUrl" mode="aspectFit" />
          <text v-else class="action-emoji">{{ act.emoji }}</text>
          <text class="action-name">{{ act.text }}</text>
        </view>
      </view>
    </view>

    <!-- 最新快递订单 -->
    <view class="section">
      <view class="section-head">
        <text class="section-label">最新订单</text>
        <text class="section-link" @click="goPage('/pages/order/all')">查看全部 ›</text>
      </view>
      <scroll-view scroll-x class="building-filter">
        <view class="filter-inner">
          <view v-for="b in buildingTabs" :key="b.name" class="filter-tab" :class="{active: selectedBuilding === b.name}" @click="selectedBuilding = b.name">
            <text class="filter-text">{{ b.name }}</text>
            <view v-if="b.count > 0" class="filter-badge"><text>{{ b.count }}</text></view>
          </view>
        </view>
      </scroll-view>
      <view v-for="order in filteredOrders" :key="order.id" class="order-card" @click="goDetail(order.id, order.orderType)">
        <view class="order-tag" :class="order.sizeClass">{{ order.sizeText }}</view>
        <view class="order-info">
          <text class="order-from">{{ order.building }}</text>
          <view class="order-route">
            <view class="route-line"></view>
            <text class="order-to">{{ order.pickupPoint }}</text>
          </view>
          <text class="order-meta">{{ order.time }}</text>
        </view>
        <view class="order-end">
          <text class="order-price">¥{{ order.totalPrice }}</text>
          <view v-if="order.tip > 0" class="order-tip-row">
            <text class="order-tip-label">含小费</text>
            <text class="order-tip-num">+{{ order.tip }}</text>
          </view>
          <text class="order-state" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
      </view>
      <view v-if="filteredOrders.length === 0" class="empty-orders">
        <text>该楼栋暂无订单</text>
      </view>
    </view>

    <!-- 轮播图 -->
    <view class="section">
      <swiper class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500" :circular="true" indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#fff">
        <swiper-item v-for="item in banners" :key="item.id">
          <view class="banner-item" :style="{ background: item.bg }">
            <text class="banner-emoji">{{ item.emoji }}</text>
            <view class="banner-text-area">
              <text class="banner-title">{{ item.title }}</text>
              <text class="banner-desc">{{ item.desc }}</text>
            </view>
          </view>
        </swiper-item>
      </swiper>
    </view>

    <MsgNotify />
    <ServiceFab />
      <CustomTabBar :current="0" />
  </view>
</template>

<script setup>
import CustomTabBar from '@/components/CustomTabBar.vue'
import { ref, reactive, computed } from 'vue'
import { onLoad, onUnload, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { callCloud, checkLogin } from '@/utils/cloud.js'
import ServiceFab from '@/components/ServiceFab.vue'
import MsgNotify from '@/components/MsgNotify.vue'

const defaultBanners = [
  { id: 1, emoji: '📦', title: '快递代取 极速送达', desc: '下单后最快30分钟送到宿舍', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
  { id: 2, emoji: '🏃', title: '万能跑腿 有求必应', desc: '买饭、打印、取件 一键搞定', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
  { id: 3, emoji: '🎉', title: '新用户首单立减', desc: '注册即享优惠 快来体验吧', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
]
const banners = ref(defaultBanners)

const defaultActions = [
  { emoji: '📦', iconUrl: '/static/action/kuaidi.png', text: '代取快递', link: '/pages/express/create', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
  { emoji: '🏃', iconUrl: '/static/action/paotui.png', text: '万能跑腿', link: '/pages/errand/create', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
  { emoji: '🏅', iconUrl: '/static/action/qishou.png', text: '骑手注册', link: '/pages/express/rider-register', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
]
const actions = ref(defaultActions)

const loadPageConfig = async () => {
  try {
    const res = await callCloud('home', 'getPageConfig')
    if (res.code === 0 && res.data) {
      if (res.data.banners && res.data.banners.length > 0) {
        banners.value = res.data.banners.map((it, i) => ({
          id: i + 1, emoji: it.emoji || '', title: it.title || '', desc: it.desc || '',
          bg: it.bg || 'linear-gradient(135deg, #4299E1, #2B6CB0)'
        }))
      }
      if (res.data.actions && res.data.actions.length > 0) {
        actions.value = res.data.actions.map(it => ({
          emoji: it.emoji || '', text: it.text || '', link: it.link || '',
          bg: it.bg || 'linear-gradient(135deg, #4299E1, #2B6CB0)'
        }))
      }
    }
  } catch (e) { /* 使用默认配置 */ }
}

const live = reactive({ updatedAt: '加载中', todayDelivered: 0 })

const refreshLive = async () => {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  live.updatedAt = h + ':' + m + ':' + s
  const res = await callCloud('home', 'getLiveData')
  if (res.code === 0) {
    live.todayDelivered = res.data.todayDelivered || 0
  }
}

let liveTimer = null

const statusTextMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
const statusColorMap = { 0: '#DD6B20', 1: '#2B6CB0', 2: '#38A169', 3: '#A0AEC0', 4: '#E53E3E' }
const errandStatusTextMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消', 4: '待确认' }
const errandStatusColorMap = { 0: '#DD6B20', 1: '#38A169', 2: '#A0AEC0', 3: '#E53E3E', 4: '#2B6CB0' }

const latestOrders = ref([])

const loadOrders = async () => {
  const res = await callCloud('home', 'getLatestOrders', { limit: 20 })
  if (res.code === 0) {
    latestOrders.value = res.data.map(o => {
      var isErrand = o.orderType === 'errand'
      return {
        ...o,
        id: o._id,
        orderType: o.orderType || 'express',
        building: isErrand ? (o.toAddr || '') : (o.building + (o.room || '')),
        buildingName: isErrand ? (o.toAddr || '跑腿') : (o.building || '未知楼栋'),
        totalPrice: (o.price || 0) + (o.tip || 0),
        statusText: isErrand ? (errandStatusTextMap[o.status] || '待接单') : (statusTextMap[o.status] || '待接单'),
        statusColor: isErrand ? (errandStatusColorMap[o.status] || '#DD6B20') : (statusColorMap[o.status] || '#DD6B20'),
        time: formatTime(o.createTime)
      }
    })
  }
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = Math.floor((now - d) / 60000)
  if (diff < 1) return '刚刚'
  if (diff < 60) return diff + '分钟前'
  if (diff < 1440) return Math.floor(diff / 60) + '小时前'
  return Math.floor(diff / 1440) + '天前'
}

// 排序优先级：待接单 > 配送中/进行中 > 已接单 > 已完成 > 已取消
// 快递状态：0=待接单, 1=已接单, 2=配送中, 3=已完成, 4=已取消
// 跑腿状态：0=待接单, 1=进行中, 2=已完成, 3=已取消
var expressPriority = { 0: 0, 2: 1, 1: 2, 3: 3, 4: 4 }
var errandPriority = { 0: 0, 1: 1, 4: 2, 2: 3, 3: 4 }
const sortedOrders = computed(() => [...latestOrders.value].sort((a, b) => {
  var pm = a.orderType === 'errand' ? errandPriority : expressPriority
  var pm2 = b.orderType === 'errand' ? errandPriority : expressPriority
  var aOrder = pm[a.status] !== undefined ? pm[a.status] : 5
  var bOrder = pm2[b.status] !== undefined ? pm2[b.status] : 5
  if (aOrder !== bOrder) return aOrder - bOrder
  return (b.tip || 0) - (a.tip || 0)
}))

const selectedBuilding = ref('全部')

// 只保留待接单和配送中/进行中的订单
const activeOrders = computed(() => sortedOrders.value.filter(o => {
  if (o.orderType === 'errand') return o.status === 0 || o.status === 1
  return o.status === 0 || o.status === 2
}))

const buildingTabs = computed(() => {
  var map = {}
  activeOrders.value.forEach(function(o) {
    var name = o.buildingName || '未知'
    if (!map[name]) map[name] = 0
    map[name]++
  })
  var tabs = [{ name: '全部', count: activeOrders.value.length }]
  Object.keys(map).forEach(function(k) {
    tabs.push({ name: k, count: map[k] })
  })
  return tabs
})

const filteredOrders = computed(() => {
  var list = activeOrders.value
  if (selectedBuilding.value !== '全部') {
    list = list.filter(function(o) { return o.buildingName === selectedBuilding.value })
  }
  return list.slice(0, 5)
})

onLoad(() => {
  refreshLive()
  loadOrders()
  loadPageConfig()
  liveTimer = setInterval(refreshLive, 30000)
})
onShow(() => {
  uni.hideTabBar({ animation: false })
  loadOrders() })
onUnload(() => { if (liveTimer) clearInterval(liveTimer) })
onPullDownRefresh(async () => {
  await Promise.all([refreshLive(), loadOrders()])
  uni.stopPullDownRefresh()
})

const goPage = (url) => {
  if (!checkLogin()) return
  uni.navigateTo({ url })
}
const goDetail = (id, orderType) => {
  if (orderType === 'errand') {
    uni.navigateTo({ url: '/pages/errand/detail?id=' + id })
  } else {
    uni.navigateTo({ url: '/pages/express/detail?id=' + id })
  }
}
</script>

<style scoped>
.home-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }

/* 顶部区域 */
.header-area { background: linear-gradient(160deg, #1A4F8B 0%, #2B6CB0 40%, #4299E1 100%); padding: 32rpx 0 40rpx; }

/* 送达卡片 */
.hero-card { margin: 0 28rpx; background: rgba(255,255,255,0.12); backdrop-filter: blur(20px); border: 1rpx solid rgba(255,255,255,0.18); border-radius: 20rpx; padding: 36rpx 32rpx; display: flex; align-items: center; }
.hero-left { flex: 1; display: flex; flex-direction: column; }
.hero-title { font-size: 30rpx; color: rgba(255,255,255,0.85); font-weight: 600; }
.hero-num-row { display: flex; align-items: baseline; margin-top: 12rpx; }
.hero-num { font-size: 72rpx; font-weight: 800; color: #fff; line-height: 1; }
.hero-unit { font-size: 30rpx; color: rgba(255,255,255,0.85); font-weight: 600; margin-left: 6rpx; }
.hero-sub { font-size: 22rpx; color: rgba(255,255,255,0.5); margin-top: 10rpx; }
.hero-right { width: 180rpx; height: 160rpx; border-radius: 20rpx; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; }
.hero-gif { width: 150rpx; height: 150rpx; }
.hero-emoji { font-size: 80rpx; }

/* 通用区块 */
.section { padding: 28rpx 28rpx 0; }
.section-label { font-size: 32rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 20rpx; letter-spacing: 1rpx; }
.section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.section-link { font-size: 26rpx; color: #fff; font-weight: 700; background: linear-gradient(135deg, #4299E1, #2B6CB0); padding: 10rpx 24rpx; border-radius: 24rpx; }

/* 快捷操作 */
.action-row { display: flex; justify-content: space-around; padding: 8rpx 0; }
.action-item { display: flex; flex-direction: column; align-items: center; padding: 16rpx 0; }
.action-item:active { opacity: 0.7; }
.action-img { width: 120rpx; height: 120rpx; margin-bottom: 12rpx; }
.action-emoji { font-size: 56rpx; margin-bottom: 12rpx; }
.action-name { font-size: 24rpx; color: #2D3748; font-weight: 600; }

/* 楼栋筛选 */
.building-filter { white-space: nowrap; margin-bottom: 20rpx; }
.filter-inner { display: inline-flex; gap: 16rpx; padding: 4rpx 0; }
.filter-tab { display: inline-flex; align-items: center; padding: 14rpx 28rpx; background: #fff; border-radius: 36rpx; border: 2rpx solid #E2E8F0; }
.filter-tab.active { border-color: #2B6CB0; background: #EBF4FF; }
.filter-text { font-size: 24rpx; color: #4A5568; font-weight: 600; }
.filter-tab.active .filter-text { color: #2B6CB0; }
.filter-badge { min-width: 32rpx; height: 32rpx; background: #E53E3E; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; padding: 0 8rpx; margin-left: 8rpx; }
.filter-badge text { font-size: 18rpx; color: #fff; font-weight: 700; }
.empty-orders { padding: 60rpx 0; text-align: center; }
.empty-orders text { font-size: 26rpx; color: #A0AEC0; }

/* 订单卡片 */
.order-card { display: flex; align-items: center; background: #fff; border-radius: 18rpx; padding: 24rpx 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04), 0 1rpx 3rpx rgba(0,0,0,0.06); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.order-card:active { transform: scale(0.98); box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08); }
.order-tag { padding: 8rpx 18rpx; border-radius: 10rpx; font-size: 22rpx; font-weight: 700; color: #fff; margin-right: 20rpx; letter-spacing: 1rpx; }
.order-tag.small { background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.order-tag.large { background: linear-gradient(135deg, #ED8936, #DD6B20); }
.order-tag.xlarge { background: linear-gradient(135deg, #FC8181, #E53E3E); }
.order-tag.errand { background: linear-gradient(135deg, #F6AD55, #DD6B20); }
.order-info { flex: 1; }
.order-from { font-size: 28rpx; font-weight: 600; color: #1A1A2E; display: block; }
.order-route { display: flex; align-items: center; margin-top: 8rpx; }
.route-line { width: 16rpx; height: 2rpx; background: #CBD5E0; margin-right: 8rpx; }
.order-to { font-size: 24rpx; color: #718096; }
.order-meta { font-size: 22rpx; color: #A0AEC0; display: block; margin-top: 6rpx; }
.order-end { text-align: right; min-width: 120rpx; }
.order-price { font-size: 50rpx; color: #E53E3E; font-weight: 800; display: block; }
.order-tip-row { display: flex; align-items: baseline; justify-content: flex-end; margin-top: 4rpx; }
.order-tip-label { font-size: 20rpx; color: #2B6CB0; font-weight: 500; margin-right: 4rpx; }
.order-tip-num { font-size: 40rpx; color: #2B6CB0; font-weight: 700; }
.order-state { font-size: 22rpx; display: block; margin-top: 6rpx; font-weight: 600; }

/* 轮播图 */
.banner-swiper { height: 240rpx; border-radius: 20rpx; overflow: hidden; }
.banner-item { width: 100%; height: 240rpx; display: flex; align-items: center; padding: 0 40rpx; box-sizing: border-box; }
.banner-emoji { font-size: 80rpx; margin-right: 28rpx; }
.banner-text-area { display: flex; flex-direction: column; }
.banner-title { font-size: 32rpx; font-weight: 800; color: #fff; margin-bottom: 10rpx; }
.banner-desc { font-size: 24rpx; color: rgba(255,255,255,0.85); }
</style>
