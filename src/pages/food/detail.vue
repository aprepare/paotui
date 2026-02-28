<template>
  <view class="detail-page" v-if="order">
    <!-- 状态 Banner -->
    <view class="status-banner" :style="{ background: statusInfo.color }">
      <text class="sb-emoji">{{ statusEmoji }}</text>
      <text class="sb-text">{{ statusInfo.text }}</text>
    </view>

    <!-- 商品明细 -->
    <view class="section">
      <view class="section-title"><text>🛒 {{ order.shopName }}</text></view>
      <view class="order-item" v-for="(item, idx) in order.items" :key="idx">
        <text class="oi-name">{{ item.name }}</text>
        <text class="oi-qty">x{{ item.quantity }}</text>
        <text class="oi-price">¥{{ (item.price * item.quantity).toFixed(1) }}</text>
      </view>
      <view class="fee-row">
        <text class="fee-label">商品小计</text>
        <text class="fee-value">¥{{ (order.itemsTotal || 0).toFixed(2) }}</text>
      </view>
      <view class="fee-row">
        <text class="fee-label">配送费</text>
        <text class="fee-value">{{ order.deliveryMode === 'self_pickup' ? '免配送费' : '¥' + (order.deliveryFee || 0).toFixed(2) }}</text>
      </view>
      <view class="fee-row total">
        <text class="fee-label">合计</text>
        <text class="fee-total">¥{{ (order.totalPrice || 0).toFixed(2) }}</text>
      </view>
    </view>

    <!-- 配送信息 -->
    <view class="section">
      <view class="section-title"><text>📍 {{ order.deliveryMode === 'self_pickup' ? '自取信息' : '配送信息' }}</text></view>
      <view class="info-row">
        <text class="info-label">配送方式</text>
        <text class="info-value">{{ order.deliveryMode === 'self_pickup' ? '🏪 到店自取' : '🚴 骑手配送' }}</text>
      </view>
      <view class="info-row" v-if="order.deliveryMode === 'delivery' && order.address">
        <text class="info-label">收货地址</text>
        <text class="info-value">{{ order.address }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">联系电话</text>
        <text class="info-value">{{ order.phone }}</text>
      </view>
      <view class="info-row" v-if="order.userName">
        <text class="info-label">联系人</text>
        <text class="info-value">{{ order.userName }}</text>
      </view>
      <view class="info-row" v-if="order.remark">
        <text class="info-label">备注</text>
        <text class="info-value">{{ order.remark }}</text>
      </view>
    </view>

    <!-- 骑手信息 -->
    <view class="section" v-if="order.deliveryMode === 'delivery' && order.riderId && order.status >= 2">
      <view class="section-title"><text>🏍️ 骑手信息</text></view>
      <view class="info-row">
        <text class="info-label">骑手</text>
        <text class="info-value">{{ order.riderName || '未知' }}</text>
      </view>
      <view class="info-row" v-if="order.riderPhone">
        <text class="info-label">电话</text>
        <text class="info-value">{{ order.riderPhone }}</text>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="section">
      <view class="section-title"><text>📋 订单信息</text></view>
      <view class="info-row">
        <text class="info-label">订单号</text>
        <text class="info-value id-text">{{ order._id }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">下单时间</text>
        <text class="info-value">{{ formatTime(order.createTime) }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-bar" v-if="showActions">
      <view class="action-btn cancel" v-if="order.status <= 1" @click="cancelOrder">
        <text>取消订单</text>
      </view>
    </view>
  </view>
  <view class="loading" v-else>
    <text>加载中...</text>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'
import { getStatusInfo, canCancel } from '@/utils/foodOrder.js'

const order = ref(null)
const orderId = ref('')

const statusInfo = computed(() => {
  if (!order.value) return { text: '', color: '#DD6B20' }
  return getStatusInfo(order.value.status, order.value.deliveryMode)
})

const statusEmoji = computed(() => {
  const map = { 0: '⏳', 1: '👨‍🍳', 2: order.value?.deliveryMode === 'self_pickup' ? '🏪' : '🚴', 3: '✅', 4: '❌' }
  return map[order.value?.status] || '⏳'
})

const showActions = computed(() => {
  if (!order.value) return false
  return canCancel(order.value.status)
})

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const loadOrder = async () => {
  const res = await callCloud('food', 'orderDetail', { orderId: orderId.value })
  if (res.code === 0) {
    order.value = res.data
  } else {
    uni.showToast({ title: res.msg || '加载失败', icon: 'none' })
  }
}

const cancelOrder = async () => {
  const [err, res] = await uni.showModal({ title: '提示', content: '确定取消订单吗？' }).then(r => [null, r]).catch(e => [e])
  if (err || !res.confirm) return
  const r = await callCloud('food', 'cancelOrder', { orderId: orderId.value })
  if (r.code === 0) {
    uni.showToast({ title: '已取消', icon: 'success' })
    loadOrder()
  } else {
    uni.showToast({ title: r.msg || '取消失败', icon: 'none' })
  }
}

onLoad((opts) => {
  orderId.value = opts.id || ''
  if (orderId.value) loadOrder()
})
</script>

<style scoped>
.detail-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 140rpx; }
.loading { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
.loading text { font-size: 28rpx; color: #A0AEC0; }

.status-banner { padding: 40rpx 32rpx; display: flex; align-items: center; gap: 16rpx; }
.sb-emoji { font-size: 48rpx; }
.sb-text { font-size: 34rpx; font-weight: 700; color: #fff; }

.section { background: #fff; border-radius: 20rpx; padding: 24rpx; margin: 20rpx 24rpx 0; }
.section-title { margin-bottom: 16rpx; }
.section-title text { font-size: 30rpx; font-weight: 700; color: #1A1A2E; }

.order-item { display: flex; align-items: center; padding: 14rpx 0; border-bottom: 1rpx solid #F7FAFC; }
.order-item:last-child { border-bottom: none; }
.oi-name { flex: 1; font-size: 26rpx; color: #2D3748; }
.oi-qty { font-size: 24rpx; color: #A0AEC0; margin: 0 20rpx; }
.oi-price { font-size: 26rpx; color: #DD6B20; font-weight: 600; }

.fee-row { display: flex; justify-content: space-between; padding: 10rpx 0; }
.fee-label { font-size: 26rpx; color: #718096; }
.fee-value { font-size: 26rpx; color: #2D3748; }
.fee-row.total { border-top: 1rpx solid #EDF2F7; padding-top: 16rpx; margin-top: 8rpx; }
.fee-total { font-size: 34rpx; font-weight: 800; color: #DD6B20; }

.info-row { display: flex; padding: 12rpx 0; border-bottom: 1rpx solid #F7FAFC; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 26rpx; color: #718096; width: 140rpx; flex-shrink: 0; }
.info-value { font-size: 26rpx; color: #2D3748; flex: 1; word-break: break-all; }
.id-text { font-size: 22rpx; color: #A0AEC0; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 32rpx; background: #fff; box-shadow: 0 -2rpx 12rpx rgba(0,0,0,0.06); display: flex; gap: 20rpx; }
.action-btn { flex: 1; text-align: center; padding: 20rpx 0; border-radius: 36rpx; }
.action-btn text { font-size: 28rpx; font-weight: 600; }
.action-btn.cancel { background: #FFF5F5; border: 1rpx solid #FEB2B2; }
.action-btn.cancel text { color: #E53E3E; }
</style>