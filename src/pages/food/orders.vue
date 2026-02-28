<template>
  <view class="orders-page">
    <view class="order-card" v-for="o in orders" :key="o._id" @click="goDetail(o)">
      <view class="oc-header">
        <view class="oc-header-left">
          <text class="oc-shop">{{ o.shopName }}</text>
          <text class="oc-mode" v-if="o.deliveryMode">{{ o.deliveryMode === 'self_pickup' ? '🏪自取' : '🚴配送' }}</text>
        </view>
        <text class="oc-status" :class="'st' + o.status">{{ o.statusText || statusMap[o.status] }}</text>
      </view>
      <view class="oc-items">
        <view class="oc-item" v-for="(item, idx) in o.items" :key="idx">
          <text class="oci-name">{{ item.name }} x{{ item.quantity }}</text>
          <text class="oci-price">¥{{ (item.price * item.quantity).toFixed(1) }}</text>
        </view>
      </view>
      <view class="oc-footer">
        <text class="oc-time">{{ fmtDate(o.createTime) }}</text>
        <text class="oc-total">合计 ¥{{ (o.totalPrice || 0).toFixed(2) }}</text>
      </view>
      <view class="oc-actions" v-if="o.status === 0">
        <view class="oc-btn cancel" @click.stop="cancelOrder(o)"><text>取消订单</text></view>
      </view>
    </view>

    <view class="empty" v-if="loaded && !orders.length">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无外卖订单</text>
    </view>

    <view class="load-more" v-if="hasMore" @click="loadMore"><text>加载更多</text></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'

const orders = ref([])
const loaded = ref(false)
const hasMore = ref(false)
const statusMap = { 0: '待确认', 1: '制作中', 2: '配送中', 3: '已完成', 4: '已取消' }
let page = 1

const loadOrders = async () => {
  const res = await callCloud('food', 'myOrders', { page })
  if (res.code === 0) {
    orders.value = page === 1 ? (res.data || []) : orders.value.concat(res.data || [])
    hasMore.value = (res.data || []).length >= 20
  }
  loaded.value = true
}

const loadMore = () => { page++; loadOrders() }

const goDetail = (o) => {
  uni.navigateTo({ url: '/pages/food/detail?id=' + o._id })
}

const cancelOrder = (o) => {
  uni.showModal({ title: '确认取消', content: '确定取消该订单？', success: async (r) => {
    if (r.confirm) {
      const res = await callCloud('food', 'cancelOrder', { orderId: o._id })
      if (res.code === 0) { uni.showToast({ title: '已取消', icon: 'success' }); page = 1; loadOrders() }
    }
  }})
}

const fmtDate = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return (d.getMonth()+1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0')
}

onShow(() => { page = 1; loadOrders() })
</script>

<style scoped>
.orders-page { background: #F0F2F5; min-height: 100vh; padding: 20rpx 24rpx; }
.order-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.oc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.oc-header-left { display: flex; align-items: center; gap: 12rpx; }
.oc-shop { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }
.oc-mode { font-size: 22rpx; padding: 2rpx 12rpx; border-radius: 6rpx; background: #EBF8FF; color: #4299E1; }
.oc-status { font-size: 24rpx; padding: 4rpx 16rpx; border-radius: 8rpx; }
.oc-status.st0 { background: #FFFAF0; color: #DD6B20; }
.oc-status.st1 { background: #EBF4FF; color: #2B6CB0; }
.oc-status.st2 { background: #F0FFF4; color: #38A169; }
.oc-status.st3 { background: #F7FAFC; color: #A0AEC0; }
.oc-status.st4 { background: #FFF5F5; color: #E53E3E; }
.oc-items { border-top: 1rpx solid #F7FAFC; padding-top: 12rpx; }
.oc-item { display: flex; justify-content: space-between; padding: 8rpx 0; }
.oci-name { font-size: 26rpx; color: #4A5568; }
.oci-price { font-size: 26rpx; color: #DD6B20; }
.oc-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12rpx; padding-top: 12rpx; border-top: 1rpx solid #F7FAFC; }
.oc-time { font-size: 22rpx; color: #A0AEC0; }
.oc-total { font-size: 28rpx; font-weight: 700; color: #DD6B20; }
.oc-actions { display: flex; justify-content: flex-end; margin-top: 12rpx; gap: 16rpx; }
.oc-btn { padding: 10rpx 28rpx; border-radius: 24rpx; }
.oc-btn text { font-size: 24rpx; font-weight: 600; }
.oc-btn.cancel { border: 2rpx solid #E53E3E; }
.oc-btn.cancel text { color: #E53E3E; }
.empty { text-align: center; padding: 120rpx 0; }
.empty-icon { font-size: 64rpx; display: block; }
.empty-text { font-size: 28rpx; color: #A0AEC0; display: block; margin-top: 16rpx; }
.load-more { text-align: center; padding: 20rpx; }
.load-more text { font-size: 26rpx; color: #DD6B20; }
</style>
