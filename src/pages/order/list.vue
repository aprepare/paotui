<template>
  <view class="order-list">
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === 0}" @click="tab = 0">
        <text>我发布的</text>
      </view>
      <view class="tab-item" :class="{active: tab === 1}" @click="tab = 1">
        <text>我接的</text>
      </view>
    </view>
    <view class="list-content">
      <view v-for="order in currentList" :key="order.id" class="order-card" @click="goDetail(order.id)">
        <view class="order-header">
          <text class="order-type">{{ order.typeEmoji }} {{ order.type }}</text>
          <text class="order-status" :style="{color: order.statusColor}">{{ order.statusText }}</text>
        </view>
        <view class="order-body">
          <view class="addr-row">
            <text class="addr-icon">📍</text>
            <text class="addr-text">{{ order.fromAddr }} → {{ order.toAddr }}</text>
          </view>
          <text class="order-desc">{{ order.desc }}</text>
        </view>
        <view class="order-footer">
          <text class="order-time">{{ order.time }}</text>
          <text class="order-price">¥{{ order.price }}</text>
        </view>
      </view>
      <view v-if="currentList.length === 0" class="empty">
        <text class="empty-emoji">📭</text>
        <text class="empty-text">暂无订单</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const tab = ref(0)
const myOrders = ref([
  { id: 1, type: '代取快递', typeEmoji: '📦', desc: '一个中号快递', fromAddr: '菜鸟驿站', toAddr: '6号楼302', price: 5, time: '今天 14:30', statusText: '配送中', statusColor: '#66BB6A' },
  { id: 2, type: '代买东西', typeEmoji: '🛒', desc: '一杯奶茶 少糖', fromAddr: '蜜雪冰城', toAddr: '图书馆2楼', price: 3, time: '今天 11:20', statusText: '已完成', statusColor: '#9E9E9E' },
  { id: 3, type: '代取快递', typeEmoji: '📦', desc: '两个大件快递', fromAddr: '京东快递柜', toAddr: '3号楼501', price: 8, time: '昨天 16:45', statusText: '已完成', statusColor: '#9E9E9E' }
])
const takenOrders = ref([
  { id: 4, type: '代取快递', typeEmoji: '📦', desc: '一个小快递', fromAddr: '菜鸟驿站', toAddr: '1号楼203', price: 3, time: '今天 15:00', statusText: '待取件', statusColor: '#FF9800' },
  { id: 5, type: '代打印', typeEmoji: '📄', desc: '论文打印30页', fromAddr: '打印店', toAddr: '2号楼108', price: 5, time: '今天 09:30', statusText: '已完成', statusColor: '#9E9E9E' }
])

const currentList = computed(() => tab.value === 0 ? myOrders.value : takenOrders.value)
const goDetail = (id) => { uni.navigateTo({ url: `/pages/order/detail?id=${id}` }) }
</script>

<style scoped>
.order-list { background: #F5F7FA; min-height: 100vh; }
.tab-bar { display: flex; background: #fff; padding: 0 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.tab-item { flex: 1; text-align: center; padding: 24rpx 0; font-size: 28rpx; color: #999; border-bottom: 4rpx solid transparent; }
.tab-item.active { color: #4A90D9; font-weight: bold; border-bottom-color: #4A90D9; }
.list-content { padding: 20rpx 24rpx; }
.order-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.order-type { font-size: 28rpx; font-weight: bold; color: #333; }
.order-status { font-size: 24rpx; font-weight: bold; }
.addr-row { display: flex; align-items: center; margin-bottom: 8rpx; }
.addr-icon { margin-right: 8rpx; }
.addr-text { font-size: 26rpx; color: #666; }
.order-desc { font-size: 24rpx; color: #999; margin-left: 36rpx; }
.order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #f0f0f0; }
.order-time { font-size: 24rpx; color: #999; }
.order-price { font-size: 32rpx; color: #FF6B6B; font-weight: bold; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #999; }
</style>
