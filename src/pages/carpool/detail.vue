<template>
  <view class="carpool-detail">
    <!-- 路线大卡 -->
    <view class="route-banner">
      <view class="route-main">
        <view class="route-point">
          <view class="point-dot start"></view>
          <text class="point-name">{{ carpool.from }}</text>
        </view>
        <view class="route-line-h">
          <text class="route-icon">🚗</text>
        </view>
        <view class="route-point">
          <view class="point-dot end"></view>
          <text class="point-name">{{ carpool.to }}</text>
        </view>
      </view>
      <view class="seat-status">
        <text class="seat-text">{{ carpool.currentPeople }}/{{ carpool.maxPeople }} 人</text>
        <text class="seat-label" v-if="carpool.currentPeople < carpool.maxPeople">还差 {{ carpool.maxPeople - carpool.currentPeople }} 人</text>
        <text class="seat-label full" v-else>已满员</text>
      </view>
    </view>

    <!-- 详细信息 -->
    <view class="info-card">
      <text class="card-title">📋 拼车详情</text>
      <view class="info-row">
        <text class="info-label">🕐 出发时间</text>
        <text class="info-value">{{ carpool.departTime }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">📍 上车地点</text>
        <text class="info-value">{{ carpool.pickupLocation }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">⏰ 报名截止</text>
        <text class="info-value">{{ carpool.deadline }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">👥 拼车人数</text>
        <text class="info-value">{{ carpool.maxPeople }} 人</text>
      </view>
    </view>

    <!-- 备注说明 -->
    <view class="info-card" v-if="carpool.remark">
      <text class="card-title">📝 备注说明</text>
      <text class="remark-text">{{ carpool.remark }}</text>
    </view>

    <!-- 发起人信息 -->
    <view class="info-card">
      <text class="card-title">👤 发起人</text>
      <view class="user-info">
        <text class="user-avatar">{{ carpool.avatar }}</text>
        <view class="user-detail">
          <text class="user-name">{{ carpool.publisher }}</text>
          <text class="user-contact">{{ carpool.contact }}</text>
        </view>
        <view class="contact-btn" @click="copyContact">
          <text>📋 复制联系方式</text>
        </view>
      </view>
    </view>

    <!-- 已加入的人 -->
    <view class="info-card">
      <text class="card-title">🚗 已加入 ({{ carpool.members.length }}人)</text>
      <view v-for="(m, i) in carpool.members" :key="i" class="member-item">
        <text class="member-avatar">{{ m.avatar }}</text>
        <text class="member-name">{{ m.name }}</text>
        <text class="member-time">{{ m.joinTime }}</text>
      </view>
      <view v-if="carpool.members.length === 0" class="no-member">
        <text>暂无人加入</text>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="action-bar" v-if="isOwner">
      <view class="action-btn-secondary" @click="cancelCarpool">
        <text>取消拼车</text>
      </view>
      <view class="action-btn-primary" @click="copyContact">
        <text>复制联系方式</text>
      </view>
    </view>
    <view class="action-bar" v-else-if="isJoined">
      <view class="action-btn-secondary" @click="leaveCarpool">
        <text>退出拼车</text>
      </view>
      <view class="action-btn-primary" @click="copyContact">
        <text>复制联系方式</text>
      </view>
    </view>
    <view class="action-bar" v-else-if="carpool.currentPeople < carpool.maxPeople">
      <view class="action-btn-secondary" @click="copyContact">
        <text>复制联系方式</text>
      </view>
      <view class="action-btn-primary" @click="joinCarpool">
        <text>加入拼车</text>
      </view>
    </view>
    <view class="action-bar" v-else>
      <view class="action-btn-disabled">
        <text>已满员，无法加入</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

const carpoolId = ref('')
const isOwner = ref(false)
const isJoined = ref(false)
const carpool = ref({
  id: '', from: '', to: '',
  departTime: '', pickupLocation: '',
  deadline: '', maxPeople: 4, currentPeople: 0,
  publisher: '', avatar: '🧑', contact: '',
  remark: '',
  members: []
})

onLoad((opts) => {
  if (opts && opts.id) {
    carpoolId.value = opts.id
    loadDetail(opts.id)
  }
})

const loadDetail = async (id) => {
  const res = await callCloud('carpool', 'detail', { id: id })
  if (res.code === 0) {
    const d = res.data
    var userInfo = uni.getStorageSync('userInfo')
    var myOpenid = ''
    if (userInfo && userInfo.openid) myOpenid = userInfo.openid
    isOwner.value = (d.openid && myOpenid && d.openid === myOpenid)
    isJoined.value = (d.members && myOpenid && d.members.indexOf(myOpenid) !== -1)
    carpool.value = {
      id: d._id,
      from: d.from || '',
      to: d.to || '',
      departTime: d.departTime || '',
      pickupLocation: d.pickupLocation || '',
      deadline: d.deadline || '',
      maxPeople: d.maxPeople || 4,
      currentPeople: d.currentPeople || 1,
      publisher: d.publisher || '匿名',
      avatar: '🧑',
      contact: d.contact || '',
      remark: d.remark || '',
      members: (d.members || []).map((m, i) => ({
        avatar: '🧑',
        name: i === 0 ? (d.publisher || '发起人') : ('成员' + i),
        joinTime: ''
      }))
    }
  }
}

const copyContact = () => {
  uni.setClipboardData({
    data: carpool.value.contact,
    success: () => {
      uni.showToast({ title: '联系方式已复制', icon: 'success' })
    }
  })
}

const joinCarpool = async () => {
  const res = await callCloud('carpool', 'join', { carpoolId: carpoolId.value })
  if (res.code === 0) {
    carpool.value.currentPeople++
    isJoined.value = true
    carpool.value.members.push({
      avatar: '🧑‍🎓', name: '我', joinTime: '刚刚'
    })
    uni.showToast({ title: '加入成功！请联系发起人进群', icon: 'success' })
  } else {
    uni.showToast({ title: res.msg || '加入失败', icon: 'none' })
  }
}

const leaveCarpool = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出该拼车吗？',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        var res = await callCloud('carpool', 'leave', { carpoolId: carpoolId.value })
        if (res.code === 0) {
          isJoined.value = false
          carpool.value.currentPeople--
          uni.showToast({ title: '已退出', icon: 'success' })
        } else {
          uni.showToast({ title: res.msg || '退出失败', icon: 'none' })
        }
      }
    }
  })
}

const cancelCarpool = () => {
  uni.showModal({
    title: '确认取消',
    content: '取消后所有成员将被移除，确定吗？',
    success: async (modalRes) => {
      if (modalRes.confirm) {
        var res = await callCloud('carpool', 'cancel', { carpoolId: carpoolId.value })
        if (res.code === 0) {
          uni.showToast({ title: '拼车已取消', icon: 'success' })
          setTimeout(function() { uni.navigateBack() }, 1000)
        }
      }
    }
  })
}
</script>

<style scoped>
.carpool-detail { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }

.route-banner { background: linear-gradient(135deg, #43A047, #2E7D32); padding: 40rpx 32rpx; }
.route-main { display: flex; align-items: center; justify-content: center; margin-bottom: 24rpx; }
.route-point { display: flex; flex-direction: column; align-items: center; }
.point-dot { width: 24rpx; height: 24rpx; border-radius: 50%; margin-bottom: 8rpx; }
.point-dot.start { background: #fff; }
.point-dot.end { background: #FFD54F; }
.point-name { font-size: 32rpx; font-weight: bold; color: #fff; }
.route-line-h { flex: 1; display: flex; align-items: center; justify-content: center; margin: 0 20rpx; }
.route-icon { font-size: 36rpx; }

.seat-status { display: flex; flex-direction: column; align-items: center; }
.seat-text { font-size: 36rpx; font-weight: bold; color: #fff; }
.seat-label { font-size: 24rpx; color: rgba(255,255,255,0.8); margin-top: 4rpx; }
.seat-label.full { color: #FFD54F; }

.info-card { background: #fff; margin: 20rpx 24rpx 0; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.card-title { font-size: 28rpx; font-weight: bold; color: #333; margin-bottom: 16rpx; display: block; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; }
.info-label { font-size: 26rpx; color: #666; }
.info-value { font-size: 26rpx; color: #333; font-weight: bold; }
.remark-text { font-size: 26rpx; color: #666; line-height: 40rpx; display: block; }

.user-info { display: flex; align-items: center; }
.user-avatar { font-size: 48rpx; margin-right: 16rpx; }
.user-detail { flex: 1; }
.user-name { font-size: 28rpx; font-weight: bold; color: #333; display: block; }
.user-contact { font-size: 24rpx; color: #4A90D9; margin-top: 4rpx; }
.contact-btn { padding: 12rpx 20rpx; background: #E3F2FD; border-radius: 20rpx; }
.contact-btn text { font-size: 22rpx; color: #4A90D9; }

.member-item { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #f5f5f5; }
.member-item:last-child { border-bottom: none; }
.member-avatar { font-size: 36rpx; margin-right: 12rpx; }
.member-name { flex: 1; font-size: 26rpx; color: #333; }
.member-time { font-size: 22rpx; color: #999; }
.no-member text { font-size: 24rpx; color: #999; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 40rpx; background: #fff; display: flex; gap: 16rpx; }
.action-btn-secondary { flex: 1; border: 2rpx solid #43A047; border-radius: 48rpx; padding: 24rpx; text-align: center; }
.action-btn-secondary text { color: #43A047; font-size: 28rpx; font-weight: bold; }
.action-btn-primary { flex: 2; background: linear-gradient(135deg, #43A047, #2E7D32); border-radius: 48rpx; padding: 24rpx; text-align: center; }
.action-btn-primary text { color: #fff; font-size: 28rpx; font-weight: bold; }
.action-btn-disabled { flex: 1; background: #e0e0e0; border-radius: 48rpx; padding: 24rpx; text-align: center; }
.action-btn-disabled text { color: #999; font-size: 28rpx; }
</style>
