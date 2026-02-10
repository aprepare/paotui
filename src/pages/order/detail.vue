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
        <view class="call-btn">
          <text>📞 联系</text>
        </view>
      </view>
    </view>
    <view class="action-bar" v-if="order.status < 3">
      <view class="action-btn" @click="nextStep">
        <text>{{ actionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const steps = ['待接单', '已接单', '配送中', '已完成']
const order = ref({
  id: 1, type: '代取快递', desc: '一个中号快递，顺丰', price: 5,
  fromAddr: '菜鸟驿站3号架', toAddr: '6号宿舍楼302',
  status: 1, statusText: '已接单',
  runner: { avatar: '🧑‍🎓', name: '张三', phone: '188****1234' },
  time: '2026-02-10 14:30'
})

const statusColor = computed(() => {
  const colors = ['linear-gradient(135deg,#FF9800,#F57C00)', 'linear-gradient(135deg,#4A90D9,#357ABD)', 'linear-gradient(135deg,#66BB6A,#43A047)', 'linear-gradient(135deg,#9E9E9E,#757575)']
  return colors[order.value.status]
})
const statusEmoji = computed(() => ['⏳', '✅', '🚀', '🎉'][order.value.status])
const statusDesc = computed(() => ['等待跑腿员接单...', '跑腿员已接单，即将出发', '跑腿员正在配送中', '订单已完成'][order.value.status])
const actionText = computed(() => ['取消订单', '确认取件', '确认送达', ''][order.value.status])

const nextStep = () => {
  if (order.value.status < 3) {
    order.value.status++
    order.value.statusText = steps[order.value.status]
    uni.showToast({ title: '操作成功', icon: 'success' })
  }
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
