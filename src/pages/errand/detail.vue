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

    <!-- 非骑手提示注册 -->
    <view class="rider-register-bar" v-if="!isRider && !isOwner && task.status === 0">
      <view class="register-hint">
        <text class="register-hint-icon">🏅</text>
        <text class="register-hint-text">注册骑手后即可接单赚钱</text>
      </view>
      <view class="register-btn" @click="goRiderRegister">
        <text>骑手注册</text>
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
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

const taskId = ref('')
const isOwner = ref(false)
const isRider = ref(false)
const task = ref({
  id: '', title: '', desc: '',
  taskLocation: '', deliverLocation: '',
  price: 0, timeRequire: '', status: 0, statusText: '加载中...',
  userName: '', userAvatar: '🧑', phone: '',
  runner: null,
  time: ''
})

onLoad((opts) => {
  if (opts && opts.id) {
    taskId.value = opts.id
    loadDetail(opts.id)
  }
  var riderFlag = uni.getStorageSync('isRider')
  isRider.value = riderFlag === 1 || riderFlag === true
})

const goRiderRegister = () => {
  uni.navigateTo({ url: '/pages/express/rider-register' })
}

const loadDetail = async (id) => {
  const res = await callCloud('errand', 'detail', { id: id })
  if (res.code === 0) {
    const d = res.data
    var userInfo = uni.getStorageSync('userInfo')
    var myOpenid = ''
    if (userInfo && userInfo.openid) myOpenid = userInfo.openid
    isOwner.value = (d.openid && myOpenid && d.openid === myOpenid)
    task.value = {
      id: d._id,
      title: d.title || '',
      desc: d.desc || '',
      taskLocation: d.fromAddr || '',
      deliverLocation: d.toAddr || '',
      price: d.price || 0,
      timeRequire: '',
      status: d.status || 0,
      statusText: ['待接单', '进行中', '已完成', '已取消'][d.status] || '待接单',
      userName: d.publisher || '发布者',
      userAvatar: '🧑',
      phone: d.phone || '',
      runner: d.riderId ? { avatar: '🧑‍🎓', name: '接单人', phone: '' } : null,
      time: ''
    }
  }
}

const statusColor = computed(() => {
  const colors = ['linear-gradient(135deg,#FF9800,#F57C00)', 'linear-gradient(135deg,#66BB6A,#43A047)', 'linear-gradient(135deg,#9E9E9E,#757575)']
  return colors[task.value.status]
})
const statusEmoji = computed(() => ['⏳', '🚀', '🎉'][task.value.status])
const statusDesc = computed(() => ['等待跑腿员接单...', '跑腿员正在执行任务', '任务已完成'][task.value.status])

const showAction = computed(() => {
  var s = task.value.status
  if (s >= 2) return false
  if (s === 0 && isOwner.value) return true
  if (s === 0 && isRider.value) return true
  if (s === 1 && !isOwner.value) return true
  return false
})

const actionText = computed(() => {
  var s = task.value.status
  if (s === 0 && isOwner.value) return '取消任务'
  if (s === 0 && isRider.value) return '接受任务'
  if (s === 1) return '确认完成'
  return ''
})

const handleAction = async () => {
  if (task.value.status === 0 && isOwner.value) {
    uni.showModal({
      title: '确认取消',
      content: '确定要取消该任务吗？',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          var res = await callCloud('errand', 'cancel', { taskId: taskId.value })
          if (res.code === 0) {
            uni.showToast({ title: '任务已取消', icon: 'success' })
            setTimeout(function() { uni.navigateBack() }, 1000)
          }
        }
      }
    })
    return
  }
  if (task.value.status === 0) {
    const res = await callCloud('errand', 'accept', { taskId: taskId.value })
    if (res.code === 0) {
      task.value.status = 1
      task.value.statusText = '进行中'
      task.value.runner = { avatar: '🧑‍🎓', name: '我', phone: '' }
      uni.showToast({ title: '接单成功', icon: 'success' })
    }
  } else {
    const res = await callCloud('errand', 'updateStatus', { taskId: taskId.value, status: 2 })
    if (res.code === 0) {
      task.value.status = 2
      task.value.statusText = '已完成'
      uni.showToast({ title: '任务完成', icon: 'success' })
    }
  }
}

const callUser = () => {
  if (task.value.phone) {
    uni.makePhoneCall({ phoneNumber: task.value.phone })
  } else {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
  }
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

.rider-register-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); display: flex; align-items: center; }
.register-hint { flex: 1; display: flex; align-items: center; }
.register-hint-icon { font-size: 36rpx; margin-right: 12rpx; }
.register-hint-text { font-size: 26rpx; color: #4A5568; font-weight: 500; }
.register-btn { padding: 20rpx 40rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 40rpx; }
.register-btn text { color: #fff; font-size: 28rpx; font-weight: 700; }
</style>
