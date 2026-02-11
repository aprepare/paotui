<template>
  <view class="errand-detail">
    <!-- 状态 Banner -->
    <view class="status-banner" :style="{background: statusColor}">
      <text class="status-emoji">{{ statusEmoji }}</text>
      <text class="status-text">{{ task.statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 任务信息 -->
    <view class="info-card">
      <text class="card-title">📝 任务信息</text>
      <text class="task-title-text">{{ task.title }}</text>
      <text class="task-desc-text">{{ task.desc }}</text>
      <view class="info-row">
        <text class="info-label">报酬</text>
        <text class="info-value price">¥{{ task.price }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">时间要求</text>
        <text class="info-value">{{ task.timeRequire }}</text>
      </view>
    </view>

    <!-- 地点信息 -->
    <view class="info-card">
      <text class="card-title">📍 地点信息</text>
      <view class="addr-item">
        <view class="addr-dot from"></view>
        <view class="addr-detail">
          <text class="addr-label">任务地点</text>
          <text class="addr-text">{{ task.taskLocation }}</text>
        </view>
      </view>
      <view class="addr-line" v-if="task.deliverLocation"></view>
      <view class="addr-item" v-if="task.deliverLocation">
        <view class="addr-dot to"></view>
        <view class="addr-detail">
          <text class="addr-label">送达地点</text>
          <text class="addr-text">{{ task.deliverLocation }}</text>
        </view>
      </view>
    </view>

    <!-- 发布者信息 -->
    <view class="info-card">
      <text class="card-title">👤 发布者</text>
      <view class="user-info">
        <text class="user-avatar">{{ task.userAvatar }}</text>
        <view class="user-detail">
          <text class="user-name">{{ task.userName }}</text>
          <text class="user-phone">{{ task.phone }}</text>
        </view>
        <view class="call-btn" @click="callUser">
          <text>📞 联系</text>
        </view>
      </view>
    </view>

    <!-- 接单人信息 -->
    <view class="info-card" v-if="task.runner">
      <text class="card-title">🏃 接单人</text>
      <view class="user-info">
        <text class="user-avatar">{{ task.runner.avatar }}</text>
        <view class="user-detail">
          <text class="user-name">{{ task.runner.name }}</text>
          <text class="user-phone">{{ task.runner.phone }}</text>
        </view>
        <view class="call-btn">
          <text>📞 联系</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-bar" v-if="task.status < 2">
      <view class="action-btn" @click="handleAction">
        <text>{{ actionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const task = ref({
  id: 1, title: '帮我去图书馆还书', desc: '3本书，在6号楼门口取，还到图书馆2楼还书处。书比较重，麻烦帮忙搬一下。',
  taskLocation: '图书馆2楼还书处', deliverLocation: '',
  price: 8, timeRequire: '1小时内', status: 0, statusText: '待接单',
  userName: '小明', userAvatar: '🧑', phone: '188****5678',
  runner: null,
  time: '2026-02-10 15:00'
})

const statusColor = computed(() => {
  const colors = ['linear-gradient(135deg,#FF9800,#F57C00)', 'linear-gradient(135deg,#66BB6A,#43A047)', 'linear-gradient(135deg,#9E9E9E,#757575)']
  return colors[task.value.status]
})
const statusEmoji = computed(() => ['⏳', '🚀', '🎉'][task.value.status])
const statusDesc = computed(() => ['等待跑腿员接单...', '跑腿员正在执行任务', '任务已完成'][task.value.status])
const actionText = computed(() => ['接受任务', '确认完成'][task.value.status])

const handleAction = () => {
  if (task.value.status === 0) {
    task.value.status = 1
    task.value.statusText = '进行中'
    task.value.runner = { avatar: '🧑‍🎓', name: '张三', phone: '188****1234' }
  } else {
    task.value.status = 2
    task.value.statusText = '已完成'
  }
  uni.showToast({ title: '操作成功', icon: 'success' })
}

const callUser = () => {
  uni.showToast({ title: '拨打电话功能开发中', icon: 'none' })
}
</script>

<style scoped>
.errand-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }

.status-banner { padding: 48rpx 32rpx; display: flex; flex-direction: column; align-items: center; }
.status-emoji { font-size: 64rpx; margin-bottom: 12rpx; }
.status-text { font-size: 36rpx; font-weight: bold; color: #fff; }
.status-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; }

.info-card { background: #fff; margin: 20rpx 24rpx 0; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.task-title-text { font-size: 32rpx; font-weight: bold; color: #333; display: block; margin-bottom: 12rpx; }
.task-desc-text { font-size: 26rpx; color: #666; display: block; line-height: 40rpx; margin-bottom: 16rpx; }
.info-row { display: flex; justify-content: space-between; padding: 12rpx 0; }
.info-label { font-size: 26rpx; color: #999; }
.info-value { font-size: 26rpx; color: #333; }
.info-value.price { color: #FF6B6B; font-weight: bold; font-size: 32rpx; }

.addr-item { display: flex; align-items: flex-start; }
.addr-dot { width: 20rpx; height: 20rpx; border-radius: 50%; margin-right: 16rpx; margin-top: 8rpx; }
.addr-dot.from { background: #4A90D9; }
.addr-dot.to { background: #FF6B6B; }
.addr-label { font-size: 24rpx; color: #999; display: block; }
.addr-text { font-size: 28rpx; color: #333; margin-top: 4rpx; display: block; }
.addr-line { width: 2rpx; height: 40rpx; background: #e0e0e0; margin-left: 9rpx; }

.user-info { display: flex; align-items: center; }
.user-avatar { font-size: 48rpx; margin-right: 16rpx; }
.user-detail { flex: 1; }
.user-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.user-phone { font-size: 24rpx; color: #999; }
.call-btn { padding: 12rpx 24rpx; background: #E3F2FD; border-radius: 24rpx; }
.call-btn text { font-size: 24rpx; color: #4A90D9; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; }
.action-btn { background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 48rpx; padding: 28rpx; text-align: center; }
.action-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
