<template>
  <view class="express-page">
    <!-- 顶部Tab切换 -->
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === 0}" @click="tab = 0">
        <text>全部订单</text>
      </view>
      <view class="tab-item" :class="{active: tab === 1}" @click="tab = 1">
        <text>待接单</text>
      </view>
      <view class="tab-item" :class="{active: tab === 2}" @click="tab = 2">
        <text>进行中</text>
      </view>
      <view class="tab-item" :class="{active: tab === 3}" @click="tab = 3">
        <text>已完成</text>
      </view>
    </view>

    <!-- 楼栋筛选 -->
    <view class="building-filter">
      <scroll-view scroll-x class="building-scroll">
        <view class="building-tags">
          <view v-for="b in buildings" :key="b.name" class="building-tag" :class="{active: selectedBuilding === b.name}" @click="selectedBuilding = b.name">
            <text>{{ b.name }}</text>
            <text class="building-count">{{ b.count }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view v-for="order in filteredOrders" :key="order.id" class="order-card" @click="goDetail(order.id)">
        <view class="order-header">
          <view class="order-size-tag" :class="order.sizeClass">{{ order.sizeText }}</view>
          <text class="order-status" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
        <view class="order-body">
          <view class="addr-row">
            <view class="addr-dot from"></view>
            <text class="addr-text">{{ order.pickupPoint }}</text>
          </view>
          <view class="addr-line-v"></view>
          <view class="addr-row">
            <view class="addr-dot to"></view>
            <text class="addr-text">{{ order.building }}{{ order.room }}</text>
          </view>
        </view>
        <view class="order-footer">
          <text class="order-time">{{ order.time }}</text>
          <view class="order-price-area">
            <text class="order-price">¥{{ order.price }}</text>
            <text v-if="order.tip > 0" class="order-tip">+{{ order.tip }}小费</text>
          </view>
        </view>
      </view>

      <view v-if="filteredOrders.length === 0" class="empty">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </view>

    <!-- 悬浮发布按钮 -->
    <view class="fab-btn" @click="goCreate">
      <text>+ 发快递单</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const tab = ref(0)
const selectedBuilding = ref('全部')

const buildings = ref([
  { name: '全部', count: 15 },
  { name: '1号楼', count: 3 },
  { name: '2号楼', count: 2 },
  { name: '3号楼', count: 4 },
  { name: '5号楼', count: 1 },
  { name: '6号楼', count: 3 },
  { name: '8号楼', count: 2 }
])

const orders = ref([
  { id: 1, pickupPoint: '菜鸟驿站A区', building: '6号楼', room: '302', sizeText: '小件', sizeClass: 'small', price: 2, tip: 0, time: '10分钟前', statusText: '待接单', statusColor: '#FF9800', status: 0 },
  { id: 2, pickupPoint: '京东快递柜', building: '3号楼', room: '501', sizeText: '大件', sizeClass: 'large', price: 5, tip: 2, time: '20分钟前', statusText: '配送中', statusColor: '#66BB6A', status: 2 },
  { id: 3, pickupPoint: '顺丰快递站', building: '1号楼', room: '108', sizeText: '超大件', sizeClass: 'xlarge', price: 20, tip: 5, time: '30分钟前', statusText: '待接单', statusColor: '#FF9800', status: 0 },
  { id: 4, pickupPoint: '菜鸟驿站B区', building: '3号楼', room: '215', sizeText: '小件', sizeClass: 'small', price: 2, tip: 1, time: '1小时前', statusText: '已接单', statusColor: '#4A90D9', status: 1 },
  { id: 5, pickupPoint: '中通快递站', building: '8号楼', room: '601', sizeText: '大件', sizeClass: 'large', price: 5, tip: 0, time: '2小时前', statusText: '已完成', statusColor: '#9E9E9E', status: 3 },
  { id: 6, pickupPoint: '韵达快递柜', building: '2号楼', room: '403', sizeText: '小件', sizeClass: 'small', price: 2, tip: 0, time: '3小时前', statusText: '已完成', statusColor: '#9E9E9E', status: 3 }
])

const filteredOrders = computed(() => {
  let list = orders.value
  if (tab.value === 1) list = list.filter(o => o.status === 0)
  else if (tab.value === 2) list = list.filter(o => o.status === 1 || o.status === 2)
  else if (tab.value === 3) list = list.filter(o => o.status === 3)
  if (selectedBuilding.value !== '全部') list = list.filter(o => o.building === selectedBuilding.value)
  return list
})

const goDetail = (id) => {
  uni.navigateTo({ url: `/pages/express/detail?id=${id}` })
}

const goCreate = () => {
  uni.navigateTo({ url: '/pages/express/create' })
}
</script>

<style scoped>
.express-page { background: #F5F7FA; min-height: 100vh; padding-bottom: 140rpx; }

.tab-bar { display: flex; background: #fff; padding: 0 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 26rpx; color: #999; border-bottom: 4rpx solid transparent; }
.tab-item.active { color: #4A90D9; font-weight: bold; border-bottom-color: #4A90D9; }

.building-filter { padding: 16rpx 24rpx; }
.building-scroll { white-space: nowrap; }
.building-tags { display: flex; gap: 12rpx; }
.building-tag { display: inline-flex; align-items: center; gap: 6rpx; padding: 12rpx 20rpx; background: #fff; border-radius: 24rpx; border: 2rpx solid #e0e0e0; flex-shrink: 0; }
.building-tag.active { border-color: #4A90D9; background: #E3F2FD; }
.building-tag text { font-size: 24rpx; color: #666; }
.building-tag.active text { color: #4A90D9; font-weight: bold; }
.building-count { background: #FF6B6B; color: #fff !important; font-size: 20rpx !important; padding: 2rpx 10rpx; border-radius: 16rpx; font-weight: normal !important; }

.order-list { padding: 0 24rpx; }
.order-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.order-size-tag { padding: 6rpx 16rpx; border-radius: 8rpx; font-size: 22rpx; font-weight: bold; color: #fff; }
.order-size-tag.small { background: #4A90D9; }
.order-size-tag.large { background: #FF9800; }
.order-size-tag.xlarge { background: #FF6B6B; }
.order-status { font-size: 24rpx; font-weight: bold; }

.order-body { margin-bottom: 16rpx; }
.addr-row { display: flex; align-items: center; }
.addr-dot { width: 16rpx; height: 16rpx; border-radius: 50%; margin-right: 12rpx; flex-shrink: 0; }
.addr-dot.from { background: #4A90D9; }
.addr-dot.to { background: #FF6B6B; }
.addr-text { font-size: 26rpx; color: #333; }
.addr-line-v { width: 2rpx; height: 24rpx; background: #e0e0e0; margin-left: 7rpx; }

.order-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.order-time { font-size: 22rpx; color: #999; }
.order-price-area { display: flex; align-items: center; gap: 8rpx; }
.order-price { font-size: 32rpx; color: #FF6B6B; font-weight: bold; }
.order-tip { font-size: 20rpx; color: #FF9800; background: #FFF3E0; padding: 4rpx 12rpx; border-radius: 8rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }

.fab-btn { position: fixed; bottom: 40rpx; left: 24rpx; right: 24rpx; background: linear-gradient(135deg, #4A90D9, #357ABD); border-radius: 48rpx; padding: 28rpx; text-align: center; box-shadow: 0 8rpx 24rpx rgba(74,144,217,0.4); }
.fab-btn text { color: #fff; font-size: 32rpx; font-weight: bold; }
</style>
