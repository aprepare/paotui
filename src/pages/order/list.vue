<template>
  <view class="order-page">
    <view class="tab-bar">
      <view class="tab-item" :class="{active: tab === 0}" @click="tab = 0">
        <text>我发布的</text>
        <view v-if="tab === 0" class="tab-line"></view>
      </view>
      <view class="tab-item" :class="{active: tab === 1}" @click="tab = 1">
        <text>我接的</text>
        <view v-if="tab === 1" class="tab-line"></view>
      </view>
    </view>

    <view class="list-content">
      <!-- 我接的 tab：未注册骑手时显示注册引导 -->
      <view v-if="tab === 1 && !isRider" class="register-card">
        <view class="register-icon">🏅</view>
        <view class="register-info">
          <text class="register-title">成为骑手，接单赚钱</text>
          <text class="register-desc">注册骑手后即可接单，轻松赚取零花钱</text>
        </view>
        <view class="register-btn" @click="goRegister">
          <text>立即注册</text>
        </view>
      </view>

      <!-- 订单列表 -->
      <view v-if="tab === 0 || isRider">
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
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'

const tab = ref(0)
const isRider = ref(true) // mock: 默认已注册

onShow(() => {
  const stored = uni.getStorageSync('isRider')
  if (stored === 0 || stored === '0') isRider.value = false
})

const myOrders = ref([
  { id: 1, type: '代取快递', typeEmoji: '📦', desc: '一个中号快递', fromAddr: '菜鸟驿站', toAddr: '6号楼302', price: 5, time: '今天 14:30', statusText: '配送中', statusColor: '#38A169' },
  { id: 2, type: '代买东西', typeEmoji: '🛒', desc: '一杯奶茶 少糖', fromAddr: '蜜雪冰城', toAddr: '图书馆2楼', price: 3, time: '今天 11:20', statusText: '已完成', statusColor: '#A0AEC0' },
  { id: 3, type: '代取快递', typeEmoji: '📦', desc: '两个大件快递', fromAddr: '京东快递柜', toAddr: '3号楼501', price: 8, time: '昨天 16:45', statusText: '已完成', statusColor: '#A0AEC0' }
])
const takenOrders = ref([
  { id: 4, type: '代取快递', typeEmoji: '📦', desc: '一个小快递', fromAddr: '菜鸟驿站', toAddr: '1号楼203', price: 3, time: '今天 15:00', statusText: '待取件', statusColor: '#DD6B20' },
  { id: 5, type: '代打印', typeEmoji: '📄', desc: '论文打印30页', fromAddr: '打印店', toAddr: '2号楼108', price: 5, time: '今天 09:30', statusText: '已完成', statusColor: '#A0AEC0' }
])

const currentList = computed(() => tab.value === 0 ? myOrders.value : takenOrders.value)
const goDetail = (id) => { uni.navigateTo({ url: '/pages/order/detail?id=' + id }) }
const goRegister = () => { uni.navigateTo({ url: '/pages/express/rider-register' }) }
</script>

<style scoped>
.order-page { background: #F0F2F5; min-height: 100vh; }

.tab-bar { display: flex; background: #fff; box-shadow: 0 1rpx 0 #E2E8F0; }
.tab-item { flex: 1; text-align: center; padding: 28rpx 0 24rpx; font-size: 28rpx; color: #A0AEC0; font-weight: 500; position: relative; }
.tab-item.active { color: #2B6CB0; font-weight: 700; }
.tab-line { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 48rpx; height: 6rpx; border-radius: 3rpx; background: linear-gradient(90deg, #4299E1, #2B6CB0); }

.list-content { padding: 20rpx 28rpx; }

/* 注册引导卡 */
.register-card { background: linear-gradient(135deg, #FFFAF0, #FFF5EB); border: 1rpx solid #FEEBC8; border-radius: 20rpx; padding: 32rpx; display: flex; align-items: center; margin-bottom: 24rpx; }
.register-icon { font-size: 48rpx; margin-right: 20rpx; }
.register-info { flex: 1; }
.register-title { font-size: 28rpx; font-weight: 700; color: #1A1A2E; display: block; }
.register-desc { font-size: 22rpx; color: #718096; margin-top: 6rpx; display: block; }
.register-btn { padding: 14rpx 32rpx; border-radius: 28rpx; background: linear-gradient(135deg, #ED8936, #DD6B20); box-shadow: 0 4rpx 12rpx rgba(221,107,32,0.25); transition: transform 0.15s ease; }
.register-btn:active { transform: scale(0.95); }
.register-btn text { font-size: 24rpx; color: #fff; font-weight: 700; }

/* 订单卡片 */
.order-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); transition: transform 0.2s ease; }
.order-card:active { transform: scale(0.98); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.order-type { font-size: 28rpx; font-weight: 700; color: #1A1A2E; }
.order-status { font-size: 24rpx; font-weight: 700; }
.addr-row { display: flex; align-items: center; margin-bottom: 8rpx; }
.addr-icon { margin-right: 8rpx; font-size: 24rpx; }
.addr-text { font-size: 26rpx; color: #4A5568; font-weight: 500; }
.order-desc { font-size: 24rpx; color: #A0AEC0; margin-left: 36rpx; }
.order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; padding-top: 16rpx; border-top: 1rpx solid #F7FAFC; }
.order-time { font-size: 24rpx; color: #A0AEC0; }
.order-price { font-size: 34rpx; color: #E53E3E; font-weight: 800; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-emoji { font-size: 80rpx; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: #A0AEC0; }
</style>
