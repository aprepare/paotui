<template>
  <view class="order-detail">
    <view class="status-banner" :style="{background: statusColor}">
      <text class="status-emoji">{{ statusEmoji }}</text>
      <text class="status-text">{{ order.statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>
    <view class="steps-bar">
      <view v-for="(step, i) in steps" :key="i" class="step-item" :class="{done: i <= order.status, current: i === order.status}">
        <view class="step-dot"></view>
        <text class="step-label">{{ step }}</text>
        <view v-if="i < steps.length - 1" class="step-line" :class="{done: i < order.status}"></view>
      </view>
    </view>
    <view class="info-card">
      <text class="card-title">📦 订单信息</text>
      <view class="info-row">
        <text class="info-label">订单类型</text>
        <text class="info-value">{{ order.type }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">物品描述</text>
        <text class="info-value">{{ order.desc }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">报酬</text>
        <text class="info-value price">¥{{ order.price }}</text>
      </view>
    </view>
    <view class="info-card">
      <text class="card-title">📍 地址信息</text>
      <view class="addr-item">
        <view class="addr-dot from"></view>
        <view class="addr-detail">
          <text class="addr-label">取件地址</text>
          <text class="addr-text">{{ order.fromAddr }}</text>
        </view>
      </view>
      <view class="addr-line"></view>
      <view class="addr-item">
        <view class="addr-dot to"></view>
        <view class="addr-detail">
          <text class="addr-label">送达地址</text>
          <text class="addr-text">{{ order.toAddr }}</text>
        </view>
      </view>
    </view>
    <view class="info-card" v-if="order.runner">
      <text class="card-title">🏃 跑腿员</text>
      <view class="runner-info">
        <text class="runner-avatar">{{ order.runner.avatar }}</text>
        <view class="runner-detail">
          <text class="runner-name">{{ order.runner.name }}</text>
          <text class="runner-phone">{{ order.runner.phone }}</text>
        </view>
        <view class="call-btn" @click="callRunner">
          <text>📞 联系</text>
        </view>
      </view>
    </view>
    <view class="action-bar" v-if="showAction">
      <view class="action-btn" @click="nextStep">
        <text>{{ actionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

const steps = ['待接单', '已接单', '配送中', '已完成']
const orderId = ref('')
const orderType = ref('')
const isOwner = ref(false)
const isRider = ref(false)

const expressStatusTextMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
const errandStatusTextMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消' }

const order = ref({
  id: '', type: '加载中...', desc: '', price: 0,
  fromAddr: '', toAddr: '',
  status: 0, statusText: '加载中...',
  runner: null,
  time: ''
})

onLoad((opts) => {
  if (opts && opts.id) {
    orderId.value = opts.id
    loadDetail(opts.id)
  }
  var userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.isRider) isRider.value = true
})

const loadDetail = async (id) => {
  // Try express first
  let res = await callCloud('express', 'detail', { id: id })
  if (res.code === 0 && res.data) {
    const d = res.data
    orderType.value = 'express'
    var userInfo = uni.getStorageSync('userInfo')
    var myOpenid = ''
    if (userInfo && userInfo.openid) myOpenid = userInfo.openid
    isOwner.value = (d.openid && myOpenid && d.openid === myOpenid)
    order.value = {
      id: d._id,
      type: '代取快递',
      desc: d.remark || d.pickupCode || '',
      price: (d.price || 0) + (d.tip || 0),
      fromAddr: d.pickupPoint || '',
      toAddr: (d.building || '') + (d.room || ''),
      status: d.status || 0,
      statusText: expressStatusTextMap[d.status] || '待接单',
      runner: d.riderId ? { avatar: '🧑‍🎓', name: '骑手', phone: '' } : null,
      time: ''
    }
    return
  }
  // Try errand
  res = await callCloud('errand', 'detail', { id: id })
  if (res.code === 0 && res.data) {
    const d = res.data
    orderType.value = 'errand'
    var userInfo2 = uni.getStorageSync('userInfo')
    var myOpenid2 = ''
    if (userInfo2 && userInfo2.openid) myOpenid2 = userInfo2.openid
    isOwner.value = (d.openid && myOpenid2 && d.openid === myOpenid2)
    order.value = {
      id: d._id,
      type: '万能跑腿',
      desc: d.title || d.desc || '',
      price: d.price || 0,
      fromAddr: d.fromAddr || '',
      toAddr: d.toAddr || '',
      status: d.status || 0,
      statusText: errandStatusTextMap[d.status] || '待接单',
      runner: d.riderId ? { avatar: '🧑‍🎓', name: '跑腿员', phone: '' } : null,
      time: ''
    }
  }
}

const statusColor = computed(() => {
  const colors = ['linear-gradient(135deg,#FF9800,#F57C00)', 'linear-gradient(135deg,#4A90D9,#357ABD)', 'linear-gradient(135deg,#66BB6A,#43A047)', 'linear-gradient(135deg,#9E9E9E,#757575)']
  return colors[order.value.status]
})
const statusEmoji = computed(() => ['⏳', '✅', '🚀', '🎉'][order.value.status])
const statusDesc = computed(() => ['等待跑腿员接单...', '跑腿员已接单，即将出发', '跑腿员正在配送中', '订单已完成'][order.value.status])
const actionText = computed(() => {
  var s = order.value.status
  if (isOwner.value && s === 0) return '取消订单'
  if (isOwner.value && s === 2) return '确认收货'
  if (!isOwner.value && isRider.value && s === 0) return '接受订单'
  if (isRider.value && s === 1) return '确认取件'
  if (isRider.value && s === 2) return '确认送达'
  return ''
})

const showAction = computed(() => {
  return actionText.value !== ''
})

const nextStep = async () => {
  if (order.value.status >= 3) return
  // 发布者取消订单
  if (isOwner.value && order.value.status === 0 && !isRider.value) {
    uni.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          var cloudName = orderType.value === 'express' ? 'express' : 'errand'
          var idKey = orderType.value === 'express' ? 'orderId' : 'taskId'
          var res = await callCloud(cloudName, 'cancel', { [idKey]: orderId.value })
          if (res.code === 0) {
            uni.showToast({ title: '订单已取消', icon: 'success' })
            setTimeout(function() { uni.navigateBack() }, 1000)
          }
        }
      }
    })
    return
  }
  // 发布者确认收货
  if (isOwner.value && order.value.status === 2 && !isRider.value) {
    var nextStatus2 = 3
    var cloudName2 = orderType.value === 'express' ? 'express' : 'errand'
    var idKey2 = orderType.value === 'express' ? 'orderId' : 'taskId'
    var res2 = await callCloud(cloudName2, 'updateStatus', { [idKey2]: orderId.value, status: nextStatus2 })
    if (res2.code === 0) {
      order.value.status = nextStatus2
      var stMap2 = orderType.value === 'express' ? expressStatusTextMap : errandStatusTextMap
      order.value.statusText = stMap2[nextStatus2] || '已完成'
      uni.showToast({ title: '已确认收货', icon: 'success' })
    }
    return
  }
  // 骑手操作
  var nextStatus = order.value.status + 1
  var cloudName = orderType.value === 'express' ? 'express' : 'errand'
  var idKey = orderType.value === 'express' ? 'orderId' : 'taskId'
  var res = await callCloud(cloudName, 'updateStatus', { [idKey]: orderId.value, status: nextStatus })
  if (res.code === 0) {
    order.value.status = nextStatus
    var stMap = orderType.value === 'express' ? expressStatusTextMap : errandStatusTextMap
    order.value.statusText = stMap[nextStatus] || '已完成'
    uni.showToast({ title: '操作成功', icon: 'success' })
  }
}

const callRunner = () => {
  uni.showToast({ title: '联系功能开发中', icon: 'none' })
}
</script>

<style scoped>
.order-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }
.status-banner { padding: 48rpx 32rpx; display: flex; flex-direction: column; align-items: center; }
.status-emoji { font-size: 64rpx; margin-bottom: 12rpx; }
.status-text { font-size: 36rpx; font-weight: bold; color: #fff; }
.status-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }
.steps-bar { display: flex; background: #fff; margin: -16rpx 24rpx 20rpx; border-radius: 16rpx; padding: 28rpx 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.step-item { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
.step-dot { width: 24rpx; height: 24rpx; border-radius: 50%; background: #e0e0e0; margin-bottom: 8rpx; }
.step-item.done .step-dot { background: #4A90D9; }
.step-item.current .step-dot { background: #4A90D9; box-shadow: 0 0 0 6rpx rgba(74,144,217,0.3); }
.step-label { font-size: 22rpx; color: #999; }
.step-item.done .step-label { color: #4A90D9; }
.step-line { position: absolute; top: 12rpx; left: 60%; width: 80%; height: 4rpx; background: #e0e0e0; }
.step-line.done { background: #4A90D9; }
.info-card { background: #fff; margin: 0 24rpx 20rpx; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 20rpx; display: block; }
.info-row { display: flex; justify-content: space-between; padding: 12rpx 0; }
.info-label { font-size: 26rpx; color: #999; }
.info-value { font-size: 26rpx; color: #333; }
.info-value.price { color: #FF6B6B; font-weight: bold; font-size: 30rpx; }
.addr-item { display: flex; align-items: flex-start; }
.addr-dot { width: 20rpx; height: 20rpx; border-radius: 50%; margin-right: 16rpx; margin-top: 8rpx; }
.addr-dot.from { background: #4A90D9; }
.addr-dot.to { background: #FF6B6B; }
.addr-label { font-size: 24rpx; color: #999; }
.addr-text { font-size: 28rpx; color: #333; margin-top: 4rpx; }
.addr-line { width: 2rpx; height: 40rpx; background: #e0e0e0; margin-left: 9rpx; }
.runner-info { display: flex; align-items: center; }
.runner-avatar { font-size: 48rpx; margin-right: 16rpx; }
.runner-detail { flex: 1; }
.runner-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.runner-phone { font-size: 24rpx; color: #999; }
.call-btn { padding: 12rpx 24rpx; background: #E3F2FD; border-radius: 24rpx; }
.call-btn text { font-size: 24rpx; color: #4A90D9; }
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; }
.action-btn { background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; }
.action-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
