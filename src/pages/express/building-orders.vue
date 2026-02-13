<template>
  <view class="building-orders">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-title">🏢 各宿舍楼订单统计</text>
      <text class="page-desc">骑手可根据楼栋订单数选择配送区域</text>
    </view>

    <!-- 楼栋列表 -->
    <view class="building-list">
      <view v-for="building in buildings" :key="building.name" class="building-card" @click="goBuilding(building.name)">
        <view class="building-left">
          <text class="building-icon">🏠</text>
          <view class="building-info">
            <text class="building-name">{{ building.name }}</text>
            <text class="building-detail">待接单 {{ building.pending }} 单 · 配送中 {{ building.delivering }} 单</text>
          </view>
        </view>
        <view class="building-right">
          <view class="order-count-badge" :class="building.level">
            <text class="count-num">{{ building.total }}</text>
            <text class="count-label">待处理</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-card">
      <text class="stats-title">📊 今日数据</text>
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-num">{{ totalPending }}</text>
          <text class="stat-label">待接单</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ totalDelivering }}</text>
          <text class="stat-label">配送中</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ totalCompleted }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">¥{{ totalEarnings }}</text>
          <text class="stat-label">总收入</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const buildings = ref([
  { name: '1号宿舍楼', pending: 3, delivering: 1, total: 4, level: 'high' },
  { name: '2号宿舍楼', pending: 1, delivering: 1, total: 2, level: 'low' },
  { name: '3号宿舍楼', pending: 4, delivering: 2, total: 6, level: 'high' },
  { name: '5号宿舍楼', pending: 0, delivering: 1, total: 1, level: 'low' },
  { name: '6号宿舍楼', pending: 3, delivering: 0, total: 3, level: 'mid' },
  { name: '8号宿舍楼', pending: 2, delivering: 1, total: 3, level: 'mid' },
  { name: '10号宿舍楼', pending: 1, delivering: 0, total: 1, level: 'low' },
  { name: '12号宿舍楼', pending: 0, delivering: 0, total: 0, level: 'low' }
])

const totalPending = computed(() => buildings.value.reduce((s, b) => s + b.pending, 0))
const totalDelivering = computed(() => buildings.value.reduce((s, b) => s + b.delivering, 0))
const totalCompleted = ref(23)
const totalEarnings = ref(89)

const goBuilding = (name) => {
  uni.navigateTo({ url: '/pages/express/index?building=' + encodeURIComponent(name) })
}
</script>

<style scoped>
.building-orders { background: #F5F7FA; min-height: 100vh; padding-bottom: 40rpx; }

.page-header { padding: 32rpx 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); }
.page-title { font-size: 36rpx; font-weight: bold; color: #fff; display: block; }
.page-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 8rpx; }

.building-list { padding: 20rpx 24rpx; }
.building-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 16rpx; padding: 28rpx 24rpx; margin-bottom: 12rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.building-left { display: flex; align-items: center; }
.building-icon { font-size: 40rpx; margin-right: 16rpx; }
.building-name { font-size: 30rpx; font-weight: bold; color: #333; display: block; }
.building-detail { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; }

.order-count-badge { width: 100rpx; height: 100rpx; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.order-count-badge.high { background: #FFEBEE; }
.order-count-badge.mid { background: #FFF3E0; }
.order-count-badge.low { background: #E8F5E9; }
.count-num { font-size: 36rpx; font-weight: bold; }
.order-count-badge.high .count-num { color: #FF6B6B; }
.order-count-badge.mid .count-num { color: #FF9800; }
.order-count-badge.low .count-num { color: #66BB6A; }
.count-label { font-size: 18rpx; color: #999; }

.stats-card { margin: 0 24rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.stats-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }
.stats-grid { display: flex; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: bold; color: #4A90D9; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 8rpx; }
</style>
