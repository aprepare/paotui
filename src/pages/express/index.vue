<template>
  <view class="express-page">
    <!-- 顶部Tab -->
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === i}" v-for="(name, i) in tabNames" :key="i" @click="tab = i">
        <text>{{ name }}</text>
        <view v-if="tab === i" class="tab-line"></view>
      </view>
    </view>

    <!-- 楼栋筛选 -->
    <view class="filter-bar">
      <scroll-view scroll-x class="filter-scroll">
        <view class="filter-tags">
          <view v-for="b in buildings" :key="b.name" class="filter-tag" :class="{active: selectedBuilding === b.name}" @click="selectedBuilding = b.name">
            <text class="tag-name">{{ b.name }}</text>
            <view class="tag-badge"><text>{{ b.count }}</text></view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 订单列表 -->
    <view class="order-list">
      <view v-for="order in filteredOrders" :key="order.id" class="order-card" @click="goDetail(order.id)">
        <view class="card-top">
          <view class="size-tag" :class="order.sizeClass">{{ order.sizeText }}</view>
          <text class="status-text" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
        <view class="card-route">
          <view class="route-point">
            <view class="dot from"></view>
            <text class="route-text">{{ order.pickupPoint }}</text>
          </view>
          <view class="route-connector"><view class="connector-line"></view></view>
          <view class="route-point">
            <view class="dot to"></view>
            <text class="route-text">{{ order.building }}{{ order.room }}</text>
          </view>
        </view>
        <view class="card-bottom">
          <text class="card-time">{{ order.time }}</text>
          <view class="price-area">
            <text class="card-price">¥{{ order.price }}</text>
            <text v-if="order.tip > 0" class="card-tip">+{{ order.tip }}小费</text>
          </view>
        </view>
      </view>
      <view v-if="filteredOrders.length === 0" class="empty">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </view>

    <view class="fab-btn" @click="goCreate"><text>+ 发快递单</text></view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'

const tab = ref(0)
const tabNames = ['全部订单','待接单','进行中','已完成']
const selectedBuilding = ref('全部')

const buildings = ref([
  { name: '全部', count: 15 }, { name: '1号楼', count: 3 }, { name: '2号楼', count: 2 },
  { name: '3号楼', count: 4 }, { name: '5号楼', count: 1 }, { name: '6号楼', count: 3 }, { name: '8号楼', count: 2 }
])

const orders = ref([
  { id: 1, pickupPoint: '菜鸟驿站A区', building: '6号楼', room: '302', sizeText: '小件', sizeClass: 'small', price: 2, tip: 0, time: '10分钟前', statusText: '待接单', statusColor: '#DD6B20', status: 0 },
  { id: 2, pickupPoint: '京东快递柜', building: '3号楼', room: '501', sizeText: '大件', sizeClass: 'large', price: 5, tip: 2, time: '20分钟前', statusText: '配送中', statusColor: '#38A169', status: 2 },
  { id: 3, pickupPoint: '顺丰快递站', building: '1号楼', room: '108', sizeText: '超大件', sizeClass: 'xlarge', price: 20, tip: 5, time: '30分钟前', statusText: '待接单', statusColor: '#DD6B20', status: 0 },
  { id: 4, pickupPoint: '菜鸟驿站B区', building: '3号楼', room: '215', sizeText: '小件', sizeClass: 'small', price: 2, tip: 1, time: '1小时前', statusText: '已接单', statusColor: '#2B6CB0', status: 1 },
  { id: 5, pickupPoint: '中通快递站', building: '8号楼', room: '601', sizeText: '大件', sizeClass: 'large', price: 5, tip: 0, time: '2小时前', statusText: '已完成', statusColor: '#A0AEC0', status: 3 },
  { id: 6, pickupPoint: '韵达快递柜', building: '2号楼', room: '403', sizeText: '小件', sizeClass: 'small', price: 2, tip: 0, time: '3小时前', statusText: '已完成', statusColor: '#A0AEC0', status: 3 }
])

const filteredOrders = computed(() => {
  let list = orders.value
  if (tab.value === 1) list = list.filter(o => o.status === 0)
  else if (tab.value === 2) list = list.filter(o => o.status === 1 || o.status === 2)
  else if (tab.value === 3) list = list.filter(o => o.status === 3)
  if (selectedBuilding.value !== '全部') list = list.filter(o => o.building === selectedBuilding.value)
  return list
})

const goDetail = (id) => { uni.navigateTo({ url: '/pages/express/detail?id=' + id }) }
const goCreate = () => { uni.navigateTo({ url: '/pages/express/create' }) }
onPullDownRefresh(() => {
  setTimeout(() => { uni.stopPullDownRefresh() }, 800)
})
</script>

<style scoped>
.express-page { background: #F0F2F5; min-height: 100vh; padding-bottom: 160rpx; }

.tab-bar { display: flex; background: #fff; padding: 0; box-shadow: 0 1rpx 0 #E2E8F0; }
.tab-item { flex: 1; text-align: center; padding: 28rpx 0 24rpx; font-size: 26rpx; color: #A0AEC0; font-weight: 500; position: relative; }
.tab-item.active { color: #2B6CB0; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(90deg, #4299E1, #2B6CB0); }

.filter-bar { padding: 16rpx 28rpx; }
.filter-scroll { white-space: nowrap; }
.filter-tags { display: flex; gap: 14rpx; }
.filter-tag { display: inline-flex; align-items: center; gap: 8rpx; padding: 14rpx 22rpx; background: #fff; border-radius: 28rpx; border: 1rpx solid #E2E8F0; flex-shrink: 0; transition: all 0.2s ease; }
.filter-tag:active { transform: scale(0.95); }
.filter-tag.active { border-color: #2B6CB0; background: #EBF4FF; }
.tag-name { font-size: 24rpx; color: #4A5568; font-weight: 500; }
.filter-tag.active .tag-name { color: #2B6CB0; font-weight: 700; }
.tag-badge { background: #E53E3E; padding: 2rpx 12rpx; border-radius: 16rpx; }
.tag-badge text { color: #fff; font-size: 20rpx; font-weight: 700; }

.order-list { padding: 0 28rpx; }
.order-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.order-card:active { transform: scale(0.98); box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.08); }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.size-tag { padding: 8rpx 20rpx; border-radius: 10rpx; font-size: 22rpx; font-weight: 700; color: #fff; letter-spacing: 1rpx; }
.size-tag.small { background: linear-gradient(135deg, #4299E1, #2B6CB0); }
.size-tag.large { background: linear-gradient(135deg, #ED8936, #DD6B20); }
.size-tag.xlarge { background: linear-gradient(135deg, #FC8181, #E53E3E); }
.status-text { font-size: 24rpx; font-weight: 700; }

.card-route { margin-bottom: 20rpx; }
.route-point { display: flex; align-items: center; }
.dot { width: 14rpx; height: 14rpx; border-radius: 50%; margin-right: 14rpx; flex-shrink: 0; }
.dot.from { background: #4299E1; box-shadow: 0 0 0 4rpx rgba(66,153,225,0.2); }
.dot.to { background: #E53E3E; box-shadow: 0 0 0 4rpx rgba(229,62,62,0.2); }
.route-text { font-size: 26rpx; color: #2D3748; font-weight: 500; }
.route-connector { padding-left: 6rpx; }
.connector-line { width: 2rpx; height: 20rpx; background: #E2E8F0; margin-left: 0; }

.card-bottom { display: flex; justify-content: space-between; align-items: center; padding-top: 20rpx; border-top: 1rpx solid #F7FAFC; }
.card-time { font-size: 22rpx; color: #A0AEC0; }
.price-area { display: flex; align-items: center; gap: 10rpx; }
.card-price { font-size: 34rpx; color: #E53E3E; font-weight: 800; }
.card-tip { font-size: 20rpx; color: #DD6B20; background: #FFFAF0; padding: 4rpx 14rpx; border-radius: 8rpx; font-weight: 600; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; }

.fab-btn { position: fixed; bottom: 48rpx; left: 28rpx; right: 28rpx; background: linear-gradient(135deg, #4299E1, #2B6CB0); border-radius: 52rpx; padding: 30rpx; text-align: center; box-shadow: 0 12rpx 32rpx rgba(43,108,176,0.35); transition: transform 0.15s ease, box-shadow 0.15s ease; }
.fab-btn:active { transform: scale(0.96); box-shadow: 0 6rpx 16rpx rgba(43,108,176,0.4); }
.fab-btn text { color: #fff; font-size: 30rpx; font-weight: 700; letter-spacing: 2rpx; }
</style>
