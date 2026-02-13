<template>
  <view class="mine-page">
    <!-- 用户头部 -->
    <view class="profile-header">
      <view class="avatar-wrap">
        <text class="avatar-text">🧑‍💼</text>
      </view>
      <view class="profile-info">
        <view class="name-row">
          <text class="user-name">{{ userInfo.name }}</text>
          <view class="level-tag">
            <text>{{ userInfo.level }}</text>
          </view>
        </view>
        <text class="user-phone">{{ userInfo.phone }}</text>
        <text class="user-id" v-if="isRider">骑手编号 {{ userInfo.riderId }}</text>
        <text class="user-id" v-else>还未注册骑手</text>
      </view>
      <view class="edit-btn" @click="goLogin">
        <text>编辑</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-num">12</text>
        <text class="stat-label">发布订单</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">8</text>
        <text class="stat-label">完成接单</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-num">¥236</text>
        <text class="stat-label">总收入</text>
      </view>
    </view>

    <!-- 我的服务 -->
    <view class="menu-group">
      <text class="group-title">我的服务</text>
      <view class="menu-card">
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #63B3ED, #2B6CB0);"><text class="mi">📦</text></view>
          <text class="menu-text">我的快递单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6AD55, #DD6B20);"><text class="mi">🏃</text></view>
          <text class="menu-text">我的跑腿任务</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #68D391, #38A169);"><text class="mi">🚗</text></view>
          <text class="menu-text">我的拼车</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goPage('/pages/order/list')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #B794F4, #805AD5);"><text class="mi">📋</text></view>
          <text class="menu-text">我的接单</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" v-if="!isRider" @click="goPage('/pages/express/rider-register')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6AD55, #DD6B20);"><text class="mi">🏅</text></view>
          <text class="menu-text">注册骑手</text>
          <view class="rider-tip"><text>接单赚钱</text></view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #FC8181, #E53E3E);"><text class="mi">🛒</text></view>
          <text class="menu-text">我的商品</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item last">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #4FD1C5, #319795);"><text class="mi">💬</text></view>
          <text class="menu-text">我的帖子</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 骑手中心 -->
    <view class="menu-group">
      <text class="group-title">骑手中心</text>
      <view class="menu-card">
        <view class="rider-banner">
          <view class="rider-badge">🏅</view>
          <view class="rider-info">
            <text class="rider-name">{{ userInfo.name }}</text>
            <text class="rider-level">{{ userInfo.level }}</text>
          </view>
          <view class="rider-stats">
            <view class="rs-item">
              <text class="rs-num">18</text>
              <text class="rs-label">本月完成</text>
            </view>
            <view class="rs-item">
              <text class="rs-num">98%</text>
              <text class="rs-label">好评率</text>
            </view>
          </view>
        </view>
        <view class="menu-item last" @click="goPage('/pages/express/building-orders')">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #63B3ED, #2B6CB0);"><text class="mi">🏢</text></view>
          <text class="menu-text">楼栋订单统计</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 其他 -->
    <view class="menu-group">
      <text class="group-title">其他</text>
      <view class="menu-card">
        <view class="menu-item">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6AD55, #DD6B20);"><text class="mi">💰</text></view>
          <text class="menu-text">我的钱包</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #F6E05E, #D69E2E);"><text class="mi">⭐</text></view>
          <text class="menu-text">我的收藏</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #A0AEC0, #718096);"><text class="mi">⚙️</text></view>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item last">
          <view class="menu-icon-bg" style="background: linear-gradient(135deg, #4FD1C5, #319795);"><text class="mi">❓</text></view>
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <view class="logout-btn">
      <text>退出登录</text>
    </view>

    <ServiceFab />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import ServiceFab from '@/components/ServiceFab.vue'

const isRider = ref(true) // mock: 是否已注册骑手，true=已注册
const userInfo = { name: '林曜', phone: '188****3886', riderId: 'R-20260213-08', level: 'Lv.3 值得信赖' }

const goPage = (url) => { uni.navigateTo({ url }) }
const goLogin = () => { uni.navigateTo({ url: '/pages/login/index' }) }

onShow(() => {
  // 从本地存储读取骑手注册状态
  const stored = uni.getStorageSync('isRider')
  if (stored === 0 || stored === '0') isRider.value = false
})
</script>

<style scoped>
.mine-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 60rpx; }

/* 头部 */
.profile-header { background: linear-gradient(160deg, #1A4F8B 0%, #2B6CB0 40%, #4299E1 100%); padding: 80rpx 32rpx 48rpx; display: flex; align-items: center; position: relative; }
.avatar-wrap { width: 120rpx; height: 120rpx; border-radius: 28rpx; background: rgba(255,255,255,0.2); border: 2rpx solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; margin-right: 24rpx; }
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
.menu-arrow { font-size: 28rpx; color: #CBD5E0; font-weight: 300; }
.rider-tip { padding: 4rpx 14rpx; border-radius: 12rpx; background: linear-gradient(135deg, #FFFAF0, #FFF5EB); border: 1rpx solid #FEEBC8; margin-right: 8rpx; }
.rider-tip text { font-size: 20rpx; color: #DD6B20; font-weight: 700; }

/* 骑手卡 */
.rider-banner { margin: 16rpx 20rpx; padding: 24rpx; background: linear-gradient(135deg, #EBF4FF, #F0F7FF); border-radius: 16rpx; border: 1rpx solid #BEE3F8; display: flex; align-items: center; }
.rider-badge { font-size: 40rpx; margin-right: 16rpx; }
.rider-info { flex: 1; }
.rider-name { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; }
.rider-level { font-size: 22rpx; color: #2B6CB0; margin-top: 4rpx; display: block; font-weight: 600; }
.rider-stats { display: flex; gap: 24rpx; }
.rs-item { display: flex; flex-direction: column; align-items: center; }
.rs-num { font-size: 28rpx; font-weight: 800; color: #2B6CB0; }
.rs-label { font-size: 20rpx; color: #A0AEC0; }

/* 退出 */
.logout-btn { margin: 20rpx 28rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; text-align: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.15s ease; }
.logout-btn:active { transform: scale(0.98); }
.logout-btn text { color: #E53E3E; font-size: 28rpx; font-weight: 600; }
</style>
