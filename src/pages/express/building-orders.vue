<template>
  <view class="building-orders">
    <!-- 顶部标题 -->
    <view class="page-header">
      <text class="page-title">🏢 各宿舍楼订单统计</text>
      <text class="page-desc">骑手可根据楼栋订单数选择配送区域</text>
    </view>

    <!-- 楼栋列表 -->
    <view class="building-list">
      <view v-for="(b, i) in buildings" :key="i" class="building-card" @click="goBuilding(b.name)">
        <view class="building-left">
          <text class="building-icon">🏠</text>
          <view class="building-info">
            <text class="building-name">{{ b.name }}</text>
            <text class="building-detail">待接单 {{ b.pending }} 单 · 配送中 {{ b.delivering }} 单</text>
          </view>
        </view>
        <view class="building-right">
          <view class="order-count-badge" :class="b.level">
            <text class="count-num">{{ b.total }}</text>
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
          <text class="stat-num" style="color:#DD6B20">{{ totalPending }}</text>
          <text class="stat-label">待接单</text>
        </view>
        <view class="stat-item">
          <text class="stat-num" style="color:#2B6CB0">{{ totalDelivering }}</text>
          <text class="stat-label">配送中</text>
        </view>
        <view class="stat-item">
          <text class="stat-num" style="color:#38A169">{{ totalCompleted }}</text>
          <text class="stat-label">已完成</text>
        </view>
        <view class="stat-item">
          <text class="stat-num" style="color:#E53E3E">¥{{ totalEarnings }}</text>
          <text class="stat-label">总收入</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud'

var buildings = ref([])
var totalPending = ref(0)
var totalDelivering = ref(0)
var totalCompleted = ref(0)
var totalEarnings = ref(0)

var loadData = async function() {
  var res = await callCloud('express', 'buildingStats')
  if (res.code === 0 && res.data) {
    var pAll = 0, dAll = 0, cAll = 0
    var list = []
    for (var i = 0; i < res.data.length; i++) {
      var b = res.data[i]
      if (b.name === '全部') continue
      var p = b.pending || 0
      var d = b.delivering || 0
      var c = b.completed || 0
      pAll += p
      dAll += d
      cAll += c
      var active = p + d
      list.push({
        name: b.name,
        pending: p,
        delivering: d,
        total: active,
        level: active >= 4 ? 'high' : (active >= 2 ? 'mid' : 'low')
      })
    }
    // 按待处理数量降序
    list.sort(function(a, b) { return b.total - a.total })
    buildings.value = list
    totalPending.value = pAll
    totalDelivering.value = dAll
    totalCompleted.value = cAll
    totalEarnings.value = res.totalEarnings || 0
  }
}

var goBuilding = function(name) {
  uni.navigateTo({ url: '/pages/express/index?building=' + encodeURIComponent(name) })
}

onShow(function() { loadData() })
</script>

<style scoped>
.building-orders { background: #F0F2F5; min-height: 100vh; padding-bottom: 40rpx; }

.page-header { padding: 32rpx 28rpx; background: linear-gradient(135deg, #4A90D9, #2B6CB0); }
.page-title { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
.page-desc { font-size: 24rpx; color: rgba(255,255,255,0.8); display: block; margin-top: 8rpx; }

.building-list { padding: 20rpx 28rpx; }
.building-card { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 20rpx; padding: 28rpx 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.building-card:active { transform: scale(0.98); }
.building-left { display: flex; align-items: center; flex: 1; }
.building-icon { font-size: 40rpx; margin-right: 16rpx; }
.building-info { flex: 1; }
.building-name { font-size: 30rpx; font-weight: 700; color: #1A1A2E; display: block; }
.building-detail { font-size: 22rpx; color: #A0AEC0; display: block; margin-top: 6rpx; }

.building-right { margin-left: 16rpx; }
.order-count-badge { width: 100rpx; height: 100rpx; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.order-count-badge.high { background: #FFEBEE; }
.order-count-badge.mid { background: #FFF3E0; }
.order-count-badge.low { background: #E8F5E9; }
.count-num { font-size: 36rpx; font-weight: 800; }
.order-count-badge.high .count-num { color: #E53E3E; }
.order-count-badge.mid .count-num { color: #DD6B20; }
.order-count-badge.low .count-num { color: #38A169; }
.count-label { font-size: 18rpx; color: #A0AEC0; }

.stats-card { margin: 0 28rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.stats-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; margin-bottom: 20rpx; }
.stats-grid { display: flex; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-num { font-size: 36rpx; font-weight: 800; }
.stat-label { font-size: 22rpx; color: #A0AEC0; margin-top: 8rpx; }
</style>
