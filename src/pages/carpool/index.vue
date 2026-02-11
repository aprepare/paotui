<template>
  <view class="carpool-page">
    <!-- 顶部Tab -->
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === 0}" @click="tab = 0">
        <text>全部拼车</text>
      </view>
      <view class="tab-item" :class="{active: tab === 1}" @click="tab = 1">
        <text>可加入</text>
      </view>
      <view class="tab-item" :class="{active: tab === 2}" @click="tab = 2">
        <text>已满员</text>
      </view>
    </view>

    <!-- 拼车列表 -->
    <view class="carpool-list">
      <view v-for="item in filteredList" :key="item.id" class="carpool-card" @click="goDetail(item.id)">
        <!-- 顶部信息 -->
        <view class="card-top">
          <view class="route-info">
            <text class="route-from">{{ item.from }}</text>
            <text class="route-arrow">→</text>
            <text class="route-to">{{ item.to }}</text>
          </view>
          <view class="seat-badge" :class="{full: item.currentPeople >= item.maxPeople}">
            <text>{{ item.currentPeople }}/{{ item.maxPeople }}人</text>
          </view>
        </view>

        <!-- 详细信息 -->
        <view class="card-detail">
          <view class="detail-row">
            <text class="detail-icon">🕐</text>
            <text class="detail-text">出发时间：{{ item.departTime }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-icon">📍</text>
            <text class="detail-text">上车地点：{{ item.pickupLocation }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-icon">⏰</text>
            <text class="detail-text">截止时间：{{ item.deadline }}</text>
          </view>
        </view>

        <!-- 底部 -->
        <view class="card-bottom">
          <view class="publisher-info">
            <text class="publisher-avatar">{{ item.avatar }}</text>
            <text class="publisher-name">{{ item.publisher }}</text>
            <text class="publish-time">{{ item.publishTime }}</text>
          </view>
          <view v-if="item.currentPeople < item.maxPeople" class="join-tag">
            <text>可加入</text>
          </view>
          <view v-else class="full-tag">
            <text>已满员</text>
          </view>
        </view>
      </view>

      <view v-if="filteredList.length === 0" class="empty">
        <text class="empty-emoji">🚗</text>
        <text class="empty-text">暂无拼车信息</text>
      </view>
    </view>

    <!-- 发布按钮 -->
    <view class="fab-btn" @click="goCreate">
      <text>+ 发起拼车</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const tab = ref(0)

const carpoolList = ref([
  { id: 1, from: '学校南门', to: '火车站', departTime: '2026-02-11 08:00', pickupLocation: '南门星巴克门口', deadline: '2026-02-10 22:00', maxPeople: 4, currentPeople: 2, publisher: '小王', avatar: '🧑', contact: '微信 wang123', publishTime: '1小时前' },
  { id: 2, from: '学校北门', to: '机场T2', departTime: '2026-02-12 06:30', pickupLocation: '北门公交站', deadline: '2026-02-11 20:00', maxPeople: 3, currentPeople: 1, publisher: '小陈', avatar: '👩', contact: '微信 chen456', publishTime: '2小时前' },
  { id: 3, from: '学校西门', to: '高铁站', departTime: '2026-02-11 14:00', pickupLocation: '西门快递站旁', deadline: '2026-02-11 12:00', maxPeople: 4, currentPeople: 4, publisher: '老张', avatar: '🧑‍🎓', contact: '电话 188xxxx', publishTime: '3小时前' },
  { id: 4, from: '市中心', to: '学校东门', departTime: '2026-02-13 18:00', pickupLocation: '万达广场正门', deadline: '2026-02-13 16:00', maxPeople: 3, currentPeople: 1, publisher: '小李', avatar: '👩‍🎓', contact: '微信 li789', publishTime: '5小时前' }
])

const filteredList = computed(() => {
  if (tab.value === 0) return carpoolList.value
  if (tab.value === 1) return carpoolList.value.filter(c => c.currentPeople < c.maxPeople)
  return carpoolList.value.filter(c => c.currentPeople >= c.maxPeople)
})

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/carpool/detail?id=${id}` })
}

const goCreate = () => {
  uni.navigateTo({ url: '/pages/carpool/create' })
}
</script>

<style scoped>
.carpool-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }

.tab-bar { display: flex; background: #fff; padding: 0 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 26rpx; color: #999; border-bottom: 4rpx solid transparent; }
.tab-item.active { color: #4A90D9; font-weight: bold; border-bottom-color: #4A90D9; }

.carpool-list { padding: 20rpx 24rpx; }
.carpool-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.route-info { display: flex; align-items: center; flex: 1; }
.route-from { font-size: 30rpx; font-weight: bold; color: #333; }
.route-arrow { font-size: 28rpx; color: #4A90D9; margin: 0 16rpx; font-weight: bold; }
.route-to { font-size: 30rpx; font-weight: bold; color: #333; }
.seat-badge { padding: 8rpx 20rpx; border-radius: 20rpx; background: #E8F5E9; }
.seat-badge text { font-size: 24rpx; color: #43A047; font-weight: bold; }
.seat-badge.full { background: #FFEBEE; }
.seat-badge.full text { color: #FF6B6B; }

.card-detail { background: #F5F7FA; border-radius: 12rpx; padding: 16rpx 20rpx; margin-bottom: 16rpx; }
.detail-row { display: flex; align-items: center; padding: 6rpx 0; }
.detail-icon { font-size: 24rpx; margin-right: 10rpx; }
.detail-text { font-size: 24rpx; color: #666; }

.card-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.publisher-info { display: flex; align-items: center; }
.publisher-avatar { font-size: 32rpx; margin-right: 8rpx; }
.publisher-name { font-size: 24rpx; color: #333; margin-right: 12rpx; }
.publish-time { font-size: 22rpx; color: #999; }
.join-tag { padding: 8rpx 20rpx; background: #E3F2FD; border-radius: 16rpx; }
.join-tag text { font-size: 22rpx; color: #4A90D9; font-weight: bold; }
.full-tag { padding: 8rpx 20rpx; background: #f0f0f0; border-radius: 16rpx; }
.full-tag text { font-size: 22rpx; color: #999; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }

.fab-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #43A047, #2E7D32); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(67,160,71,0.4); }
.fab-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
