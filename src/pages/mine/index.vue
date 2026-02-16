<template>
  <view class="mine-page">
    <!-- 用户头部 -->
    <view class="profile-header" @click="onHeaderClick">
      <view class="avatar-wrap">
        <image v-if="isValidImage(userInfo.avatar)" :src="userInfo.avatar" class="avatar-img" />
        <text v-else class="avatar-text">🧑‍💼</text>
      </view>
      <view class="profile-info">
        <view class="name-row">
          <text class="user-name">{{ userInfo.name }}</text>
          <view class="level-tag" v-if="isLoggedIn">
            <text>{{ userInfo.level }}</text>
          </view>
        </view>
        <text class="user-phone" v-if="isLoggedIn">{{ userInfo.phone }}</text>
        <text class="user-phone" v-else>点击登录/注册</text>
        <text class="user-id" v-if="isRider">骑手编号 {{ userInfo.riderId }}</text>
      </view>
      <view class="edit-btn" @click.stop="goLogin">
        <text>{{ isLoggedIn ? '编辑' : '登录' }}</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-card" v-if="isLoggedIn">
      <view class="stat-item">
        <text class="stat-num">{{ stats.publishedCount }}</text>
        <text class="stat-label">发布订单</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.takenCount }}</text>
        <text class="stat-label">完成接单</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">{{ stats.income || 0 }}</text>
        <text class="stat-label">总收入</text>
      </view>
    </view>

    <!-- 消息中心入口 -->
    <view class="msg-entry" v-if="isLoggedIn" @click="goPage('/pages/message/index')">
      <view class="msg-entry-left">
        <view class="msg-icon-bg"><text class="mi">🔔</text></view>
        <text class="msg-entry-text">消息中心</text>
      </view>
      <view class="msg-entry-right">
        <view class="unread-badge" v-if="unreadCount > 0">
          <text>{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <!-- 我的服务 -->
    <view class="menu-group">
      <text class="group-title">我的服务</text>
      <view class="menu-card">
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #63B3ED, #2B6CB0);"><text class="mi">📦</text></view>
          <text class="menu-text">我发布的</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/order/list?tab=1')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #B794F4, #805AD5);"><text class="mi">📋</text></view>
          <text class="menu-text">我的接单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/forum/my')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #4FD1C5, #319795);"><text class="mi">💬</text></view>
          <text class="menu-text">我的帖子</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item last" @click="goPage('/pages/mine/favorites')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6E05E, #D69E2E);"><text class="mi">⭐</text></view>
          <text class="menu-text">我的收藏</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 骑手服务 -->
    <view class="menu-group" v-if="isLoggedIn">
      <text class="group-title">骑手服务</text>
      <view class="menu-card">
        <view class="menu-item" v-if="!isRider" @click="goPage('/pages/express/rider-register')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6AD55, #DD6B20);"><text class="mi">🏅</text></view>
          <text class="menu-text">注册骑手</text>
          <view class="rider-tip"><text>接单赚钱</text></view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" v-if="isRider" @click="goPage('/pages/express/building-orders')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #63B3ED, #2B6CB0);"><text class="mi">🏢</text></view>
          <text class="menu-text">楼栋订单统计</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item last" @click="showWallet">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6AD55, #DD6B20);"><text class="mi">💰</text></view>
          <text class="menu-text">我的钱包</text>
          <view class="wallet-amount"><text>¥{{ stats.income || 0 }}</text></view>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 其他 -->
    <view class="menu-group">
      <view class="menu-card">
        <view class="menu-item last" @click="showFeedback">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #4FD1C5, #319795);"><text class="mi">❓</text></view>
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="logout-btn" v-if="isLoggedIn" @click="handleLogout">
      <text>退出登录</text>
    </view>

    <MsgNotify />
    <ServiceFab />
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'
import ServiceFab from '@/components/ServiceFab.vue'
import MsgNotify from '@/components/MsgNotify.vue'

const isRider = ref(false)
const isLoggedIn = ref(false)
const unreadCount = ref(0)
const userInfo = reactive({ name: '加载中...', phone: '', riderId: '', level: 'Lv.1 新手', avatar: '' })
const stats = reactive({ publishedCount: 0, takenCount: 0, income: 0 })

const checkLoggedIn = () => {
  var info = uni.getStorageSync('userInfo')
  isLoggedIn.value = !!(info && info.name)
  return isLoggedIn.value
}

const loadProfile = async () => {
  if (!checkLoggedIn()) {
    userInfo.name = '未登录'
    userInfo.phone = '点击登录'
    userInfo.avatar = ''
    userInfo.riderId = ''
    isRider.value = false
    return
  }
  const res = await callCloud('user', 'getProfile')
  if (res.code === 0) {
    const u = res.data
    userInfo.name = u.name || '未设置昵称'
    userInfo.phone = u.phone || '未绑定手机'
    userInfo.riderId = u.riderId || ''
    userInfo.level = u.level || 'Lv.1 新手'
    userInfo.avatar = u.avatar || ''
    isRider.value = !!u.isRider
    uni.setStorageSync('isRider', u.isRider ? 1 : 0)
  }
}

const loadStats = async () => {
  if (!isLoggedIn.value) return
  const res = await callCloud('user', 'getStats')
  if (res.code === 0) {
    stats.publishedCount = res.data.publishedCount || 0
    stats.takenCount = res.data.takenCount || 0
    stats.income = res.data.income || 0
  }
}

const loadUnreadCount = async () => {
  if (!isLoggedIn.value) return
  var res = await callCloud('message', 'unreadCount')
  if (res.code === 0) {
    unreadCount.value = res.count || 0
  }
}

const requireLogin = () => {
  if (isLoggedIn.value) return true
  uni.navigateTo({ url: '/pages/login/index' })
  return false
}

const goPage = (url) => {
  if (!requireLogin()) return
  uni.navigateTo({ url })
}
const goTabPage = (url) => { uni.switchTab({ url }) }
const goLogin = () => { uni.navigateTo({ url: '/pages/login/index' }) }
const onHeaderClick = () => {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/login/index' })
  }
}
const isValidImage = (src) => {
  if (!src || typeof src !== 'string') return false
  return src.indexOf('cloud://') === 0 || src.indexOf('https://') === 0 || src.indexOf('http://') === 0
}
const showTip = (msg) => { uni.showToast({ title: msg, icon: 'none' }) }
const showWallet = () => {
  uni.showModal({
    title: '我的钱包',
    content: '累计收入 ¥' + (stats.income || 0) + '\n提现功能即将上线',
    showCancel: false
  })
}
const showFeedback = () => {
  uni.navigateTo({ url: '/pages/kefu/show?img=' + encodeURIComponent('/static/TeamWork.png') })
}
const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('isRider')
        uni.removeStorageSync('openid')
        userInfo.name = '未登录'
        userInfo.phone = ''
        userInfo.avatar = ''
        userInfo.riderId = ''
        userInfo.level = 'Lv.1 新手'
        isRider.value = false
        stats.publishedCount = 0
        stats.takenCount = 0
        stats.income = 0
        uni.showToast({ title: '已退出登录', icon: 'success' })
      }
    }
  })
}

onShow(() => { loadProfile(); loadStats(); loadUnreadCount() })
</script>

<style scoped>
.mine-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 60rpx; }

/* 头部 */
.profile-header { background: linear-gradient(160deg, #1A4F8B 0%, #2B6CB0 40%, #4299E1 100%); padding: 80rpx 32rpx 48rpx; display: flex; align-items: center; position: relative; }
.avatar-wrap { width: 120rpx; height: 120rpx; border-radius: 28rpx; background: rgba(255,255,255,0.2); border: 2rpx solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; margin-right: 24rpx; overflow: hidden; }
.avatar-img { width: 120rpx; height: 120rpx; border-radius: 28rpx; }
.avatar-text { font-size: 56rpx; }
.profile-info { flex: 1; }
.name-row { display: flex; align-items: center; gap: 12rpx; }
.user-name { font-size: 36rpx; font-weight: 800; color: #fff; }
.level-tag { padding: 6rpx 16rpx; border-radius: 20rpx; background: rgba(255,255,255,0.2); border: 1rpx solid rgba(255,255,255,0.3); }
.level-tag text { font-size: 20rpx; color: #fff; font-weight: 600; }
.user-phone { font-size: 26rpx; color: rgba(255,255,255,0.8); margin-top: 8rpx; display: block; }
.user-id { font-size: 22rpx; color: rgba(255,255,255,0.6); margin-top: 4rpx; display: block; }
.edit-btn { padding: 12rpx 28rpx; border: 1rpx solid rgba(255,255,255,0.4); border-radius: 28rpx; background: rgba(255,255,255,0.1); transition: background 0.15s ease; }
.edit-btn:active { background: rgba(255,255,255,0.25); }
.edit-btn text { font-size: 24rpx; color: #fff; font-weight: 500; }

/* 统计卡 */
.stats-card { display: flex; align-items: center; background: #fff; margin: -24rpx 28rpx 24rpx; border-radius: 20rpx; padding: 32rpx 0; box-shadow: 0 8rpx 24rpx rgba(26,79,139,0.1); }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: 800; color: #2B6CB0; }
.stat-label { font-size: 22rpx; color: #A0AEC0; margin-top: 8rpx; font-weight: 500; }
.stat-divider { width: 1rpx; height: 60rpx; background: #E2E8F0; }

/* 消息入口 */
.msg-entry { display: flex; align-items: center; justify-content: space-between; background: #fff; margin: 0 28rpx 24rpx; border-radius: 20rpx; padding: 24rpx 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.msg-entry:active { background: #F7FAFC; }
.msg-entry-left { display: flex; align-items: center; }
.msg-icon-bg { width: 56rpx; height: 56rpx; border-radius: 14rpx; background: linear-gradient(135deg, #FC8181, #E53E3E); display: flex; align-items: center; justify-content: center; margin-right: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.msg-entry-text { font-size: 28rpx; color: #2D3748; font-weight: 600; }
.msg-entry-right { display: flex; align-items: center; }
.unread-badge { background: #E53E3E; border-radius: 20rpx; padding: 2rpx 12rpx; margin-right: 8rpx; min-width: 32rpx; text-align: center; }
.unread-badge text { font-size: 20rpx; color: #fff; font-weight: 700; }

/* 菜单组 */
.menu-group { padding: 0 28rpx; margin-bottom: 24rpx; }
.group-title { font-size: 26rpx; color: #A0AEC0; font-weight: 600; padding: 16rpx 4rpx 12rpx; display: block; letter-spacing: 1rpx; }
.menu-card { background: #fff; border-radius: 20rpx; overflow: hidden; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.menu-item { display: flex; align-items: center; padding: 24rpx 28rpx; border-bottom: 1rpx solid #F7FAFC; transition: background 0.15s ease; }
.menu-item:active { background: #F7FAFC; }
.menu-item.last { border-bottom: none; }
.menu-icon-bg { width: 56rpx; height: 56rpx; border-radius: 14rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.08); }
.mi { font-size: 28rpx; }
.menu-text { flex: 1; font-size: 28rpx; color: #2D3748; font-weight: 500; }
.menu-sub { font-size: 22rpx; color: #A0AEC0; margin-right: 8rpx; }
.menu-arrow { font-size: 28rpx; color: #CBD5E0; font-weight: 300; }
.rider-tip { padding: 4rpx 14rpx; border-radius: 12rpx; background: linear-gradient(135deg, #FFFAF0, #FFF5EB); border: 1rpx solid #FEEBC8; margin-right: 8rpx; }
.rider-tip text { font-size: 20rpx; color: #DD6B20; font-weight: 700; }
.wallet-amount { padding: 4rpx 14rpx; border-radius: 12rpx; background: #FFFAF0; border: 1rpx solid #FEEBC8; margin-right: 8rpx; }
.wallet-amount text { font-size: 22rpx; color: #DD6B20; font-weight: 700; }
/* 退出 */
.logout-btn { margin: 20rpx 28rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.15s ease; }
.logout-btn:active { transform: scale(0.98); }
.logout-btn text { color: #E53E3E; font-size: 28rpx; font-weight: 600; }
</style>
