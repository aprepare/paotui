<template>
  <view class="all-orders">
    <view class="tab-bar">
      <view class="tab-item" :class="{active: currentTab === 0}" @click="currentTab = 0">
        <text>📦 快递订单</text>
      </view>
      <view class="tab-item" :class="{active: currentTab === 1}" @click="currentTab = 1">
        <text>🏃 跑腿订单</text>
      </view>
    </view>
    <view class="order-list">
      <view v-for="order in displayList" :key="order.id" class="order-card" @click="goDetail(order)">
        <view class="order-tag" :class="order.tagClass">{{ order.tagText }}</view>
        <view class="order-info">
          <text class="order-from">{{ order.from }}</text>
          <view class="order-route" v-if="order.to">
            <view class="route-line"></view>
            <text class="order-to">{{ order.to }}</text>
          </view>
          <text class="order-meta">{{ order.time }}</text>
        </view>
        <view class="order-end">
          <text class="order-price">¥{{ order.price }}</text>
          <view v-if="order.tip > 0" class="order-tip-row">
            <text class="order-tip-label">含小费</text>
            <text class="order-tip-num">+{{ order.tip }}</text>
          </view>
          <text class="order-state" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
      </view>
      <view v-if="displayList.length === 0 && !loading" class="empty">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

const currentTab = ref(0)
const loading = ref(false)
const expressList = ref([])
const errandList = ref([])

const statusTextMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
const statusColorMap = { 0: '#DD6B20', 1: '#2B6CB0', 2: '#38A169', 3: '#A0AEC0', 4: '#E53E3E' }
const errandStatusTextMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消', 4: '待确认' }
const errandStatusColorMap = { 0: '#DD6B20', 1: '#38A169', 2: '#A0AEC0', 3: '#E53E3E', 4: '#2B6CB0' }

const fmtTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const diff = Math.floor((Date.now() - d) / 60000)
  if (diff < 1) return '刚刚'
  if (diff < 60) return diff + '分钟前'
  if (diff < 1440) return Math.floor(diff / 60) + '小时前'
  return Math.floor(diff / 1440) + '天前'
}

const loadData = async () => {
  loading.value = true
  const res = await callCloud('home', 'getLatestOrders', { limit: 50 })
  if (res.code === 0) {
    const eArr = [], rArr = []
    res.data.forEach(o => {
      if (o.orderType === 'errand') {
        rArr.push({ id: o._id, type: 'errand', from: o.title || o.desc || '', to: o.toAddr || '',
          price: o.price || 0, time: fmtTime(o.createTime), tagText: '跑腿', tagClass: 'errand',
          statusText: errandStatusTextMap[o.status] || '待接单', statusColor: errandStatusColorMap[o.status] || '#DD6B20' })
      } else {
        eArr.push({ id: o._id, type: 'express', from: o.pickupPoint || '', to: (o.building || '') + (o.room || ''),
          price: (o.price || 0) + (o.tip || 0), tip: o.tip || 0, time: fmtTime(o.createTime),
          tagText: o.sizeText || '快递', tagClass: o.sizeClass || 'small',
          statusText: statusTextMap[o.status] || '待接单', statusColor: statusColorMap[o.status] || '#DD6B20' })
      }
    })
    expressList.value = eArr
    errandList.value = rArr
  }
  loading.value = false
}

onShow(() => { loadData() })

const displayList = computed(() => currentTab.value === 0 ? expressList.value : errandList.value)

const goDetail = (order) => {
  if (order.type === 'errand') uni.navigateTo({ url: '/pages/errand/detail?id=' + order.id })
  else uni.navigateTo({ url: '/pages/express/detail?id=' + order.id })
}
</script>

<style scoped>
.all-orders { background: #F0F2F5; min-height: 100vh; }
.tab-bar { display: flex; background: #fff; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 28rpx; color: #718096; font-weight: 600; border-bottom: 4rpx solid transparent; }
.tab-item.active { color: #2B6CB0; border-bottom-color: #2B6CB0; }
.tab-item text { font-size: 28rpx; }
.order-list { padding: 20rpx 28rpx; }
.order-card { display: flex; align-items: center; background: #fff; border-radius: 18rpx; padding: 24rpx 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.order-card:active { transform: scale(0.98); }
.order-tag { padding: 8rpx 18rpx; border-radius: 10rpx; font-size: 22rpx; font-weight: 700; color: #fff; margin-right: 20rpx; }
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
.order-price { font-size: 34rpx; color: #E53E3E; font-weight: 800; display: block; }
.order-tip-row { display: flex; align-items: baseline; justify-content: flex-end; margin-top: 4rpx; }
.order-tip-label { font-size: 20rpx; color: #DD6B20; font-weight: 500; margin-right: 4rpx; }
.order-tip-num { font-size: 60rpx; color: #DD6B20; font-weight: 800; line-height: 1; }
.order-state { font-size: 22rpx; display: block; margin-top: 6rpx; font-weight: 600; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; margin-top: 16rpx; }
</style>
