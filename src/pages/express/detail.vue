<template>
  <view class="express-detail">
    <!-- 状态 Banner -->
    <view class="status-banner" :style="{background: statusColor}">
      <text class="status-emoji">{{ statusEmoji }}</text>
      <text class="status-text">{{ order.statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 步骤条 -->
    <view class="steps-bar">
      <view v-for="(step, i) in steps" :key="i" class="step-item" :class="{done: i <= order.status, current: i === order.status}">
        <view class="step-dot"></view>
        <text class="step-label">{{ step }}</text>
        <view v-if="i < steps.length - 1" class="step-line" :class="{done: i < order.status}"></view>
      </view>
    </view>

    <!-- 快递信息 -->
    <view class="info-card">
      <text class="card-title">📦 快递信息</text>
      <view class="info-row">
        <text class="info-label">快递大小</text>
        <view class="size-tag" :class="order.sizeClass">
          <text>{{ order.sizeText }}</text>
        </view>
      </view>
      <view class="info-row">
        <text class="info-label">取件码</text>
        <text class="info-value">{{ order.pickupCode }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">快递公司</text>
        <text class="info-value">{{ order.expressCompany }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">配送费</text>
        <text class="info-value price">¥{{ order.price }}</text>
      </view>
      <view class="info-row" v-if="order.tip > 0">
        <text class="info-label">小费</text>
        <text class="info-value tip">+¥{{ order.tip }}</text>
      </view>
    </view>

    <!-- 地址信息 -->
    <view class="info-card">
      <text class="card-title">📍 地址信息</text>
      <view class="addr-item">
        <view class="addr-dot from"></view>
        <view class="addr-detail">
          <text class="addr-label">取件地址</text>
          <text class="addr-text">{{ order.pickupPoint }}</text>
        </view>
      </view>
      <view class="addr-line"></view>
      <view class="addr-item">
        <view class="addr-dot to"></view>
        <view class="addr-detail">
          <text class="addr-label">送达地址</text>
          <text class="addr-text">{{ order.building }}{{ order.room }}</text>
        </view>
      </view>
    </view>

    <!-- 照片凭证 -->
    <view class="info-card" v-if="order.status >= 1">
      <text class="card-title">📷 配送照片</text>
      <view class="photo-section">
        <view class="photo-group">
          <text class="photo-label">取件照片</text>
          <view class="photo-list">
            <view v-if="order.pickupPhoto" class="photo-item">
              <text class="photo-placeholder">📷</text>
              <text class="photo-time">{{ order.pickupPhotoTime }}</text>
            </view>
            <view v-else-if="isRider && order.status === 1" class="photo-upload" @click="uploadPhoto('pickup')">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传取件照</text>
            </view>
            <text v-else class="photo-pending">等待骑手上传</text>
          </view>
        </view>
        <view class="photo-group" v-if="order.status >= 2">
          <text class="photo-label">送达照片</text>
          <view class="photo-list">
            <view v-if="order.deliverPhoto" class="photo-item">
              <text class="photo-placeholder">📷</text>
              <text class="photo-time">{{ order.deliverPhotoTime }}</text>
            </view>
            <view v-else-if="isRider && order.status === 2" class="photo-upload" @click="uploadPhoto('deliver')">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传送达照</text>
            </view>
            <text v-else class="photo-pending">等待骑手上传</text>
          </view>
        </view>
      </view>
      <text class="photo-notice">照片仅发布者、骑手和管理员可见</text>
    </view>

    <!-- 骑手信息 -->
    <view class="info-card" v-if="order.runner">
      <text class="card-title">🏃 骑手信息</text>
      <view class="runner-info">
        <text class="runner-avatar">🧑‍🎓</text>
        <view class="runner-detail">
          <text class="runner-name">{{ order.runner.name }}</text>
          <text class="runner-phone">{{ order.runner.phone }}</text>
        </view>
        <view class="call-btn" @click="callRunner">
          <text>📞 联系</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-bar" v-if="showAction">
      <view class="action-btn" @click="handleAction">
        <text>{{ actionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const steps = ['待接单', '已接单', '配送中', '已完成']
const isRider = ref(false) // mock：当前用户是否为骑手

const order = ref({
  id: 1, sizeText: '小件', sizeClass: 'small',
  pickupPoint: '菜鸟驿站A区', pickupCode: '5-2-1234',
  expressCompany: '顺丰', building: '6号宿舍楼', room: '302',
  price: 2, tip: 1, status: 1, statusText: '已接单',
  pickupPhoto: true, pickupPhotoTime: '14:35',
  deliverPhoto: false, deliverPhotoTime: '',
  runner: { avatar: '🧑‍🎓', name: '张三', phone: '188****1234' },
  time: '2026-02-10 14:30'
})

const statusColor = computed(() => {
  const colors = ['linear-gradient(135deg,#FF9800,#F57C00)', 'linear-gradient(135deg,#4A90D9,#357ABD)', 'linear-gradient(135deg,#66BB6A,#43A047)', 'linear-gradient(135deg,#9E9E9E,#757575)']
  return colors[order.value.status]
})
const statusEmoji = computed(() => ['⏳', '✅', '🚀', '🎉'][order.value.status])
const statusDesc = computed(() => ['等待骑手接单...', '骑手已接单，请上传取件照片', '骑手正在配送中', '订单已完成'][order.value.status])

const showAction = computed(() => order.value.status < 3)
const actionText = computed(() => {
  if (isRider.value) return ['接单', '已取件，开始配送', '已送达，完成订单', ''][order.value.status]
  return ['取消订单', '等待骑手取件...', '确认收货', ''][order.value.status]
})

const handleAction = () => {
  if (isRider.value) {
    if (order.value.status === 1 && !order.value.pickupPhoto) {
      uni.showToast({ title: '请先上传取件照片', icon: 'none' })
      return
    }
    if (order.value.status === 2 && !order.value.deliverPhoto) {
      uni.showToast({ title: '请先上传送达照片', icon: 'none' })
      return
    }
  }
  if (order.value.status < 3) {
    order.value.status++
    order.value.statusText = steps[order.value.status]
    uni.showToast({ title: '操作成功', icon: 'success' })
  }
}

const uploadPhoto = (type) => {
  uni.chooseImage({
    count: 1,
    success: () => {
      if (type === 'pickup') {
        order.value.pickupPhoto = true
        order.value.pickupPhotoTime = '刚刚'
      } else {
        order.value.deliverPhoto = true
        order.value.deliverPhotoTime = '刚刚'
      }
      uni.showToast({ title: '照片上传成功', icon: 'success' })
    }
  })
}

const callRunner = () => {
  uni.showToast({ title: '拨打电话功能开发中', icon: 'none' })
}
</script>

<style scoped>
.express-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }

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
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; }
.info-label { font-size: 26rpx; color: #999; }
.info-value { font-size: 26rpx; color: #333; }
.info-value.price { color: #FF6B6B; font-weight: bold; font-size: 30rpx; }
.info-value.tip { color: #FF9800; font-weight: bold; }
.size-tag { padding: 4rpx 16rpx; border-radius: 8rpx; }
.size-tag.small { background: #E3F2FD; }
.size-tag.large { background: #FFF3E0; }
.size-tag.xlarge { background: #FFEBEE; }
.size-tag text { font-size: 24rpx; font-weight: bold; }

.addr-item { display: flex; align-items: flex-start; }
.addr-dot { width: 20rpx; height: 20rpx; border-radius: 50%; margin-right: 16rpx; margin-top: 8rpx; }
.addr-dot.from { background: #4A90D9; }
.addr-dot.to { background: #FF6B6B; }
.addr-label { font-size: 24rpx; color: #999; display: block; }
.addr-text { font-size: 28rpx; color: #333; margin-top: 4rpx; display: block; }
.addr-line { width: 2rpx; height: 40rpx; background: #e0e0e0; margin-left: 9rpx; }

.photo-section { margin-bottom: 12rpx; }
.photo-group { margin-bottom: 20rpx; }
.photo-label { font-size: 24rpx; color: #666; display: block; margin-bottom: 12rpx; }
.photo-list { display: flex; gap: 16rpx; }
.photo-item { width: 160rpx; height: 160rpx; background: #f0f0f0; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.photo-placeholder { font-size: 48rpx; }
.photo-time { font-size: 20rpx; color: #999; margin-top: 4rpx; }
.photo-upload { width: 160rpx; height: 160rpx; border: 2rpx dashed #4A90D9; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.upload-icon { font-size: 48rpx; color: #4A90D9; }
.upload-text { font-size: 20rpx; color: #4A90D9; margin-top: 4rpx; }
.photo-pending { font-size: 24rpx; color: #999; }
.photo-notice { font-size: 22rpx; color: #999; font-style: italic; }

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
