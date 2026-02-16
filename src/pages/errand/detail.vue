<template>
  <view class="errand-detail">
    <!-- 状态 Banner -->
    <view class="status-banner" :style="{background: statusColor}">
      <text class="status-emoji">{{ statusEmoji }}</text>
      <text class="status-text">{{ task.statusText }}</text>
      <text class="status-desc">{{ statusDesc }}</text>
    </view>

    <!-- 自动确认倒计时 -->
    <view class="auto-confirm-bar" v-if="task.status === 4 && autoConfirmText">
      <text class="auto-confirm-icon">⏰</text>
      <text class="auto-confirm-text">{{ autoConfirmText }}</text>
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
        <view class="call-btn" @click="callRunner">
          <text>📞 联系</text>
        </view>
      </view>
    </view>

    <!-- 照片凭证 -->
    <view class="info-card" v-if="task.status >= 1 && (isOwner || isRider)">
      <text class="card-title">📷 任务照片</text>
      <view class="photo-section">
        <view class="photo-group">
          <text class="photo-label">执行照片</text>
          <view class="photo-list">
            <view v-if="task.pickupPhoto" class="photo-item" @click="previewPhoto(task.pickupPhoto)">
              <image class="photo-img" :src="task.pickupPhoto" mode="aspectFill" />
              <text class="photo-time">{{ task.pickupPhotoTime }}</text>
            </view>
            <view v-else-if="isRider && task.status === 1" class="photo-upload" @click="uploadPhoto('pickup')">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传执行照</text>
            </view>
            <text v-else class="photo-pending">等待接单人上传</text>
          </view>
        </view>
        <view class="photo-group">
          <text class="photo-label">完成照片</text>
          <view class="photo-list">
            <view v-if="task.deliverPhoto" class="photo-item" @click="previewPhoto(task.deliverPhoto)">
              <image class="photo-img" :src="task.deliverPhoto" mode="aspectFill" />
              <text class="photo-time">{{ task.deliverPhotoTime }}</text>
            </view>
            <view v-else-if="isRider && task.status === 1" class="photo-upload" @click="uploadPhoto('deliver')">
              <text class="upload-icon">+</text>
              <text class="upload-text">上传完成照</text>
            </view>
            <text v-else class="photo-pending">等待接单人上传</text>
          </view>
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
      <view v-if="task.status === 4 && isOwner" class="action-row-btns">
        <view class="action-btn reject-btn" @click="handleReject">
          <text>有问题，退回修改</text>
        </view>
        <view class="action-btn confirm-btn" @click="handleAction">
          <text>确认完成，支付报酬</text>
        </view>
      </view>
      <view v-else class="action-btn" @click="handleAction">
        <text>{{ actionText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { callCloud, uploadImage } from '@/utils/cloud'

const taskId = ref('')
const isOwner = ref(false)
const isRider = ref(false)
const autoConfirmText = ref('')
var autoConfirmTimer = null
const task = ref({
  id: '', title: '', desc: '',
  taskLocation: '', deliverLocation: '',
  price: 0, timeRequire: '', status: 0, statusText: '加载中...',
  userName: '', userAvatar: '🧑', phone: '',
  runner: null,
  pickupPhoto: '', pickupPhotoTime: '',
  deliverPhoto: '', deliverPhotoTime: '',
  submitTime: null,
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

onUnload(() => {
  if (autoConfirmTimer) { clearInterval(autoConfirmTimer); autoConfirmTimer = null }
})

const goRiderRegister = () => {
  uni.navigateTo({ url: '/pages/express/rider-register' })
}

const formatPhotoTime = (t) => {
  if (!t) return ''
  var d = new Date(t)
  if (isNaN(d.getTime())) return '已上传'
  var now = new Date()
  var diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  var m = d.getMonth() + 1
  var day = d.getDate()
  var hh = d.getHours()
  var mm = d.getMinutes()
  return (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day) + ' ' + (hh < 10 ? '0' + hh : hh) + ':' + (mm < 10 ? '0' + mm : mm)
}

const loadDetail = async (id) => {
  const res = await callCloud('errand', 'detail', { id: id })
  if (res.code === 0) {
    const d = res.data
    var userInfo = uni.getStorageSync('userInfo')
    var myOpenid = ''
    if (userInfo && userInfo.openid) myOpenid = userInfo.openid
    if (!myOpenid) myOpenid = uni.getStorageSync('openid') || ''
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
      statusText: ['待接单', '进行中', '已完成', '已取消', '待确认'][d.status] || '待接单',
      userName: d.publisher || '发布者',
      userAvatar: '🧑',
      phone: d.phone || '',
      runner: d.riderId ? { avatar: '🧑‍🎓', name: d.riderName || '接单人', phone: d.riderPhone || '' } : null,
      pickupPhoto: d.pickupPhoto || '',
      pickupPhotoTime: d.pickupPhotoTime ? formatPhotoTime(d.pickupPhotoTime) : '',
      deliverPhoto: d.deliverPhoto || '',
      deliverPhotoTime: d.deliverPhotoTime ? formatPhotoTime(d.deliverPhotoTime) : '',
      submitTime: d.submitTime || null,
      time: ''
    }

    // 启动自动确认倒计时
    startAutoConfirmCountdown()
  }
}

const startAutoConfirmCountdown = () => {
  if (autoConfirmTimer) { clearInterval(autoConfirmTimer); autoConfirmTimer = null }
  var updateCountdown = () => {
    var t = task.value
    if (t.status !== 4 || !t.submitTime) {
      autoConfirmText.value = ''
      return
    }
    var submitTs = new Date(t.submitTime).getTime()
    var deadline = submitTs + 24 * 60 * 60 * 1000
    var remaining = deadline - Date.now()
    if (remaining <= 0) {
      autoConfirmText.value = '已自动确认完成'
      if (autoConfirmTimer) { clearInterval(autoConfirmTimer); autoConfirmTimer = null }
      return
    }
    var hours = Math.floor(remaining / 3600000)
    var mins = Math.floor((remaining % 3600000) / 60000)
    autoConfirmText.value = hours + '小时' + mins + '分钟后自动确认完成'
  }
  updateCountdown()
  autoConfirmTimer = setInterval(updateCountdown, 60000)
}

const statusColor = computed(() => {
  const colors = {
    0: 'linear-gradient(135deg,#FF9800,#F57C00)',
    1: 'linear-gradient(135deg,#66BB6A,#43A047)',
    2: 'linear-gradient(135deg,#9E9E9E,#757575)',
    3: 'linear-gradient(135deg,#E53E3E,#C53030)',
    4: 'linear-gradient(135deg,#4A90D9,#2B6CB0)'
  }
  return colors[task.value.status] || colors[0]
})
const statusEmoji = computed(() => ({ 0: '⏳', 1: '🚀', 2: '🎉', 3: '❌', 4: '🔔' }[task.value.status] || '⏳'))
const statusDesc = computed(() => ({
  0: '等待跑腿员接单...',
  1: '跑腿员正在执行任务',
  2: '任务已完成',
  3: '任务已取消',
  4: '接单人已提交完成，等待发布者确认'
}[task.value.status] || ''))

const showAction = computed(() => {
  var s = task.value.status
  if (s === 2 || s === 3) return false
  if (s === 0 && isOwner.value) return true
  if (s === 0 && isRider.value) return true
  // 进行中：只有接单人能提交完成
  if (s === 1 && !isOwner.value) return true
  // 待确认：只有发布者能确认完成
  if (s === 4 && isOwner.value) return true
  return false
})

const actionText = computed(() => {
  var s = task.value.status
  if (s === 0 && isOwner.value) return '取消任务'
  if (s === 0 && isRider.value) return '接受任务'
  if (s === 1) return '提交完成'
  if (s === 4 && isOwner.value) return '确认完成，支付报酬'
  return ''
})

const handleReject = () => {
  uni.showModal({
    title: '退回任务',
    content: '确认退回？接单人需要重新执行并提交完成。',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        const res = await callCloud('errand', 'updateStatus', { taskId: taskId.value, status: 1 })
        if (res.code === 0) {
          task.value.status = 1
          task.value.statusText = '进行中'
          uni.showToast({ title: '已退回，等待接单人重新完成', icon: 'none' })
        }
      }
    }
  })
}

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
    return
  }
  // 接单人提交完成 → 进入待确认状态
  if (task.value.status === 1) {
    if (!task.value.pickupPhoto || !task.value.deliverPhoto) {
      uni.showToast({ title: '请先上传执行照片和完成照片', icon: 'none' })
      return
    }
    uni.showModal({
      title: '提交完成',
      content: '确认已完成任务？提交后需等待发布者确认。',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          const res = await callCloud('errand', 'updateStatus', { taskId: taskId.value, status: 4 })
          if (res.code === 0) {
            task.value.status = 4
            task.value.statusText = '待确认'
            uni.showToast({ title: '已提交，等待发布者确认', icon: 'success' })
          }
        }
      }
    })
    return
  }
  // 发布者确认完成
  if (task.value.status === 4 && isOwner.value) {
    uni.showModal({
      title: '确认完成',
      content: '确认任务已完成？确认后将支付报酬 ¥' + task.value.price + ' 给接单人。',
      success: async (modalRes) => {
        if (modalRes.confirm) {
          const res = await callCloud('errand', 'updateStatus', { taskId: taskId.value, status: 2 })
          if (res.code === 0) {
            task.value.status = 2
            task.value.statusText = '已完成'
            uni.showToast({ title: '任务完成，报酬已结算', icon: 'success' })
          }
        }
      }
    })
    return
  }
}

const callUser = () => {
  if (task.value.phone) {
    uni.makePhoneCall({ phoneNumber: task.value.phone })
  } else {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
  }
}

const callRunner = () => {
  if (task.value.runner && task.value.runner.phone) {
    uni.makePhoneCall({ phoneNumber: task.value.runner.phone })
  } else {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
  }
}

const uploadPhoto = (type) => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      var fileID = await uploadImage(res.tempFilePaths[0], 'errand-photo')
      uni.hideLoading()
      if (type === 'pickup') {
        await callCloud('errand', 'uploadPhoto', { taskId: taskId.value, type: 'pickup', fileID: fileID })
        task.value.pickupPhoto = fileID
        task.value.pickupPhotoTime = '刚刚'
      } else {
        await callCloud('errand', 'uploadPhoto', { taskId: taskId.value, type: 'deliver', fileID: fileID })
        task.value.deliverPhoto = fileID
        task.value.deliverPhotoTime = '刚刚'
      }
      uni.showToast({ title: '照片上传成功', icon: 'success' })
    }
  })
}

const previewPhoto = (src) => {
  if (src) { uni.previewImage({ urls: [src], current: src }) }
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

/* 自动确认倒计时 */
.auto-confirm-bar { margin: 20rpx 24rpx 0; background: linear-gradient(135deg, #FFF8E1, #FFECB3); border-radius: 12rpx; padding: 18rpx 24rpx; display: flex; align-items: center; }
.auto-confirm-icon { font-size: 28rpx; margin-right: 12rpx; }
.auto-confirm-text { font-size: 24rpx; color: #E65100; font-weight: 600; }
.action-btn { background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 48rpx; padding: 28rpx; text-align: center; }
.action-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }

.rider-register-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); display: flex; align-items: center; }
.register-hint { flex: 1; display: flex; align-items: center; }
.register-hint-icon { font-size: 36rpx; margin-right: 12rpx; }
.register-hint-text { font-size: 26rpx; color: #4A5568; font-weight: 500; }
.register-btn { padding: 20rpx 40rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 40rpx; }
.register-btn text { color: #fff; font-size: 28rpx; font-weight: 700; }

.photo-section { margin-bottom: 12rpx; }
.photo-group { margin-bottom: 20rpx; }
.photo-label { font-size: 24rpx; color: #666; display: block; margin-bottom: 12rpx; }
.photo-list { display: flex; gap: 16rpx; }
.photo-item { width: 160rpx; height: 160rpx; background: #f0f0f0; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
.photo-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; }
.photo-time { font-size: 20rpx; color: #999; margin-top: 4rpx; }
.photo-upload { width: 160rpx; height: 160rpx; border: 2rpx dashed #FF9800; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.upload-icon { font-size: 48rpx; color: #FF9800; }
.upload-text { font-size: 20rpx; color: #FF9800; margin-top: 4rpx; }
.photo-pending { font-size: 24rpx; color: #999; }
</style>
