<template>
  <view class="carpool-page">
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === i}" v-for="(name, i) in tabNames" :key="i" @click="tab = i">
        <text>{{ name }}</text>
        <view v-if="tab === i" class="tab-line"></view>
      </view>
    </view>

    <view class="carpool-list">
      <view v-for="item in filteredList" :key="item.id" class="carpool-card" @click="goDetail(item.id)">
        <view class="card-top">
          <view class="route-row">
            <text class="route-city">{{ item.from }}</text>
            <view class="route-arrow-wrap">
              <view class="arrow-line"></view>
              <text class="arrow-icon">›</text>
            </view>
            <text class="route-city">{{ item.to }}</text>
          </view>
          <view class="seat-badge" :class="{full: item.currentPeople >= item.maxPeople}">
            <text>{{ item.currentPeople }}/{{ item.maxPeople }}</text>
          </view>
        </view>
        <view class="card-detail">
          <view class="detail-item">
            <text class="detail-icon">🕐</text>
            <text class="detail-text">{{ item.departTime }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-icon">📍</text>
            <text class="detail-text">{{ item.pickupLocation }}</text>
          </view>
        </view>
        <view class="card-bottom">
          <view class="publisher">
            <text class="pub-avatar">{{ item.avatar }}</text>
            <text class="pub-name">{{ item.publisher }}</text>
            <text class="pub-time">{{ item.publishTime }}</text>
          </view>
          <view class="join-btn" :class="{disabled: item.currentPeople >= item.maxPeople}">
            <text>{{ item.currentPeople >= item.maxPeople ? '已满员' : '加入' }}</text>
          </view>
        </view>
      </view>
      <view v-if="filteredList.length === 0" class="empty">
        <text class="empty-emoji">🚗</text>
        <text class="empty-text">暂无拼车信息</text>
      </view>
    </view>

    <view class="fab-btn" @click="goCreate"><text>+ 发起拼车</text></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const tab = ref(0)
const tabNames = ['全部拼车','可加入','已满员']
const carpoolList = ref([
  { id: 1, from: '学校南门', to: '火车站', departTime: '2026-02-11 08:00', pickupLocation: '南门星巴克门口', deadline: '2026-02-10 22:00', maxPeople: 4, currentPeople: 2, publisher: '小王', avatar: '🧑', publishTime: '1小时前' },
  { id: 2, from: '学校北门', to: '机场T2', departTime: '2026-02-12 06:30', pickupLocation: '北门公交站', deadline: '2026-02-11 20:00', maxPeople: 3, currentPeople: 1, publisher: '小陈', avatar: '👩', publishTime: '2小时前' },
  { id: 3, from: '学校西门', to: '高铁站', departTime: '2026-02-11 14:00', pickupLocation: '西门快递站旁', deadline: '2026-02-11 12:00', maxPeople: 4, currentPeople: 4, publisher: '老张', avatar: '🧑‍🎓', publishTime: '3小时前' },
  { id: 4, from: '市中心', to: '学校东门', departTime: '2026-02-13 18:00', pickupLocation: '万达广场正门', deadline: '2026-02-13 16:00', maxPeople: 3, currentPeople: 1, publisher: '小李', avatar: '👩‍🎓', publishTime: '5小时前' }
])

const filteredList = computed(() => {
  if (tab.value === 0) return carpoolList.value
  if (tab.value === 1) return carpoolList.value.filter(c => c.currentPeople < c.maxPeople)
  return carpoolList.value.filter(c => c.currentPeople >= c.maxPeople)
})

const goDetail = (id) => { uni.navigateTo({ url: '/pages/carpool/detail?id=' + id }) }
const goCreate = () => { uni.navigateTo({ url: '/pages/carpool/create' }) }
</script>

<style scoped>
.carpool-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 160rpx; }

.tab-bar { display: flex; background: #fff; box-shadow: 0 1rpx 0 #E2E8F0; }
.tab-item { flex: 1; text-align: center; padding: 28rpx 0 24rpx; font-size: 26rpx; color: #A0AEC0; font-weight: 500; position: relative; }
.tab-item.active { color: #38A169; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(90deg, #48BB78, #38A169); }

.carpool-list { padding: 20rpx 28rpx; }
.carpool-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.carpool-card:active { transform: scale(0.98); box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.route-row { display: flex; align-items: center; flex: 1; }
.route-city { font-size: 32rpx; font-weight: 800; color: #1A1A2E; }
.route-arrow-wrap { display: flex; align-items: center; margin: 0 16rpx; }
.arrow-line { width: 40rpx; height: 2rpx; background: linear-gradient(90deg, #48BB78, #38A169); }
.arrow-icon { font-size: 24rpx; color: #38A169; font-weight: 800; margin-left: -4rpx; }
.seat-badge { padding: 8rpx 20rpx; border-radius: 20rpx; background: #F0FFF4; border: 1rpx solid #C6F6D5; }
.seat-badge text { font-size: 24rpx; color: #38A169; font-weight: 700; }
.seat-badge.full { background: #FFF5F5; border-color: #FED7D7; }
.seat-badge.full text { color: #E53E3E; }

.card-detail { background: #F7FAFC; border-radius: 14rpx; padding: 18rpx 22rpx; margin-bottom: 20rpx; }
.detail-item { display: flex; align-items: center; padding: 6rpx 0; }
.detail-icon { font-size: 22rpx; margin-right: 12rpx; }
.detail-text { font-size: 24rpx; color: #4A5568; font-weight: 500; }

.card-bottom { display: flex; justify-content: space-between; align-items: center; }
.publisher { display: flex; align-items: center; }
.pub-avatar { font-size: 32rpx; margin-right: 10rpx; }
.pub-name { font-size: 24rpx; color: #2D3748; font-weight: 600; margin-right: 12rpx; }
.pub-time { font-size: 22rpx; color: #A0AEC0; }
.join-btn { padding: 10rpx 28rpx; border-radius: 24rpx; background: linear-gradient(135deg, #48BB78, #38A169); box-shadow: 0 4rpx 12rpx rgba(56,161,105,0.25); transition: transform 0.15s ease; }
.join-btn:active { transform: scale(0.92); }
.join-btn text { font-size: 24rpx; color: #fff; font-weight: 700; }
.join-btn.disabled { background: #EDF2F7; box-shadow: none; }
.join-btn.disabled text { color: #A0AEC0; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; }

.fab-btn { position: fixed; bottom: 48rpx; left: 28rpx; right: 28rpx; background: linear-gradient(135deg, #48BB78, #38A169); border-radius: 52rpx; padding: 30rpx; text-align: center; box-shadow: 0 12rpx 32rpx rgba(56,161,105,0.35); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.fab-btn:active { transform: scale(0.96); box-shadow: 0 6rpx 16rpx rgba(56,161,105,0.4); }
.fab-btn text { color: #fff; font-size: 30rpx; font-weight: 700; letter-spacing: 2rpx; }
</style>
