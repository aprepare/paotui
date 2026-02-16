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

    <!-- 自动确认倒计时 -->
    <view class="auto-confirm-bar" v-if="order.status === 2 && order.deliverPhoto && autoConfirmText">
      <text class="auto-confirm-icon">⏰</text>
      <text class="auto-confirm-text">{{ autoConfirmText }}</text>
    </view>

    <!-- 实时地图 -->
    <view class="info-card" v-if="order.status >= 1 && order.status <= 2 && mapReady">
      <text class="card-title">🗺️ 实时位置</text>
      <view class="map-wrap">
        <map class="rider-map"
          :latitude="mapCenter.lat"
          :longitude="mapCenter.lng"
          :markers="markers"
          :polyline="polyline"
          :scale="mapScale"
          show-location
        ></map>
      </view>
      <view class="map-legend">
        <view class="legend-item">
          <view class="legend-dot rider-dot"></view>
          <text class="legend-text">骑手位置</text>
        </view>
        <view class="legend-item">
          <view class="legend-dot dest-dot"></view>
          <text class="legend-text">收货地址</text>
        </view>
      </view>
      <view class="distance-info" v-if="distanceText || durationText">
        <text class="distance-text" v-if="distanceText">📏 距离: {{ distanceText }}</text>
        <text class="duration-text" v-if="durationText">⏱️ 预计: {{ durationText }}</text>
      </view>
      <view class="map-actions">
        <view class="map-btn" :class="{disabled: refreshCooling}" @click="refreshRiderLocation">
          <text>🔄 {{ refreshCooling ? cooldownText : '刷新位置' }}</text>
        </view>
        <text class="map-time" v-if="riderLocationTime">{{ riderLocationTime }} 更新</text>
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
    <view class="info-card" v-if="order.status >= 1 && (isOwner || isRider)">
      <text class="card-title">📷 配送照片</text>
      <view class="photo-section">
        <view class="photo-group">
          <text class="photo-label">取件照片</text>
          <view class="photo-list">
            <view v-if="order.pickupPhoto" class="photo-item" @click="previewPhoto(order.pickupPhoto)">
              <image class="photo-img" :src="order.pickupPhoto" mode="aspectFill" />
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
            <view v-if="order.deliverPhoto" class="photo-item" @click="previewPhoto(order.deliverPhoto)">
              <image class="photo-img" :src="order.deliverPhoto" mode="aspectFill" />
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
    </view>

    <!-- 骑手信息 -->
    <view class="info-card" v-if="order.runner">
      <text class="card-title">🏃 骑手信息</text>
      <view class="runner-info">
        <text class="runner-avatar">🧑‍🎓</text>
        <view class="runner-detail">
          <view class="runner-top">
            <text class="runner-name">{{ order.runner.name }}</text>
          </view>
          <text class="runner-phone" v-if="order.runner.phone">{{ order.runner.phone }}</text>
        </view>
        <view class="call-btn" v-if="order.runner.phone" @click="callRunner">
          <text>📞 联系</text>
        </view>
      </view>
      <!-- 配送进度 -->
      <view class="location-card" v-if="order.status >= 1 && order.status <= 2">
        <view class="location-row">
          <text class="location-label">📍 配送进度</text>
        </view>
        <view class="progress-list">
          <view class="progress-item" v-if="order.status >= 1">
            <view class="progress-dot active"></view>
            <view class="progress-content">
              <text class="progress-text">骑手已接单</text>
              <text class="progress-time">{{ order.acceptTimeText }}</text>
            </view>
          </view>
          <view class="progress-line" v-if="order.status >= 1"></view>
          <view class="progress-item" v-if="order.pickupPhoto">
            <view class="progress-dot active"></view>
            <view class="progress-content">
              <text class="progress-text">已取件</text>
              <text class="progress-time">{{ order.pickupPhotoTime }}</text>
            </view>
          </view>
          <view class="progress-line" v-if="order.pickupPhoto"></view>
          <view class="progress-item">
            <view class="progress-dot" :class="{active: order.status >= 2}"></view>
            <view class="progress-content">
              <text class="progress-text">{{ order.status >= 2 ? '配送中，正在前往 ' + order.building : '等待骑手取件' }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 非骑手提示注册 -->
    <view class="rider-register-bar" v-if="!isRider && !isOwner && order.status === 0">
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
import { ref, reactive, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { callCloud, uploadImage } from '@/utils/cloud'

var steps = ['待接单', '已接单', '配送中', '已完成']
var isRider = ref(false)
var isOwner = ref(false)
var orderId = ref('')
var mapReady = ref(false)
var mapScale = ref(15)
var riderLocationTime = ref('')
var locationTimer = null

var mapCenter = reactive({ lat: 0, lng: 0 })
var markers = ref([])
var polyline = ref([])
var refreshCooling = ref(false)
var cooldownText = ref('3s')
var lastRefreshTime = ref(0)
var cooldownTimer = null
var distanceText = ref('')
var durationText = ref('')

var autoConfirmText = ref('')
var autoConfirmTimer = null

var order = ref({
  id: '', sizeText: '', sizeClass: '',
  pickupPoint: '', pickupCode: '',
  expressCompany: '', building: '', room: '',
  price: 0, tip: 0, status: 0, statusText: '加载中...',
  pickupPhoto: '', pickupPhotoTime: '',
  deliverPhoto: '', deliverPhotoTime: '',
  acceptTimeText: '',
  runner: null, time: '',
  destLat: 0, destLng: 0,
  riderLat: 0, riderLng: 0
})

onLoad(function(opts) {
  if (opts && opts.id) {
    orderId.value = opts.id
    loadDetail(opts.id)
  }
  var riderFlag = uni.getStorageSync('isRider')
  isRider.value = riderFlag === 1 || riderFlag === true
})

onUnload(function() {
  if (locationTimer) { clearInterval(locationTimer); locationTimer = null }
  if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null }
  if (autoConfirmTimer) { clearInterval(autoConfirmTimer); autoConfirmTimer = null }
})

var goRiderRegister = function() {
  uni.navigateTo({ url: '/pages/express/rider-register' })
}

var detailStatusTextMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }

var formatPhotoTime = function(t) {
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

var loadDetail = async function(id) {
  var res = await callCloud('express', 'detail', { id: id })
  if (res.code === 0) {
    var d = res.data
    var userInfo = uni.getStorageSync('userInfo')
    var myOpenid = ''
    if (userInfo && userInfo.openid) myOpenid = userInfo.openid
    if (!myOpenid) myOpenid = uni.getStorageSync('openid') || ''
    isOwner.value = !!(d.openid && myOpenid && d.openid === myOpenid)

    order.value = {
      id: d._id,
      sizeText: d.sizeText || '小件',
      sizeClass: d.sizeClass || 'small',
      pickupPoint: d.pickupPoint || '',
      pickupCode: d.pickupCode || '',
      expressCompany: d.expressCompany || '',
      building: d.building || '',
      room: d.room || '',
      price: d.price || 0,
      tip: d.tip || 0,
      status: d.status || 0,
      statusText: detailStatusTextMap[d.status] || '待接单',
      pickupPhoto: d.pickupPhoto || '',
      pickupPhotoTime: d.pickupPhotoTime ? formatPhotoTime(d.pickupPhotoTime) : '',
      deliverPhoto: d.deliverPhoto || '',
      deliverPhotoTime: d.deliverPhotoTime ? formatPhotoTime(d.deliverPhotoTime) : '',
      deliverPhotoRawTime: d.deliverPhotoTime || null,
      acceptTimeText: d.acceptTime ? formatPhotoTime(d.acceptTime) : '',
      runner: d.riderId ? { avatar: '🧑‍🎓', name: d.riderName || '骑手', phone: d.riderPhone || '' } : null,
      time: '',
      destLat: d.destLat || 0,
      destLng: d.destLng || 0,
      riderLat: d.riderLat || 0,
      riderLng: d.riderLng || 0
    }

    // 骑手进入详情页时自动上报位置
    if (isRider.value && d.riderId === myOpenid && d.status >= 1 && d.status <= 2) {
      reportMyLocation()
      locationTimer = setInterval(reportMyLocation, 15000)
    }

    // 用户查看时加载地图
    if (d.status >= 1 && d.status <= 2) {
      initMap()
      if (!isRider.value) {
        locationTimer = setInterval(function() { refreshRiderLocation() }, 10000)
      }
    }

    // 启动自动确认倒计时
    startAutoConfirmCountdown()
  }
}

var startAutoConfirmCountdown = function() {
  if (autoConfirmTimer) { clearInterval(autoConfirmTimer); autoConfirmTimer = null }
  var updateCountdown = function() {
    var o = order.value
    if (o.status !== 2 || !o.deliverPhoto || !o.deliverPhotoRawTime) {
      autoConfirmText.value = ''
      return
    }
    var submitTs = new Date(o.deliverPhotoRawTime).getTime()
    var deadline = submitTs + 24 * 60 * 60 * 1000
    var remaining = deadline - Date.now()
    if (remaining <= 0) {
      autoConfirmText.value = '已自动确认收货'
      if (autoConfirmTimer) { clearInterval(autoConfirmTimer); autoConfirmTimer = null }
      return
    }
    var hours = Math.floor(remaining / 3600000)
    var mins = Math.floor((remaining % 3600000) / 60000)
    autoConfirmText.value = hours + '小时' + mins + '分钟后自动确认收货'
  }
  updateCountdown()
  autoConfirmTimer = setInterval(updateCountdown, 60000)
}

// 骑手上报自己的位置
var reportMyLocation = function() {
  uni.getLocation({
    type: 'gcj02',
    success: function(loc) {
      callCloud('express', 'reportLocation', {
        orderId: orderId.value,
        latitude: loc.latitude,
        longitude: loc.longitude
      })
      order.value.riderLat = loc.latitude
      order.value.riderLng = loc.longitude
      updateMarkers()
    }
  })
}

// 用户刷新骑手位置（3秒冷却）
var refreshRiderLocation = async function() {
  var now = Date.now()
  if (now - lastRefreshTime.value < 3000) {
    uni.showToast({ title: '请稍后再刷新', icon: 'none' })
    return
  }
  lastRefreshTime.value = now
  refreshCooling.value = true
  var remaining = 3
  cooldownText.value = remaining + 's'
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(function() {
    remaining--
    if (remaining <= 0) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
      refreshCooling.value = false
    } else {
      cooldownText.value = remaining + 's'
    }
  }, 1000)

  var res = await callCloud('express', 'getRiderLocation', { orderId: orderId.value })
  if (res.code === 0 && res.data.riderLat) {
    order.value.riderLat = res.data.riderLat
    order.value.riderLng = res.data.riderLng
    if (res.data.riderLocationTime) {
      riderLocationTime.value = formatPhotoTime(res.data.riderLocationTime)
    }
    // 更新距离和预计时间
    if (res.data.distance) {
      distanceText.value = res.data.distance >= 1000
        ? (res.data.distance / 1000).toFixed(1) + 'km'
        : res.data.distance + 'm'
    }
    if (res.data.duration) {
      durationText.value = res.data.duration < 60
        ? '不到1分钟'
        : Math.ceil(res.data.duration / 60) + '分钟'
    }
    updateMarkers()
  }
}

// 初始化地图
var initMap = function() {
  var o = order.value
  // 确定地图中心
  if (o.riderLat && o.destLat) {
    mapCenter.lat = (o.riderLat + o.destLat) / 2
    mapCenter.lng = (o.riderLng + o.destLng) / 2
  } else if (o.destLat) {
    mapCenter.lat = o.destLat
    mapCenter.lng = o.destLng
  } else if (o.riderLat) {
    mapCenter.lat = o.riderLat
    mapCenter.lng = o.riderLng
  } else {
    // 没有坐标，不显示地图
    mapReady.value = false
    return
  }
  updateMarkers()
  mapReady.value = true
}

// 更新地图标记
var updateMarkers = function() {
  var o = order.value
  var newMarkers = []
  // 骑手标记
  if (o.riderLat && o.riderLng) {
    newMarkers.push({
      id: 1,
      latitude: o.riderLat,
      longitude: o.riderLng,
      iconPath: '/static/logo.png',
      width: 30,
      height: 30,
      callout: {
        content: '骑手位置',
        display: 'ALWAYS',
        fontSize: 12,
        borderRadius: 8,
        padding: 6,
        bgColor: '#4A90D9',
        color: '#fff'
      }
    })
  }
  // 收货地址标记
  if (o.destLat && o.destLng) {
    newMarkers.push({
      id: 2,
      latitude: o.destLat,
      longitude: o.destLng,
      iconPath: '/static/logo.png',
      width: 30,
      height: 30,
      callout: {
        content: o.building + o.room,
        display: 'ALWAYS',
        fontSize: 12,
        borderRadius: 8,
        padding: 6,
        bgColor: '#E53E3E',
        color: '#fff'
      }
    })
  }
  markers.value = newMarkers

  // 连线
  if (o.riderLat && o.riderLng && o.destLat && o.destLng) {
    polyline.value = [{
      points: [
        { latitude: o.riderLat, longitude: o.riderLng },
        { latitude: o.destLat, longitude: o.destLng }
      ],
      color: '#4A90D9',
      width: 4,
      dottedLine: true
    }]
    // 更新中心点
    mapCenter.lat = (o.riderLat + o.destLat) / 2
    mapCenter.lng = (o.riderLng + o.destLng) / 2
  }
}

var statusColor = computed(function() {
  var colors = ['linear-gradient(135deg,#FF9800,#F57C00)', 'linear-gradient(135deg,#4A90D9,#357ABD)', 'linear-gradient(135deg,#66BB6A,#43A047)', 'linear-gradient(135deg,#9E9E9E,#757575)']
  return colors[order.value.status]
})
var statusEmoji = computed(function() { return ['⏳', '✅', '🚀', '🎉'][order.value.status] })
var statusDesc = computed(function() { return ['等待骑手接单...', '骑手已接单', '骑手正在配送中', '订单已完成'][order.value.status] })

var showAction = computed(function() {
  var s = order.value.status
  if (s >= 3) return false
  if (s === 4) return false
  if (isRider.value) return true
  if (isOwner.value && s === 0) return true
  // 已接单时用户可以取消
  if (isOwner.value && s === 1) return true
  // 配送中用户不能取消，但能确认收货
  if (s === 2 && isOwner.value && order.value.deliverPhoto) return true
  return false
})
var actionText = computed(function() {
  var s = order.value.status
  if (isRider.value) {
    if (s === 0) return '接单'
    if (s === 1) return '已取件，开始配送'
    if (s === 2) return '已送达，完成订单'
    return ''
  }
  if (isOwner.value && s === 0) return '取消订单'
  if (isOwner.value && s === 1) return '取消订单'
  if (isOwner.value && s === 2 && order.value.deliverPhoto) return '确认收货'
  return ''
})

var handleAction = async function() {
  if (isRider.value) {
    if (order.value.status === 0) {
      var res = await callCloud('express', 'accept', { orderId: orderId.value })
      if (res.code === 0) {
        order.value.status = 1
        order.value.statusText = '已接单'
        order.value.runner = { avatar: '🧑‍🎓', name: '我', phone: '' }
        uni.showToast({ title: '接单成功', icon: 'success' })
        reportMyLocation()
        if (!locationTimer) locationTimer = setInterval(reportMyLocation, 15000)
        initMap()
      }
      return
    }
    if (order.value.status === 1 && !order.value.pickupPhoto) {
      uni.showToast({ title: '请先上传取件照片', icon: 'none' })
      return
    }
    if (order.value.status === 2 && !order.value.deliverPhoto) {
      uni.showToast({ title: '请先上传送达照片', icon: 'none' })
      return
    }
  }
  // 用户取消订单（待接单或已接单状态）
  if (!isRider.value && isOwner.value && (order.value.status === 0 || order.value.status === 1)) {
    uni.showModal({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      success: async function(modalRes) {
        if (modalRes.confirm) {
          var r = await callCloud('express', 'cancel', { orderId: orderId.value })
          if (r.code === 0) {
            uni.showToast({ title: '订单已取消', icon: 'success' })
            setTimeout(function() { uni.navigateBack() }, 1000)
          } else {
            uni.showToast({ title: r.msg || '取消失败', icon: 'none' })
          }
        }
      }
    })
    return
  }
  var nextStatus = order.value.status + 1
  var r2 = await callCloud('express', 'updateStatus', { orderId: orderId.value, status: nextStatus })
  if (r2.code === 0) {
    order.value.status = nextStatus
    order.value.statusText = detailStatusTextMap[nextStatus] || '已完成'
    uni.showToast({ title: '操作成功', icon: 'success' })
    if (nextStatus >= 3 && locationTimer) {
      clearInterval(locationTimer)
      locationTimer = null
    }
  }
}

var uploadPhoto = function(type) {
  uni.chooseImage({
    count: 1,
    success: async function(res) {
      uni.showLoading({ title: '上传中...' })
      var fileID = await uploadImage(res.tempFilePaths[0], 'express-photo')
      uni.hideLoading()
      if (type === 'pickup') {
        await callCloud('express', 'uploadPhoto', { orderId: orderId.value, type: 'pickup', fileID: fileID })
        order.value.pickupPhoto = fileID
        order.value.pickupPhotoTime = '刚刚'
      } else {
        await callCloud('express', 'uploadPhoto', { orderId: orderId.value, type: 'deliver', fileID: fileID })
        order.value.deliverPhoto = fileID
        order.value.deliverPhotoTime = '刚刚'
      }
      uni.showToast({ title: '照片上传成功', icon: 'success' })
    }
  })
}

var callRunner = function() {
  if (order.value.runner && order.value.runner.phone) {
    uni.makePhoneCall({ phoneNumber: order.value.runner.phone })
  } else {
    uni.showToast({ title: '暂无联系电话', icon: 'none' })
  }
}

var previewPhoto = function(src) {
  if (src) { uni.previewImage({ urls: [src], current: src }) }
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
.photo-item { width: 160rpx; height: 160rpx; background: #f0f0f0; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
.photo-img { width: 160rpx; height: 160rpx; border-radius: 12rpx; }
.photo-time { font-size: 20rpx; color: #999; margin-top: 4rpx; }
.photo-upload { width: 160rpx; height: 160rpx; border: 2rpx dashed #4A90D9; border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.upload-icon { font-size: 48rpx; color: #4A90D9; }
.upload-text { font-size: 20rpx; color: #4A90D9; margin-top: 4rpx; }
.photo-pending { font-size: 24rpx; color: #999; }
.runner-info { display: flex; align-items: center; }
.runner-avatar { font-size: 48rpx; margin-right: 16rpx; }
.runner-detail { flex: 1; }
.runner-top { display: flex; align-items: center; gap: 12rpx; }
.runner-name { font-size: 28rpx; font-weight: bold; color: #333; }
.runner-phone { font-size: 24rpx; color: #999; display: block; margin-top: 6rpx; }
.call-btn { padding: 12rpx 24rpx; background: #E3F2FD; border-radius: 24rpx; }
.call-btn text { font-size: 24rpx; color: #4A90D9; }
.location-card { background: #F5F7FA; border-radius: 12rpx; padding: 18rpx 16rpx; margin-top: 16rpx; }
.location-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.location-label { font-size: 24rpx; color: #333; font-weight: bold; }
.progress-list { padding: 8rpx 0 0 8rpx; }
.progress-item { display: flex; align-items: flex-start; }
.progress-dot { width: 20rpx; height: 20rpx; border-radius: 50%; background: #E2E8F0; margin-right: 16rpx; margin-top: 4rpx; flex-shrink: 0; }
.progress-dot.active { background: #4A90D9; box-shadow: 0 0 0 4rpx rgba(74,144,217,0.2); }
.progress-content { flex: 1; }
.progress-text { font-size: 26rpx; color: #333; display: block; }
.progress-time { font-size: 22rpx; color: #A0AEC0; display: block; margin-top: 4rpx; }
.progress-line { width: 2rpx; height: 32rpx; background: #E2E8F0; margin-left: 9rpx; }

/* 地图 */
.map-wrap { width: 100%; height: 400rpx; border-radius: 16rpx; overflow: hidden; }
.rider-map { width: 100%; height: 400rpx; }
.map-legend { display: flex; gap: 32rpx; margin-top: 16rpx; padding: 0 8rpx; }
.legend-item { display: flex; align-items: center; }
.legend-dot { width: 20rpx; height: 20rpx; border-radius: 50%; margin-right: 8rpx; }
.rider-dot { background: #4A90D9; }
.dest-dot { background: #E53E3E; }
.legend-text { font-size: 22rpx; color: #718096; }
.map-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 12rpx; }
.map-btn { padding: 12rpx 24rpx; background: #EBF4FF; border-radius: 24rpx; }
.map-btn.disabled { background: #F0F0F0; opacity: 0.6; }
.map-btn:active { background: #BEE3F8; }
.map-btn.disabled:active { background: #F0F0F0; }
.map-btn text { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }
.map-btn.disabled text { color: #999; }
.map-time { font-size: 22rpx; color: #A0AEC0; }
.distance-info { display: flex; gap: 24rpx; margin-top: 12rpx; padding: 12rpx 16rpx; background: #F0FFF4; border-radius: 12rpx; }
.distance-text { font-size: 24rpx; color: #2D8A56; font-weight: 600; }
.duration-text { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; }

/* 自动确认倒计时 */
.auto-confirm-bar { margin: 0 24rpx 20rpx; background: linear-gradient(135deg, #FFF8E1, #FFECB3); border-radius: 12rpx; padding: 18rpx 24rpx; display: flex; align-items: center; }
.auto-confirm-icon { font-size: 28rpx; margin-right: 12rpx; }
.auto-confirm-text { font-size: 24rpx; color: #E65100; font-weight: 600; }
.action-btn { background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; }
.action-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
.rider-register-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.06); display: flex; align-items: center; }
.register-hint { flex: 1; display: flex; align-items: center; }
.register-hint-icon { font-size: 36rpx; margin-right: 12rpx; }
.register-hint-text { font-size: 26rpx; color: #4A5568; font-weight: 500; }
.register-btn { padding: 20rpx 40rpx; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 40rpx; }
.register-btn text { color: #fff; font-size: 28rpx; font-weight: 700; }
</style>